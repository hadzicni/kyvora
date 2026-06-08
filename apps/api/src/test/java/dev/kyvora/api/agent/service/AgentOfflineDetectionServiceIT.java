package dev.kyvora.api.agent.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import dev.kyvora.api.agent.entity.Agent;
import dev.kyvora.api.agent.entity.AgentStatus;
import dev.kyvora.api.agent.repository.AgentRepository;
import dev.kyvora.api.auditlog.entity.AuditEventType;
import dev.kyvora.api.auditlog.repository.AuditLogRepository;
import dev.kyvora.api.serverinventory.entity.ServerInventory;
import dev.kyvora.api.serverinventory.entity.ServerStatus;
import dev.kyvora.api.serverinventory.repository.ServerInventoryRepository;

@SpringBootTest(properties = "kyvora.agent.offline-check-interval-seconds=3600")
@ActiveProfiles("test")
class AgentOfflineDetectionServiceIT {

	@Autowired
	private AgentService agentService;

	@Autowired
	private AgentRepository agentRepository;

	@Autowired
	private AuditLogRepository auditLogRepository;

	@Autowired
	private ServerInventoryRepository serverInventoryRepository;

	@BeforeEach
	void setUp() {
		auditLogRepository.deleteAll();
		agentRepository.deleteAll();
		serverInventoryRepository.deleteAll();
	}

	@Test
	void staleOnlineAgentAndLinkedServerBecomeOfflineAndAuditLogIsRecorded() {
		ServerInventory server = createServer("Node 01", "node01.example.com");
		Agent agent = createAgent("Agent 01", "node01.example.com", AgentStatus.ONLINE, server, 120);

		int changed = agentService.markStaleOnlineAgentsOffline();

		assertThat(changed).isEqualTo(1);

		Agent storedAgent = agentRepository.findById(agent.getId()).orElseThrow();
		assertThat(storedAgent.getStatus()).isEqualTo(AgentStatus.OFFLINE);

		ServerInventory storedServer = serverInventoryRepository.findById(server.getId()).orElseThrow();
		assertThat(storedServer.getStatus()).isEqualTo(ServerStatus.OFFLINE);

		assertThat(auditLogRepository.findAll())
				.singleElement()
				.satisfies(log -> {
					assertThat(log.getEventType()).isEqualTo(AuditEventType.AGENT_MARKED_OFFLINE);
					assertThat(log.getAggregateType()).isEqualTo("AGENT");
					assertThat(log.getAggregateId()).isEqualTo(agent.getId());
					assertThat(log.getActor()).isEqualTo("system");
					assertThat(log.getMessage()).isEqualTo("Agent marked offline: node01.example.com");
					assertThat(log.getMetadata()).containsEntry("status", "OFFLINE");
				});
	}

	@Test
	void recentOnlineAgentStaysOnline() {
		ServerInventory server = createServer("Node 02", "node02.example.com");
		Agent agent = createAgent("Agent 02", "node02.example.com", AgentStatus.ONLINE, server, 30);

		int changed = agentService.markStaleOnlineAgentsOffline();

		assertThat(changed).isZero();
		assertThat(agentRepository.findById(agent.getId()).orElseThrow().getStatus()).isEqualTo(AgentStatus.ONLINE);
		assertThat(serverInventoryRepository.findById(server.getId()).orElseThrow().getStatus())
				.isEqualTo(ServerStatus.ONLINE);
		assertThat(auditLogRepository.findAll()).isEmpty();
	}

	@Test
	void pendingAgentIsNotChangedEvenWhenLastSeenIsOld() {
		ServerInventory server = createServer("Node 03", "node03.example.com");
		Agent agent = createAgent("Agent 03", "node03.example.com", AgentStatus.PENDING, server, 120);

		int changed = agentService.markStaleOnlineAgentsOffline();

		assertThat(changed).isZero();
		assertThat(agentRepository.findById(agent.getId()).orElseThrow().getStatus()).isEqualTo(AgentStatus.PENDING);
		assertThat(serverInventoryRepository.findById(server.getId()).orElseThrow().getStatus())
				.isEqualTo(ServerStatus.ONLINE);
		assertThat(auditLogRepository.findAll()).isEmpty();
	}

	@Test
	void unknownAgentIsNotChangedEvenWhenLastSeenIsOld() {
		ServerInventory server = createServer("Node 04", "node04.example.com");
		Agent agent = createAgent("Agent 04", "node04.example.com", AgentStatus.UNKNOWN, server, 120);

		int changed = agentService.markStaleOnlineAgentsOffline();

		assertThat(changed).isZero();
		assertThat(agentRepository.findById(agent.getId()).orElseThrow().getStatus()).isEqualTo(AgentStatus.UNKNOWN);
		assertThat(serverInventoryRepository.findById(server.getId()).orElseThrow().getStatus())
				.isEqualTo(ServerStatus.ONLINE);
		assertThat(auditLogRepository.findAll()).isEmpty();
	}

	@Test
	void serverWithoutLinkedAgentIsNotChanged() {
		ServerInventory server = createServer("Node 05", "node05.example.com");

		int changed = agentService.markStaleOnlineAgentsOffline();

		assertThat(changed).isZero();
		assertThat(serverInventoryRepository.findById(server.getId()).orElseThrow().getStatus())
				.isEqualTo(ServerStatus.ONLINE);
		assertThat(auditLogRepository.findAll()).isEmpty();
	}

	private ServerInventory createServer(String name, String hostname) {
		return serverInventoryRepository.save(new ServerInventory(
				name,
				hostname,
				"10.0.0.10",
				"",
				Set.of(),
				"Ubuntu 24.04",
				ServerStatus.ONLINE,
				Instant.now()));
	}

	private Agent createAgent(
			String name,
			String hostname,
			AgentStatus status,
			ServerInventory server,
			long lastSeenSecondsAgo) {
		Agent agent = new Agent(name, hostname, "0.1.0", status, server);
		agent.setLastSeenAt(Instant.now().minusSeconds(lastSeenSecondsAgo));
		return agentRepository.save(agent);
	}
}
