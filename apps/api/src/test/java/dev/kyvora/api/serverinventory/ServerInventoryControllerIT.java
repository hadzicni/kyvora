package dev.kyvora.api.serverinventory;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
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
		mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
		repository.deleteAll();
	}

	@Test
	void createReturnsCreatedServer() throws Exception {
		mockMvc.perform(post("/api/v1/servers")
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
				.andExpect(jsonPath("$.status", is("ONLINE")))
				.andExpect(jsonPath("$.tags", hasSize(2)))
				.andExpect(jsonPath("$.createdAt", notNullValue()))
				.andExpect(jsonPath("$.updatedAt", notNullValue()));
	}

	@Test
	void listSupportsPaginationAndFilters() throws Exception {
		createServer("App 01", "app01.example.com", "10.0.0.11", List.of("prod", "app"), "ONLINE");
		createServer("DB 01", "db01.example.com", "10.0.0.12", List.of("prod", "db"), "OFFLINE");

		mockMvc.perform(get("/api/v1/servers")
				.param("page", "0")
				.param("size", "1")
				.param("tags", "db")
				.param("status", "OFFLINE"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content", hasSize(1)))
				.andExpect(jsonPath("$.totalElements", is(1)))
				.andExpect(jsonPath("$.content[0].hostname", is("db01.example.com")))
				.andExpect(jsonPath("$.content[0].status", is("OFFLINE")));
	}

	@Test
	void validationRejectsBadPayload() throws Exception {
		mockMvc.perform(post("/api/v1/servers")
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
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(createPayload(
						"Old Name",
						"old.example.com",
						"10.0.0.30",
						"Old description",
						"Linux",
						List.of("legacy"),
						"UNKNOWN",
						"2026-06-07T00:00:00Z"))))
				.andExpect(status().isCreated())
				.andReturn()
				.getResponse()
				.getContentAsString();

		JsonNode created = objectMapper.readTree(createdJson);
		String id = created.get("id").asText();

		mockMvc.perform(put("/api/v1/servers/{id}", id)
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
				.andExpect(jsonPath("$.tags", hasSize(2)));

		mockMvc.perform(delete("/api/v1/servers/{id}", id))
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

	private void createServer(String name, String hostname, String ipAddress, List<String> tags, String status) throws Exception {
		mockMvc.perform(post("/api/v1/servers")
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
