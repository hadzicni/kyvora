package dev.kyvora.api.agent.client;

public class AgentPullException extends RuntimeException {

	public AgentPullException(String message) {
		super(message);
	}

	public AgentPullException(String message, Throwable cause) {
		super(message, cause);
	}
}
