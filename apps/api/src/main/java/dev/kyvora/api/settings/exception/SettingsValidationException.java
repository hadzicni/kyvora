package dev.kyvora.api.settings.exception;

import java.util.List;

public class SettingsValidationException extends RuntimeException {

	private final List<String> details;

	public SettingsValidationException(String message, List<String> details) {
		super(message);
		this.details = List.copyOf(details);
	}

	public List<String> getDetails() {
		return details;
	}
}
