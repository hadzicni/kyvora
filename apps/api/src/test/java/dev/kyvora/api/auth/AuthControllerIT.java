package dev.kyvora.api.auth;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.blankOrNullString;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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

import dev.kyvora.api.auditlog.repository.AuditLogRepository;
import dev.kyvora.api.auth.entity.PermissionPreset;
import dev.kyvora.api.auth.repository.RefreshTokenRepository;
import dev.kyvora.api.auth.repository.UserRepository;
import dev.kyvora.api.auth.service.UserService;

@SpringBootTest
@ActiveProfiles("test")
class AuthControllerIT {

	private static final String EMAIL = "admin@example.com";
	private static final String PASSWORD = "correct-password";

	@Autowired
	private WebApplicationContext webApplicationContext;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private UserService userService;

	@Autowired
	private RefreshTokenRepository refreshTokenRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private AuditLogRepository auditLogRepository;

	private MockMvc mockMvc;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
				.apply(springSecurity())
				.build();
		auditLogRepository.deleteAll();
		refreshTokenRepository.deleteAll();
		userRepository.deleteAll();
		userService.create(EMAIL, PASSWORD, "Admin User", PermissionPreset.ADMIN.permissions());
	}

	@Test
	void loginSuccessReturnsTokensAndUser() throws Exception {
		mockMvc.perform(post("/api/v1/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(loginPayload(EMAIL, PASSWORD))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.accessToken", not(blankOrNullString())))
				.andExpect(jsonPath("$.refreshToken", not(blankOrNullString())))
				.andExpect(jsonPath("$.tokenType", is("Bearer")))
				.andExpect(jsonPath("$.expiresIn", is(900)))
				.andExpect(jsonPath("$.user.email", is(EMAIL)))
				.andExpect(jsonPath("$.user.displayName", is("Admin User")))
				.andExpect(jsonPath("$.user.permissions", hasItem("USER_UPDATE")))
				.andExpect(jsonPath("$.user.mustChangePassword", is(false)))
				.andExpect(jsonPath("$.user.passwordHash").doesNotExist());
	}

	@Test
	void loginFailureReturnsUnauthorized() throws Exception {
		mockMvc.perform(post("/api/v1/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(loginPayload(EMAIL, "wrong-password"))))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.message", is("Invalid email or password")));
	}

	@Test
	void disabledUserCannotLoginWithSameInvalidCredentialsMessage() throws Exception {
		var user = userRepository.findByEmailIgnoreCase(EMAIL).orElseThrow();
		user.setEnabled(false);
		userRepository.save(user);

		mockMvc.perform(post("/api/v1/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(loginPayload(EMAIL, PASSWORD))))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.message", is("Invalid email or password")));
	}

	@Test
	void refreshSuccessRotatesRefreshToken() throws Exception {
		JsonNode login = login();

		mockMvc.perform(post("/api/v1/auth/refresh")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of("refreshToken", login.get("refreshToken").asText()))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.accessToken", not(blankOrNullString())))
				.andExpect(jsonPath("$.refreshToken", not(blankOrNullString())))
				.andExpect(jsonPath("$.refreshToken", not(is(login.get("refreshToken").asText()))))
				.andExpect(jsonPath("$.tokenType", is("Bearer")))
				.andExpect(jsonPath("$.expiresIn", is(900)))
				.andExpect(jsonPath("$.user.email", is(EMAIL)));
	}

	@Test
	void refreshInvalidTokenReturnsUnauthorized() throws Exception {
		mockMvc.perform(post("/api/v1/auth/refresh")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of("refreshToken", "not-a-token"))))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.message", is("Invalid refresh token")));
	}

	@Test
	void meEndpointReturnsCurrentUserWithValidJwt() throws Exception {
		JsonNode login = login();

		mockMvc.perform(get("/api/v1/auth/me")
				.header(HttpHeaders.AUTHORIZATION, "Bearer " + login.get("accessToken").asText()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id", notNullValue()))
				.andExpect(jsonPath("$.email", is(EMAIL)))
				.andExpect(jsonPath("$.displayName", is("Admin User")))
				.andExpect(jsonPath("$.permissions", hasItem("USER_UPDATE")))
				.andExpect(jsonPath("$.mustChangePassword", is(false)))
				.andExpect(jsonPath("$.passwordHash").doesNotExist());
	}

	@Test
	void protectedEndpointRejectsMissingToken() throws Exception {
		mockMvc.perform(get("/api/v1/servers"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.message", is("Authentication is required")));
	}

	@Test
	void publicEndpointsStayPublic() throws Exception {
		mockMvc.perform(get("/actuator/health"))
				.andExpect(status().isOk());

		mockMvc.perform(get("/v3/api-docs"))
				.andExpect(status().isOk());

		mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON))
				.andExpect(status().isBadRequest());

		mockMvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON))
				.andExpect(status().isBadRequest());
	}

	private JsonNode login() throws Exception {
		String body = mockMvc.perform(post("/api/v1/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(loginPayload(EMAIL, PASSWORD))))
				.andExpect(status().isOk())
				.andReturn()
				.getResponse()
				.getContentAsString();
		return objectMapper.readTree(body);
	}

	private Map<String, Object> loginPayload(String email, String password) {
		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("email", email);
		payload.put("password", password);
		return payload;
	}
}
