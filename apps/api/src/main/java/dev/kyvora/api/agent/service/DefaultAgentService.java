package dev.kyvora.api.agent.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.kyvora.api.agent.client.AgentPullClient;
import dev.kyvora.api.agent.client.AgentPullException;
import dev.kyvora.api.agent.dto.AgentHostFactsRequest;
import dev.kyvora.api.agent.dto.AgentPullResponse;
import dev.kyvora.api.agent.dto.AgentRegisterRequest;
import dev.kyvora.api.agent.dto.AgentResponse;
import dev.kyvora.api.agent.entity.Agent;
import dev.kyvora.api.agent.entity.AgentHostFacts;
import dev.kyvora.api.agent.entity.AgentStatus;
import dev.kyvora.api.agent.event.AgentChangedEvent;
import dev.kyvora.api.agent.event.AgentEventType;
import dev.kyvora.api.agent.exception.AgentNotFoundException;
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
import lombok.extern.slf4j.Slf4j;

@Service
@Transactional
@Slf4j
public class DefaultAgentService implements AgentService {

	private final AgentRepository repository;
	private final AgentMapper mapper;
	private final AuditLogService auditLogService;
	private final AgentHostFactsRepository hostFactsRepository;
	private final ServerInventoryRepository serverInventoryRepository;
	private final SettingsService settingsService;
	private final AgentPullClient agentPullClient;
	private final long fallbackOfflineThresholdSeconds;

	public DefaultAgentService(
			AgentRepository repository,
			AgentMapper mapper,
			AuditLogService auditLogService,
			AgentHostFactsRepository hostFactsRepository,
			ServerInventoryRepository serverInventoryRepository,
			SettingsService settingsService,
			AgentPullClient agentPullClient,
			@Value("${kyvora.agent.offline-threshold-seconds:90}") long offlineThresholdSeconds) {
		this.repository = repository;
		this.mapper = mapper;
		this.auditLogService = auditLogService;
		this.hostFactsRepository = hostFactsRepository;
		this.serverInventoryRepository = serverInventoryRepository;
		this.settingsService = settingsService;
		this.agentPullClient = agentPullClient;
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
	public AgentResponse create(AgentRegisterRequest request) {
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

		Agent agent = mapper.toEntity(request, server);
		agent.setPullEnabled(request.pullEnabled() == null || request.pullEnabled());
		Agent saved = repository.save(agent);
		auditLogService.recordAgentChange(AgentChangedEvent.from(AgentEventType.AGENT_CONFIGURED, saved));
		log.info("Configured agent {} for server {}", saved.getId(), server.getId());
		return mapper.toResponse(saved);
	}

	@Override
	public AgentPullResponse pull(UUID id) {
		Agent agent = getRequiredEntity(id);
		Instant pulledAt = Instant.now();
		AgentStatus previousStatus = agent.getStatus();
		ServerStatus previousServerStatus = agent.getServer() == null ? null : agent.getServer().getStatus();
		agent.setLastPullAt(pulledAt);

		if (!agent.isPullEnabled()) {
			String message = "Agent pull is disabled";
			recordFailedPull(agent, message);
			log.warn("Agent pull skipped for {} because pull is disabled", agent.getId());
			return new AgentPullResponse(mapper.toResponse(agent), agent.getStatus(), pulledAt, message);
		}

		try {
			AgentPullClient.AgentPullSnapshot snapshot = agentPullClient.pull(agent);
			applySuccessfulPull(agent, snapshot, pulledAt);
			Agent saved = repository.save(agent);
			recordPullLifecycleEvents(saved, previousStatus, previousServerStatus);
			log.info("Agent pull succeeded for {}", saved.getId());
			return new AgentPullResponse(mapper.toResponse(saved), saved.getStatus(), pulledAt, null);
		}
		catch (AgentPullException exception) {
			String message = truncate(exception.getMessage(), 1000);
			recordFailedPull(agent, message);
			Agent saved = repository.save(agent);
			if (previousStatus != AgentStatus.OFFLINE) {
				auditLogService.recordAgentChange(AgentChangedEvent.fromSystemActor(AgentEventType.AGENT_PULL_FAILED, saved));
			}
			log.warn("Agent pull failed for {} with {}", saved.getId(), exception.getClass().getSimpleName());
			return new AgentPullResponse(mapper.toResponse(saved), saved.getStatus(), pulledAt, message);
		}
	}

	@Override
	public AgentResponse decommission(UUID id) {
		Agent agent = getRequiredEntity(id);
		AgentStatus previousStatus = agent.getStatus();
		ServerInventory server = agent.getServer();
		UUID previousServerId = server == null ? null : server.getId();
		String previousServerName = server == null ? null : server.getName();

		agent.setPullEnabled(false);
		agent.setStatus(AgentStatus.UNKNOWN);
		agent.setServer(null);
		agent.setSharedSecret("");

		if (server != null) {
			server.setStatus(ServerStatus.UNKNOWN);
		}

		Agent saved = repository.save(agent);
		auditLogService.recordAgentChange(AgentChangedEvent.decommissioned(
				saved,
				previousStatus,
				previousServerId,
				previousServerName));
		log.info("Decommissioned agent {}", saved.getId());
		return mapper.toResponse(saved);
	}

	@Override
	public int markStaleOnlineAgentsOffline() {
		long offlineThresholdSeconds = settingsService.getLongSettingOrDefault(
				DefaultSettingsService.AGENTS_OFFLINE_THRESHOLD_SECONDS,
				fallbackOfflineThresholdSeconds);
		Instant staleBefore = Instant.now().minusSeconds(offlineThresholdSeconds);
		var staleAgents = repository.findStaleOnlineAgents(staleBefore);
		if (staleAgents.isEmpty()) {
			log.debug("No stale online agents found before {}", staleBefore);
			return 0;
		}
		for (Agent agent : staleAgents) {
			agent.setStatus(AgentStatus.OFFLINE);
			agent.setLastPullError("Agent has not been pulled successfully within the offline threshold");
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
		log.warn("Marked {} stale agents offline", staleAgents.size());
		return staleAgents.size();
	}

	private void applySuccessfulPull(Agent agent, AgentPullClient.AgentPullSnapshot snapshot, Instant pulledAt) {
		AgentStatus previousStatus = agent.getStatus();
		agent.setStatus(AgentStatus.ONLINE);
		agent.setLastSeenAt(pulledAt);
		agent.setLastSuccessfulPullAt(pulledAt);
		agent.setLastPullError(null);
		if (snapshot.health().version() != null && !snapshot.health().version().isBlank()) {
			agent.setVersion(snapshot.health().version().trim());
		}
		if (snapshot.health().hostname() != null && !snapshot.health().hostname().isBlank()) {
			agent.setHostname(mapper.normalizeHostname(snapshot.health().hostname()));
		}
		agent.setCapabilities(snapshot.capabilities().supports());
		updateLinkedServer(agent, pulledAt);
		upsertHostFacts(agent, snapshot.system());
		if (previousStatus != AgentStatus.ONLINE) {
			auditLogService.recordAgentChange(AgentChangedEvent.fromSystemActor(AgentEventType.AGENT_MARKED_ONLINE, agent));
		}
		auditLogService.recordAgentChange(AgentChangedEvent.fromSystemActor(AgentEventType.AGENT_PULL_SUCCEEDED, agent));
	}

	private void recordFailedPull(Agent agent, String message) {
		agent.setStatus(AgentStatus.OFFLINE);
		agent.setLastPullError(message);
		ServerInventory server = agent.getServer();
		if (server != null) {
			server.setStatus(ServerStatus.OFFLINE);
		}
	}

	private void recordPullLifecycleEvents(Agent agent, AgentStatus previousStatus, ServerStatus previousServerStatus) {
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
		if (previousStatus == AgentStatus.ONLINE) {
			return;
		}
	}

	private void updateLinkedServer(Agent agent, Instant pulledAt) {
		ServerInventory server = agent.getServer();
		if (server == null) {
			return;
		}
		server.setStatus(ServerStatus.ONLINE);
		server.setLastSeenAt(pulledAt);
	}

	private void upsertHostFacts(Agent agent, AgentHostFactsRequest request) {
		if (request == null) {
			log.debug("Skipping host facts update for agent {} because no system facts were returned", agent.getId());
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
		log.debug("Updated host facts for agent {}", agent.getId());
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

	private String truncate(String value, int maxLength) {
		if (value == null || value.length() <= maxLength) {
			return value;
		}
		return value.substring(0, maxLength);
	}

	private Agent getRequiredEntity(UUID id) {
		return repository.findById(id).orElseThrow(() -> new AgentNotFoundException(id));
	}
}
