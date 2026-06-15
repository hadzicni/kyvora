package dev.kyvora.api.notification.service;

import java.time.Instant;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.kyvora.api.auth.entity.User;
import dev.kyvora.api.auth.exception.UserNotFoundException;
import dev.kyvora.api.auth.repository.UserRepository;
import dev.kyvora.api.auth.security.AuthenticatedUser;
import dev.kyvora.api.notification.dto.CreateNotificationCommand;
import dev.kyvora.api.notification.dto.NotificationResponse;
import dev.kyvora.api.notification.entity.Notification;
import dev.kyvora.api.notification.exception.NotificationNotDismissibleException;
import dev.kyvora.api.notification.exception.NotificationNotFoundException;
import dev.kyvora.api.notification.mapper.NotificationMapper;
import dev.kyvora.api.notification.repository.NotificationRepository;

@Service
@Transactional
class DefaultNotificationService implements NotificationService {

	private static final Logger log = LoggerFactory.getLogger(DefaultNotificationService.class);

	private final NotificationRepository notificationRepository;
	private final UserRepository userRepository;
	private final NotificationMapper mapper;

	DefaultNotificationService(
			NotificationRepository notificationRepository,
			UserRepository userRepository,
			NotificationMapper mapper) {
		this.notificationRepository = notificationRepository;
		this.userRepository = userRepository;
		this.mapper = mapper;
	}

	@Override
	@Transactional(readOnly = true)
	public Page<NotificationResponse> findForUser(AuthenticatedUser principal, Pageable pageable) {
		return notificationRepository.findByRecipientIdAndDismissedAtIsNull(principal.id(), pageable)
				.map(mapper::toResponse);
	}

	@Override
	@Transactional(readOnly = true)
	public long countUnread(AuthenticatedUser principal) {
		return notificationRepository.countByRecipientIdAndReadAtIsNullAndDismissedAtIsNull(principal.id());
	}

	@Override
	public NotificationResponse markRead(AuthenticatedUser principal, UUID id) {
		Notification notification = findUserNotification(principal.id(), id);
		notification.markRead(Instant.now());
		return mapper.toResponse(notification);
	}

	@Override
	public int markAllRead(AuthenticatedUser principal) {
		return notificationRepository.markAllRead(principal.id(), Instant.now());
	}

	@Override
	public void dismiss(AuthenticatedUser principal, UUID id) {
		Notification notification = findUserNotification(principal.id(), id);
		try {
			notification.dismiss(Instant.now());
		} catch (IllegalStateException exception) {
			throw new NotificationNotDismissibleException();
		}
	}

	@Override
	public NotificationResponse create(CreateNotificationCommand command) {
		User recipient = userRepository.findById(command.recipientUserId())
				.orElseThrow(() -> new UserNotFoundException("User not found"));
		Notification notification = new Notification(
				recipient,
				command.title().trim(),
				command.message().trim(),
				command.severity(),
				trimToNull(command.relatedResourceType()),
				trimToNull(command.relatedResourceId()),
				trimToNull(command.relatedResourceUrl()),
				command.dismissible());
		Notification saved = notificationRepository.save(notification);
		log.debug("Created notification {} for user {}", saved.getId(), recipient.getId());
		return mapper.toResponse(saved);
	}

	private Notification findUserNotification(UUID recipientId, UUID id) {
		return notificationRepository.findByIdAndRecipientIdAndDismissedAtIsNull(id, recipientId)
				.orElseThrow(() -> new NotificationNotFoundException(id));
	}

	private String trimToNull(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value.trim();
	}
}
