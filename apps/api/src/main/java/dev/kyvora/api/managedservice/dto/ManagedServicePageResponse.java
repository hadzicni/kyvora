package dev.kyvora.api.managedservice.dto;

import java.util.List;

import org.springframework.data.domain.Page;

public record ManagedServicePageResponse(
		List<ManagedServiceResponse> content,
		int page,
		int size,
		long totalElements,
		int totalPages,
		boolean first,
		boolean last,
		boolean empty) {

	public static ManagedServicePageResponse from(Page<ManagedServiceResponse> page) {
		return new ManagedServicePageResponse(
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
