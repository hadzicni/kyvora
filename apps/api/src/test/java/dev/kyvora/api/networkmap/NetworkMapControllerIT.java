package dev.kyvora.api.networkmap;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.LinkedHashSet;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import dev.kyvora.api.agent.repository.AgentHostFactsRepository;
import dev.kyvora.api.agent.repository.AgentRepository;
import dev.kyvora.api.auditlog.repository.AuditLogRepository;
import dev.kyvora.api.serverinventory.entity.ServerInventory;
import dev.kyvora.api.serverinventory.entity.ServerStatus;
import dev.kyvora.api.serverinventory.repository.ServerInventoryRepository;

@SpringBootTest
@ActiveProfiles("test")
class NetworkMapControllerIT {

	@Autowired
	private WebApplicationContext webApplicationContext;

	@Autowired
	private ServerInventoryRepository serverRepository;

	@Autowired
	private AgentRepository agentRepository;

	@Autowired
	private AgentHostFactsRepository hostFactsRepository;

	@Autowired
	private AuditLogRepository auditLogRepository;

	private MockMvc mockMvc;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
				.apply(springSecurity())
				.build();
		auditLogRepository.deleteAll();
		hostFactsRepository.deleteAll();
		agentRepository.deleteAll();
		serverRepository.deleteAll();
	}

	@Test
	void returnsDerivedNetworkMapForInventoryServers() throws Exception {
		createServer("App 01", "app01.example.com", "10.0.0.11", ServerStatus.ONLINE, List.of("prod", "app"));
		createServer("DB 01", "db01.example.com", "10.0.0.12", ServerStatus.OFFLINE, List.of("prod", "db"));

		mockMvc.perform(get("/api/v1/network-map").with(user("viewer").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.subnets", hasSize(1)))
				.andExpect(jsonPath("$.subnets[0].cidr", is("10.0.0.0/24")))
				.andExpect(jsonPath("$.subnets[0].nodeCount", is(2)))
				.andExpect(jsonPath("$.nodes", hasSize(3)))
				.andExpect(jsonPath("$.nodes[0].type", is("GATEWAY")))
				.andExpect(jsonPath("$.nodes[0].source", is("INFERRED")))
				.andExpect(jsonPath("$.nodes[1].name", is("App 01")))
				.andExpect(jsonPath("$.nodes[1].hostname", is("app01.example.com")))
				.andExpect(jsonPath("$.nodes[1].ipAddress", is("10.0.0.11")))
				.andExpect(jsonPath("$.nodes[1].openPorts", hasSize(0)))
				.andExpect(jsonPath("$.nodes[1].services", hasSize(0)))
				.andExpect(jsonPath("$.edges", hasSize(2)))
				.andExpect(jsonPath("$.generatedAt", notNullValue()));
	}

	@Test
	void requiresAuthentication() throws Exception {
		mockMvc.perform(get("/api/v1/network-map"))
				.andExpect(status().isUnauthorized());
	}

	private void createServer(String name, String hostname, String ipAddress, ServerStatus status, List<String> tags) {
		ServerInventory server = new ServerInventory(
				name,
				hostname,
				ipAddress,
				null,
				new LinkedHashSet<>(tags),
				"Linux",
				status,
				null);
		serverRepository.save(server);
	}
}
