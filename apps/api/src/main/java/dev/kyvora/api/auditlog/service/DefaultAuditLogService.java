package dev.kyvora.api.auditlog.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.kyvora.api.auditlog.dto.AuditLogFilter;
import dev.kyvora.api.auditlog.dto.AuditLogResponse;
import dev.kyvora.api.auditlog.entity.AuditEventType;
import dev.kyvora.api.auditlog.entity.AuditLog;
import dev.kyvora.api.auditlog.mapper.AuditLogMapper;
import dev.kyvora.api.auditlog.repository.AuditLogRepository;
import dev.kyvora.api.auditlog.repository.AuditLogSpecifications;
import dev.kyvora.api.agent.event.AgentChangedEvent;
import dev.kyvora.api.agent.event.AgentEventType;
import dev.kyvora.api.auth.security.AuthenticatedUser;
import dev.kyvora.api.serverinventory.event.ServerInventoryChangedEvent;

@Service
@Transactional
public class DefaultAuditLogService implements AuditLogService {

	private static final String SERVER_AGGREGATE_TYPE = "SERVER";
	private static final String AGENT_AGGREGATE_TYPE = "AGENT";
	private static final String AUTH_AGGREGATE_TYPE = "AUTH";
	private static final String SETTINGS_AGGREGATE_TYPE = "SETTINGS";
	private static final String SYSTEM_ACTOR = "system";
	private static final UUID EMPTY_AGGREGATE_ID = new UUID(0, 0);

	private final AuditLogRepository repository;
	private final AuditLogMapper mapper;

	public DefaultAuditLogService(AuditLogRepository repository, AuditLogMapper mapper) {
		this.repository = repository;
		this.mapper = mapper;
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
	}

	@Override
	public void recordAuthEvent(AuditEventType eventType, UUID userId, String actor, String message) {
		repository.save(new AuditLog(
				eventType,
				AUTH_AGGREGATE_TYPE,
				userId == null ? EMPTY_AGGREGATE_ID : userId,
				actor == null || actor.isBlank() ? currentActor() : actor,
				message,
				Map.of()));
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
	}

	private String currentActor() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
			return SYSTEM_ACTOR;
		}
		if (authentication.getPrincipal() instanceof AuthenticatedUser user) {
			return user.email();
		}
		return authentication.getName();
	}

	private String actorFor(AgentChangedEvent event) {
		if (event.actor() != null && !event.actor().isBlank()) {
			return event.actor();
		}
		if (event.type() == AgentEventType.AGENT_HEARTBEAT_RECEIVED
				|| event.type() == AgentEventType.AGENT_CONNECTED
				|| event.type() == AgentEventType.AGENT_MARKED_ONLINE) {
			if (event.hostname() != null && !event.hostname().isBlank()) {
				return "agent:" + event.hostname();
			}
			return "agent:" + event.agentId();
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
			case AGENT_REGISTERED, AGENT_ENROLLED -> "Agent enrolled";
			case AGENT_CONNECTED -> "Agent connected";
			case AGENT_HEARTBEAT_RECEIVED -> "Agent heartbeat received: " + event.hostname();
			case AGENT_MARKED_ONLINE -> "Agent marked online";
			case AGENT_MARKED_OFFLINE -> "Agent marked offline: " + event.hostname();
			case AGENT_TOKEN_ROTATED -> "Agent token rotated";
			case AGENT_ENROLLMENT_CANCELED -> "Agent enrollment canceled";
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
