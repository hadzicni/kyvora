package dev.kyvora.api.notification.mapper;

import org.springframework.stereotype.Component;

import dev.kyvora.api.notification.dto.NotificationResponse;
import dev.kyvora.api.notification.entity.Notification;

@Component
public class NotificationMapper {

	public NotificationResponse toResponse(Notification notification) {
		return new NotificationResponse(
				notification.getId(),
				notification.getTitle(),
				notification.getMessage(),
				notification.getSeverity(),
				notification.isRead(),
				notification.getCreatedAt(),
				notification.getReadAt(),
				notification.getRelatedResourceType(),
				notification.getRelatedResourceId(),
				notification.getRelatedResourceUrl(),
				notification.isDismissible());
	}
}
