package dev.kyvora.api.agent.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AgentConnectionUpdateRequest(
		@NotBlank @Size(max = 512) String baseUrl,
		@Size(min = 12, max = 512) String sharedSecret,
		boolean pullEnabled) {
}
