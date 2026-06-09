package dev.kyvora.api.agent.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import dev.kyvora.api.agent.entity.AgentHostFacts;

public interface AgentHostFactsRepository extends JpaRepository<AgentHostFacts, UUID> {
}
