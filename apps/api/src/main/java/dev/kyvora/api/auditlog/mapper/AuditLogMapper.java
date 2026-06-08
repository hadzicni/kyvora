package dev.kyvora.api.auditlog.mapper;

import org.springframework.stereotype.Component;

import dev.kyvora.api.auditlog.dto.AuditLogResponse;
import dev.kyvora.api.auditlog.entity.AuditLog;

@Component
public class AuditLogMapper {

	public AuditLogResponse toResponse(AuditLog auditLog) {
		return new AuditLogResponse(
				auditLog.getId(),
				auditLog.getEventType(),
				auditLog.getAggregateType(),
				auditLog.getAggregateId(),
				auditLog.getActor(),
				auditLog.getMessage(),
				auditLog.getMetadata(),
				auditLog.getCreatedAt());
	}
}
