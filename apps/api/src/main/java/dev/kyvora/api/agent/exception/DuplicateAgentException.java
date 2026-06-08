package dev.kyvora.api.agent.exception;

public class DuplicateAgentException extends RuntimeException {

	private final String field;
	private final String value;

	public DuplicateAgentException(String field, String value) {
		this(field, value, field + " already exists");
	}

	public DuplicateAgentException(String field, String value, String message) {
		super(message);
		this.field = field;
		this.value = value;
	}

	public String getField() {
		return field;
	}

	public String getValue() {
		return value;
	}
}
