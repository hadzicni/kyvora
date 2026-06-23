package dev.kyvora.api.agent.exception;

import java.util.List;

public class AgentConfigurationException extends RuntimeException {
	private final List<String> details;

	public AgentConfigurationException(List<String> details) {
		super("Agent connection configuration is invalid");
		this.details = List.copyOf(details);
	}

	public List<String> getDetails() {
		return details;
	}
}
