package dev.kyvora.api.search.dto;

import java.time.Instant;
import java.util.Map;

public record SearchResultResponse(
		String id,
		String type,
		String title,
		String subtitle,
		String description,
		String url,
		Map<String, Object> metadata,
		Instant updatedAt) {
}
