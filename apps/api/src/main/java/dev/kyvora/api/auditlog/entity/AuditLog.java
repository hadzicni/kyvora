package dev.kyvora.api.auditlog.entity;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Enumerated(EnumType.STRING)
	@Column(name = "event_type", nullable = false, length = 64)
	private AuditEventType eventType;

	@Column(name = "aggregate_type", nullable = false, length = 64)
	private String aggregateType;

	@Column(name = "aggregate_id", nullable = false)
	private UUID aggregateId;

	@Column(nullable = false, length = 120)
	private String actor;

	@Column(nullable = false, length = 1000)
	private String message;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(columnDefinition = "jsonb")
	private Map<String, Object> metadata = new LinkedHashMap<>();

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected AuditLog() {
	}

	public AuditLog(
			AuditEventType eventType,
			String aggregateType,
			UUID aggregateId,
			String actor,
			String message,
			Map<String, Object> metadata) {
		this.eventType = eventType;
		this.aggregateType = aggregateType;
		this.aggregateId = aggregateId;
		this.actor = actor;
		this.message = message;
		this.metadata = metadata == null ? new LinkedHashMap<>() : new LinkedHashMap<>(metadata);
	}

	@PrePersist
	public void beforeCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
	}

	public UUID getId() {
		return id;
	}

	public AuditEventType getEventType() {
		return eventType;
	}

	public String getAggregateType() {
		return aggregateType;
	}

	public UUID getAggregateId() {
		return aggregateId;
	}

	public String getActor() {
		return actor;
	}

	public String getMessage() {
		return message;
	}

	public Map<String, Object> getMetadata() {
		return new LinkedHashMap<>(metadata);
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
