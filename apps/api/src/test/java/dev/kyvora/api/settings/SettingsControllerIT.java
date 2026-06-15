package dev.kyvora.api.settings;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.LinkedHashMap;
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

import dev.kyvora.api.auditlog.entity.AuditEventType;
import dev.kyvora.api.auditlog.repository.AuditLogRepository;
import dev.kyvora.api.settings.repository.SystemSettingRepository;

@SpringBootTest
@ActiveProfiles("test")
class SettingsControllerIT {

	@Autowired
	private WebApplicationContext webApplicationContext;

	@Autowired
	private AuditLogRepository auditLogRepository;

	@Autowired
	private SystemSettingRepository systemSettingRepository;

	private ObjectMapper objectMapper;

	private MockMvc mockMvc;

	@BeforeEach
	void setUp() {
		objectMapper = new ObjectMapper().findAndRegisterModules();
		mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
				.apply(springSecurity())
				.build();
		auditLogRepository.deleteAll();
		systemSettingRepository.deleteAll();
	}

	@Test
	void unauthenticatedGetReturnsUnauthorized() throws Exception {
		mockMvc.perform(get("/api/v1/settings"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void adminGetReturnsDefaults() throws Exception {
		mockMvc.perform(get("/api/v1/settings").with(user("admin").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_DISABLE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_ENABLE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_PASSWORD_RESET"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SETTINGS_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SETTINGS_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_PULL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION"))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.settings", hasSize(5)))
				.andExpect(jsonPath("$.settings[?(@.key == 'instance.name')].value", containsInAnyOrder("Kyvora")))
				.andExpect(jsonPath("$.settings[?(@.key == 'instance.description')].value", containsInAnyOrder("Homelab Control Plane")))
				.andExpect(jsonPath("$.settings[?(@.key == 'agents.offline_threshold_seconds')].value", containsInAnyOrder(90)))
				.andExpect(jsonPath("$.settings[?(@.key == 'agents.offline_check_interval_seconds')].value", containsInAnyOrder(30)))
				.andExpect(jsonPath("$.settings[?(@.key == 'ui.show_dev_hints')].value", containsInAnyOrder(true)));
	}

	@Test
	void nonAdminGetReturnsForbidden() throws Exception {
		mockMvc.perform(get("/api/v1/settings").with(user("operator").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_PULL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION"))))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.message", is("You do not have permission to perform this action.")));
	}

	@Test
	void validUpdatePersistsValues() throws Exception {
		mockMvc.perform(put("/api/v1/settings")
				.with(user("admin").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_DISABLE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_ENABLE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_PASSWORD_RESET"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SETTINGS_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SETTINGS_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_PULL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION")))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(updatePayload(Map.of(
						"instance.name", "Kyvora Lab",
						"agents.offline_threshold_seconds", 120,
						"agents.offline_check_interval_seconds", 15,
						"ui.show_dev_hints", false)))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.settings[?(@.key == 'instance.name')].value", containsInAnyOrder("Kyvora Lab")))
				.andExpect(jsonPath("$.settings[?(@.key == 'agents.offline_threshold_seconds')].value", containsInAnyOrder(120)))
				.andExpect(jsonPath("$.settings[?(@.key == 'agents.offline_check_interval_seconds')].value", containsInAnyOrder(15)))
				.andExpect(jsonPath("$.settings[?(@.key == 'ui.show_dev_hints')].value", containsInAnyOrder(false)));

		org.assertj.core.api.Assertions.assertThat(systemSettingRepository.findById("instance.name").orElseThrow().getValue())
				.isEqualTo("Kyvora Lab");
		org.assertj.core.api.Assertions.assertThat(systemSettingRepository.findById("ui.show_dev_hints").orElseThrow().getValue())
				.isEqualTo("false");
	}

	@Test
	void invalidValueReturnsBadRequest() throws Exception {
		mockMvc.perform(put("/api/v1/settings")
				.with(user("admin").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_DISABLE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_ENABLE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_PASSWORD_RESET"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SETTINGS_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SETTINGS_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_PULL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION")))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(updatePayload(Map.of(
						"agents.offline_threshold_seconds", 10)))))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message", is("Validation failed")))
				.andExpect(jsonPath("$.details[0]", is("agents.offline_threshold_seconds: must be between 30 and 86400")));
	}

	@Test
	void unknownSettingKeyReturnsBadRequest() throws Exception {
		mockMvc.perform(put("/api/v1/settings")
				.with(user("admin").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_DISABLE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_ENABLE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_PASSWORD_RESET"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SETTINGS_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SETTINGS_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_PULL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION")))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(updatePayload(Map.of(
						"KYVORA_JWT_SECRET", "do-not-store")))))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message", is("Validation failed")))
				.andExpect(jsonPath("$.details[0]", is("KYVORA_JWT_SECRET: unknown setting")));
	}

	@Test
	void updateWritesAuditEventWithChangedKeysOnly() throws Exception {
		Map<String, Object> settings = new LinkedHashMap<>();
		settings.put("instance.name", "Audited Kyvora");
		settings.put("instance.description", "Operational settings");

		mockMvc.perform(put("/api/v1/settings")
				.with(user("admin").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_DISABLE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_ENABLE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_USER_PASSWORD_RESET"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SETTINGS_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SETTINGS_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_PULL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION")))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(updatePayload(settings))))
				.andExpect(status().isOk());

		var auditLog = auditLogRepository.findAll().stream()
				.filter(log -> log.getEventType() == AuditEventType.SETTINGS_UPDATED)
				.findFirst()
				.orElseThrow();

		org.assertj.core.api.Assertions.assertThat(auditLog.getAggregateType()).isEqualTo("SETTINGS");
		org.assertj.core.api.Assertions.assertThat(auditLog.getActor()).isEqualTo("admin");
		org.assertj.core.api.Assertions.assertThat(auditLog.getMessage()).isEqualTo("System settings updated");
		org.assertj.core.api.Assertions.assertThat(auditLog.getMetadata())
				.containsEntry("changedKeys", java.util.List.of("instance.name", "instance.description"));
		org.assertj.core.api.Assertions.assertThat(auditLog.getMetadata().toString()).doesNotContain("Audited Kyvora");
	}

	@Test
	void nonAdminUpdateReturnsForbidden() throws Exception {
		mockMvc.perform(put("/api/v1/settings")
				.with(user("operator").authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_DASHBOARD_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AUDIT_LOG_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_NETWORK_MAP_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_READ"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVER_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_CREATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_UPDATE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_SERVICE_DELETE"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_ENROLL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_PULL"), new org.springframework.security.core.authority.SimpleGrantedAuthority("PERMISSION_AGENT_DECOMMISSION")))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(updatePayload(Map.of("instance.name", "Kyvora Lab")))))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.message", is("You do not have permission to perform this action.")));
	}

	private Map<String, Object> updatePayload(Map<String, Object> settings) {
		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("settings", settings);
		return payload;
	}
}
