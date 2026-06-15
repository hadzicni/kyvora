package dev.kyvora.api.notification.exception;

import java.util.UUID;

public class NotificationNotFoundException extends RuntimeException {

	public NotificationNotFoundException(UUID id) {
		super("Notification not found: " + id);
	}
}
