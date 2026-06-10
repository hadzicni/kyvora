package dev.kyvora.api.networkmap.dto;

import java.time.Instant;
import java.util.List;

import dev.kyvora.api.serverinventory.entity.ServerStatus;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Node represented in the network map.")
public record NetworkMapNodeResponse(
		@Schema(description = "Stable node identifier.", example = "server-00000000-0000-0000-0000-000000000001")
		String id,
		@Schema(description = "Node type.", example = "SERVER")
		NetworkMapNodeType type,
		@Schema(description = "Node source.", example = "INVENTORY")
		NetworkMapNodeSource source,
		@Schema(description = "Subnet identifier this node belongs to.", example = "subnet-10-0-0-0-24")
		String subnetId,
		@Schema(description = "Linked server inventory identifier when this is a server node.")
		String serverId,
		@Schema(description = "Display label.", example = "Web 01")
		String name,
		@Schema(description = "DNS hostname.", example = "web01.example.com")
		String hostname,
		@Schema(description = "Primary IP address.", example = "10.0.0.10")
		String ipAddress,
		@Schema(description = "DNS name discovered or inferred for this node.", example = "web01.example.com")
		String dnsName,
		@Schema(description = "Current operational status.", example = "ONLINE")
		ServerStatus status,
		@Schema(description = "Operating system from inventory or host facts.")
		String operatingSystem,
		@Schema(description = "Additional IP addresses reported by host facts.")
		List<String> ipAddresses,
		@Schema(description = "Tags from inventory.")
		List<String> tags,
		@Schema(description = "Open ports. Empty until Kyvora has discovery metadata.")
		List<NetworkMapPortResponse> openPorts,
		@Schema(description = "Services. Empty until Kyvora has discovery metadata.")
		List<NetworkMapServiceResponse> services,
		@Schema(description = "Last time Kyvora observed this node.")
		Instant lastSeenAt) {
}
