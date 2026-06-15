package dev.kyvora.api.notification.dto;

import java.util.UUID;

import dev.kyvora.api.notification.entity.NotificationSeverity;

public record CreateNotificationCommand(
		UUID recipientUserId,
		String title,
		String message,
		NotificationSeverity severity,
		String relatedResourceType,
		String relatedResourceId,
		String relatedResourceUrl,
		boolean dismissible) {
}
