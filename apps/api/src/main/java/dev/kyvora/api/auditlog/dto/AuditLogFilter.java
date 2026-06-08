package dev.kyvora.api.auditlog.dto;

import java.util.UUID;

import dev.kyvora.api.auditlog.entity.AuditEventType;

public record AuditLogFilter(
		String aggregateType,
		UUID aggregateId,
		AuditEventType eventType) {
}
