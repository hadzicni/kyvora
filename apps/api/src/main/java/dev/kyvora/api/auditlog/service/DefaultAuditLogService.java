package dev.kyvora.api.auditlog.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.kyvora.api.agent.event.AgentChangedEvent;
import dev.kyvora.api.auditlog.dto.AuditLogFilter;
import dev.kyvora.api.auditlog.dto.AuditLogResponse;
import dev.kyvora.api.auditlog.entity.AuditEventType;
import dev.kyvora.api.auditlog.entity.AuditLog;
import dev.kyvora.api.auditlog.mapper.AuditLogMapper;
import dev.kyvora.api.auditlog.repository.AuditLogRepository;
import dev.kyvora.api.auditlog.repository.AuditLogSpecifications;
import dev.kyvora.api.auth.security.CurrentUserProvider;
import dev.kyvora.api.serverinventory.event.ServerInventoryChangedEvent;
import lombok.extern.slf4j.Slf4j;

@Service
@Transactional
@Slf4j
public class DefaultAuditLogService implements AuditLogService {

	private static final String SERVER_AGGREGATE_TYPE = "SERVER";
	private static final String AGENT_AGGREGATE_TYPE = "AGENT";
	private static final String AUTH_AGGREGATE_TYPE = "AUTH";
	private static final String USER_AGGREGATE_TYPE = "USER";
	private static final String SETTINGS_AGGREGATE_TYPE = "SETTINGS";
	private static final UUID EMPTY_AGGREGATE_ID = new UUID(0, 0);

	private final AuditLogRepository repository;
	private final AuditLogMapper mapper;
	private final CurrentUserProvider currentUserProvider;

	public DefaultAuditLogService(
			AuditLogRepository repository,
			AuditLogMapper mapper,
			CurrentUserProvider currentUserProvider) {
		this.repository = repository;
		this.mapper = mapper;
		this.currentUserProvider = currentUserProvider;
	}

	@Override
	@Transactional(readOnly = true)
	public Page<AuditLogResponse> findAll(AuditLogFilter filter, Pageable pageable) {
		return repository.findAll(AuditLogSpecifications.byFilter(filter), pageable).map(mapper::toResponse);
	}

	@Override
	public void recordServerInventoryChange(ServerInventoryChangedEvent event) {
		AuditEventType eventType = AuditEventType.valueOf(event.type().name());
		repository.save(new AuditLog(
				eventType,
				SERVER_AGGREGATE_TYPE,
				event.serverId(),
				event.actor() == null || event.actor().isBlank() ? currentActor() : event.actor(),
				messageFor(event),
				metadataFor(event)));
		log.debug("Recorded audit log for server event {} on aggregate {}", eventType, event.serverId());
	}

	@Override
	public void recordAgentChange(AgentChangedEvent event) {
		AuditEventType eventType = AuditEventType.valueOf(event.type().name());
		repository.save(new AuditLog(
				eventType,
				AGENT_AGGREGATE_TYPE,
				event.agentId(),
				actorFor(event),
				messageFor(event),
				metadataFor(event)));
		log.debug("Recorded audit log for agent event {} on aggregate {}", eventType, event.agentId());
	}

	@Override
	public void recordAuthEvent(AuditEventType eventType, UUID userId, String actor, String message) {
		UUID aggregateId = userId == null ? EMPTY_AGGREGATE_ID : userId;
		repository.save(new AuditLog(
				eventType,
				AUTH_AGGREGATE_TYPE,
				aggregateId,
				actor == null || actor.isBlank() ? currentActor() : actor,
				message,
				Map.of()));
		log.debug("Recorded audit log for auth event {} on aggregate {}", eventType, aggregateId);
	}

	@Override
	public void recordUserEvent(AuditEventType eventType, UUID userId, String actor, String message, Map<String, Object> metadata) {
		UUID aggregateId = userId == null ? EMPTY_AGGREGATE_ID : userId;
		repository.save(new AuditLog(
				eventType,
				USER_AGGREGATE_TYPE,
				aggregateId,
				actor == null || actor.isBlank() ? currentActor() : actor,
				message,
				metadata == null ? Map.of() : Map.copyOf(metadata)));
		log.debug("Recorded audit log for user event {} on aggregate {}", eventType, aggregateId);
	}

	@Override
	public void recordSettingsUpdated(String actor, List<String> changedKeys) {
		repository.save(new AuditLog(
				AuditEventType.SETTINGS_UPDATED,
				SETTINGS_AGGREGATE_TYPE,
				EMPTY_AGGREGATE_ID,
				actor == null || actor.isBlank() ? currentActor() : actor,
				"System settings updated",
				Map.of("changedKeys", List.copyOf(changedKeys))));
		log.debug("Recorded audit log for settings update with {} changed keys", changedKeys.size());
	}

	private String currentActor() {
		return currentUserProvider.currentActor();
	}

	private String actorFor(AgentChangedEvent event) {
		if (event.actor() != null && !event.actor().isBlank()) {
			return event.actor();
		}
		return currentActor();
	}

	private String messageFor(ServerInventoryChangedEvent event) {
		return switch (event.type()) {
			case SERVER_CREATED -> "Server created: " + event.hostname();
			case SERVER_UPDATED -> "Server updated: " + event.hostname();
			case SERVER_DELETED -> "Server deleted: " + event.hostname();
			case SERVER_MARKED_ONLINE_BY_AGENT -> "Server marked online by agent";
			case SERVER_MARKED_OFFLINE_BY_AGENT -> "Server marked offline by agent";
		};
	}

	private String messageFor(AgentChangedEvent event) {
		return switch (event.type()) {
			case AGENT_CONFIGURED -> "Agent configured: " + agentDisplayName(event);
			case AGENT_PULL_SUCCEEDED -> "Agent pull succeeded: " + agentDisplayName(event);
			case AGENT_PULL_FAILED -> "Agent pull failed: " + agentDisplayName(event);
			case AGENT_MARKED_ONLINE -> "Agent marked online";
			case AGENT_MARKED_OFFLINE -> "Agent marked offline: " + event.hostname();
			case AGENT_DECOMMISSIONED -> "Agent decommissioned: " + agentDisplayName(event);
		};
	}

	private Map<String, Object> metadataFor(ServerInventoryChangedEvent event) {
		Map<String, Object> metadata = new LinkedHashMap<>();
		metadata.put("name", event.name());
		metadata.put("hostname", event.hostname());
		metadata.put("ipAddress", event.ipAddress());
		metadata.put("description", event.description());
		metadata.put("tags", event.tags());
		metadata.put("operatingSystem", event.operatingSystem());
		metadata.put("status", event.status());
		metadata.put("lastSeenAt", timestampMetadataValue(event.lastSeenAt()));
		metadata.put("agentId", event.agentId() == null ? null : event.agentId().toString());
		metadata.put("agentName", event.agentName());
		metadata.put("occurredAt", event.occurredAt().toString());
		return metadata;
	}

	private Map<String, Object> metadataFor(AgentChangedEvent event) {
		Map<String, Object> metadata = new LinkedHashMap<>();
		metadata.put("agentId", event.agentId().toString());
		metadata.put("agentName", event.name());
		metadata.put("hostname", event.hostname());
		metadata.put("version", event.version());
		metadata.put("status", event.status());
		metadata.put("previousStatus", event.previousStatus());
		metadata.put("lastSeenAt", timestampMetadataValue(event.lastSeenAt()));
		metadata.put("serverId", event.serverId() == null ? null : event.serverId().toString());
		metadata.put("serverName", event.serverName());
		metadata.put("occurredAt", event.occurredAt().toString());
		return metadata;
	}

	private String agentDisplayName(AgentChangedEvent event) {
		if (event.name() != null && !event.name().isBlank()) {
			return event.name();
		}
		if (event.hostname() != null && !event.hostname().isBlank()) {
			return event.hostname();
		}
		return event.agentId().toString();
	}

	private String timestampMetadataValue(Instant timestamp) {
		return timestamp == null ? null : timestamp.toString();
	}
}
