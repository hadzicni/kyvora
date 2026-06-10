package dev.kyvora.api.networkmap.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Subnet group represented in the network map.")
public record NetworkMapSubnetResponse(
		@Schema(description = "Stable subnet identifier.", example = "subnet-10-0-0-0-24")
		String id,
		@Schema(description = "Subnet CIDR or fallback grouping label.", example = "10.0.0.0/24")
		String cidr,
		@Schema(description = "Human-readable subnet label.", example = "10.0.0.0/24")
		String label,
		@Schema(description = "Number of server nodes in this subnet.", example = "3")
		int nodeCount) {
}
