package dev.kyvora.api.serverinventory.exception;

import java.time.Instant;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Standard API error response.")
public record ApiErrorResponse(
		@Schema(description = "Time when the error response was generated.", example = "2026-06-07T00:00:00Z")
		Instant timestamp,
		@Schema(description = "HTTP status code.", example = "400")
		int status,
		@Schema(description = "HTTP status reason phrase.", example = "Bad Request")
		String error,
		@Schema(description = "Human-readable error message.", example = "Validation failed")
		String message,
		@Schema(description = "Request path that produced the error.", example = "/api/v1/servers")
		String path,
		@Schema(description = "Field-level or conflict details.", example = "[\"hostname: must match expected pattern\"]")
		List<String> details) {
}
