package dev.kyvora.api.serverinventory.dto;

import java.util.List;

public record ServerInventoryPageResponse(
		List<ServerInventoryResponse> content,
		int page,
		int size,
		long totalElements,
		int totalPages) {
}
