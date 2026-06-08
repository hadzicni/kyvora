package dev.kyvora.api.agent.exception;

import java.util.UUID;

public class AgentNotFoundException extends RuntimeException {

	public AgentNotFoundException(UUID id) {
		super("Agent not found: " + id);
	}
}
