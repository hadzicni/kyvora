package dev.kyvora.api.auditlog.dto;

import java.util.List;

import org.springframework.data.domain.Page;

public record AuditLogPageResponse(
		List<AuditLogResponse> content,
		int page,
		int size,
		long totalElements,
		int totalPages,
		boolean first,
		boolean last,
		boolean empty) {

	public static AuditLogPageResponse from(Page<AuditLogResponse> page) {
		return new AuditLogPageResponse(
				page.getContent(),
				page.getNumber(),
				page.getSize(),
				page.getTotalElements(),
				page.getTotalPages(),
				page.isFirst(),
				page.isLast(),
				page.isEmpty());
	}
}
