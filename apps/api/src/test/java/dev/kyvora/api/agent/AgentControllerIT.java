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

import dev.kyvora.api.agent.repository.AgentRepository;
import dev.kyvora.api.auditlog.repository.AuditLogRepository;

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
	}

	@Test
	void registerReturnsCreatedAgentAndAuditLog() throws Exception {
		String createdJson = mockMvc.perform(post("/api/v1/agents/register")
				.with(user("alice"))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(registerPayload(
						"Homelab Agent 01",
						"NODE01.EXAMPLE.COM",
						"0.1.0"))))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id", notNullValue()))
				.andExpect(jsonPath("$.name", is("Homelab Agent 01")))
				.andExpect(jsonPath("$.hostname", is("node01.example.com")))
				.andExpect(jsonPath("$.version", is("0.1.0")))
				.andExpect(jsonPath("$.status", is("PENDING")))
				.andExpect(jsonPath("$.lastSeenAt").doesNotExist())
				.andExpect(jsonPath("$.registeredAt", notNullValue()))
				.andExpect(jsonPath("$.updatedAt", notNullValue()))
				.andReturn()
				.getResponse()
				.getContentAsString();

		String id = objectMapper.readTree(createdJson).get("id").asText();

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
	void duplicateHostnameReturnsConflict() throws Exception {
		registerAgent("Agent 01", "dup.example.com", "0.1.0");

		mockMvc.perform(post("/api/v1/agents/register")
				.with(user("alice"))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(registerPayload(
						"Agent 02",
						"DUP.EXAMPLE.COM",
						"0.1.0"))))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.message", is("hostname already exists")))
				.andExpect(jsonPath("$.details[0]", is("hostname: dup.example.com")));
	}

	@Test
	void heartbeatUpdatesStatusLastSeenVersionAndAuditLog() throws Exception {
		String createdJson = registerAgent("Agent 01", "node01.example.com", "0.1.0");
		String id = objectMapper.readTree(createdJson).get("id").asText();

		mockMvc.perform(post("/api/v1/agents/{id}/heartbeat", id)
				.with(user("alice"))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(heartbeatPayload("ONLINE", "0.1.1"))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id", is(id)))
				.andExpect(jsonPath("$.status", is("ONLINE")))
				.andExpect(jsonPath("$.version", is("0.1.1")))
				.andExpect(jsonPath("$.lastSeenAt", notNullValue()));

		mockMvc.perform(get("/api/v1/audit-logs")
				.with(user("alice"))
				.param("aggregateType", "AGENT")
				.param("aggregateId", id)
				.param("eventType", "AGENT_HEARTBEAT_RECEIVED"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content", hasSize(1)))
				.andExpect(jsonPath("$.content[0].message", is("Agent heartbeat received: node01.example.com")))
				.andExpect(jsonPath("$.content[0].metadata.status", is("ONLINE")))
				.andExpect(jsonPath("$.content[0].metadata.lastSeenAt", matchesPattern(ISO_8601_INSTANT_PATTERN)))
				.andExpect(jsonPath("$.content[0].metadata.registeredAt").doesNotExist())
				.andExpect(jsonPath("$.content[0].metadata.updatedAt").doesNotExist())
				.andExpect(jsonPath("$.content[0].metadata.occurredAt", matchesPattern(ISO_8601_INSTANT_PATTERN)));
	}

	@Test
	void listSupportsPagination() throws Exception {
		registerAgent("Agent 01", "node01.example.com", "0.1.0");
		registerAgent("Agent 02", "node02.example.com", "0.1.0");

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
				.andExpect(jsonPath("$.content[0].hostname", is("node01.example.com")));
	}

	@Test
	void findByIdReturnsAgent() throws Exception {
		String createdJson = registerAgent("Agent 01", "node01.example.com", "0.1.0");
		String id = objectMapper.readTree(createdJson).get("id").asText();

		mockMvc.perform(get("/api/v1/agents/{id}", id)
				.with(user("alice")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id", is(id)))
				.andExpect(jsonPath("$.hostname", is("node01.example.com")));
	}

	@Test
	void notFoundReturnsApiError() throws Exception {
		mockMvc.perform(get("/api/v1/agents/{id}", "00000000-0000-0000-0000-000000000001")
				.with(user("alice")))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.message", is("Agent not found: 00000000-0000-0000-0000-000000000001")));

		mockMvc.perform(post("/api/v1/agents/{id}/heartbeat", "00000000-0000-0000-0000-000000000001")
				.with(user("alice"))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(heartbeatPayload("ONLINE", "0.1.0"))))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.message", is("Agent not found: 00000000-0000-0000-0000-000000000001")));
	}

	@Test
	void agentEndpointsRequireAuthentication() throws Exception {
		mockMvc.perform(get("/api/v1/agents"))
				.andExpect(status().isUnauthorized());

		mockMvc.perform(post("/api/v1/agents/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(registerPayload("Agent 01", "node01.example.com", "0.1.0"))))
				.andExpect(status().isUnauthorized());
	}

	private String registerAgent(String name, String hostname, String version) throws Exception {
		return mockMvc.perform(post("/api/v1/agents/register")
				.with(user("alice"))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(registerPayload(name, hostname, version))))
				.andExpect(status().isCreated())
				.andReturn()
				.getResponse()
				.getContentAsString();
	}

	private Map<String, Object> registerPayload(String name, String hostname, String version) {
		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("name", name);
		payload.put("hostname", hostname);
		payload.put("version", version);
		return payload;
	}

	private Map<String, Object> heartbeatPayload(String status, String version) {
		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("status", status);
		payload.put("version", version);
		return payload;
	}
}
