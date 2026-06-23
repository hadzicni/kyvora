package dev.kyvora.api.agent;

import static org.hamcrest.Matchers.is;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.Map;
import java.util.Set;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import dev.kyvora.api.agent.repository.AgentRepository;
import dev.kyvora.api.agent.entity.Agent;
import dev.kyvora.api.agent.entity.AgentStatus;
import dev.kyvora.api.auditlog.entity.AuditEventType;
import dev.kyvora.api.auditlog.repository.AuditLogRepository;
import dev.kyvora.api.serverinventory.entity.ServerInventory;
import dev.kyvora.api.serverinventory.entity.ServerStatus;
import dev.kyvora.api.serverinventory.repository.ServerInventoryRepository;

@SpringBootTest
@ActiveProfiles("test")
class AgentControllerIT {

	@Autowired
	private WebApplicationContext webApplicationContext;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private AgentRepository agentRepository;

	@Autowired
	private ServerInventoryRepository serverInventoryRepository;

	@Autowired
	private AuditLogRepository auditLogRepository;

	private MockMvc mockMvc;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
				.apply(springSecurity())
				.build();
		agentRepository.deleteAll();
		auditLogRepository.deleteAll();
		serverInventoryRepository.deleteAll();
	}

	@Test
	void configureAgentDoesNotExposeSharedSecret() throws Exception {
		ServerInventory server = serverInventoryRepository.save(new ServerInventory(
				"Node 01",
				"node01.example.com",
				"10.0.0.10",
				"",
				Set.of(),
				"Ubuntu",
				ServerStatus.UNKNOWN,
				Instant.now()));

		mockMvc.perform(post("/api/v1/agents")
						.with(user("operator").authorities(
								new SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"),
								new SimpleGrantedAuthority("PERMISSION_AGENT_READ")))
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(Map.of(
								"serverId", server.getId(),
								"name", "Node Agent",
								"baseUrl", "http://10.0.0.10:9187",
								"sharedSecret", "very-secret-value"))))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.status", is("UNKNOWN")))
				.andExpect(jsonPath("$.baseUrl", is("http://10.0.0.10:9187")))
				.andExpect(jsonPath("$.sharedSecret").doesNotExist());
	}

	@Test
	void manualPullRequiresPullPermission() throws Exception {
		mockMvc.perform(post("/api/v1/agents/00000000-0000-0000-0000-000000000001/pull")
						.with(user("viewer").authorities(new SimpleGrantedAuthority("PERMISSION_AGENT_READ"))))
				.andExpect(status().isForbidden());
	}

	@Test
	void testConnectionRequiresPullPermission() throws Exception {
		mockMvc.perform(post("/api/v1/agents/test-connection")
					.with(user("viewer").authorities(new SimpleGrantedAuthority("PERMISSION_AGENT_READ")))
					.contentType(MediaType.APPLICATION_JSON)
					.content(objectMapper.writeValueAsString(Map.of(
							"baseUrl", "http://127.0.0.1:9187",
							"sharedSecret", "very-secret-value"))))
				.andExpect(status().isForbidden());
	}

	@Test
	void configureAgentRejectsUnsafeScheme() throws Exception {
		ServerInventory server = serverInventoryRepository.save(new ServerInventory(
				"Node 02", "node02.example.com", "10.0.0.11", "", Set.of(), "Linux",
				ServerStatus.UNKNOWN, Instant.now()));

		mockMvc.perform(post("/api/v1/agents")
					.with(user("operator").authorities(new SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL")))
					.contentType(MediaType.APPLICATION_JSON)
					.content(objectMapper.writeValueAsString(Map.of(
							"serverId", server.getId(),
							"baseUrl", "file://10.0.0.11:9187/etc/passwd",
							"sharedSecret", "very-secret-value"))))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.details[0]", is("baseUrl: scheme must be http or https")));
	}

	@Test
	void removeAgentRequiresRemovePermission() throws Exception {
		mockMvc.perform(delete("/api/v1/agents/00000000-0000-0000-0000-000000000001")
					.with(user("viewer").authorities(new SimpleGrantedAuthority("PERMISSION_AGENT_READ"))))
				.andExpect(status().isForbidden());
	}

	@Test
	void removeAgentDeletesRecordResetsServerAndWritesAuditEvent() throws Exception {
		ServerInventory server = serverInventoryRepository.save(new ServerInventory(
				"Node 03", "node03.example.com", "10.0.0.12", "", Set.of(), "Linux",
				ServerStatus.ONLINE, Instant.now()));
		Agent agent = agentRepository.save(new Agent(
				"Node 03 Agent", server.getHostname(), "1.0.0", AgentStatus.ONLINE, server,
				"http://10.0.0.12:9187", "very-secret-value"));

		mockMvc.perform(delete("/api/v1/agents/{id}", agent.getId())
					.with(user("operator").authorities(new SimpleGrantedAuthority("PERMISSION_AGENT_REMOVE"))))
				.andExpect(status().isNoContent());

		assertThat(agentRepository.findById(agent.getId())).isEmpty();
		assertThat(serverInventoryRepository.findById(server.getId())).get()
				.extracting(ServerInventory::getStatus).isEqualTo(ServerStatus.UNKNOWN);
		assertThat(auditLogRepository.findAll())
				.anySatisfy(log -> {
					assertThat(log.getEventType()).isEqualTo(AuditEventType.AGENT_REMOVED);
					assertThat(log.getMessage()).contains("removed from Kyvora", "uninstall is manual");
				});
	}

}
