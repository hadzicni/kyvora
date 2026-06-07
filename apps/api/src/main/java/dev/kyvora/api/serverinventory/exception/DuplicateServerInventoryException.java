package dev.kyvora.api.serverinventory.exception;

public class DuplicateServerInventoryException extends RuntimeException {

	private final String field;
	private final String value;

	public DuplicateServerInventoryException(String field, String value) {
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
