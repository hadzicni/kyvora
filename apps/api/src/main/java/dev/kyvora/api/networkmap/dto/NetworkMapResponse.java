package dev.kyvora.api.networkmap.dto;

import java.time.Instant;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Frontend-friendly network topology snapshot.")
public record NetworkMapResponse(
		@Schema(description = "Subnets represented in this topology.")
		List<NetworkMapSubnetResponse> subnets,
		@Schema(description = "Topology nodes.")
		List<NetworkMapNodeResponse> nodes,
		@Schema(description = "Topology edges.")
		List<NetworkMapEdgeResponse> edges,
		@Schema(description = "Snapshot generation time.")
		Instant generatedAt) {
}
