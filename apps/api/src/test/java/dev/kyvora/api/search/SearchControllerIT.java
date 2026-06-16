package dev.kyvora.api.search;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import dev.kyvora.api.agent.entity.Agent;
import dev.kyvora.api.agent.entity.AgentStatus;
import dev.kyvora.api.agent.repository.AgentRepository;
import dev.kyvora.api.auditlog.entity.AuditEventType;
import dev.kyvora.api.auditlog.entity.AuditLog;
import dev.kyvora.api.auditlog.repository.AuditLogRepository;
import dev.kyvora.api.auth.entity.User;
import dev.kyvora.api.auth.entity.UserPermission;
import dev.kyvora.api.auth.repository.UserRepository;
import dev.kyvora.api.managedservice.entity.ManagedService;
import dev.kyvora.api.managedservice.entity.ManagedServiceCategory;
import dev.kyvora.api.managedservice.entity.ManagedServiceProtocol;
import dev.kyvora.api.managedservice.repository.ManagedServiceRepository;
import dev.kyvora.api.serverinventory.entity.ServerInventory;
import dev.kyvora.api.serverinventory.entity.ServerStatus;
import dev.kyvora.api.serverinventory.repository.ServerInventoryRepository;

@SpringBootTest
@ActiveProfiles("test")
class SearchControllerIT {

	@Autowired
	private WebApplicationContext webApplicationContext;

	@Autowired
	private ServerInventoryRepository serverInventoryRepository;

	@Autowired
	private ManagedServiceRepository managedServiceRepository;

	@Autowired
	private AgentRepository agentRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private AuditLogRepository auditLogRepository;

	private MockMvc mockMvc;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
				.defaultRequest(get("/").with(user("viewer").authorities(readAuthority("SERVER_READ"))))
				.apply(springSecurity())
				.build();
		auditLogRepository.deleteAll();
		agentRepository.deleteAll();
		managedServiceRepository.deleteAll();
		serverInventoryRepository.deleteAll();
		userRepository.deleteAll();
	}

	@Test
	void searchReturnsVisibleResourceTypes() throws Exception {
		ServerInventory server = createServer("Grafana Host", "grafana-host.example.com", "10.0.0.10");
		createService("Grafana", "https://grafana.example.com", server);
		createAgent("Grafana Agent", "grafana-host.example.com", server);
		createUser("grafana.operator@example.com", "Grafana Operator");
		createAuditLog("Grafana service updated", server);

		mockMvc.perform(get("/api/v1/search")
				.with(user("operator").authorities(
						readAuthority("SERVER_READ"),
						readAuthority("SERVICE_READ"),
						readAuthority("AGENT_READ"),
						readAuthority("USER_READ"),
						readAuthority("AUDIT_LOG_READ")))
				.param("q", "grafana")
				.param("limit", "10"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.query", is("grafana")))
				.andExpect(jsonPath("$.results", hasSize(5)))
				.andExpect(jsonPath("$.results[*].type", containsInAnyOrder(
						"SERVER",
						"SERVICE",
						"AGENT",
						"USER",
						"ACTIVITY")))
				.andExpect(jsonPath("$.results[?(@.type == 'SERVICE')].url", containsInAnyOrder(org.hamcrest.Matchers.startsWith("/services/"))));
	}

	@Test
	void searchOnlyReturnsResourcesAllowedByPermissions() throws Exception {
		ServerInventory server = createServer("Grafana Host", "grafana-host.example.com", "10.0.0.10");
		createService("Grafana", "https://grafana.example.com", server);

		mockMvc.perform(get("/api/v1/search")
				.with(user("service-viewer").authorities(readAuthority("SERVICE_READ")))
				.param("q", "grafana")
				.param("limit", "10"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.results", hasSize(1)))
				.andExpect(jsonPath("$.results[0].type", is("SERVICE")))
				.andExpect(jsonPath("$.results[0].url", org.hamcrest.Matchers.startsWith("/services/")));
	}

	@Test
	void searchRequiresAtLeastTwoCharacters() throws Exception {
		createServer("Grafana Host", "grafana-host.example.com", "10.0.0.10");

		mockMvc.perform(get("/api/v1/search")
				.param("q", "g"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.query", is("g")))
				.andExpect(jsonPath("$.results", hasSize(0)));
	}

	private ServerInventory createServer(String name, String hostname, String ipAddress) {
		return serverInventoryRepository.save(new ServerInventory(
				name,
				hostname,
				ipAddress,
				"Searchable server",
				new LinkedHashSet<>(List.of("grafana", "search")),
				"Linux",
				ServerStatus.ONLINE,
				null));
	}

	private ManagedService createService(String name, String url, ServerInventory server) {
		return managedServiceRepository.save(new ManagedService(
				name,
				"Grafana dashboards",
				url,
				"grafana.example.com",
				"10.0.0.20",
				3000,
				ManagedServiceProtocol.HTTPS,
				ManagedServiceCategory.MONITORING,
				new LinkedHashSet<>(List.of("grafana", "metrics")),
				"Searchable service",
				server));
	}

	private Agent createAgent(String name, String hostname, ServerInventory server) {
		return agentRepository.save(new Agent(
				name,
				hostname,
				"test",
				AgentStatus.ONLINE,
				server,
				"http://10.0.0.10:9187",
				"agent-secret"));
	}

	private User createUser(String email, String displayName) {
		return userRepository.save(new User(
				email,
				"not-a-real-password-hash",
				displayName,
				new LinkedHashSet<>(List.of(UserPermission.DASHBOARD_READ)),
				true));
	}

	private AuditLog createAuditLog(String message, ServerInventory server) {
		Map<String, Object> metadata = new LinkedHashMap<>();
		metadata.put("source", "search-test");
		return auditLogRepository.save(new AuditLog(
				AuditEventType.SERVER_UPDATED,
				"ServerInventory",
				server.getId(),
				"grafana.operator@example.com",
				message,
				metadata));
	}

	private SimpleGrantedAuthority readAuthority(String permission) {
		return new SimpleGrantedAuthority("PERMISSION_" + permission);
	}
}
