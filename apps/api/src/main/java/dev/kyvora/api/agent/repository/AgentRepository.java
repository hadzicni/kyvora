package dev.kyvora.api.agent.repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import dev.kyvora.api.agent.entity.Agent;
import dev.kyvora.api.serverinventory.entity.ServerInventory;

public interface AgentRepository extends JpaRepository<Agent, UUID> {

	boolean existsByHostnameIgnoreCase(String hostname);

	boolean existsByServer(ServerInventory server);

	@Query("""
			select agent
			from Agent agent
			left join fetch agent.server
			where agent.status = dev.kyvora.api.agent.entity.AgentStatus.ONLINE
				and agent.lastSeenAt < :staleBefore
			""")
	List<Agent> findStaleOnlineAgents(@Param("staleBefore") Instant staleBefore);
}
