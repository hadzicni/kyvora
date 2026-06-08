package dev.kyvora.api.agent.exception;

public class DuplicateAgentException extends RuntimeException {

	private final String field;
	private final String value;

	public DuplicateAgentException(String field, String value) {
		super(field + " already exists");
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
