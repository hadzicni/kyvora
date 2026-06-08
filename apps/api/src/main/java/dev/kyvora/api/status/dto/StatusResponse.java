package dev.kyvora.api.status.dto;

import java.time.Instant;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Kyvora API status and release metadata.")
public record StatusResponse(
		@Schema(description = "Service name.", example = "kyvora-api")
		String service,

		@Schema(description = "Kyvora product version.", example = "0.1.0")
		String version,

		@Schema(description = "Response generation timestamp.", example = "2026-06-08T10:00:00Z")
		Instant generatedAt) {
}
