package dev.kyvora.api.agent.service;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.kyvora.api.agent.dto.AgentHeartbeatRequest;
import dev.kyvora.api.agent.dto.AgentEnrollmentResponse;
import dev.kyvora.api.agent.dto.AgentRegisterRequest;
import dev.kyvora.api.agent.dto.AgentResponse;
import dev.kyvora.api.agent.entity.Agent;
import dev.kyvora.api.agent.entity.AgentStatus;
import dev.kyvora.api.agent.event.AgentChangedEvent;
import dev.kyvora.api.agent.event.AgentEventType;
import dev.kyvora.api.agent.exception.AgentNotFoundException;
import dev.kyvora.api.agent.exception.AgentTokenAuthenticationException;
import dev.kyvora.api.agent.exception.AgentTokenForbiddenException;
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
	private final AgentTokenService agentTokenService;

	public DefaultAgentService(
			AgentRepository repository,
			AgentMapper mapper,
			AuditLogService auditLogService,
			AgentTokenService agentTokenService) {
		this.repository = repository;
		this.mapper = mapper;
		this.auditLogService = auditLogService;
		this.agentTokenService = agentTokenService;
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
	public AgentEnrollmentResponse enroll(AgentRegisterRequest request) {
		String hostname = mapper.normalizeHostname(request.hostname());
		if (hostname != null && repository.existsByHostnameIgnoreCase(hostname)) {
			throw new DuplicateAgentException("hostname", hostname);
		}

		String token = agentTokenService.generateToken();
		Agent agent = new Agent(
				request.name().trim(),
				hostname == null ? generatedEnrollmentHostname() : hostname,
				mapper.normalizeVersion(request.version()),
				AgentStatus.PENDING);
		agent.setTokenHash(agentTokenService.hash(token));
		agent.setTokenCreatedAt(Instant.now());

		Agent saved = repository.save(agent);
		auditLogService.recordAgentChange(AgentChangedEvent.from(AgentEventType.AGENT_REGISTERED, saved));
		return new AgentEnrollmentResponse(mapper.toResponse(saved), token);
	}

	@Override
	public AgentResponse heartbeat(UUID id, String agentToken, AgentHeartbeatRequest request) {
		Agent agent = getRequiredEntity(id);
		verifyAgentToken(agent, agentToken);

		agent.setStatus(request.status());
		if (request.version() != null && !request.version().isBlank()) {
			agent.setVersion(request.version().trim());
		}
		if (request.hostname() != null && !request.hostname().isBlank()) {
			agent.setHostname(mapper.normalizeHostname(request.hostname()));
		}
		agent.setLastSeenAt(Instant.now());
		agent.setTokenLastUsedAt(Instant.now());
		Agent saved = repository.save(agent);
		auditLogService.recordAgentChange(AgentChangedEvent.from(AgentEventType.AGENT_HEARTBEAT_RECEIVED, saved));
		return mapper.toResponse(saved);
	}

	private void verifyAgentToken(Agent agent, String agentToken) {
		if (agentToken == null || agentToken.isBlank()) {
			throw new AgentTokenAuthenticationException("Agent token is required");
		}
		if (agent.getTokenRevokedAt() != null) {
			throw new AgentTokenForbiddenException("Agent token has been revoked");
		}
		if (!agentTokenService.matches(agentToken, agent.getTokenHash())) {
			throw new AgentTokenAuthenticationException("Invalid agent token");
		}
	}

	private String generatedEnrollmentHostname() {
		return "agent-" + UUID.randomUUID() + ".local";
	}

	private Agent getRequiredEntity(UUID id) {
		return repository.findById(id).orElseThrow(() -> new AgentNotFoundException(id));
	}
}
