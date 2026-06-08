package dev.kyvora.api.agent.service;

import java.time.Instant;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
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
import dev.kyvora.api.agent.exception.AgentEnrollmentCancellationException;
import dev.kyvora.api.agent.exception.AgentNotFoundException;
import dev.kyvora.api.agent.exception.AgentTokenAuthenticationException;
import dev.kyvora.api.agent.exception.AgentTokenForbiddenException;
import dev.kyvora.api.agent.exception.DuplicateAgentException;
import dev.kyvora.api.agent.mapper.AgentMapper;
import dev.kyvora.api.agent.repository.AgentRepository;
import dev.kyvora.api.auditlog.service.AuditLogService;
import dev.kyvora.api.serverinventory.entity.ServerInventory;
import dev.kyvora.api.serverinventory.entity.ServerStatus;
import dev.kyvora.api.serverinventory.exception.ServerInventoryNotFoundException;
import dev.kyvora.api.serverinventory.repository.ServerInventoryRepository;

@Service
@Transactional
public class DefaultAgentService implements AgentService {

	private final AgentRepository repository;
	private final AgentMapper mapper;
	private final AuditLogService auditLogService;
	private final AgentTokenService agentTokenService;
	private final ServerInventoryRepository serverInventoryRepository;
	private final long offlineThresholdSeconds;

	public DefaultAgentService(
			AgentRepository repository,
			AgentMapper mapper,
			AuditLogService auditLogService,
			AgentTokenService agentTokenService,
			ServerInventoryRepository serverInventoryRepository,
			@Value("${kyvora.agent.offline-threshold-seconds:90}") long offlineThresholdSeconds) {
		this.repository = repository;
		this.mapper = mapper;
		this.auditLogService = auditLogService;
		this.agentTokenService = agentTokenService;
		this.serverInventoryRepository = serverInventoryRepository;
		this.offlineThresholdSeconds = offlineThresholdSeconds;
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
		ServerInventory server = serverInventoryRepository.findById(request.serverId())
				.orElseThrow(() -> new ServerInventoryNotFoundException(request.serverId()));
		if (repository.existsByServer(server)) {
			throw new DuplicateAgentException(
					"serverId",
					server.getId().toString(),
					"server already has an agent");
		}
		String hostname = mapper.normalizeHostname(server.getHostname());
		if (repository.existsByHostnameIgnoreCase(hostname)) {
			throw new DuplicateAgentException("hostname", hostname);
		}

		String token = agentTokenService.generateToken();
		Agent agent = mapper.toEntity(request, server);
		agent.setTokenHash(agentTokenService.hash(token));
		agent.setTokenCreatedAt(Instant.now());

		Agent saved = repository.save(agent);
		auditLogService.recordAgentChange(AgentChangedEvent.from(AgentEventType.AGENT_REGISTERED, saved));
		return new AgentEnrollmentResponse(mapper.toResponse(saved), token);
	}

	@Override
	public void cancelPendingEnrollment(UUID id) {
		Agent agent = getRequiredEntity(id);
		if (agent.getStatus() != AgentStatus.PENDING || agent.getLastSeenAt() != null) {
			throw new AgentEnrollmentCancellationException();
		}
		repository.delete(agent);
	}

	@Override
	public AgentEnrollmentResponse rotateToken(UUID id) {
		Agent agent = getRequiredEntity(id);
		String token = agentTokenService.generateToken();
		Instant rotatedAt = Instant.now();
		agent.setTokenHash(agentTokenService.hash(token));
		agent.setTokenCreatedAt(rotatedAt);
		agent.setTokenLastUsedAt(null);
		agent.setTokenRevokedAt(null);

		Agent saved = repository.save(agent);
		return new AgentEnrollmentResponse(mapper.toResponse(saved), token);
	}

	@Override
	public AgentResponse heartbeat(UUID id, String agentToken, AgentHeartbeatRequest request) {
		Agent agent = getRequiredEntity(id);
		verifyAgentToken(agent, agentToken);

		Instant heartbeatAt = Instant.now();
		agent.setStatus(request.status());
		if (request.version() != null && !request.version().isBlank()) {
			agent.setVersion(request.version().trim());
		}
		if (request.hostname() != null && !request.hostname().isBlank()) {
			agent.setHostname(mapper.normalizeHostname(request.hostname()));
		}
		agent.setLastSeenAt(heartbeatAt);
		agent.setTokenLastUsedAt(heartbeatAt);
		updateLinkedServer(agent, heartbeatAt);
		Agent saved = repository.save(agent);
		auditLogService.recordAgentChange(AgentChangedEvent.from(AgentEventType.AGENT_HEARTBEAT_RECEIVED, saved));
		return mapper.toResponse(saved);
	}

	@Override
	public int markStaleOnlineAgentsOffline() {
		Instant staleBefore = Instant.now().minusSeconds(offlineThresholdSeconds);
		var staleAgents = repository.findStaleOnlineAgents(staleBefore);
		for (Agent agent : staleAgents) {
			agent.setStatus(AgentStatus.OFFLINE);
			ServerInventory server = agent.getServer();
			if (server != null) {
				server.setStatus(ServerStatus.OFFLINE);
			}
			auditLogService.recordAgentChange(AgentChangedEvent.from(AgentEventType.AGENT_MARKED_OFFLINE, agent));
		}
		return staleAgents.size();
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

	private void updateLinkedServer(Agent agent, Instant heartbeatAt) {
		ServerInventory server = agent.getServer();
		if (server == null) {
			return;
		}
		server.setStatus(ServerStatus.valueOf(agent.getStatus().name()));
		server.setLastSeenAt(heartbeatAt);
	}

	private Agent getRequiredEntity(UUID id) {
		return repository.findById(id).orElseThrow(() -> new AgentNotFoundException(id));
	}
}
