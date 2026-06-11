package dev.kyvora.api.agent;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.matchesPattern;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import dev.kyvora.api.agent.entity.Agent;
import dev.kyvora.api.agent.repository.AgentHostFactsRepository;
import dev.kyvora.api.agent.repository.AgentRepository;
import dev.kyvora.api.auditlog.entity.AuditEventType;
import dev.kyvora.api.auditlog.repository.AuditLogRepository;
import dev.kyvora.api.serverinventory.entity.ServerInventory;
import dev.kyvora.api.serverinventory.entity.ServerStatus;
import dev.kyvora.api.serverinventory.repository.ServerInventoryRepository;

@SpringBootTest
@ActiveProfiles("test")
class AgentControllerIT {

	private static final String ISO_8601_INSTANT_PATTERN = "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,9})?Z";

	@Autowired
	private WebApplicationContext webApplicationContext;

	@Autowired
	private AgentRepository agentRepository;

	@Autowired
	private AgentHostFactsRepository hostFactsRepository;

	@Autowired
	private AuditLogRepository auditLogRepository;

	@Autowired
	private ServerInventoryRepository serverInventoryRepository;

	private ObjectMapper objectMapper;

	private MockMvc mockMvc;

	@BeforeEach
	void setUp() {
		objectMapper = new ObjectMapper().findAndRegisterModules();
		mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
				.apply(springSecurity())
				.build();
		auditLogRepository.deleteAll();
		hostFactsRepository.deleteAll();
		agentRepository.deleteAll();
		serverInventoryRepository.deleteAll();
	}

	@Test
	void enrollReturnsCreatedAgentPlaintextTokenAndAuditLog() throws Exception {
		ServerInventory server = createServer("Node 01", "node01.example.com", "10.0.0.11");

		String createdJson = mockMvc.perform(post("/api/v1/agents")
				.with(user("alice").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_CANCEL_ENROLLMENT"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ROTATE_TOKEN"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION")))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(registerPayload(
						server.getId(),
						"Homelab Agent 01",
						"0.1.0"))))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.agent.id", notNullValue()))
				.andExpect(jsonPath("$.agent.name", is("Homelab Agent 01")))
				.andExpect(jsonPath("$.agent.serverId", is(server.getId().toString())))
				.andExpect(jsonPath("$.agent.serverName", is("Node 01")))
				.andExpect(jsonPath("$.agent.serverHostname", is("node01.example.com")))
				.andExpect(jsonPath("$.agent.hostname", is("node01.example.com")))
				.andExpect(jsonPath("$.agent.version", is("0.1.0")))
				.andExpect(jsonPath("$.agent.status", is("PENDING")))
				.andExpect(jsonPath("$.agent.lastSeenAt").doesNotExist())
				.andExpect(jsonPath("$.agent.registeredAt", notNullValue()))
				.andExpect(jsonPath("$.agent.updatedAt", notNullValue()))
				.andExpect(jsonPath("$.agentToken", notNullValue()))
				.andReturn()
				.getResponse()
				.getContentAsString();

		JsonNode created = objectMapper.readTree(createdJson);
		String id = created.get("agent").get("id").asText();
		String agentToken = created.get("agentToken").asText();

		Agent stored = agentRepository.findById(UUID.fromString(id)).orElseThrow();
		org.assertj.core.api.Assertions.assertThat(stored.getTokenHash()).isNotBlank();
		org.assertj.core.api.Assertions.assertThat(stored.getTokenHash()).hasSize(64);
		org.assertj.core.api.Assertions.assertThat(stored.getTokenHash()).isNotEqualTo(agentToken);
		org.assertj.core.api.Assertions.assertThat(stored.getTokenCreatedAt()).isNotNull();
		org.assertj.core.api.Assertions.assertThat(stored.getTokenLastUsedAt()).isNull();
		org.assertj.core.api.Assertions.assertThat(stored.getServer().getId()).isEqualTo(server.getId());

		mockMvc.perform(get("/api/v1/audit-logs")
				.with(user("alice").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_CANCEL_ENROLLMENT"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ROTATE_TOKEN"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION")))
				.param("aggregateType", "AGENT")
				.param("aggregateId", id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content", hasSize(1)))
				.andExpect(jsonPath("$.content[0].eventType", is("AGENT_ENROLLED")))
				.andExpect(jsonPath("$.content[0].aggregateType", is("AGENT")))
				.andExpect(jsonPath("$.content[0].aggregateId", is(id)))
				.andExpect(jsonPath("$.content[0].actor", is("alice")))
				.andExpect(jsonPath("$.content[0].message", is("Agent enrolled")))
				.andExpect(jsonPath("$.content[0].metadata.agentId", is(id)))
				.andExpect(jsonPath("$.content[0].metadata.agentName", is("Homelab Agent 01")))
				.andExpect(jsonPath("$.content[0].metadata.hostname", is("node01.example.com")))
				.andExpect(jsonPath("$.content[0].metadata.serverId", is(server.getId().toString())))
				.andExpect(jsonPath("$.content[0].metadata.serverName", is("Node 01")))
				.andExpect(jsonPath("$.content[0].metadata.lastSeenAt", nullValue()))
				.andExpect(jsonPath("$.content[0].metadata.registeredAt").doesNotExist())
				.andExpect(jsonPath("$.content[0].metadata.updatedAt").doesNotExist())
				.andExpect(jsonPath("$.content[0].metadata.occurredAt", matchesPattern(ISO_8601_INSTANT_PATTERN)));
	}

	@Test
	void enrollDefaultsAgentNameFromServerNameWhenNameIsOmitted() throws Exception {
		ServerInventory server = createServer("Node 01", "node01.example.com", "10.0.0.11");

		mockMvc.perform(post("/api/v1/agents")
				.with(user("alice").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_CANCEL_ENROLLMENT"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ROTATE_TOKEN"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION")))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(registerPayload(
						server.getId(),
						null,
						"0.1.0"))))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.agent.name", is("Node 01 Agent")));
	}

	@Test
	void enrollMissingServerReturnsNotFound() throws Exception {
		UUID missingServerId = UUID.fromString("00000000-0000-0000-0000-000000000010");

		mockMvc.perform(post("/api/v1/agents")
				.with(user("alice").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_CANCEL_ENROLLMENT"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ROTATE_TOKEN"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION")))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(registerPayload(
						missingServerId,
						"Agent 01",
						"0.1.0"))))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.message", is("Server inventory item not found: " + missingServerId)));
	}

	@Test
	void enrollSecondAgentForSameServerReturnsConflict() throws Exception {
		ServerInventory server = createServer("Node 01", "node01.example.com", "10.0.0.11");
		registerAgent(server.getId(), "Agent 01", "0.1.0");

		mockMvc.perform(post("/api/v1/agents")
				.with(user("alice").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_CANCEL_ENROLLMENT"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ROTATE_TOKEN"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION")))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(registerPayload(
						server.getId(),
						"Agent 02",
						"0.1.0"))))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.message", is("server already has an agent")))
				.andExpect(jsonPath("$.details[0]", is("serverId: " + server.getId())));
	}

	@Test
	void firstHeartbeatUpdatesStatusAndWritesLifecycleAuditLogWithoutRepeatedHeartbeatNoise() throws Exception {
		ServerInventory server = createServer("Node 01", "node01.example.com", "10.0.0.11");
		String createdJson = registerAgent(server.getId(), "Agent 01", "0.1.0");
		JsonNode created = objectMapper.readTree(createdJson);
		String id = created.get("agent").get("id").asText();
		String agentToken = created.get("agentToken").asText();

		mockMvc.perform(post("/api/v1/agents/{id}/heartbeat", id)
				.header("X-Kyvora-Agent-Token", agentToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(heartbeatPayload("ONLINE", "0.1.1"))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id", is(id)))
				.andExpect(jsonPath("$.status", is("ONLINE")))
				.andExpect(jsonPath("$.version", is("0.1.1")))
				.andExpect(jsonPath("$.lastSeenAt", notNullValue()));

		Agent stored = agentRepository.findById(UUID.fromString(id)).orElseThrow();
		org.assertj.core.api.Assertions.assertThat(stored.getTokenLastUsedAt()).isNotNull();
		ServerInventory storedServer = serverInventoryRepository.findById(server.getId()).orElseThrow();
		org.assertj.core.api.Assertions.assertThat(storedServer.getStatus()).isEqualTo(ServerStatus.ONLINE);
		org.assertj.core.api.Assertions.assertThat(storedServer.getLastSeenAt()).isNotNull();

		mockMvc.perform(post("/api/v1/agents/{id}/heartbeat", id)
				.header("X-Kyvora-Agent-Token", agentToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(heartbeatPayload("ONLINE", "0.1.1"))))
				.andExpect(status().isOk());

		mockMvc.perform(get("/api/v1/audit-logs")
				.with(user("alice").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_CANCEL_ENROLLMENT"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ROTATE_TOKEN"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION")))
				.param("aggregateType", "AGENT")
				.param("aggregateId", id)
				.param("eventType", "AGENT_CONNECTED"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content", hasSize(1)))
				.andExpect(jsonPath("$.content[0].actor", is("agent:node01.example.com")))
				.andExpect(jsonPath("$.content[0].message", is("Agent connected")))
				.andExpect(jsonPath("$.content[0].metadata.status", is("ONLINE")))
				.andExpect(jsonPath("$.content[0].metadata.serverId", is(server.getId().toString())))
				.andExpect(jsonPath("$.content[0].metadata.lastSeenAt", matchesPattern(ISO_8601_INSTANT_PATTERN)))
				.andExpect(jsonPath("$.content[0].metadata.registeredAt").doesNotExist())
				.andExpect(jsonPath("$.content[0].metadata.updatedAt").doesNotExist())
				.andExpect(jsonPath("$.content[0].metadata.occurredAt", matchesPattern(ISO_8601_INSTANT_PATTERN)));

		mockMvc.perform(get("/api/v1/audit-logs")
				.with(user("alice").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_CANCEL_ENROLLMENT"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ROTATE_TOKEN"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION")))
				.param("aggregateType", "AGENT")
				.param("aggregateId", id)
				.param("eventType", "AGENT_HEARTBEAT_RECEIVED"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content", hasSize(0)));

		org.assertj.core.api.Assertions.assertThat(auditLogRepository.findAll().stream()
				.filter(log -> log.getEventType() == AuditEventType.SERVER_MARKED_ONLINE_BY_AGENT)
				.count()).isEqualTo(1);
	}

	@Test
	void pendingAgentCanBeCanceledAndTokenCanNoLongerHeartbeat() throws Exception {
		ServerInventory server = createServer("Node 01", "node01.example.com", "10.0.0.11");
		JsonNode created = objectMapper.readTree(registerAgent(server.getId(), "Agent 01", "0.1.0"));
		String id = created.get("agent").get("id").asText();
		String agentToken = created.get("agentToken").asText();

		mockMvc.perform(delete("/api/v1/agents/{id}", id)
				.with(user("alice").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_CANCEL_ENROLLMENT"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ROTATE_TOKEN"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION"))))
				.andExpect(status().isNoContent());

		org.assertj.core.api.Assertions.assertThat(agentRepository.findById(UUID.fromString(id))).isEmpty();
		org.assertj.core.api.Assertions.assertThat(auditLogRepository.findAll().stream()
				.filter(log -> log.getEventType() == AuditEventType.AGENT_ENROLLMENT_CANCELED)
				.findFirst())
				.hasValueSatisfying(log -> {
					org.assertj.core.api.Assertions.assertThat(log.getActor()).isEqualTo("alice");
					org.assertj.core.api.Assertions.assertThat(log.getMessage()).isEqualTo("Agent enrollment canceled");
					org.assertj.core.api.Assertions.assertThat(log.getMetadata()).containsEntry("agentId", id);
					org.assertj.core.api.Assertions.assertThat(log.getMetadata()).containsEntry("serverId", server.getId().toString());
				});

		mockMvc.perform(post("/api/v1/agents/{id}/heartbeat", id)
				.header("X-Kyvora-Agent-Token", agentToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(heartbeatPayload("ONLINE", "0.1.0"))))
				.andExpect(status().isNotFound());
	}

	@Test
	void heartbeatThatBringsOfflineAgentOnlineWritesLifecycleAuditLog() throws Exception {
		ServerInventory server = createServer("Node 01", "node01.example.com", "10.0.0.11");
		JsonNode created = objectMapper.readTree(registerAgent(server.getId(), "Agent 01", "0.1.0"));
		String id = created.get("agent").get("id").asText();
		String agentToken = created.get("agentToken").asText();
		Agent agent = agentRepository.findById(UUID.fromString(id)).orElseThrow();
		agent.setStatus(dev.kyvora.api.agent.entity.AgentStatus.OFFLINE);
		agent.setLastSeenAt(java.time.Instant.now().minusSeconds(300));
		agentRepository.save(agent);
		ServerInventory storedServer = serverInventoryRepository.findById(server.getId()).orElseThrow();
		storedServer.setStatus(ServerStatus.OFFLINE);
		serverInventoryRepository.save(storedServer);
		auditLogRepository.deleteAll();

		mockMvc.perform(post("/api/v1/agents/{id}/heartbeat", id)
				.header("X-Kyvora-Agent-Token", agentToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(heartbeatPayload("ONLINE", "0.1.0"))))
				.andExpect(status().isOk());

		org.assertj.core.api.Assertions.assertThat(auditLogRepository.findAll().stream()
				.filter(log -> log.getEventType() == AuditEventType.AGENT_MARKED_ONLINE)
				.count()).isEqualTo(1);
		org.assertj.core.api.Assertions.assertThat(auditLogRepository.findAll().stream()
				.filter(log -> log.getEventType() == AuditEventType.SERVER_MARKED_ONLINE_BY_AGENT)
				.count()).isEqualTo(1);
	}

	@Test
	void heartbeatWithHostFactsStoresFactsAndReturnsSummary() throws Exception {
		ServerInventory server = createServer("Node 01", "node01.example.com", "10.0.0.11");
		server.setOperatingSystem("unknown");
		serverInventoryRepository.save(server);
		JsonNode created = objectMapper.readTree(registerAgent(server.getId(), "Agent 01", "0.1.0"));
		String id = created.get("agent").get("id").asText();
		String agentToken = created.get("agentToken").asText();

		mockMvc.perform(post("/api/v1/agents/{id}/heartbeat", id)
				.header("X-Kyvora-Agent-Token", agentToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(heartbeatPayloadWithFacts(
						"ONLINE",
						"0.1.1",
						"Ubuntu 24.04",
						"amd64",
						4,
						17_179_869_184L))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.hostFacts.operatingSystem", is("Ubuntu 24.04")))
				.andExpect(jsonPath("$.hostFacts.architecture", is("amd64")))
				.andExpect(jsonPath("$.hostFacts.cpuCount", is(4)))
				.andExpect(jsonPath("$.hostFacts.memoryTotalBytes", is(17_179_869_184L)));

		var facts = hostFactsRepository.findById(UUID.fromString(id)).orElseThrow();
		org.assertj.core.api.Assertions.assertThat(facts.getHostname()).isEqualTo("node01.example.com");
		org.assertj.core.api.Assertions.assertThat(facts.getPlatform()).isEqualTo("linux");
		org.assertj.core.api.Assertions.assertThat(facts.getKernelVersion()).isEqualTo("6.8.0");
		org.assertj.core.api.Assertions.assertThat(facts.getDiskTotalBytes()).isEqualTo(107_374_182_400L);
		org.assertj.core.api.Assertions.assertThat(facts.getDiskFreeBytes()).isEqualTo(53_687_091_200L);
		org.assertj.core.api.Assertions.assertThat(facts.getUptimeSeconds()).isEqualTo(3600L);
		org.assertj.core.api.Assertions.assertThat(facts.getIpAddresses()).containsExactly("10.0.0.11", "fd00::11");
		org.assertj.core.api.Assertions.assertThat(facts.getAgentVersion()).isEqualTo("0.1.1");
		org.assertj.core.api.Assertions.assertThat(facts.getCollectedAt()).isNotNull();
		org.assertj.core.api.Assertions.assertThat(serverInventoryRepository.findById(server.getId()).orElseThrow().getOperatingSystem())
				.isEqualTo("Ubuntu 24.04");
	}

	@Test
	void secondHeartbeatUpdatesHostFacts() throws Exception {
		ServerInventory server = createServer("Node 01", "node01.example.com", "10.0.0.11");
		JsonNode created = objectMapper.readTree(registerAgent(server.getId(), "Agent 01", "0.1.0"));
		String id = created.get("agent").get("id").asText();
		String agentToken = created.get("agentToken").asText();

		mockMvc.perform(post("/api/v1/agents/{id}/heartbeat", id)
				.header("X-Kyvora-Agent-Token", agentToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(heartbeatPayloadWithFacts(
						"ONLINE",
						"0.1.0",
						"Ubuntu 22.04",
						"amd64",
						2,
						8_589_934_592L))))
				.andExpect(status().isOk());

		mockMvc.perform(post("/api/v1/agents/{id}/heartbeat", id)
				.header("X-Kyvora-Agent-Token", agentToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(heartbeatPayloadWithFacts(
						"ONLINE",
						"0.1.1",
						"Ubuntu 24.04",
						"arm64",
						8,
						34_359_738_368L))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.hostFacts.operatingSystem", is("Ubuntu 24.04")))
				.andExpect(jsonPath("$.hostFacts.architecture", is("arm64")))
				.andExpect(jsonPath("$.hostFacts.cpuCount", is(8)));

		var facts = hostFactsRepository.findById(UUID.fromString(id)).orElseThrow();
		org.assertj.core.api.Assertions.assertThat(facts.getOperatingSystem()).isEqualTo("Ubuntu 24.04");
		org.assertj.core.api.Assertions.assertThat(facts.getArchitecture()).isEqualTo("arm64");
		org.assertj.core.api.Assertions.assertThat(hostFactsRepository.count()).isEqualTo(1);
	}

	@Test
	void heartbeatWithoutHostFactsStillWorks() throws Exception {
		ServerInventory server = createServer("Node 01", "node01.example.com", "10.0.0.11");
		JsonNode created = objectMapper.readTree(registerAgent(server.getId(), "Agent 01", "0.1.0"));
		String id = created.get("agent").get("id").asText();
		String agentToken = created.get("agentToken").asText();

		mockMvc.perform(post("/api/v1/agents/{id}/heartbeat", id)
				.header("X-Kyvora-Agent-Token", agentToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(heartbeatPayload("ONLINE", "0.1.0"))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status", is("ONLINE")))
				.andExpect(jsonPath("$.hostFacts").doesNotExist());

		org.assertj.core.api.Assertions.assertThat(hostFactsRepository.findById(UUID.fromString(id))).isEmpty();
	}

	@Test
	void serverDetailExposesLinkedAgentHostFacts() throws Exception {
		ServerInventory server = createServer("Node 01", "node01.example.com", "10.0.0.11");
		JsonNode created = objectMapper.readTree(registerAgent(server.getId(), "Agent 01", "0.1.0"));
		String id = created.get("agent").get("id").asText();
		String agentToken = created.get("agentToken").asText();

		mockMvc.perform(post("/api/v1/agents/{id}/heartbeat", id)
				.header("X-Kyvora-Agent-Token", agentToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(heartbeatPayloadWithFacts(
						"ONLINE",
						"0.1.0",
						"Ubuntu 24.04",
						"amd64",
						4,
						17_179_869_184L))))
				.andExpect(status().isOk());

		mockMvc.perform(get("/api/v1/servers/{id}", server.getId())
				.with(user("alice").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_CANCEL_ENROLLMENT"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ROTATE_TOKEN"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION"))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.hostFacts.operatingSystem", is("Ubuntu 24.04")))
				.andExpect(jsonPath("$.hostFacts.architecture", is("amd64")))
				.andExpect(jsonPath("$.hostFacts.cpuCount", is(4)));
	}

	@Test
	void linkedServerCanEnrollNewAgentAfterCancellation() throws Exception {
		ServerInventory server = createServer("Node 01", "node01.example.com", "10.0.0.11");
		JsonNode created = objectMapper.readTree(registerAgent(server.getId(), "Agent 01", "0.1.0"));
		String id = created.get("agent").get("id").asText();

		mockMvc.perform(delete("/api/v1/agents/{id}", id)
				.with(user("alice").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_CANCEL_ENROLLMENT"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ROTATE_TOKEN"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION"))))
				.andExpect(status().isNoContent());

		mockMvc.perform(post("/api/v1/agents")
				.with(user("alice").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_CANCEL_ENROLLMENT"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ROTATE_TOKEN"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION")))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(registerPayload(server.getId(), "Agent 02", "0.1.0"))))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.agent.serverId", is(server.getId().toString())))
				.andExpect(jsonPath("$.agent.name", is("Agent 02")));
	}

	@Test
	void connectedAgentCannotBeCanceled() throws Exception {
		ServerInventory server = createServer("Node 01", "node01.example.com", "10.0.0.11");
		JsonNode created = objectMapper.readTree(registerAgent(server.getId(), "Agent 01", "0.1.0"));
		String id = created.get("agent").get("id").asText();
		String agentToken = created.get("agentToken").asText();

		mockMvc.perform(post("/api/v1/agents/{id}/heartbeat", id)
				.header("X-Kyvora-Agent-Token", agentToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(heartbeatPayload("ONLINE", "0.1.0"))))
				.andExpect(status().isOk());

		mockMvc.perform(delete("/api/v1/agents/{id}", id)
				.with(user("alice").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_CANCEL_ENROLLMENT"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ROTATE_TOKEN"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION"))))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.message", is("Connected agents cannot be deleted through enrollment cancellation.")));
	}

	@Test
	void connectedOnlineAgentCanBeDecommissionedAndServerCanEnrollAgain() throws Exception {
		ServerInventory server = createServer("Node 01", "node01.example.com", "10.0.0.11");
		JsonNode created = objectMapper.readTree(registerAgent(server.getId(), "Agent 01", "0.1.0"));
		String id = created.get("agent").get("id").asText();
		String agentToken = created.get("agentToken").asText();

		mockMvc.perform(post("/api/v1/agents/{id}/heartbeat", id)
				.header("X-Kyvora-Agent-Token", agentToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(heartbeatPayload("ONLINE", "0.1.0"))))
				.andExpect(status().isOk());
		auditLogRepository.deleteAll();

		mockMvc.perform(post("/api/v1/agents/{id}/decommission", id)
				.with(user("alice").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_CANCEL_ENROLLMENT"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ROTATE_TOKEN"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION"))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id", is(id)))
				.andExpect(jsonPath("$.status", is("DECOMMISSIONED")))
				.andExpect(jsonPath("$.serverId", nullValue()))
				.andExpect(jsonPath("$.lastSeenAt", notNullValue()));

		Agent stored = agentRepository.findById(UUID.fromString(id)).orElseThrow();
		org.assertj.core.api.Assertions.assertThat(stored.getStatus())
				.isEqualTo(dev.kyvora.api.agent.entity.AgentStatus.DECOMMISSIONED);
		org.assertj.core.api.Assertions.assertThat(stored.getServer()).isNull();
		org.assertj.core.api.Assertions.assertThat(stored.getTokenHash()).isNull();
		org.assertj.core.api.Assertions.assertThat(stored.getTokenRevokedAt()).isNotNull();
		ServerInventory storedServer = serverInventoryRepository.findById(server.getId()).orElseThrow();
		org.assertj.core.api.Assertions.assertThat(storedServer.getStatus()).isEqualTo(ServerStatus.UNKNOWN);
		org.assertj.core.api.Assertions.assertThat(storedServer.getLastSeenAt()).isNotNull();

		mockMvc.perform(post("/api/v1/agents/{id}/heartbeat", id)
				.header("X-Kyvora-Agent-Token", agentToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(heartbeatPayload("ONLINE", "0.1.0"))))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.message", is("Agent token has been revoked")));

		mockMvc.perform(get("/api/v1/servers/{id}", server.getId())
				.with(user("alice").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_CANCEL_ENROLLMENT"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ROTATE_TOKEN"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION"))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status", is("UNKNOWN")));

		mockMvc.perform(post("/api/v1/agents")
				.with(user("alice").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_CANCEL_ENROLLMENT"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ROTATE_TOKEN"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION")))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(registerPayload(server.getId(), "Agent 02", "0.1.0"))))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.agent.serverId", is(server.getId().toString())))
				.andExpect(jsonPath("$.agent.name", is("Agent 02")));

		org.assertj.core.api.Assertions.assertThat(auditLogRepository.findAll().stream()
				.filter(log -> log.getEventType() == AuditEventType.AGENT_DECOMMISSIONED)
				.findFirst())
				.hasValueSatisfying(log -> {
					org.assertj.core.api.Assertions.assertThat(log.getAggregateType()).isEqualTo("AGENT");
					org.assertj.core.api.Assertions.assertThat(log.getAggregateId()).isEqualTo(UUID.fromString(id));
					org.assertj.core.api.Assertions.assertThat(log.getActor()).isEqualTo("alice");
					org.assertj.core.api.Assertions.assertThat(log.getMessage()).isEqualTo("Agent decommissioned: Agent 01");
					org.assertj.core.api.Assertions.assertThat(log.getMetadata()).containsEntry("agentId", id);
					org.assertj.core.api.Assertions.assertThat(log.getMetadata()).containsEntry("agentName", "Agent 01");
					org.assertj.core.api.Assertions.assertThat(log.getMetadata()).containsEntry("hostname", "node01.example.com");
					org.assertj.core.api.Assertions.assertThat(log.getMetadata()).containsEntry("previousStatus", "ONLINE");
					org.assertj.core.api.Assertions.assertThat(log.getMetadata()).containsEntry("serverId", server.getId().toString());
					org.assertj.core.api.Assertions.assertThat(log.getMetadata()).containsEntry("serverName", "Node 01");
					org.assertj.core.api.Assertions.assertThat(log.getMetadata().toString()).doesNotContain(agentToken);
				});
	}

	@Test
	void connectedOfflineAgentCanBeDecommissioned() throws Exception {
		ServerInventory server = createServer("Node 01", "node01.example.com", "10.0.0.11");
		JsonNode created = objectMapper.readTree(registerAgent(server.getId(), "Agent 01", "0.1.0"));
		String id = created.get("agent").get("id").asText();
		Agent agent = agentRepository.findById(UUID.fromString(id)).orElseThrow();
		agent.setStatus(dev.kyvora.api.agent.entity.AgentStatus.OFFLINE);
		agent.setLastSeenAt(java.time.Instant.now().minusSeconds(300));
		agentRepository.save(agent);

		mockMvc.perform(post("/api/v1/agents/{id}/decommission", id)
				.with(user("alice").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_CANCEL_ENROLLMENT"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ROTATE_TOKEN"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION"))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status", is("DECOMMISSIONED")))
				.andExpect(jsonPath("$.serverId", nullValue()));

		org.assertj.core.api.Assertions.assertThat(auditLogRepository.findAll().stream()
				.filter(log -> log.getEventType() == AuditEventType.AGENT_DECOMMISSIONED)
				.findFirst())
				.hasValueSatisfying(log ->
						org.assertj.core.api.Assertions.assertThat(log.getMetadata()).containsEntry("previousStatus", "OFFLINE"));
	}

	@Test
	void decommissionRequiresUserAuthentication() throws Exception {
		mockMvc.perform(post("/api/v1/agents/{id}/decommission", UUID.randomUUID()))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void rotateTokenInvalidatesOldTokenAndKeepsServerAssignment() throws Exception {
		ServerInventory server = createServer("Node 01", "node01.example.com", "10.0.0.11");
		JsonNode created = objectMapper.readTree(registerAgent(server.getId(), "Agent 01", "0.1.0"));
		String id = created.get("agent").get("id").asText();
		String oldToken = created.get("agentToken").asText();

		String rotatedJson = mockMvc.perform(post("/api/v1/agents/{id}/rotate-token", id)
				.with(user("alice").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_CANCEL_ENROLLMENT"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ROTATE_TOKEN"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION"))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.agent.id", is(id)))
				.andExpect(jsonPath("$.agent.serverId", is(server.getId().toString())))
				.andExpect(jsonPath("$.agentToken", notNullValue()))
				.andReturn()
				.getResponse()
				.getContentAsString();

		JsonNode rotated = objectMapper.readTree(rotatedJson);
		String newToken = rotated.get("agentToken").asText();
		org.assertj.core.api.Assertions.assertThat(newToken).isNotEqualTo(oldToken);

		Agent stored = agentRepository.findById(UUID.fromString(id)).orElseThrow();
		org.assertj.core.api.Assertions.assertThat(stored.getServer().getId()).isEqualTo(server.getId());
		org.assertj.core.api.Assertions.assertThat(stored.getTokenHash()).isNotEqualTo(oldToken);
		org.assertj.core.api.Assertions.assertThat(stored.getTokenHash()).isNotEqualTo(newToken);
		org.assertj.core.api.Assertions.assertThat(auditLogRepository.findAll().stream()
				.filter(log -> log.getEventType() == AuditEventType.AGENT_TOKEN_ROTATED)
				.findFirst())
				.hasValueSatisfying(log -> {
					org.assertj.core.api.Assertions.assertThat(log.getMessage()).isEqualTo("Agent token rotated");
					org.assertj.core.api.Assertions.assertThat(log.getMetadata().toString()).doesNotContain(oldToken, newToken, stored.getTokenHash());
				});

		mockMvc.perform(post("/api/v1/agents/{id}/heartbeat", id)
				.header("X-Kyvora-Agent-Token", oldToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(heartbeatPayload("ONLINE", "0.1.0"))))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.message", is("Invalid agent token")));

		mockMvc.perform(post("/api/v1/agents/{id}/heartbeat", id)
				.header("X-Kyvora-Agent-Token", newToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(heartbeatPayload("ONLINE", "0.1.0"))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status", is("ONLINE")));
	}

	@Test
	void heartbeatFailsWithMissingToken() throws Exception {
		String createdJson = registerAgent(
				createServer("Node 01", "node01.example.com", "10.0.0.11").getId(),
				"Agent 01",
				"0.1.0");
		String id = objectMapper.readTree(createdJson).get("agent").get("id").asText();

		mockMvc.perform(post("/api/v1/agents/{id}/heartbeat", id)
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(heartbeatPayload("ONLINE", "0.1.0"))))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.message", is("Agent token is required")));
	}

	@Test
	void heartbeatFailsWithInvalidToken() throws Exception {
		String createdJson = registerAgent(
				createServer("Node 01", "node01.example.com", "10.0.0.11").getId(),
				"Agent 01",
				"0.1.0");
		String id = objectMapper.readTree(createdJson).get("agent").get("id").asText();

		mockMvc.perform(post("/api/v1/agents/{id}/heartbeat", id)
				.header("X-Kyvora-Agent-Token", "invalid-token")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(heartbeatPayload("ONLINE", "0.1.0"))))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.message", is("Invalid agent token")));
	}

	@Test
	void heartbeatFailsWithRevokedToken() throws Exception {
		String createdJson = registerAgent(
				createServer("Node 01", "node01.example.com", "10.0.0.11").getId(),
				"Agent 01",
				"0.1.0");
		JsonNode created = objectMapper.readTree(createdJson);
		String id = created.get("agent").get("id").asText();
		String agentToken = created.get("agentToken").asText();
		Agent stored = agentRepository.findById(UUID.fromString(id)).orElseThrow();
		stored.setTokenRevokedAt(java.time.Instant.now());
		agentRepository.save(stored);

		mockMvc.perform(post("/api/v1/agents/{id}/heartbeat", id)
				.header("X-Kyvora-Agent-Token", agentToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(heartbeatPayload("ONLINE", "0.1.0"))))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.message", is("Agent token has been revoked")));
	}

	@Test
	void listSupportsPagination() throws Exception {
		ServerInventory node01 = createServer("Node 01", "node01.example.com", "10.0.0.11");
		ServerInventory node02 = createServer("Node 02", "node02.example.com", "10.0.0.12");
		registerAgent(node01.getId(), "Agent 01", "0.1.0");
		registerAgent(node02.getId(), "Agent 02", "0.1.0");

		mockMvc.perform(get("/api/v1/agents")
				.with(user("alice").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_CANCEL_ENROLLMENT"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ROTATE_TOKEN"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION")))
				.param("page", "0")
				.param("size", "1")
				.param("sort", "hostname,asc"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content", hasSize(1)))
				.andExpect(jsonPath("$.page", is(0)))
				.andExpect(jsonPath("$.size", is(1)))
				.andExpect(jsonPath("$.totalElements", is(2)))
				.andExpect(jsonPath("$.totalPages", is(2)))
				.andExpect(jsonPath("$.first", is(true)))
				.andExpect(jsonPath("$.last", is(false)))
				.andExpect(jsonPath("$.empty", is(false)))
				.andExpect(jsonPath("$.content[0].hostname", is("node01.example.com")))
				.andExpect(jsonPath("$.content[0].serverId", is(node01.getId().toString())))
				.andExpect(jsonPath("$.content[0].serverName", is("Node 01")))
				.andExpect(jsonPath("$.content[0].serverHostname", is("node01.example.com")));
	}

	@Test
	void findByIdReturnsAgent() throws Exception {
		ServerInventory server = createServer("Node 01", "node01.example.com", "10.0.0.11");
		String createdJson = registerAgent(server.getId(), "Agent 01", "0.1.0");
		String id = objectMapper.readTree(createdJson).get("agent").get("id").asText();

		mockMvc.perform(get("/api/v1/agents/{id}", id)
				.with(user("alice").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_CANCEL_ENROLLMENT"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ROTATE_TOKEN"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION"))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id", is(id)))
				.andExpect(jsonPath("$.serverId", is(server.getId().toString())))
				.andExpect(jsonPath("$.hostname", is("node01.example.com")));
	}

	@Test
	void notFoundReturnsApiError() throws Exception {
		mockMvc.perform(get("/api/v1/agents/{id}", "00000000-0000-0000-0000-000000000001")
				.with(user("alice").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_CANCEL_ENROLLMENT"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ROTATE_TOKEN"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION"))))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.message", is("Agent not found: 00000000-0000-0000-0000-000000000001")));

		mockMvc.perform(post("/api/v1/agents/{id}/heartbeat", "00000000-0000-0000-0000-000000000001")
				.header("X-Kyvora-Agent-Token", "agent-token")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(heartbeatPayload("ONLINE", "0.1.0"))))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.message", is("Agent not found: 00000000-0000-0000-0000-000000000001")));
	}

	@Test
	void agentEndpointsRequireAuthentication() throws Exception {
		mockMvc.perform(get("/api/v1/agents"))
				.andExpect(status().isUnauthorized());

		mockMvc.perform(post("/api/v1/agents")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(registerPayload(UUID.randomUUID(), "Agent 01", "0.1.0"))))
				.andExpect(status().isUnauthorized());

		mockMvc.perform(delete("/api/v1/agents/{id}", UUID.randomUUID()))
				.andExpect(status().isUnauthorized());

		mockMvc.perform(post("/api/v1/agents/{id}/rotate-token", UUID.randomUUID()))
				.andExpect(status().isUnauthorized());

		mockMvc.perform(post("/api/v1/agents/{id}/decommission", UUID.randomUUID()))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void viewerCanListAndViewAgentsButCannotManageAgents() throws Exception {
		ServerInventory server = createServer("Node 01", "node01.example.com", "10.0.0.11");
		JsonNode created = objectMapper.readTree(registerAgent(server.getId(), "Agent 01", "0.1.0"));
		String id = created.get("agent").get("id").asText();

		mockMvc.perform(get("/api/v1/agents")
				.with(user("viewer").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"))))
				.andExpect(status().isOk());

		mockMvc.perform(get("/api/v1/agents/{id}", id)
				.with(user("viewer").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id", is(id)));

		mockMvc.perform(post("/api/v1/agents")
				.with(user("viewer").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ")))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(registerPayload(server.getId(), "Blocked Agent", "0.1.0"))))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.message", is("You do not have permission to perform this action.")));

		mockMvc.perform(delete("/api/v1/agents/{id}", id)
				.with(user("viewer").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"))))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.message", is("You do not have permission to perform this action.")));

		mockMvc.perform(post("/api/v1/agents/{id}/rotate-token", id)
				.with(user("viewer").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"))))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.message", is("You do not have permission to perform this action.")));

		mockMvc.perform(post("/api/v1/agents/{id}/decommission", id)
				.with(user("viewer").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"))))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.message", is("You do not have permission to perform this action.")));
	}

	private String registerAgent(UUID serverId, String name, String version) throws Exception {
		return mockMvc.perform(post("/api/v1/agents")
				.with(user("alice").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_CANCEL_ENROLLMENT"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ROTATE_TOKEN"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION")))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(registerPayload(serverId, name, version))))
				.andExpect(status().isCreated())
				.andReturn()
				.getResponse()
				.getContentAsString();
	}

	private Map<String, Object> registerPayload(UUID serverId, String name, String version) {
		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("serverId", serverId);
		payload.put("name", name);
		payload.put("version", version);
		return payload;
	}

	private ServerInventory createServer(String name, String hostname, String ipAddress) {
		return serverInventoryRepository.save(new ServerInventory(
				name,
				hostname,
				ipAddress,
				"",
				java.util.Set.of(),
				"Ubuntu 24.04",
				ServerStatus.UNKNOWN,
				null));
	}

	private Map<String, Object> heartbeatPayload(String status, String version) {
		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("status", status);
		payload.put("version", version);
		return payload;
	}

	private Map<String, Object> heartbeatPayloadWithFacts(
			String status,
			String version,
			String operatingSystem,
			String architecture,
			int cpuCount,
			long memoryTotalBytes) {
		Map<String, Object> payload = heartbeatPayload(status, version);
		payload.put("hostname", "node01.example.com");
		Map<String, Object> facts = new LinkedHashMap<>();
		facts.put("hostname", "node01.example.com");
		facts.put("operatingSystem", operatingSystem);
		facts.put("platform", "linux");
		facts.put("kernelVersion", "6.8.0");
		facts.put("architecture", architecture);
		facts.put("cpuCount", cpuCount);
		facts.put("memoryTotalBytes", memoryTotalBytes);
		facts.put("diskTotalBytes", 107_374_182_400L);
		facts.put("diskFreeBytes", 53_687_091_200L);
		facts.put("uptimeSeconds", 3600L);
		facts.put("ipAddresses", List.of("10.0.0.11", "fd00::11"));
		facts.put("agentVersion", version);
		facts.put("collectedAt", "2026-06-09T10:00:00Z");
		payload.put("hostFacts", facts);
		return payload;
	}
}
