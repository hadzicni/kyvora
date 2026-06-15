package dev.kyvora.api.settings.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.kyvora.api.auditlog.service.AuditLogService;
import dev.kyvora.api.auth.security.CurrentUserProvider;
import dev.kyvora.api.settings.dto.SettingItemResponse;
import dev.kyvora.api.settings.dto.SettingsResponse;
import dev.kyvora.api.settings.dto.UpdateSettingsRequest;
import dev.kyvora.api.settings.entity.SettingValueType;
import dev.kyvora.api.settings.entity.SystemSetting;
import dev.kyvora.api.settings.exception.SettingsValidationException;
import dev.kyvora.api.settings.repository.SystemSettingRepository;

@Service
@Transactional
public class DefaultSettingsService implements SettingsService {

	public static final String INSTANCE_NAME = "instance.name";
	public static final String INSTANCE_DESCRIPTION = "instance.description";
	public static final String AGENTS_OFFLINE_THRESHOLD_SECONDS = "agents.offline_threshold_seconds";
	public static final String AGENTS_OFFLINE_CHECK_INTERVAL_SECONDS = "agents.offline_check_interval_seconds";
	public static final String UI_SHOW_DEV_HINTS = "ui.show_dev_hints";

	private static final Map<String, SettingDefinition> DEFINITIONS = Map.of(
			INSTANCE_NAME, new SettingDefinition(INSTANCE_NAME, "Kyvora", SettingValueType.STRING, "Display name for this Kyvora instance."),
			INSTANCE_DESCRIPTION, new SettingDefinition(INSTANCE_DESCRIPTION, "Homelab Control Plane", SettingValueType.STRING, "Short description shown in the UI."),
			AGENTS_OFFLINE_THRESHOLD_SECONDS, new SettingDefinition(AGENTS_OFFLINE_THRESHOLD_SECONDS, "90", SettingValueType.INTEGER, "Seconds without a successful pull before an online agent is marked offline."),
			AGENTS_OFFLINE_CHECK_INTERVAL_SECONDS, new SettingDefinition(AGENTS_OFFLINE_CHECK_INTERVAL_SECONDS, "30", SettingValueType.INTEGER, "Seconds between scheduled stale-agent checks. Changes require API restart."),
			UI_SHOW_DEV_HINTS, new SettingDefinition(UI_SHOW_DEV_HINTS, "true", SettingValueType.BOOLEAN, "Show local development hints in the web UI."));

	private final SystemSettingRepository repository;
	private final AuditLogService auditLogService;
	private final CurrentUserProvider currentUserProvider;

	public DefaultSettingsService(
			SystemSettingRepository repository,
			AuditLogService auditLogService,
			CurrentUserProvider currentUserProvider) {
		this.repository = repository;
		this.auditLogService = auditLogService;
		this.currentUserProvider = currentUserProvider;
	}

	@Override
	@Transactional(readOnly = true)
	public SettingsResponse findAll() {
		Map<String, SystemSetting> stored = new LinkedHashMap<>();
		repository.findAll().forEach(setting -> stored.put(setting.getKey(), setting));
		return responseFrom(stored);
	}

	@Override
	public SettingsResponse update(UpdateSettingsRequest request) {
		Map<String, Object> requested = request.settings();
		validateKnownKeys(requested);

		Map<String, SystemSetting> stored = new LinkedHashMap<>();
		repository.findAllById(DEFINITIONS.keySet()).forEach(setting -> stored.put(setting.getKey(), setting));
		ensureMissingDefaults(stored);

		List<String> errors = validateValues(requested, stored);
		if (!errors.isEmpty()) {
			throw new SettingsValidationException("Validation failed", errors);
		}

		String actor = currentActor();
		List<String> changedKeys = new ArrayList<>();
		for (Map.Entry<String, Object> entry : requested.entrySet()) {
			String key = entry.getKey();
			SystemSetting setting = stored.get(key);
			String newValue = serializeValue(key, entry.getValue());
			if (!Objects.equals(setting.getValue(), newValue)) {
				setting.setValue(newValue);
				setting.setUpdatedBy(actor);
				changedKeys.add(key);
			}
		}

		if (!changedKeys.isEmpty()) {
			repository.saveAll(stored.values());
			auditLogService.recordSettingsUpdated(actor, changedKeys);
		}

		return responseFrom(stored);
	}

	@Override
	@Transactional(readOnly = true)
	public long getLongSettingOrDefault(String key, long fallback) {
		try {
			return repository.findById(key)
					.map(SystemSetting::getValue)
					.map(value -> parseLong(value, fallback))
					.orElse(fallback);
		}
		catch (DataAccessException exception) {
			return fallback;
		}
	}

	private void validateKnownKeys(Map<String, Object> requested) {
		List<String> unknownKeys = requested.keySet().stream()
				.filter(key -> !DEFINITIONS.containsKey(key))
				.sorted()
				.map(key -> key + ": unknown setting")
				.toList();
		if (!unknownKeys.isEmpty()) {
			throw new SettingsValidationException("Validation failed", unknownKeys);
		}
	}

	private List<String> validateValues(Map<String, Object> requested, Map<String, SystemSetting> stored) {
		List<String> errors = new ArrayList<>();
		String instanceName = stringValue(requested.get(INSTANCE_NAME));
		if (requested.containsKey(INSTANCE_NAME) && (instanceName == null || instanceName.isBlank())) {
			errors.add(INSTANCE_NAME + ": must not be blank");
		}
		if (instanceName != null && instanceName.length() > 80) {
			errors.add(INSTANCE_NAME + ": must be 80 characters or fewer");
		}

		String description = stringValue(requested.get(INSTANCE_DESCRIPTION));
		if (description != null && description.length() > 240) {
			errors.add(INSTANCE_DESCRIPTION + ": must be 240 characters or fewer");
		}

		Integer threshold = integerValue(requested.get(AGENTS_OFFLINE_THRESHOLD_SECONDS), AGENTS_OFFLINE_THRESHOLD_SECONDS, errors);
		if (threshold != null && (threshold < 30 || threshold > 86_400)) {
			errors.add(AGENTS_OFFLINE_THRESHOLD_SECONDS + ": must be between 30 and 86400");
		}

		Integer interval = integerValue(requested.get(AGENTS_OFFLINE_CHECK_INTERVAL_SECONDS), AGENTS_OFFLINE_CHECK_INTERVAL_SECONDS, errors);
		if (interval != null && (interval < 5 || interval > 3_600)) {
			errors.add(AGENTS_OFFLINE_CHECK_INTERVAL_SECONDS + ": must be between 5 and 3600");
		}

		int effectiveThreshold = threshold == null
				? parseInteger(stored.get(AGENTS_OFFLINE_THRESHOLD_SECONDS).getValue())
				: threshold;
		int effectiveInterval = interval == null
				? parseInteger(stored.get(AGENTS_OFFLINE_CHECK_INTERVAL_SECONDS).getValue())
				: interval;
		if (effectiveInterval > effectiveThreshold) {
			errors.add(AGENTS_OFFLINE_CHECK_INTERVAL_SECONDS + ": must not be greater than " + AGENTS_OFFLINE_THRESHOLD_SECONDS);
		}

		if (requested.containsKey(UI_SHOW_DEV_HINTS) && booleanValue(requested.get(UI_SHOW_DEV_HINTS)) == null) {
			errors.add(UI_SHOW_DEV_HINTS + ": must be a boolean");
		}

		return errors;
	}

	private void ensureMissingDefaults(Map<String, SystemSetting> stored) {
		for (SettingDefinition definition : DEFINITIONS.values()) {
			stored.computeIfAbsent(definition.key(), key -> new SystemSetting(
					key,
					definition.defaultValue(),
					definition.valueType(),
					definition.description()));
		}
	}

	private SettingsResponse responseFrom(Map<String, SystemSetting> stored) {
		ensureMissingDefaults(stored);
		List<SettingItemResponse> settings = stored.values().stream()
				.filter(setting -> DEFINITIONS.containsKey(setting.getKey()))
				.sorted(Comparator.comparing(SystemSetting::getKey))
				.map(this::toResponse)
				.toList();
		return new SettingsResponse(settings);
	}

	private SettingItemResponse toResponse(SystemSetting setting) {
		return new SettingItemResponse(
				setting.getKey(),
				deserializeValue(setting.getValue(), setting.getValueType()),
				setting.getValueType(),
				setting.getDescription(),
				setting.getUpdatedAt(),
				setting.getUpdatedBy());
	}

	private Object deserializeValue(String value, SettingValueType valueType) {
		if (valueType == SettingValueType.BOOLEAN) {
			return Boolean.parseBoolean(value);
		}
		if (valueType == SettingValueType.INTEGER) {
			return parseInteger(value);
		}
		return value;
	}

	private String serializeValue(String key, Object value) {
		SettingValueType valueType = DEFINITIONS.get(key).valueType();
		if (valueType == SettingValueType.BOOLEAN) {
			return String.valueOf(booleanValue(value));
		}
		if (valueType == SettingValueType.INTEGER) {
			return String.valueOf(integerValue(value, key, new ArrayList<>()));
		}
		return stringValue(value) == null ? "" : stringValue(value).trim();
	}

	private String currentActor() {
		return currentUserProvider.currentActor();
	}

	private String stringValue(Object value) {
		return value instanceof String string ? string.trim() : null;
	}

	private Integer integerValue(Object value, String key, List<String> errors) {
		if (value == null) {
			return null;
		}
		if (value instanceof Integer integer) {
			return integer;
		}
		if (value instanceof Number number && Math.floor(number.doubleValue()) == number.doubleValue()) {
			return number.intValue();
		}
		if (value instanceof String string && string.matches("-?\\d+")) {
			return Integer.parseInt(string);
		}
		errors.add(key + ": must be an integer");
		return null;
	}

	private Boolean booleanValue(Object value) {
		if (value instanceof Boolean bool) {
			return bool;
		}
		if (value instanceof String string && ("true".equalsIgnoreCase(string) || "false".equalsIgnoreCase(string))) {
			return Boolean.parseBoolean(string);
		}
		return null;
	}

	private int parseInteger(String value) {
		return Integer.parseInt(value);
	}

	private long parseLong(String value, long fallback) {
		try {
			return Long.parseLong(value);
		}
		catch (NumberFormatException exception) {
			return fallback;
		}
	}

	private record SettingDefinition(
			String key,
			String defaultValue,
			SettingValueType valueType,
			String description) {
	}
}
