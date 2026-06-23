package dev.kyvora.api.agent.service;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import dev.kyvora.api.agent.dto.AgentPullResponse;
import dev.kyvora.api.agent.dto.AgentConnectionTestRequest;
import dev.kyvora.api.agent.dto.AgentConnectionTestResponse;
import dev.kyvora.api.agent.dto.AgentConnectionUpdateRequest;
import dev.kyvora.api.agent.dto.AgentRegisterRequest;
import dev.kyvora.api.agent.dto.AgentResponse;

public interface AgentService {

	Page<AgentResponse> findAll(Pageable pageable);

	AgentResponse findById(UUID id);

	AgentResponse create(AgentRegisterRequest request);

	AgentConnectionTestResponse testConnection(AgentConnectionTestRequest request);

	AgentResponse updateConnection(UUID id, AgentConnectionUpdateRequest request);

	AgentPullResponse pull(UUID id);

	AgentResponse decommission(UUID id);

	int markStaleOnlineAgentsOffline();
}
