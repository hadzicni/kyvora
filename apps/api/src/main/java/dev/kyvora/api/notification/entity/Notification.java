package dev.kyvora.api.notification.entity;

import java.time.Instant;
import java.util.UUID;

import dev.kyvora.api.auth.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "notifications")
public class Notification {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "recipient_user_id", nullable = false)
	private User recipient;

	@Column(nullable = false, length = 160)
	private String title;

	@Column(nullable = false, length = 2000)
	private String message;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 16)
	private NotificationSeverity severity;

	@Column(name = "read_at")
	private Instant readAt;

	@Column(name = "related_resource_type", length = 80)
	private String relatedResourceType;

	@Column(name = "related_resource_id", length = 120)
	private String relatedResourceId;

	@Column(name = "related_resource_url", length = 500)
	private String relatedResourceUrl;

	@Column(nullable = false)
	private boolean dismissible = true;

	@Column(name = "dismissed_at")
	private Instant dismissedAt;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected Notification() {
	}

	public Notification(
			User recipient,
			String title,
			String message,
			NotificationSeverity severity,
			String relatedResourceType,
			String relatedResourceId,
			String relatedResourceUrl,
			boolean dismissible) {
		this.recipient = recipient;
		this.title = title;
		this.message = message;
		this.severity = severity;
		this.relatedResourceType = relatedResourceType;
		this.relatedResourceId = relatedResourceId;
		this.relatedResourceUrl = relatedResourceUrl;
		this.dismissible = dismissible;
	}

	@PrePersist
	void beforeCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
	}

	public UUID getId() {
		return id;
	}

	public User getRecipient() {
		return recipient;
	}

	public String getTitle() {
		return title;
	}

	public String getMessage() {
		return message;
	}

	public NotificationSeverity getSeverity() {
		return severity;
	}

	public Instant getReadAt() {
		return readAt;
	}

	public String getRelatedResourceType() {
		return relatedResourceType;
	}

	public String getRelatedResourceId() {
		return relatedResourceId;
	}

	public String getRelatedResourceUrl() {
		return relatedResourceUrl;
	}

	public boolean isDismissible() {
		return dismissible;
	}

	public Instant getDismissedAt() {
		return dismissedAt;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public boolean isRead() {
		return readAt != null;
	}

	public void markRead(Instant readAt) {
		if (this.readAt == null) {
			this.readAt = readAt;
		}
	}

	public void dismiss(Instant dismissedAt) {
		if (!dismissible) {
			throw new IllegalStateException("Notification cannot be dismissed");
		}
		this.dismissedAt = dismissedAt;
		markRead(dismissedAt);
	}
}
