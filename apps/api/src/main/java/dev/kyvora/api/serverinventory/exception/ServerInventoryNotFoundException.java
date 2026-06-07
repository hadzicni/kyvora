package dev.kyvora.api.serverinventory.exception;

import java.util.UUID;

public class ServerInventoryNotFoundException extends RuntimeException {

	public ServerInventoryNotFoundException(UUID id) {
		super("Server inventory item not found: " + id);
	}
}
