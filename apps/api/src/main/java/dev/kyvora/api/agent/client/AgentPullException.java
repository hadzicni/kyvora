package dev.kyvora.api.agent.client;

public class AgentPullException extends RuntimeException {
	private final String errorCode;

	public AgentPullException(String message) {
		this("UNKNOWN_ERROR", message, null);
	}

	public AgentPullException(String message, Throwable cause) {
		this("UNKNOWN_ERROR", message, cause);
	}

	public AgentPullException(String errorCode, String message) {
		this(errorCode, message, null);
	}

	public AgentPullException(String errorCode, String message, Throwable cause) {
		super(message, cause);
		this.errorCode = errorCode;
	}

	public String getErrorCode() {
		return errorCode;
	}
}
