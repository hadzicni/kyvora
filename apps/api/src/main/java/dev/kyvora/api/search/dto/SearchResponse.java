package dev.kyvora.api.search.dto;

import java.time.Instant;
import java.util.List;

public record SearchResponse(
		String query,
		List<SearchResultResponse> results,
		Instant generatedAt) {
}
