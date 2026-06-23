package dev.kyvora.api.agent.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Unsaved agent connection details to test from the Kyvora API.")
public record AgentConnectionTestRequest(
		@NotBlank @Size(max = 512) String baseUrl,
		@NotBlank @Size(min = 12, max = 512) String sharedSecret) {
}
