package dev.kyvora.api.serverinventory;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
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

import dev.kyvora.api.serverinventory.entity.ServerStatus;
import dev.kyvora.api.serverinventory.repository.ServerInventoryRepository;

@SpringBootTest
@ActiveProfiles("test")
class ServerInventoryControllerIT {

	@Autowired
	private WebApplicationContext webApplicationContext;

	private ObjectMapper objectMapper;

	private MockMvc mockMvc;

	@Autowired
	private ServerInventoryRepository repository;

	@BeforeEach
	void setUp() {
		objectMapper = new ObjectMapper().findAndRegisterModules();
		mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
				.defaultRequest(get("/").with(user("viewer").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"))))
				.apply(springSecurity())
				.build();
		repository.deleteAll();
	}

	@Test
	void createReturnsCreatedServer() throws Exception {
		mockMvc.perform(post("/api/v1/servers")
				.with(user("operator").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_PULL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION")))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(createPayload(
						"Web 01",
						"web01.example.com",
						"10.0.0.10",
						"Primary web server",
						"Linux",
						List.of("prod", "web"),
						"ONLINE",
						"2026-06-07T00:00:00Z"))))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id", notNullValue()))
				.andExpect(jsonPath("$.name", is("Web 01")))
				.andExpect(jsonPath("$.hostname", is("web01.example.com")))
				.andExpect(jsonPath("$.ipAddress", is("10.0.0.10")))
				.andExpect(jsonPath("$.description", is("Primary web server")))
				.andExpect(jsonPath("$.operatingSystem", is("Linux")))
				.andExpect(jsonPath("$.status", is("UNKNOWN")))
				.andExpect(jsonPath("$.tags", hasSize(2)))
				.andExpect(jsonPath("$.createdAt", notNullValue()))
				.andExpect(jsonPath("$.updatedAt", notNullValue()));
	}

	@Test
	void listSupportsPaginationAndFilters() throws Exception {
		createServer("App 01", "app01.example.com", "10.0.0.11", List.of("prod", "app"), "ONLINE");
		createServer("DB 01", "db01.example.com", "10.0.0.12", List.of("prod", "db"), "OFFLINE");
		setStoredStatus("app01.example.com", ServerStatus.ONLINE);
		setStoredStatus("db01.example.com", ServerStatus.OFFLINE);

		mockMvc.perform(get("/api/v1/servers")
				.param("page", "0")
				.param("size", "1")
				.param("tags", "db")
				.param("status", "OFFLINE"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content", hasSize(1)))
				.andExpect(jsonPath("$.page", is(0)))
				.andExpect(jsonPath("$.size", is(1)))
				.andExpect(jsonPath("$.totalElements", is(1)))
				.andExpect(jsonPath("$.totalPages", is(1)))
				.andExpect(jsonPath("$.first", is(true)))
				.andExpect(jsonPath("$.last", is(true)))
				.andExpect(jsonPath("$.empty", is(false)))
				.andExpect(jsonPath("$.content[0].hostname", is("db01.example.com")))
				.andExpect(jsonPath("$.content[0].status", is("OFFLINE")));
	}

	@Test
	void listSearchesNameHostnameAndIpAddress() throws Exception {
		createServer("Application 01", "app01.example.com", "10.0.0.11", List.of("prod", "app"), "ONLINE");
		createServer("Database 01", "db01.example.com", "10.0.0.12", List.of("prod", "db"), "OFFLINE");
		createServer("Cache 01", "cache01.example.com", "10.0.0.13", List.of("prod", "cache"), "UNKNOWN");

		mockMvc.perform(get("/api/v1/servers").param("q", "database"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content", hasSize(1)))
				.andExpect(jsonPath("$.content[0].hostname", is("db01.example.com")));

		mockMvc.perform(get("/api/v1/servers").param("q", "cache01"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content", hasSize(1)))
				.andExpect(jsonPath("$.content[0].name", is("Cache 01")));

		mockMvc.perform(get("/api/v1/servers").param("q", "10.0.0.11"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content", hasSize(1)))
				.andExpect(jsonPath("$.content[0].name", is("Application 01")));
	}

	@Test
	void validationRejectsBadPayload() throws Exception {
		mockMvc.perform(post("/api/v1/servers")
				.with(user("operator").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_PULL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION")))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(createPayload(
						"x",
						"not-a-hostname",
						"999.999.0.1",
						"",
						"",
						List.of("", "this-tag-is-way-too-long-for-the-limit-because-it-keeps-going-forever"),
						"ONLINE",
						null))))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message", is("Validation failed")))
				.andExpect(jsonPath("$.details[0]", notNullValue()));
	}

	@Test
	void duplicateHostnameReturnsConflict() throws Exception {
		createServer("Duplicate", "dup.example.com", "10.0.0.20", List.of("prod"), "ONLINE");

		mockMvc.perform(post("/api/v1/servers")
				.with(user("operator").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_PULL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION")))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(createPayload(
						"Duplicate 2",
						"dup.example.com",
						"10.0.0.21",
						"Another server",
						"Linux",
						List.of("prod"),
						"ONLINE",
						null))))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.message", is("hostname already exists")));
	}

	@Test
	void updateAndDeleteWork() throws Exception {
		String createdJson = mockMvc.perform(post("/api/v1/servers")
				.with(user("operator").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_PULL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION")))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(createPayload(
						"Initial Name",
						"initial.example.com",
						"10.0.0.30",
						"Initial description",
						"Linux",
						List.of("maintenance"),
						"UNKNOWN",
						"2026-06-07T00:00:00Z"))))
				.andExpect(status().isCreated())
				.andReturn()
				.getResponse()
				.getContentAsString();

		JsonNode created = objectMapper.readTree(createdJson);
		String id = created.get("id").asText();

		mockMvc.perform(put("/api/v1/servers/{id}", id)
				.with(user("operator").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_PULL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION")))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(createPayload(
						"New Name",
						"new.example.com",
						"10.0.0.31",
						"Updated description",
						"Ubuntu",
						List.of("prod", "api"),
						"ONLINE",
						"2026-06-07T01:00:00Z"))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name", is("New Name")))
				.andExpect(jsonPath("$.hostname", is("new.example.com")))
				.andExpect(jsonPath("$.ipAddress", is("10.0.0.31")))
				.andExpect(jsonPath("$.description", is("Updated description")))
				.andExpect(jsonPath("$.operatingSystem", is("Ubuntu")))
				.andExpect(jsonPath("$.status", is("UNKNOWN")))
				.andExpect(jsonPath("$.tags", hasSize(2)));

		mockMvc.perform(delete("/api/v1/servers/{id}", id)
				.with(user("admin").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_DISABLE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_ENABLE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_PASSWORD_RESET"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SETTINGS_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SETTINGS_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_PULL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION"))))
				.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/v1/servers/{id}", id))
				.andExpect(status().isNotFound());
	}

	@Test
	void notFoundReturnsApiError() throws Exception {
		mockMvc.perform(get("/api/v1/servers/{id}", "00000000-0000-0000-0000-000000000001"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.message", is("Server inventory item not found: 00000000-0000-0000-0000-000000000001")));
	}

	@Test
	void viewerCanListAndViewServersButCannotCreateOrUpdate() throws Exception {
		createServer("Viewable", "viewable.example.com", "10.0.0.40", List.of("prod"), "ONLINE");
		String id = repository.findAll().get(0).getId().toString();

		mockMvc.perform(get("/api/v1/servers"))
				.andExpect(status().isOk());

		mockMvc.perform(get("/api/v1/servers/{id}", id))
				.andExpect(status().isOk());

		mockMvc.perform(post("/api/v1/servers")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(createPayload(
						"Viewer Create",
						"viewer-create.example.com",
						"10.0.0.41",
						"Blocked",
						"Linux",
						List.of("prod"),
						"ONLINE",
						null))))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.message", is("You do not have permission to perform this action.")));

		mockMvc.perform(put("/api/v1/servers/{id}", id)
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(createPayload(
						"Viewer Update",
						"viewer-update.example.com",
						"10.0.0.42",
						"Blocked",
						"Linux",
						List.of("prod"),
						"ONLINE",
						null))))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.message", is("You do not have permission to perform this action.")));
	}

	@Test
	void operatorCanCreateAndUpdateButCannotDeleteServers() throws Exception {
		String createdJson = mockMvc.perform(post("/api/v1/servers")
				.with(user("operator").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_PULL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION")))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(createPayload(
						"Operator Create",
						"operator-create.example.com",
						"10.0.0.50",
						"Created",
						"Linux",
						List.of("prod"),
						"ONLINE",
						null))))
				.andExpect(status().isCreated())
				.andReturn()
				.getResponse()
				.getContentAsString();

		String id = objectMapper.readTree(createdJson).get("id").asText();

		mockMvc.perform(put("/api/v1/servers/{id}", id)
				.with(user("operator").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_PULL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION")))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(createPayload(
						"Operator Update",
						"operator-update.example.com",
						"10.0.0.51",
						"Updated",
						"Ubuntu",
						List.of("ops"),
						"ONLINE",
						null))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name", is("Operator Update")));

		mockMvc.perform(delete("/api/v1/servers/{id}", id)
				.with(user("operator").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_PULL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION"))))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.message", is("You do not have permission to perform this action.")));
	}

	private void createServer(String name, String hostname, String ipAddress, List<String> tags, String status) throws Exception {
		mockMvc.perform(post("/api/v1/servers")
				.with(user("operator").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_PULL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION")))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(createPayload(
						name,
						hostname,
						ipAddress,
						"Description for " + hostname,
						"Linux",
						tags,
						status,
						null))))
				.andExpect(status().isCreated());
	}

	private void setStoredStatus(String hostname, ServerStatus status) {
		var server = repository.findAll().stream()
				.filter(item -> item.getHostname().equals(hostname))
				.findFirst()
				.orElseThrow();
		server.setStatus(status);
		repository.save(server);
	}

	private Map<String, Object> createPayload(
			String name,
			String hostname,
			String ipAddress,
			String description,
			String operatingSystem,
			List<String> tags,
			String status,
			String lastSeenAt) {
		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("name", name);
		payload.put("hostname", hostname);
		payload.put("ipAddress", ipAddress);
		payload.put("description", description);
		payload.put("operatingSystem", operatingSystem);
		payload.put("tags", tags);
		payload.put("status", status);
		if (lastSeenAt != null) {
			payload.put("lastSeenAt", lastSeenAt);
		}
		return payload;
	}
}
