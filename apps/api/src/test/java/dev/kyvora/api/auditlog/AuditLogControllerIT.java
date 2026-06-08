package dev.kyvora.api.auditlog;

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

import dev.kyvora.api.auditlog.repository.AuditLogRepository;
import dev.kyvora.api.serverinventory.repository.ServerInventoryRepository;

@SpringBootTest
@ActiveProfiles("test")
class AuditLogControllerIT {

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
				.with(user("alice"))
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
				.with(user("alice"))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(payload(
						"Web 01 Renamed",
						"web01.example.com",
						"10.0.0.11",
						"ONLINE"))))
				.andExpect(status().isOk());

		mockMvc.perform(delete("/api/v1/servers/{id}", id)
				.with(user("alice")))
				.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/v1/audit-logs")
				.with(user("alice"))
				.param("aggregateType", "SERVER")
				.param("aggregateId", id)
				.param("sort", "createdAt,asc"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content", hasSize(3)))
				.andExpect(jsonPath("$.content[0].eventType", is("SERVER_CREATED")))
				.andExpect(jsonPath("$.content[0].aggregateType", is("SERVER")))
				.andExpect(jsonPath("$.content[0].aggregateId", is(id)))
				.andExpect(jsonPath("$.content[0].actor", is("alice")))
				.andExpect(jsonPath("$.content[0].message", is("Server created: web01.example.com")))
				.andExpect(jsonPath("$.content[0].metadata.hostname", is("web01.example.com")))
				.andExpect(jsonPath("$.content[0].createdAt", notNullValue()))
				.andExpect(jsonPath("$.content[1].eventType", is("SERVER_UPDATED")))
				.andExpect(jsonPath("$.content[2].eventType", is("SERVER_DELETED")));
	}

	@Test
	void auditLogsSupportEventTypeFilter() throws Exception {
		String createdJson = mockMvc.perform(post("/api/v1/servers")
				.with(user("bob"))
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
				.with(user("bob"))
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
