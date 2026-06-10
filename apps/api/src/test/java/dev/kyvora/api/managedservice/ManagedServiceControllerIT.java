package dev.kyvora.api.managedservice;

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
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import dev.kyvora.api.managedservice.repository.ManagedServiceRepository;
import dev.kyvora.api.serverinventory.entity.ServerInventory;
import dev.kyvora.api.serverinventory.entity.ServerStatus;
import dev.kyvora.api.serverinventory.repository.ServerInventoryRepository;

@SpringBootTest
@ActiveProfiles("test")
class ManagedServiceControllerIT {

	@Autowired
	private WebApplicationContext webApplicationContext;

	@Autowired
	private ManagedServiceRepository repository;

	@Autowired
	private ServerInventoryRepository serverInventoryRepository;

	private ObjectMapper objectMapper;

	private MockMvc mockMvc;

	@BeforeEach
	void setUp() {
		objectMapper = new ObjectMapper().findAndRegisterModules();
		mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
				.defaultRequest(get("/").with(user("viewer").roles("VIEWER")))
				.apply(springSecurity())
				.build();
		repository.deleteAll();
		serverInventoryRepository.deleteAll();
	}

	@Test
	void createReturnsCreatedServiceWithLinkedServer() throws Exception {
		ServerInventory server = createServer("NAS 01", "nas01.example.com", "10.0.0.10");

		mockMvc.perform(post("/api/v1/services")
				.with(user("operator").roles("OPERATOR"))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(createPayload(
						"Grafana",
						"Metrics dashboards",
						"https://grafana.example.com",
						"grafana.example.com",
						"10.0.0.20",
						3000,
						"HTTPS",
						"MONITORING",
						"ONLINE",
						List.of("monitoring", "internal"),
						"Backed by docker compose.",
						server.getId().toString()))))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id", notNullValue()))
				.andExpect(jsonPath("$.name", is("Grafana")))
				.andExpect(jsonPath("$.url", is("https://grafana.example.com")))
				.andExpect(jsonPath("$.hostname", is("grafana.example.com")))
				.andExpect(jsonPath("$.ipAddress", is("10.0.0.20")))
				.andExpect(jsonPath("$.port", is(3000)))
				.andExpect(jsonPath("$.protocol", is("HTTPS")))
				.andExpect(jsonPath("$.category", is("MONITORING")))
				.andExpect(jsonPath("$.status", is("ONLINE")))
				.andExpect(jsonPath("$.tags", hasSize(2)))
				.andExpect(jsonPath("$.linkedServer.name", is("NAS 01")))
				.andExpect(jsonPath("$.createdAt", notNullValue()))
				.andExpect(jsonPath("$.updatedAt", notNullValue()));
	}

	@Test
	void listSupportsSearchCategoryStatusAndTags() throws Exception {
		createService("Grafana", "https://grafana.example.com", "MONITORING", "ONLINE", List.of("metrics"));
		createService("Jellyfin", "https://jellyfin.example.com", "MEDIA", "OFFLINE", List.of("media"));

		mockMvc.perform(get("/api/v1/services")
				.param("q", "jellyfin")
				.param("category", "MEDIA")
				.param("status", "OFFLINE")
				.param("tags", "media"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content", hasSize(1)))
				.andExpect(jsonPath("$.totalElements", is(1)))
				.andExpect(jsonPath("$.content[0].name", is("Jellyfin")))
				.andExpect(jsonPath("$.content[0].category", is("MEDIA")));
	}

	@Test
	void updateAndDeleteWork() throws Exception {
		String createdJson = createService("Pi-hole", "http://pihole.example.com", "NETWORKING", "UNKNOWN", List.of("dns"));
		String id = objectMapper.readTree(createdJson).get("id").asText();

		mockMvc.perform(put("/api/v1/services/{id}", id)
				.with(user("operator").roles("OPERATOR"))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(createPayload(
						"Pi-hole Admin",
						"DNS filtering UI",
						"http://pihole.example.com/admin",
						"pihole.example.com",
						"10.0.0.53",
						80,
						"HTTP",
						"NETWORKING",
						"ONLINE",
						List.of("dns", "network"),
						"Local resolver.",
						null))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name", is("Pi-hole Admin")))
				.andExpect(jsonPath("$.status", is("ONLINE")))
				.andExpect(jsonPath("$.tags", hasSize(2)));

		mockMvc.perform(delete("/api/v1/services/{id}", id)
				.with(user("operator").roles("OPERATOR")))
				.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/v1/services/{id}", id))
				.andExpect(status().isNotFound());
	}

	@Test
	void viewerCanReadButCannotMutateServices() throws Exception {
		String createdJson = createService("Vaultwarden", "https://vault.example.com", "SECURITY", "ONLINE", List.of("passwords"));
		String id = objectMapper.readTree(createdJson).get("id").asText();

		mockMvc.perform(get("/api/v1/services"))
				.andExpect(status().isOk());

		mockMvc.perform(get("/api/v1/services/{id}", id))
				.andExpect(status().isOk());

		mockMvc.perform(post("/api/v1/services")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(createPayload(
						"Viewer Create",
						"",
						"https://viewer.example.com",
						"viewer.example.com",
						"",
						null,
						"HTTPS",
						"OTHER",
						"UNKNOWN",
						List.of(),
						"",
						null))))
				.andExpect(status().isForbidden());

		mockMvc.perform(delete("/api/v1/services/{id}", id))
				.andExpect(status().isForbidden());
	}

	@Test
	void validationRejectsBadPayload() throws Exception {
		mockMvc.perform(post("/api/v1/services")
				.with(user("operator").roles("OPERATOR"))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(createPayload(
						"x",
						"",
						"",
						"not a hostname",
						"999.999.0.1",
						70000,
						"HTTPS",
						"OTHER",
						"UNKNOWN",
						List.of("this-tag-is-way-too-long-for-the-limit-because-it-keeps-going-forever"),
						"",
						null))))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message", is("Validation failed")))
				.andExpect(jsonPath("$.details[0]", notNullValue()));
	}

	private ServerInventory createServer(String name, String hostname, String ipAddress) {
		return serverInventoryRepository.save(new ServerInventory(
				name,
				hostname,
				ipAddress,
				"Linked service host",
				new LinkedHashSet<>(List.of("services")),
				"Linux",
				ServerStatus.UNKNOWN,
				null));
	}

	private String createService(
			String name,
			String url,
			String category,
			String status,
			List<String> tags) throws Exception {
		return mockMvc.perform(post("/api/v1/services")
				.with(user("operator").roles("OPERATOR"))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(createPayload(
						name,
						"Description for " + name,
						url,
						name.toLowerCase() + ".example.com",
						"10.0.0.20",
						443,
						"HTTPS",
						category,
						status,
						tags,
						"Notes for " + name,
						null))))
				.andExpect(status().isCreated())
				.andReturn()
				.getResponse()
				.getContentAsString();
	}

	private Map<String, Object> createPayload(
			String name,
			String description,
			String url,
			String hostname,
			String ipAddress,
			Integer port,
			String protocol,
			String category,
			String status,
			List<String> tags,
			String notes,
			String linkedServerId) {
		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("name", name);
		payload.put("description", description);
		payload.put("url", url);
		payload.put("hostname", hostname);
		payload.put("ipAddress", ipAddress);
		payload.put("port", port);
		payload.put("protocol", protocol);
		payload.put("category", category);
		payload.put("status", status);
		payload.put("tags", tags);
		payload.put("notes", notes);
		payload.put("linkedServerId", linkedServerId);
		return payload;
	}
}
