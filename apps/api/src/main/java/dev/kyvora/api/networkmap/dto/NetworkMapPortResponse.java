package dev.kyvora.api.networkmap.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Open port metadata for a topology node.")
public record NetworkMapPortResponse(
		@Schema(description = "Port number.", example = "443")
		int port,
		@Schema(description = "Transport protocol.", example = "tcp")
		String protocol,
		@Schema(description = "Optional detected service name.", example = "https")
		String service) {
}
