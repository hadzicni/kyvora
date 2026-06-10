package dev.kyvora.api.managedservice.exception;

import java.util.UUID;

public class ManagedServiceNotFoundException extends RuntimeException {

	public ManagedServiceNotFoundException(UUID id) {
		super("Homelab service not found: " + id);
	}
}
