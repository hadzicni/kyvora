package dev.kyvora.api.serverinventory.dto;

import java.util.List;

import dev.kyvora.api.serverinventory.entity.ServerStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ServerInventoryCreateRequest(
		@NotBlank
		@Size(min = 2, max = 120)
		@Pattern(regexp = NAME_PATTERN)
		String name,

		@NotBlank
		@Size(min = 1, max = 253)
		@Pattern(regexp = HOSTNAME_PATTERN)
		String hostname,

		@NotBlank
		@Pattern(regexp = IPV4_PATTERN)
		String ipAddress,

		@Size(max = 2000)
		String description,

		@jakarta.validation.constraints.NotNull
		@Size(max = 20)
		List<@NotBlank @Size(max = 50) String> tags,

		@Size(max = 120)
		String operatingSystem,

		@NotNull
		ServerStatus status) {

	private static final String NAME_PATTERN = "^.{2,120}$";
	private static final String HOSTNAME_PATTERN =
			"^(?=.{1,253}$)(?:(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)\\.)*(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)$";
	private static final String IPV4_PATTERN =
			"^(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}$";
}
