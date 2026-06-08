package dev.kyvora.api.agent.exception;

public class AgentEnrollmentCancellationException extends RuntimeException {

	public AgentEnrollmentCancellationException() {
		super("Connected agents cannot be deleted through enrollment cancellation.");
	}
}
