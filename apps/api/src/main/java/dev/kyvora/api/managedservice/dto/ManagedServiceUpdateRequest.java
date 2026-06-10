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

@Schema(description = "Payload for replacing a service entry.")
public record ManagedServiceUpdateRequest(
		@NotBlank
		@Size(min = 2, max = 120)
		String name,

		@Size(max = 2000)
		String description,

		@Size(max = 2048)
		String url,

		@Size(max = 253)
		@Pattern(regexp = HOSTNAME_PATTERN)
		String hostname,

		@Pattern(regexp = IPV4_PATTERN)
		String ipAddress,

		@Min(1)
		@Max(65535)
		Integer port,

		@NotNull
		ManagedServiceProtocol protocol,

		@NotNull
		ManagedServiceCategory category,

		@NotNull
		ManagedServiceStatus status,

		@ArraySchema(schema = @Schema(maxLength = 50), arraySchema = @Schema(description = "Maximum 20 tags."))
		@NotNull
		@Size(max = 20)
		List<@NotBlank @Size(max = 50) String> tags,

		@Size(max = 10000)
		String notes,

		UUID linkedServerId) {

	private static final String HOSTNAME_PATTERN =
			"^$|^(?=.{1,253}$)(?:(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)\\.)*(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)$";
	private static final String IPV4_PATTERN =
			"^$|^(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}$";
}
