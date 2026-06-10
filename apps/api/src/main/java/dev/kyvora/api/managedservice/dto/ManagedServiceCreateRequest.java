package dev.kyvora.api.managedservice.dto;

import java.util.List;
import java.util.UUID;

import dev.kyvora.api.managedservice.entity.ManagedServiceCategory;
import dev.kyvora.api.managedservice.entity.ManagedServiceProtocol;
import dev.kyvora.api.managedservice.entity.ManagedServiceStatus;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Schema(description = "Payload for creating a service entry.")
public record ManagedServiceCreateRequest(
		@Schema(description = "Human-readable service name.", example = "Grafana", minLength = 2, maxLength = 120)
		@NotBlank
		@Size(min = 2, max = 120)
		String name,

		@Schema(description = "Optional service description.", example = "Metrics dashboard", maxLength = 2000)
		@Size(max = 2000)
		String description,

		@Schema(description = "Optional URL for opening the service.", example = "https://grafana.lab.example.com", maxLength = 2048)
		@Size(max = 2048)
		String url,

		@Schema(description = "Optional DNS hostname.", example = "grafana.lab.example.com", maxLength = 253)
		@Size(max = 253)
		@Pattern(regexp = HOSTNAME_PATTERN)
		String hostname,

		@Schema(description = "Optional IPv4 address.", example = "10.0.0.20")
		@Pattern(regexp = IPV4_PATTERN)
		String ipAddress,

		@Schema(description = "Optional service port.", example = "3000", minimum = "1", maximum = "65535")
		@Min(1)
		@Max(65535)
		Integer port,

		@Schema(description = "Service protocol.", example = "HTTPS")
		@NotNull
		ManagedServiceProtocol protocol,

		@Schema(description = "Service category.", example = "MONITORING")
		@NotNull
		ManagedServiceCategory category,

		@Schema(description = "Manually tracked service status.", example = "UNKNOWN")
		@NotNull
		ManagedServiceStatus status,

		@ArraySchema(
				schema = @Schema(description = "Service tag. Must not be blank.", example = "internal", maxLength = 50),
				arraySchema = @Schema(description = "Tags used for filtering and grouping. Maximum 20 tags."))
		@NotNull
		@Size(max = 20)
		List<@NotBlank @Size(max = 50) String> tags,

		@Schema(description = "Operational notes for humans.", example = "Backed by docker compose on nas-01.", maxLength = 10000)
		@Size(max = 10000)
		String notes,

		@Schema(description = "Optional linked server inventory identifier.")
		UUID linkedServerId) {

	private static final String HOSTNAME_PATTERN =
			"^$|^(?=.{1,253}$)(?:(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)\\.)*(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)$";
	private static final String IPV4_PATTERN =
			"^$|^(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}$";
}
