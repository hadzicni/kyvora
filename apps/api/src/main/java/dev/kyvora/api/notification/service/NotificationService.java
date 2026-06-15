package dev.kyvora.api.notification.service;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import dev.kyvora.api.auth.security.AuthenticatedUser;
import dev.kyvora.api.notification.dto.CreateNotificationCommand;
import dev.kyvora.api.notification.dto.NotificationResponse;

public interface NotificationService {

	Page<NotificationResponse> findForUser(AuthenticatedUser principal, Pageable pageable);

	long countUnread(AuthenticatedUser principal);

	NotificationResponse markRead(AuthenticatedUser principal, UUID id);

	int markAllRead(AuthenticatedUser principal);

	void dismiss(AuthenticatedUser principal, UUID id);

	NotificationResponse create(CreateNotificationCommand command);
}
