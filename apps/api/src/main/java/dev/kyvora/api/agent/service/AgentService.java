package dev.kyvora.api.agent.service;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import dev.kyvora.api.agent.dto.AgentHeartbeatRequest;
import dev.kyvora.api.agent.dto.AgentEnrollmentResponse;
import dev.kyvora.api.agent.dto.AgentRegisterRequest;
import dev.kyvora.api.agent.dto.AgentResponse;

public interface AgentService {

	Page<AgentResponse> findAll(Pageable pageable);

	AgentResponse findById(UUID id);

	AgentEnrollmentResponse enroll(AgentRegisterRequest request);

	AgentResponse heartbeat(UUID id, String agentToken, AgentHeartbeatRequest request);
}
