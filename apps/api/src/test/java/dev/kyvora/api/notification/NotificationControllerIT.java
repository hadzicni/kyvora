package dev.kyvora.api.notification;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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

import dev.kyvora.api.auth.entity.PermissionPreset;
import dev.kyvora.api.auth.entity.User;
import dev.kyvora.api.auth.repository.RefreshTokenRepository;
import dev.kyvora.api.auth.repository.UserRepository;
import dev.kyvora.api.auth.service.UserService;
import dev.kyvora.api.notification.dto.CreateNotificationCommand;
import dev.kyvora.api.notification.dto.NotificationResponse;
import dev.kyvora.api.notification.entity.NotificationSeverity;
import dev.kyvora.api.notification.repository.NotificationRepository;
import dev.kyvora.api.notification.service.NotificationService;

@SpringBootTest
@ActiveProfiles("test")
class NotificationControllerIT {

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
	private NotificationRepository notificationRepository;

	@Autowired
	private NotificationService notificationService;

	private MockMvc mockMvc;
	private User admin;
	private User viewer;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
				.apply(springSecurity())
				.build();
		notificationRepository.deleteAll();
		refreshTokenRepository.deleteAll();
		userRepository.deleteAll();
		admin = userService.create("admin@example.com", PASSWORD, "Admin User", PermissionPreset.ADMIN.permissions());
		viewer = userService.create("viewer@example.com", PASSWORD, "Viewer User", PermissionPreset.VIEWER.permissions());
		refreshTokenRepository.deleteAll();
	}

	@Test
	void authenticatedUserCanListAndReadOwnNotifications() throws Exception {
		NotificationResponse own = createNotification(admin, "Server created", true);
		createNotification(viewer, "Viewer notification", true);

		mockMvc.perform(get("/api/v1/notifications")
				.header(HttpHeaders.AUTHORIZATION, bearer(adminToken())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content", hasSize(1)))
				.andExpect(jsonPath("$.content[0].id", is(own.id().toString())))
				.andExpect(jsonPath("$.content[0].read", is(false)))
				.andExpect(jsonPath("$.content[0].severity", is("SUCCESS")));

		mockMvc.perform(get("/api/v1/notifications/unread-count")
				.header(HttpHeaders.AUTHORIZATION, bearer(adminToken())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.count", is(1)));

		mockMvc.perform(post("/api/v1/notifications/{id}/read", own.id())
				.header(HttpHeaders.AUTHORIZATION, bearer(adminToken())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.read", is(true)))
				.andExpect(jsonPath("$.readAt").exists());

		mockMvc.perform(get("/api/v1/notifications/unread-count")
				.header(HttpHeaders.AUTHORIZATION, bearer(adminToken())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.count", is(0)));
	}

	@Test
	void usersCannotReadOrDismissAnotherUsersNotifications() throws Exception {
		NotificationResponse viewerNotification = createNotification(viewer, "Viewer notification", true);

		mockMvc.perform(post("/api/v1/notifications/{id}/read", viewerNotification.id())
				.header(HttpHeaders.AUTHORIZATION, bearer(adminToken())))
				.andExpect(status().isNotFound());

		mockMvc.perform(delete("/api/v1/notifications/{id}", viewerNotification.id())
				.header(HttpHeaders.AUTHORIZATION, bearer(adminToken())))
				.andExpect(status().isNotFound());
	}

	@Test
	void authenticatedUserCanMarkAllReadAndDismissDismissibleNotifications() throws Exception {
		NotificationResponse first = createNotification(admin, "First", true);
		createNotification(admin, "Second", true);

		mockMvc.perform(post("/api/v1/notifications/read-all")
				.header(HttpHeaders.AUTHORIZATION, bearer(adminToken())))
				.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/v1/notifications/unread-count")
				.header(HttpHeaders.AUTHORIZATION, bearer(adminToken())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.count", is(0)));

		mockMvc.perform(delete("/api/v1/notifications/{id}", first.id())
				.header(HttpHeaders.AUTHORIZATION, bearer(adminToken())))
				.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/v1/notifications")
				.header(HttpHeaders.AUTHORIZATION, bearer(adminToken())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content", hasSize(1)));
	}

	@Test
	void nonDismissibleNotificationsCannotBeDismissed() throws Exception {
		NotificationResponse notification = createNotification(admin, "Security warning", false);

		mockMvc.perform(delete("/api/v1/notifications/{id}", notification.id())
				.header(HttpHeaders.AUTHORIZATION, bearer(adminToken())))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.message", is("Notification cannot be dismissed")));
	}

	private NotificationResponse createNotification(User recipient, String title, boolean dismissible) {
		return notificationService.create(new CreateNotificationCommand(
				recipient.getId(),
				title,
				"Review this event.",
				NotificationSeverity.SUCCESS,
				"SERVER",
				"server-1",
				"/servers/server-1",
				dismissible));
	}

	private String adminToken() throws Exception {
		return tokenFor("admin@example.com", PASSWORD);
	}

	private String tokenFor(String email, String password) throws Exception {
		String body = mockMvc.perform(post("/api/v1/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of("email", email, "password", password))))
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
}
