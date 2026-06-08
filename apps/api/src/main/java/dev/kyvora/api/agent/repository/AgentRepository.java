package dev.kyvora.api.agent.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import dev.kyvora.api.agent.entity.Agent;

public interface AgentRepository extends JpaRepository<Agent, UUID> {

	boolean existsByHostnameIgnoreCase(String hostname);
}
