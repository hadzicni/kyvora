package dev.kyvora.api.notification.dto;

import java.util.List;

import org.springframework.data.domain.Page;

public record NotificationPageResponse(
		List<NotificationResponse> content,
		int page,
		int size,
		long totalElements,
		int totalPages,
		boolean first,
		boolean last,
		boolean empty) {

	public static NotificationPageResponse from(Page<NotificationResponse> page) {
		return new NotificationPageResponse(
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
