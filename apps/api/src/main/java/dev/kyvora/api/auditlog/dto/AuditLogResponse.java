package dev.kyvora.api.auditlog.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import dev.kyvora.api.auditlog.entity.AuditEventType;

public record AuditLogResponse(
		UUID id,
		AuditEventType eventType,
		String aggregateType,
		UUID aggregateId,
		String actor,
		String message,
		Map<String, Object> metadata,
		Instant createdAt) {
}
