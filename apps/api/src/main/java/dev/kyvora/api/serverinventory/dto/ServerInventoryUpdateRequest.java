package dev.kyvora.api.serverinventory.dto;

import java.util.List;

import dev.kyvora.api.serverinventory.entity.ServerStatus;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Schema(description = "Payload for replacing a server inventory entry.")
public record ServerInventoryUpdateRequest(
		@Schema(description = "Human-readable server name.", example = "Web 01", minLength = 2, maxLength = 120)
		@NotBlank
		@Size(min = 2, max = 120)
		@Pattern(regexp = NAME_PATTERN)
		String name,

		@Schema(description = "DNS hostname. Must be a valid hostname up to 253 characters.", example = "web01.example.com", maxLength = 253)
		@NotBlank
		@Size(min = 1, max = 253)
		@Pattern(regexp = HOSTNAME_PATTERN)
		String hostname,

		@Schema(description = "IPv4 address assigned to the server.", example = "10.0.0.10")
		@NotBlank
		@Pattern(regexp = IPV4_PATTERN)
		String ipAddress,

		@Schema(description = "Optional operational notes for the server.", example = "Primary web server", maxLength = 2000)
		@Size(max = 2000)
		String description,

		@ArraySchema(
				schema = @Schema(description = "Inventory tag. Must not be blank.", example = "prod", maxLength = 50),
				arraySchema = @Schema(description = "Tags used for filtering and grouping. Maximum 20 tags."))
		@NotNull
		@Size(max = 20)
		List<@NotBlank @Size(max = 50) String> tags,

		@Schema(description = "Operating system name or family.", example = "Ubuntu 24.04", maxLength = 120)
		@Size(max = 120)
		String operatingSystem,

		@Schema(description = "Current server status.", example = "ONLINE")
		@NotNull
		ServerStatus status) {

	private static final String NAME_PATTERN = "^.{2,120}$";
	private static final String HOSTNAME_PATTERN =
			"^(?=.{1,253}$)(?:(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)\\.)*(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)$";
	private static final String IPV4_PATTERN =
			"^(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}$";
}
