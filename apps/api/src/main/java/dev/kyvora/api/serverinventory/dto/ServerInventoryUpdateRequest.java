package dev.kyvora.api.serverinventory.dto;

import dev.kyvora.api.serverinventory.entity.ServerStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ServerInventoryUpdateRequest(
		@NotBlank
		@Size(min = 2, max = 120)
		String name,

		@NotBlank
		@Size(min = 1, max = 253)
		String hostname,

		@NotBlank
		@Pattern(regexp = IPV4_PATTERN)
		String ipAddress,

		@NotNull
		ServerStatus status) {

	private static final String IPV4_PATTERN =
			"^(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}$";
}
