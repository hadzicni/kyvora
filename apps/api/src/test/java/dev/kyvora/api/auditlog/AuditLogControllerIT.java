package dev.kyvora.api.auditlog;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.matchesPattern;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.LinkedHashMap;
import java.util.List;
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

import dev.kyvora.api.auditlog.repository.AuditLogRepository;
import dev.kyvora.api.serverinventory.repository.ServerInventoryRepository;

@SpringBootTest
@ActiveProfiles("test")
class AuditLogControllerIT {

	private static final String ISO_8601_INSTANT_PATTERN = "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,9})?Z";

	@Autowired
	private WebApplicationContext webApplicationContext;

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
		serverInventoryRepository.deleteAll();
	}

	@Test
	void serverInventoryChangesPersistAuditLogs() throws Exception {
		String createdJson = mockMvc.perform(post("/api/v1/servers")
				.with(user("alice").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_PULL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION")))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(payload(
						"Web 01",
						"web01.example.com",
						"10.0.0.10",
						"ONLINE"))))
				.andExpect(status().isCreated())
				.andReturn()
				.getResponse()
				.getContentAsString();

		JsonNode created = objectMapper.readTree(createdJson);
		String id = created.get("id").asText();

		mockMvc.perform(put("/api/v1/servers/{id}", id)
				.with(user("alice").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_PULL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION")))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(payload(
						"Web 01 Renamed",
						"web01.example.com",
						"10.0.0.11",
						"ONLINE"))))
				.andExpect(status().isOk());

		mockMvc.perform(delete("/api/v1/servers/{id}", id)
				.with(user("admin").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_DISABLE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_ENABLE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_PASSWORD_RESET"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SETTINGS_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SETTINGS_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_PULL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION"))))
				.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/v1/audit-logs")
				.with(user("alice").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ")))
				.param("aggregateType", "SERVER")
				.param("aggregateId", id)
				.param("sort", "createdAt,asc"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content", hasSize(3)))
				.andExpect(jsonPath("$.page", is(0)))
				.andExpect(jsonPath("$.size", is(20)))
				.andExpect(jsonPath("$.totalElements", is(3)))
				.andExpect(jsonPath("$.totalPages", is(1)))
				.andExpect(jsonPath("$.first", is(true)))
				.andExpect(jsonPath("$.last", is(true)))
				.andExpect(jsonPath("$.empty", is(false)))
				.andExpect(jsonPath("$.content[0].eventType", is("SERVER_CREATED")))
				.andExpect(jsonPath("$.content[0].aggregateType", is("SERVER")))
				.andExpect(jsonPath("$.content[0].aggregateId", is(id)))
				.andExpect(jsonPath("$.content[0].actor", is("alice")))
				.andExpect(jsonPath("$.content[0].message", is("Server created: web01.example.com")))
				.andExpect(jsonPath("$.content[0].metadata.hostname", is("web01.example.com")))
				.andExpect(jsonPath("$.content[0].metadata.occurredAt", matchesPattern(ISO_8601_INSTANT_PATTERN)))
				.andExpect(jsonPath("$.content[0].createdAt", notNullValue()))
				.andExpect(jsonPath("$.content[1].eventType", is("SERVER_UPDATED")))
				.andExpect(jsonPath("$.content[2].eventType", is("SERVER_DELETED")));
	}

	@Test
	void auditLogsSupportEventTypeFilter() throws Exception {
		String createdJson = mockMvc.perform(post("/api/v1/servers")
				.with(user("bob").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_PULL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION")))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(payload(
						"DB 01",
						"db01.example.com",
						"10.0.0.20",
						"UNKNOWN"))))
				.andExpect(status().isCreated())
				.andReturn()
				.getResponse()
				.getContentAsString();

		String id = objectMapper.readTree(createdJson).get("id").asText();

		mockMvc.perform(get("/api/v1/audit-logs")
				.with(user("bob").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_PULL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION")))
				.param("eventType", "SERVER_CREATED")
				.param("aggregateId", id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content", hasSize(1)))
				.andExpect(jsonPath("$.content[0].eventType", is("SERVER_CREATED")));
	}

	private Map<String, Object> payload(String name, String hostname, String ipAddress, String status) {
		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("name", name);
		payload.put("hostname", hostname);
		payload.put("ipAddress", ipAddress);
		payload.put("description", "Description for " + hostname);
		payload.put("operatingSystem", "Linux");
		payload.put("tags", List.of("prod"));
		payload.put("status", status);
		return payload;
	}
}
