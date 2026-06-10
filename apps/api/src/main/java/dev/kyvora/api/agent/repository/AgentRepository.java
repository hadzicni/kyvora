package dev.kyvora.api.agent.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import dev.kyvora.api.agent.entity.Agent;
import dev.kyvora.api.agent.entity.AgentStatus;
import dev.kyvora.api.serverinventory.entity.ServerInventory;

public interface AgentRepository extends JpaRepository<Agent, UUID> {

	boolean existsByHostnameIgnoreCaseAndStatusNot(String hostname, AgentStatus status);

	boolean existsByServer(ServerInventory server);

	Optional<Agent> findByServerId(UUID serverId);

	@Query("""
			select agent
			from Agent agent
			left join fetch agent.server
			left join fetch agent.hostFacts
			where agent.server is not null
			""")
	List<Agent> findAllLinkedWithHostFacts();

	@Query("""
			select agent
			from Agent agent
			left join fetch agent.server
			where agent.status = dev.kyvora.api.agent.entity.AgentStatus.ONLINE
				and agent.lastSeenAt < :staleBefore
			""")
	List<Agent> findStaleOnlineAgents(@Param("staleBefore") Instant staleBefore);
}
