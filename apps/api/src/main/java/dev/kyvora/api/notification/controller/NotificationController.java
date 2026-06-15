package dev.kyvora.api.notification.controller;

import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import dev.kyvora.api.auth.security.AuthenticatedUser;
import dev.kyvora.api.config.openapi.OpenApiConfig;
import dev.kyvora.api.notification.dto.NotificationPageResponse;
import dev.kyvora.api.notification.dto.NotificationResponse;
import dev.kyvora.api.notification.dto.UnreadNotificationCountResponse;
import dev.kyvora.api.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1/notifications")
@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH_SCHEME)
@Tag(name = "Notifications", description = "User-scoped notification center.")
public class NotificationController {

	private final NotificationService service;

	public NotificationController(NotificationService service) {
		this.service = service;
	}

	@GetMapping
	@Operation(summary = "List notifications for the authenticated user")
	public ResponseEntity<NotificationPageResponse> findAll(
			@AuthenticationPrincipal AuthenticatedUser principal,
			@PageableDefault(size = 20) Pageable pageable) {
		return ResponseEntity.ok(NotificationPageResponse.from(service.findForUser(principal, pageable)));
	}

	@GetMapping("/unread-count")
	@Operation(summary = "Get unread notification count")
	public ResponseEntity<UnreadNotificationCountResponse> unreadCount(@AuthenticationPrincipal AuthenticatedUser principal) {
		return ResponseEntity.ok(new UnreadNotificationCountResponse(service.countUnread(principal)));
	}

	@PostMapping("/{id}/read")
	@Operation(summary = "Mark a notification as read")
	public ResponseEntity<NotificationResponse> markRead(
			@AuthenticationPrincipal AuthenticatedUser principal,
			@PathVariable UUID id) {
		return ResponseEntity.ok(service.markRead(principal, id));
	}

	@PostMapping("/read-all")
	@Operation(summary = "Mark all notifications as read")
	public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal AuthenticatedUser principal) {
		service.markAllRead(principal);
		return ResponseEntity.noContent().build();
	}

	@DeleteMapping("/{id}")
	@Operation(summary = "Dismiss a notification")
	public ResponseEntity<Void> dismiss(
			@AuthenticationPrincipal AuthenticatedUser principal,
			@PathVariable UUID id) {
		service.dismiss(principal, id);
		return ResponseEntity.noContent().build();
	}
}
