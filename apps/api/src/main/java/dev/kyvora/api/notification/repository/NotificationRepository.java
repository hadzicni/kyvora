package dev.kyvora.api.notification.repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import dev.kyvora.api.notification.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

	Page<Notification> findByRecipientIdAndDismissedAtIsNull(UUID recipientId, Pageable pageable);

	Optional<Notification> findByIdAndRecipientIdAndDismissedAtIsNull(UUID id, UUID recipientId);

	long countByRecipientIdAndReadAtIsNullAndDismissedAtIsNull(UUID recipientId);

	@Modifying
	@Query("""
			update Notification notification
			set notification.readAt = :readAt
			where notification.recipient.id = :recipientId
				and notification.readAt is null
				and notification.dismissedAt is null
			""")
	int markAllRead(@Param("recipientId") UUID recipientId, @Param("readAt") Instant readAt);
}
