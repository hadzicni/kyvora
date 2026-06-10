package dev.kyvora.api.networkmap.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Relationship between two topology nodes.")
public record NetworkMapEdgeResponse(
		@Schema(description = "Stable edge identifier.", example = "edge-gateway-10-0-0-0-24-server-...")
		String id,
		@Schema(description = "Source node identifier.")
		String source,
		@Schema(description = "Target node identifier.")
		String target,
		@Schema(description = "Relationship label.", example = "subnet")
		String label) {
}
