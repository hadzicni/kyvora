package dev.kyvora.api.agent;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.matchesPattern;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.LinkedHashMap;
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
import dev.kyvora.api.agent.repository.AgentRepository;
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
		agentRepository.deleteAll();
		serverInventoryRepository.deleteAll();
	}

	@Test
	void enrollReturnsCreatedAgentPlaintextTokenAndAuditLog() throws Exception {
		ServerInventory server = createServer("Node 01", "node01.example.com", "10.0.0.11");

		String createdJson = mockMvc.perform(post("/api/v1/agents")
				.with(user("alice"))
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
				.with(user("alice"))
				.param("aggregateType", "AGENT")
				.param("aggregateId", id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content", hasSize(1)))
				.andExpect(jsonPath("$.content[0].eventType", is("AGENT_REGISTERED")))
				.andExpect(jsonPath("$.content[0].aggregateType", is("AGENT")))
				.andExpect(jsonPath("$.content[0].aggregateId", is(id)))
				.andExpect(jsonPath("$.content[0].actor", is("alice")))
				.andExpect(jsonPath("$.content[0].message", is("Agent registered: node01.example.com")))
				.andExpect(jsonPath("$.content[0].metadata.hostname", is("node01.example.com")))
				.andExpect(jsonPath("$.content[0].metadata.lastSeenAt", nullValue()))
				.andExpect(jsonPath("$.content[0].metadata.registeredAt").doesNotExist())
				.andExpect(jsonPath("$.content[0].metadata.updatedAt").doesNotExist())
				.andExpect(jsonPath("$.content[0].metadata.occurredAt", matchesPattern(ISO_8601_INSTANT_PATTERN)));
	}

	@Test
	void enrollDefaultsAgentNameFromServerNameWhenNameIsOmitted() throws Exception {
		ServerInventory server = createServer("Node 01", "node01.example.com", "10.0.0.11");

		mockMvc.perform(post("/api/v1/agents")
				.with(user("alice"))
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
				.with(user("alice"))
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
				.with(user("alice"))
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
	void heartbeatUpdatesStatusLastSeenVersionAndAuditLog() throws Exception {
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

		mockMvc.perform(get("/api/v1/audit-logs")
				.with(user("alice"))
				.param("aggregateType", "AGENT")
				.param("aggregateId", id)
				.param("eventType", "AGENT_HEARTBEAT_RECEIVED"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content", hasSize(1)))
				.andExpect(jsonPath("$.content[0].actor", is("agent:node01.example.com")))
				.andExpect(jsonPath("$.content[0].message", is("Agent heartbeat received: node01.example.com")))
				.andExpect(jsonPath("$.content[0].metadata.status", is("ONLINE")))
				.andExpect(jsonPath("$.content[0].metadata.lastSeenAt", matchesPattern(ISO_8601_INSTANT_PATTERN)))
				.andExpect(jsonPath("$.content[0].metadata.registeredAt").doesNotExist())
				.andExpect(jsonPath("$.content[0].metadata.updatedAt").doesNotExist())
				.andExpect(jsonPath("$.content[0].metadata.occurredAt", matchesPattern(ISO_8601_INSTANT_PATTERN)));
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
				.with(user("alice"))
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
				.with(user("alice")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id", is(id)))
				.andExpect(jsonPath("$.serverId", is(server.getId().toString())))
				.andExpect(jsonPath("$.hostname", is("node01.example.com")));
	}

	@Test
	void notFoundReturnsApiError() throws Exception {
		mockMvc.perform(get("/api/v1/agents/{id}", "00000000-0000-0000-0000-000000000001")
				.with(user("alice")))
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
	}

	private String registerAgent(UUID serverId, String name, String version) throws Exception {
		return mockMvc.perform(post("/api/v1/agents")
				.with(user("alice"))
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
}
