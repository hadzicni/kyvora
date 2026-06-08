package dev.kyvora.api.agent.service;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.kyvora.api.agent.dto.AgentHeartbeatRequest;
import dev.kyvora.api.agent.dto.AgentRegisterRequest;
import dev.kyvora.api.agent.dto.AgentResponse;
import dev.kyvora.api.agent.entity.Agent;
import dev.kyvora.api.agent.event.AgentChangedEvent;
import dev.kyvora.api.agent.event.AgentEventType;
import dev.kyvora.api.agent.exception.AgentNotFoundException;
import dev.kyvora.api.agent.exception.DuplicateAgentException;
import dev.kyvora.api.agent.mapper.AgentMapper;
import dev.kyvora.api.agent.repository.AgentRepository;
import dev.kyvora.api.auditlog.service.AuditLogService;

@Service
@Transactional
public class DefaultAgentService implements AgentService {

	private final AgentRepository repository;
	private final AgentMapper mapper;
	private final AuditLogService auditLogService;

	public DefaultAgentService(AgentRepository repository, AgentMapper mapper, AuditLogService auditLogService) {
		this.repository = repository;
		this.mapper = mapper;
		this.auditLogService = auditLogService;
	}

	@Override
	@Transactional(readOnly = true)
	public Page<AgentResponse> findAll(Pageable pageable) {
		return repository.findAll(pageable).map(mapper::toResponse);
	}

	@Override
	@Transactional(readOnly = true)
	public AgentResponse findById(UUID id) {
		return mapper.toResponse(getRequiredEntity(id));
	}

	@Override
	public AgentResponse register(AgentRegisterRequest request) {
		String hostname = mapper.normalizeHostname(request.hostname());
		if (repository.existsByHostnameIgnoreCase(hostname)) {
			throw new DuplicateAgentException("hostname", hostname);
		}

		Agent saved = repository.save(mapper.toEntity(request));
		auditLogService.recordAgentChange(AgentChangedEvent.from(AgentEventType.AGENT_REGISTERED, saved));
		return mapper.toResponse(saved);
	}

	@Override
	public AgentResponse heartbeat(UUID id, AgentHeartbeatRequest request) {
		Agent agent = getRequiredEntity(id);
		agent.setStatus(request.status());
		if (request.version() != null && !request.version().isBlank()) {
			agent.setVersion(request.version().trim());
		}
		agent.setLastSeenAt(Instant.now());
		Agent saved = repository.save(agent);
		auditLogService.recordAgentChange(AgentChangedEvent.from(AgentEventType.AGENT_HEARTBEAT_RECEIVED, saved));
		return mapper.toResponse(saved);
	}

	private Agent getRequiredEntity(UUID id) {
		return repository.findById(id).orElseThrow(() -> new AgentNotFoundException(id));
	}
}
