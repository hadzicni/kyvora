package dev.kyvora.api.settings.dto;

import java.util.Map;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record UpdateSettingsRequest(
		@NotEmpty(message = "settings must include at least one setting")
		Map<@NotNull String, Object> settings) {
}
