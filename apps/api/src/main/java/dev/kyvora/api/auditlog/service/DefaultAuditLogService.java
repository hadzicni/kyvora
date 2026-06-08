package dev.kyvora.api.auditlog.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

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
import dev.kyvora.api.serverinventory.event.ServerInventoryChangedEvent;

@Service
@Transactional
public class DefaultAuditLogService implements AuditLogService {

	private static final String SERVER_AGGREGATE_TYPE = "SERVER";
	private static final String AGENT_AGGREGATE_TYPE = "AGENT";
	private static final String SYSTEM_ACTOR = "system";

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
				currentActor(),
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
				currentActor(),
				messageFor(event),
				metadataFor(event)));
	}

	private String currentActor() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
			return SYSTEM_ACTOR;
		}
		return authentication.getName();
	}

	private String messageFor(ServerInventoryChangedEvent event) {
		return switch (event.type()) {
			case SERVER_CREATED -> "Server created: " + event.hostname();
			case SERVER_UPDATED -> "Server updated: " + event.hostname();
			case SERVER_DELETED -> "Server deleted: " + event.hostname();
		};
	}

	private String messageFor(AgentChangedEvent event) {
		return switch (event.type()) {
			case AGENT_REGISTERED -> "Agent registered: " + event.hostname();
			case AGENT_HEARTBEAT_RECEIVED -> "Agent heartbeat received: " + event.hostname();
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
		metadata.put("occurredAt", event.occurredAt().toString());
		return metadata;
	}

	private Map<String, Object> metadataFor(AgentChangedEvent event) {
		Map<String, Object> metadata = new LinkedHashMap<>();
		metadata.put("name", event.name());
		metadata.put("hostname", event.hostname());
		metadata.put("version", event.version());
		metadata.put("status", event.status());
		metadata.put("lastSeenAt", timestampMetadataValue(event.lastSeenAt()));
		metadata.put("occurredAt", event.occurredAt().toString());
		return metadata;
	}

	private String timestampMetadataValue(Instant timestamp) {
		return timestamp == null ? null : timestamp.toString();
	}
}
