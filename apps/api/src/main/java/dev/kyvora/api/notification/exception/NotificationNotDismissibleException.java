package dev.kyvora.api.notification.exception;

public class NotificationNotDismissibleException extends RuntimeException {

	public NotificationNotDismissibleException() {
		super("Notification cannot be dismissed");
	}
}
