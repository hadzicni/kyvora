package dev.kyvora.api.search.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.kyvora.api.agent.entity.Agent;
import dev.kyvora.api.agent.repository.AgentRepository;
import dev.kyvora.api.auditlog.entity.AuditLog;
import dev.kyvora.api.auditlog.repository.AuditLogRepository;
import dev.kyvora.api.auth.entity.User;
import dev.kyvora.api.auth.repository.UserRepository;
import dev.kyvora.api.config.security.Permissions;
import dev.kyvora.api.managedservice.entity.ManagedService;
import dev.kyvora.api.managedservice.repository.ManagedServiceRepository;
import dev.kyvora.api.search.dto.SearchResponse;
import dev.kyvora.api.search.dto.SearchResultResponse;
import dev.kyvora.api.serverinventory.entity.ServerInventory;
import dev.kyvora.api.serverinventory.repository.ServerInventoryRepository;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class DefaultSearchService implements SearchService {

	private static final int MAX_LIMIT = 25;
	private static final int DEFAULT_LIMIT = 8;

	private final ServerInventoryRepository serverInventoryRepository;
	private final ManagedServiceRepository managedServiceRepository;
	private final AgentRepository agentRepository;
	private final UserRepository userRepository;
	private final AuditLogRepository auditLogRepository;
	private final Permissions permissions;

	public DefaultSearchService(
			ServerInventoryRepository serverInventoryRepository,
			ManagedServiceRepository managedServiceRepository,
			AgentRepository agentRepository,
			UserRepository userRepository,
			AuditLogRepository auditLogRepository,
			Permissions permissions) {
		this.serverInventoryRepository = serverInventoryRepository;
		this.managedServiceRepository = managedServiceRepository;
		this.agentRepository = agentRepository;
		this.userRepository = userRepository;
		this.auditLogRepository = auditLogRepository;
		this.permissions = permissions;
	}

	@Override
	@Transactional(readOnly = true)
	public SearchResponse search(String query, int limit, Authentication authentication) {
		String normalizedQuery = query == null ? "" : query.trim();
		int normalizedLimit = normalizeLimit(limit);
		if (normalizedQuery.length() < 2) {
			log.debug("Search skipped because query was shorter than the minimum length");
			return new SearchResponse(normalizedQuery, List.of(), Instant.now());
		}

		PageRequest page = PageRequest.of(0, normalizedLimit, Sort.by("updatedAt").descending());
		List<SearchResultResponse> results = new ArrayList<>();

		if (permissions.canReadServers(authentication)) {
			results.addAll(serverInventoryRepository.search(normalizedQuery, page).stream()
					.map(this::toServerResult)
					.toList());
		}
		if (permissions.canReadServices(authentication)) {
			results.addAll(managedServiceRepository.search(normalizedQuery, page).stream()
					.map(this::toServiceResult)
					.toList());
		}
		if (permissions.canReadAgents(authentication)) {
			results.addAll(agentRepository.search(normalizedQuery, page).stream()
					.map(this::toAgentResult)
					.toList());
		}
		if (permissions.canReadUsers(authentication)) {
			results.addAll(userRepository.search(normalizedQuery, page).stream()
					.map(this::toUserResult)
					.toList());
		}
		if (permissions.canReadAuditLogs(authentication)) {
			results.addAll(auditLogRepository.search(
					normalizedQuery,
					PageRequest.of(0, normalizedLimit, Sort.by("createdAt").descending())).stream()
					.map(this::toAuditLogResult)
					.toList());
		}

		List<SearchResultResponse> orderedResults = results.stream()
				.sorted(Comparator
						.comparingInt((SearchResultResponse result) -> typeRank(result.type()))
						.thenComparing(SearchResultResponse::title, String.CASE_INSENSITIVE_ORDER))
				.limit(normalizedLimit)
				.toList();

		log.debug("Search completed with {} results", orderedResults.size());
		return new SearchResponse(normalizedQuery, orderedResults, Instant.now());
	}

	private int normalizeLimit(int limit) {
		if (limit <= 0) {
			return DEFAULT_LIMIT;
		}
		return Math.min(limit, MAX_LIMIT);
	}

	private SearchResultResponse toServerResult(ServerInventory server) {
		return new SearchResultResponse(
				server.getId().toString(),
				"SERVER",
				server.getName(),
				"Server - " + server.getStatus() + " - " + server.getIpAddress(),
				server.getHostname(),
				"/servers/" + server.getId(),
				metadata("hostname", server.getHostname(), "ipAddress", server.getIpAddress(), "status", server.getStatus().name()),
				server.getUpdatedAt());
	}

	private SearchResultResponse toServiceResult(ManagedService service) {
		String endpoint = firstNonBlank(service.getUrl(), service.getHostname(), service.getIpAddress(), service.getProtocol().name());
		return new SearchResultResponse(
				service.getId().toString(),
				"SERVICE",
				service.getName(),
				"Service - " + service.getCategory() + " - " + endpoint,
				service.getDescription(),
				"/services/" + service.getId(),
				metadata("category", service.getCategory().name(), "protocol", service.getProtocol().name(), "endpoint", endpoint),
				service.getUpdatedAt());
	}

	private SearchResultResponse toAgentResult(Agent agent) {
		return new SearchResultResponse(
				agent.getId().toString(),
				"AGENT",
				agent.getName(),
				"Agent - " + agent.getStatus() + " - " + agent.getHostname(),
				agent.getServer() == null ? null : agent.getServer().getName(),
				"/agents/" + agent.getId(),
				metadata("hostname", agent.getHostname(), "status", agent.getStatus().name(), "version", agent.getVersion()),
				agent.getUpdatedAt());
	}

	private SearchResultResponse toUserResult(User user) {
		return new SearchResultResponse(
				user.getId().toString(),
				"USER",
				user.getDisplayName(),
				"User - " + (user.isEnabled() ? "Enabled" : "Disabled") + " - " + user.getEmail(),
				user.getEmail(),
				"/users",
				metadata("email", user.getEmail(), "enabled", user.isEnabled()),
				user.getUpdatedAt());
	}

	private SearchResultResponse toAuditLogResult(AuditLog auditLog) {
		return new SearchResultResponse(
				auditLog.getId().toString(),
				"ACTIVITY",
				auditLog.getEventType().name(),
				"Activity - " + auditLog.getActor() + " - " + auditLog.getAggregateType(),
				auditLog.getMessage(),
				"/activity",
				metadata("actor", auditLog.getActor(), "aggregateType", auditLog.getAggregateType()),
				auditLog.getCreatedAt());
	}

	private Map<String, Object> metadata(Object... entries) {
		Map<String, Object> metadata = new LinkedHashMap<>();
		for (int index = 0; index + 1 < entries.length; index += 2) {
			metadata.put(String.valueOf(entries[index]), entries[index + 1]);
		}
		return metadata;
	}

	private String firstNonBlank(String... values) {
		for (String value : values) {
			if (value != null && !value.isBlank()) {
				return value;
			}
		}
		return "";
	}

	private int typeRank(String type) {
		return switch (type) {
			case "SERVER" -> 0;
			case "SERVICE" -> 1;
			case "AGENT" -> 2;
			case "USER" -> 3;
			case "ACTIVITY" -> 4;
			default -> 5;
		};
	}
}
