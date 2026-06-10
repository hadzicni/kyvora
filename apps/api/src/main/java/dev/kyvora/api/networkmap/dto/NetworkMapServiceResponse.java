package dev.kyvora.api.networkmap.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Service metadata for a topology node.")
public record NetworkMapServiceResponse(
		@Schema(description = "Service display name.", example = "PostgreSQL")
		String name,
		@Schema(description = "Service protocol or type.", example = "tcp")
		String protocol,
		@Schema(description = "Service port when known.", example = "5432")
		Integer port) {
}
