package dev.kyvora.api.notification.dto;

import java.time.Instant;
import java.util.UUID;

import dev.kyvora.api.notification.entity.NotificationSeverity;

public record NotificationResponse(
		UUID id,
		String title,
		String message,
		NotificationSeverity severity,
		boolean read,
		Instant createdAt,
		Instant readAt,
		String relatedResourceType,
		String relatedResourceId,
		String relatedResourceUrl,
		boolean dismissible) {
}
