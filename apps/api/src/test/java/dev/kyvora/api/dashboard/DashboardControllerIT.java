package dev.kyvora.api.dashboard;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

import com.fasterxml.jackson.databind.ObjectMapper;

import dev.kyvora.api.serverinventory.entity.ServerStatus;
import dev.kyvora.api.serverinventory.repository.ServerInventoryRepository;

@SpringBootTest
@ActiveProfiles("test")
class DashboardControllerIT {

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
	void summaryReturnsInventoryStatusCounts() throws Exception {
		createServer("Web 01", "web01.example.com", "10.0.1.10", "ONLINE");
		createServer("App 01", "app01.example.com", "10.0.1.11", "ONLINE");
		createServer("DB 01", "db01.example.com", "10.0.1.12", "OFFLINE");
		createServer("Cache 01", "cache01.example.com", "10.0.1.13", "UNKNOWN");

		mockMvc.perform(get("/api/v1/dashboard/summary"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalServers", is(4)))
				.andExpect(jsonPath("$.onlineServers", is(2)))
				.andExpect(jsonPath("$.offlineServers", is(1)))
				.andExpect(jsonPath("$.unknownServers", is(1)))
				.andExpect(jsonPath("$.generatedAt", notNullValue()));
	}

	@Test
	void summaryReturnsZeroCountsForEmptyInventory() throws Exception {
		mockMvc.perform(get("/api/v1/dashboard/summary"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalServers", is(0)))
				.andExpect(jsonPath("$.onlineServers", is(0)))
				.andExpect(jsonPath("$.offlineServers", is(0)))
				.andExpect(jsonPath("$.unknownServers", is(0)))
				.andExpect(jsonPath("$.generatedAt", notNullValue()));
	}

	private void createServer(String name, String hostname, String ipAddress, String status) throws Exception {
		mockMvc.perform(post("/api/v1/servers")
				.with(user("operator").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_PULL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_REMOVE")))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(createPayload(name, hostname, ipAddress, status))))
				.andExpect(status().isCreated());
		var server = repository.findAll().stream()
				.filter(item -> item.getHostname().equals(hostname))
				.findFirst()
				.orElseThrow();
		server.setStatus(ServerStatus.valueOf(status));
		repository.save(server);
	}

	private Map<String, Object> createPayload(String name, String hostname, String ipAddress, String status) {
		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("name", name);
		payload.put("hostname", hostname);
		payload.put("ipAddress", ipAddress);
		payload.put("description", "Description for " + hostname);
		payload.put("operatingSystem", "Linux");
		payload.put("tags", List.of("dashboard"));
		payload.put("status", status);
		return payload;
	}
}
