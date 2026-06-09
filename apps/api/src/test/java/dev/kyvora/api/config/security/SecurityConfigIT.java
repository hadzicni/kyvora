package dev.kyvora.api.config.security;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
@ActiveProfiles("test")
class SecurityConfigIT {

	@Autowired
	private WebApplicationContext webApplicationContext;

	private MockMvc mockMvc;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
				.apply(springSecurity())
				.build();
	}

	@Test
	void openApiDocumentationEndpointsArePublic() throws Exception {
		mockMvc.perform(get("/v3/api-docs"))
				.andExpect(status().isOk());

		mockMvc.perform(get("/swagger-ui.html"))
				.andExpect(status().is3xxRedirection());
	}

	@Test
	void statusEndpointIsPublic() throws Exception {
		mockMvc.perform(get("/api/v1/status"))
				.andExpect(status().isOk());
	}

	@Test
	void serverInventoryEndpointsRequireAuthentication() throws Exception {
		mockMvc.perform(get("/api/v1/servers"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void dashboardSummaryEndpointRequiresAuthentication() throws Exception {
		mockMvc.perform(get("/api/v1/dashboard/summary"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void auditLogEndpointsRequireAuthentication() throws Exception {
		mockMvc.perform(get("/api/v1/audit-logs"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void agentEndpointsRequireAuthentication() throws Exception {
		mockMvc.perform(get("/api/v1/agents"))
				.andExpect(status().isUnauthorized());
	}
}
