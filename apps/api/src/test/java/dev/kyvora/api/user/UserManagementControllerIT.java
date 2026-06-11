package dev.kyvora.api.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;

import java.util.LinkedHashMap;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import dev.kyvora.api.auditlog.entity.AuditEventType;
import dev.kyvora.api.auditlog.repository.AuditLogRepository;
import dev.kyvora.api.auth.entity.User;
import dev.kyvora.api.auth.entity.PermissionPreset;
import dev.kyvora.api.auth.repository.RefreshTokenRepository;
import dev.kyvora.api.auth.repository.UserRepository;
import dev.kyvora.api.auth.service.UserService;

@SpringBootTest
@ActiveProfiles("test")
class UserManagementControllerIT {

	private static final String ADMIN_EMAIL = "admin@example.com";
	private static final String VIEWER_EMAIL = "viewer@example.com";
	private static final String OPERATOR_EMAIL = "operator@example.com";
	private static final String PASSWORD = "correct-password";

	@Autowired
	private WebApplicationContext webApplicationContext;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private UserService userService;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private RefreshTokenRepository refreshTokenRepository;

	@Autowired
	private AuditLogRepository auditLogRepository;

	private MockMvc mockMvc;

	private User admin;
	private User viewer;
	private User operator;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
				.apply(springSecurity())
				.build();
		auditLogRepository.deleteAll();
		refreshTokenRepository.deleteAll();
		userRepository.deleteAll();
		admin = userService.create(ADMIN_EMAIL, PASSWORD, "Admin User", PermissionPreset.ADMIN.permissions());
		viewer = userService.create(VIEWER_EMAIL, PASSWORD, "Viewer User", PermissionPreset.VIEWER.permissions());
		operator = userService.create(OPERATOR_EMAIL, PASSWORD, "Operator User", PermissionPreset.OPERATOR.permissions());
		auditLogRepository.deleteAll();
		refreshTokenRepository.deleteAll();
	}

	@Test
	void adminCanListUsersAndResponsesNeverContainPasswordHash() throws Exception {
		mockMvc.perform(get("/api/v1/users")
				.header(HttpHeaders.AUTHORIZATION, bearer(adminToken())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id", notNullValue()))
				.andExpect(jsonPath("$[0].passwordHash").doesNotExist())
				.andExpect(jsonPath("$[1].passwordHash").doesNotExist());
	}

	@Test
	void operatorCannotListUsers() throws Exception {
		mockMvc.perform(get("/api/v1/users")
				.header(HttpHeaders.AUTHORIZATION, bearer(operatorToken())))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.message", is("You do not have permission to perform this action.")));
	}

	@Test
	void viewerCannotListUsers() throws Exception {
		mockMvc.perform(get("/api/v1/users")
				.header(HttpHeaders.AUTHORIZATION, bearer(viewerToken())))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.message", is("You do not have permission to perform this action.")));
	}

	@Test
	void adminCanCreateUserAndDuplicateEmailIsRejected() throws Exception {
		mockMvc.perform(post("/api/v1/users")
				.header(HttpHeaders.AUTHORIZATION, bearer(adminToken()))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(createPayload("new@example.com", "New User", "VIEWER", "temporary-password"))))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.email", is("new@example.com")))
				.andExpect(jsonPath("$.permissions", hasItem("DASHBOARD_READ")))
				.andExpect(jsonPath("$.mustChangePassword", is(true)))
				.andExpect(jsonPath("$.passwordHash").doesNotExist());

		mockMvc.perform(post("/api/v1/users")
				.header(HttpHeaders.AUTHORIZATION, bearer(adminToken()))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(createPayload("new@example.com", "New User", "VIEWER", "temporary-password"))))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.message", is("Email is already in use")));

		assertThat(auditLogRepository.findAll())
				.anyMatch(log -> log.getEventType() == AuditEventType.USER_CREATED
						&& ((java.util.List<?>) log.getMetadata().get("permissions")).contains("DASHBOARD_READ")
						&& Boolean.TRUE.equals(log.getMetadata().get("mustChangePassword"))
						&& !log.getMetadata().containsKey("password"));
	}

	@Test
	void adminCanCreateUserWithoutRequiredPasswordChangeWhenExplicitlyDisabled() throws Exception {
		Map<String, Object> payload = createPayload("ready@example.com", "Ready User", "OPERATOR", "temporary-password");
		payload.put("mustChangePassword", false);

		mockMvc.perform(post("/api/v1/users")
				.header(HttpHeaders.AUTHORIZATION, bearer(adminToken()))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(payload)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.mustChangePassword", is(false)));
	}

	@Test
	void disabledUserCannotLoginAndAdminCanEnableDisabledUser() throws Exception {
		viewer.setEnabled(false);
		userRepository.save(viewer);

		mockMvc.perform(post("/api/v1/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(loginPayload(VIEWER_EMAIL, PASSWORD))))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.message", is("Invalid email or password")));

		mockMvc.perform(post("/api/v1/users/{id}/enable", viewer.getId())
				.header(HttpHeaders.AUTHORIZATION, bearer(adminToken())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.enabled", is(true)));

		mockMvc.perform(post("/api/v1/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(loginPayload(VIEWER_EMAIL, PASSWORD))))
				.andExpect(status().isOk());
	}

	@Test
	void adminCanResetPassword() throws Exception {
		mockMvc.perform(post("/api/v1/users/{id}/reset-password", viewer.getId())
				.header(HttpHeaders.AUTHORIZATION, bearer(adminToken()))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of("newTemporaryPassword", "new-temporary-password"))))
				.andExpect(status().isNoContent());

		assertThat(userRepository.findById(viewer.getId()).orElseThrow().isMustChangePassword()).isTrue();

		mockMvc.perform(post("/api/v1/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(loginPayload(VIEWER_EMAIL, "new-temporary-password"))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.user.mustChangePassword", is(true)));

		assertThat(auditLogRepository.findAll())
				.anyMatch(log -> log.getEventType() == AuditEventType.USER_PASSWORD_RESET
						&& !log.getMetadata().containsKey("newTemporaryPassword"));
	}

	@Test
	void viewerCanChangeOwnPasswordAndWrongCurrentPasswordIsRejected() throws Exception {
		mockMvc.perform(post("/api/v1/me/change-password")
				.header(HttpHeaders.AUTHORIZATION, bearer(viewerToken()))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of(
						"currentPassword", "wrong-password",
						"newPassword", "new-password"))))
				.andExpect(status().isUnauthorized());

		mockMvc.perform(post("/api/v1/me/change-password")
				.header(HttpHeaders.AUTHORIZATION, bearer(viewerToken()))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of(
						"currentPassword", PASSWORD,
						"newPassword", "new-password"))))
				.andExpect(status().isNoContent());

		assertThat(userRepository.findById(viewer.getId()).orElseThrow().isMustChangePassword()).isFalse();

		mockMvc.perform(post("/api/v1/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(loginPayload(VIEWER_EMAIL, "new-password"))))
				.andExpect(status().isOk());

		assertThat(auditLogRepository.findAll())
				.anyMatch(log -> log.getEventType() == AuditEventType.USER_PASSWORD_CHANGED);
	}

	@Test
	void mustChangePasswordUserCanOnlyChangePasswordUntilCompleted() throws Exception {
		viewer.setMustChangePassword(true);
		userRepository.save(viewer);

		String token = viewerToken();

		mockMvc.perform(get("/api/v1/servers")
				.header(HttpHeaders.AUTHORIZATION, bearer(token)))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.message", is("Password change required before accessing this resource.")));

		mockMvc.perform(get("/api/v1/auth/me")
				.header(HttpHeaders.AUTHORIZATION, bearer(token)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.mustChangePassword", is(true)));

		mockMvc.perform(post("/api/v1/me/change-password")
				.header(HttpHeaders.AUTHORIZATION, bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of(
						"currentPassword", PASSWORD,
						"newPassword", "changed-password"))))
				.andExpect(status().isNoContent());

		String changedToken = tokenFor(VIEWER_EMAIL, "changed-password");
		mockMvc.perform(get("/api/v1/servers")
				.header(HttpHeaders.AUTHORIZATION, bearer(changedToken)))
				.andExpect(status().isOk());
	}

	@Test
	void bootstrapStyleCreatedUserDoesNotRequirePasswordChange() {
		assertThat(admin.isMustChangePassword()).isFalse();
	}

	@Test
	void cannotDisableLastEnabledUserManager() throws Exception {
		mockMvc.perform(post("/api/v1/users/{id}/disable", admin.getId())
				.header(HttpHeaders.AUTHORIZATION, bearer(adminToken())))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.message", is("Cannot disable the last enabled user manager")));
	}

	@Test
	void adminCanUpdateUserAndAuditEventIsWritten() throws Exception {
		mockMvc.perform(put("/api/v1/users/{id}", viewer.getId())
				.header(HttpHeaders.AUTHORIZATION, bearer(adminToken()))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of(
						"displayName", "Updated User",
						"permissionPreset", "OPERATOR"))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.displayName", is("Updated User")))
				.andExpect(jsonPath("$.permissions", hasItem("SERVER_UPDATE")))
				.andExpect(jsonPath("$.passwordHash").doesNotExist());

		assertThat(auditLogRepository.findAll())
				.anyMatch(log -> log.getEventType() == AuditEventType.USER_UPDATED);
	}

	private String adminToken() throws Exception {
		return tokenFor(ADMIN_EMAIL, PASSWORD);
	}

	private String viewerToken() throws Exception {
		return tokenFor(VIEWER_EMAIL, PASSWORD);
	}

	private String operatorToken() throws Exception {
		return tokenFor(OPERATOR_EMAIL, PASSWORD);
	}

	private String tokenFor(String email, String password) throws Exception {
		String body = mockMvc.perform(post("/api/v1/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(loginPayload(email, password))))
				.andExpect(status().isOk())
				.andReturn()
				.getResponse()
				.getContentAsString();
		JsonNode login = objectMapper.readTree(body);
		return login.get("accessToken").asText();
	}

	private String bearer(String token) {
		return "Bearer " + token;
	}

	private Map<String, Object> loginPayload(String email, String password) {
		return Map.of("email", email, "password", password);
	}

	private Map<String, Object> createPayload(String email, String displayName, String preset, String temporaryPassword) {
		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("email", email);
		payload.put("displayName", displayName);
		payload.put("permissionPreset", preset);
		payload.put("temporaryPassword", temporaryPassword);
		return payload;
	}
}
