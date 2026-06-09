package dev.kyvora.api.agent.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.kyvora.api.agent.dto.AgentHeartbeatRequest;
import dev.kyvora.api.agent.dto.AgentHostFactsRequest;
import dev.kyvora.api.agent.dto.AgentEnrollmentResponse;
import dev.kyvora.api.agent.dto.AgentRegisterRequest;
import dev.kyvora.api.agent.dto.AgentResponse;
import dev.kyvora.api.agent.entity.Agent;
import dev.kyvora.api.agent.entity.AgentHostFacts;
import dev.kyvora.api.agent.entity.AgentStatus;
import dev.kyvora.api.agent.event.AgentChangedEvent;
import dev.kyvora.api.agent.event.AgentEventType;
import dev.kyvora.api.agent.exception.AgentEnrollmentCancellationException;
import dev.kyvora.api.agent.exception.AgentNotFoundException;
import dev.kyvora.api.agent.exception.AgentTokenAuthenticationException;
import dev.kyvora.api.agent.exception.AgentTokenForbiddenException;
import dev.kyvora.api.agent.exception.DuplicateAgentException;
import dev.kyvora.api.agent.mapper.AgentMapper;
import dev.kyvora.api.agent.repository.AgentHostFactsRepository;
import dev.kyvora.api.agent.repository.AgentRepository;
import dev.kyvora.api.auditlog.service.AuditLogService;
import dev.kyvora.api.serverinventory.entity.ServerInventory;
import dev.kyvora.api.serverinventory.entity.ServerStatus;
import dev.kyvora.api.serverinventory.event.ServerInventoryChangedEvent;
import dev.kyvora.api.serverinventory.event.ServerInventoryEventType;
import dev.kyvora.api.serverinventory.exception.ServerInventoryNotFoundException;
import dev.kyvora.api.serverinventory.repository.ServerInventoryRepository;
import dev.kyvora.api.settings.service.DefaultSettingsService;
import dev.kyvora.api.settings.service.SettingsService;

@Service
@Transactional
public class DefaultAgentService implements AgentService {

	private final AgentRepository repository;
	private final AgentMapper mapper;
	private final AuditLogService auditLogService;
	private final AgentTokenService agentTokenService;
	private final AgentHostFactsRepository hostFactsRepository;
	private final ServerInventoryRepository serverInventoryRepository;
	private final SettingsService settingsService;
	private final long fallbackOfflineThresholdSeconds;

	public DefaultAgentService(
			AgentRepository repository,
			AgentMapper mapper,
			AuditLogService auditLogService,
			AgentTokenService agentTokenService,
			AgentHostFactsRepository hostFactsRepository,
			ServerInventoryRepository serverInventoryRepository,
			SettingsService settingsService,
			@Value("${kyvora.agent.offline-threshold-seconds:90}") long offlineThresholdSeconds) {
		this.repository = repository;
		this.mapper = mapper;
		this.auditLogService = auditLogService;
		this.agentTokenService = agentTokenService;
		this.hostFactsRepository = hostFactsRepository;
		this.serverInventoryRepository = serverInventoryRepository;
		this.settingsService = settingsService;
		this.fallbackOfflineThresholdSeconds = offlineThresholdSeconds;
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
		auditLogService.recordAgentChange(AgentChangedEvent.from(AgentEventType.AGENT_ENROLLED, saved));
		return new AgentEnrollmentResponse(mapper.toResponse(saved), token);
	}

	@Override
	public void cancelPendingEnrollment(UUID id) {
		Agent agent = getRequiredEntity(id);
		if (agent.getStatus() != AgentStatus.PENDING || agent.getLastSeenAt() != null) {
			throw new AgentEnrollmentCancellationException();
		}
		auditLogService.recordAgentChange(AgentChangedEvent.from(AgentEventType.AGENT_ENROLLMENT_CANCELED, agent));
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
		auditLogService.recordAgentChange(AgentChangedEvent.from(AgentEventType.AGENT_TOKEN_ROTATED, saved));
		return new AgentEnrollmentResponse(mapper.toResponse(saved), token);
	}

	@Override
	public AgentResponse heartbeat(UUID id, String agentToken, AgentHeartbeatRequest request) {
		Agent agent = getRequiredEntity(id);
		verifyAgentToken(agent, agentToken);

		AgentStatus previousStatus = agent.getStatus();
		Instant previousLastSeenAt = agent.getLastSeenAt();
		ServerInventory linkedServer = agent.getServer();
		ServerStatus previousServerStatus = linkedServer == null ? null : linkedServer.getStatus();
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
		upsertHostFacts(agent, request.hostFacts());
		Agent saved = repository.save(agent);
		recordHeartbeatLifecycleEvents(saved, previousStatus, previousLastSeenAt, previousServerStatus);
		return mapper.toResponse(saved);
	}

	@Override
	public int markStaleOnlineAgentsOffline() {
		long offlineThresholdSeconds = settingsService.getLongSettingOrDefault(
				DefaultSettingsService.AGENTS_OFFLINE_THRESHOLD_SECONDS,
				fallbackOfflineThresholdSeconds);
		Instant staleBefore = Instant.now().minusSeconds(offlineThresholdSeconds);
		var staleAgents = repository.findStaleOnlineAgents(staleBefore);
		for (Agent agent : staleAgents) {
			agent.setStatus(AgentStatus.OFFLINE);
			ServerInventory server = agent.getServer();
			if (server != null) {
				ServerStatus previousServerStatus = server.getStatus();
				server.setStatus(ServerStatus.OFFLINE);
				if (previousServerStatus != ServerStatus.OFFLINE) {
					auditLogService.recordServerInventoryChange(ServerInventoryChangedEvent.fromAgentMonitor(
							ServerInventoryEventType.SERVER_MARKED_OFFLINE_BY_AGENT,
							server,
							agent));
				}
			}
			auditLogService.recordAgentChange(AgentChangedEvent.fromSystemActor(AgentEventType.AGENT_MARKED_OFFLINE, agent));
		}
		return staleAgents.size();
	}

	private void recordHeartbeatLifecycleEvents(
			Agent agent,
			AgentStatus previousStatus,
			Instant previousLastSeenAt,
			ServerStatus previousServerStatus) {
		boolean firstHeartbeat = previousLastSeenAt == null;
		boolean becameOnline = previousStatus != AgentStatus.ONLINE && agent.getStatus() == AgentStatus.ONLINE;

		if (firstHeartbeat || previousStatus == AgentStatus.PENDING) {
			auditLogService.recordAgentChange(AgentChangedEvent.fromAgentActor(AgentEventType.AGENT_CONNECTED, agent));
		}
		else if (becameOnline) {
			auditLogService.recordAgentChange(AgentChangedEvent.fromAgentActor(AgentEventType.AGENT_MARKED_ONLINE, agent));
		}

		ServerInventory server = agent.getServer();
		if (server != null
				&& agent.getStatus() == AgentStatus.ONLINE
				&& previousServerStatus != ServerStatus.ONLINE
				&& server.getStatus() == ServerStatus.ONLINE) {
			auditLogService.recordServerInventoryChange(ServerInventoryChangedEvent.fromAgent(
					ServerInventoryEventType.SERVER_MARKED_ONLINE_BY_AGENT,
					server,
					agent));
		}
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

	private void upsertHostFacts(Agent agent, AgentHostFactsRequest request) {
		if (request == null) {
			return;
		}
		AgentHostFacts facts = hostFactsRepository.findById(agent.getId())
				.orElseGet(() -> new AgentHostFacts(agent));
		facts.setHostname(trimToNull(request.hostname()));
		facts.setOperatingSystem(trimToNull(request.operatingSystem()));
		facts.setPlatform(trimToNull(request.platform()));
		facts.setKernelVersion(trimToNull(request.kernelVersion()));
		facts.setArchitecture(trimToNull(request.architecture()));
		facts.setCpuCount(request.cpuCount());
		facts.setMemoryTotalBytes(request.memoryTotalBytes());
		facts.setDiskTotalBytes(request.diskTotalBytes());
		facts.setDiskFreeBytes(request.diskFreeBytes());
		facts.setUptimeSeconds(request.uptimeSeconds());
		facts.setIpAddresses(request.ipAddresses() == null ? List.of() : request.ipAddresses().stream()
				.map(this::trimToNull)
				.filter(value -> value != null)
				.distinct()
				.toList());
		facts.setAgentVersion(trimToNull(request.agentVersion()));
		facts.setCollectedAt(request.collectedAt() == null ? Instant.now() : request.collectedAt());
		hostFactsRepository.save(facts);
		agent.setHostFacts(facts);
		updateLinkedServerOperatingSystem(agent.getServer(), facts);
	}

	private void updateLinkedServerOperatingSystem(ServerInventory server, AgentHostFacts facts) {
		if (server == null || facts.getOperatingSystem() == null || !isUnknownLike(server.getOperatingSystem())) {
			return;
		}
		server.setOperatingSystem(facts.getOperatingSystem());
	}

	private boolean isUnknownLike(String value) {
		if (value == null || value.isBlank()) {
			return true;
		}
		String normalized = value.trim().toLowerCase(java.util.Locale.ROOT);
		return normalized.equals("unknown") || normalized.equals("n/a") || normalized.equals("na");
	}

	private String trimToNull(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value.trim();
	}

	private Agent getRequiredEntity(UUID id) {
		return repository.findById(id).orElseThrow(() -> new AgentNotFoundException(id));
	}
}
