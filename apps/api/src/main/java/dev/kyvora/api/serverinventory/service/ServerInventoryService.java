package dev.kyvora.api.serverinventory.service;

import java.util.List;
import java.util.UUID;

import dev.kyvora.api.serverinventory.dto.ServerInventoryCreateRequest;
import dev.kyvora.api.serverinventory.dto.ServerInventoryResponse;
import dev.kyvora.api.serverinventory.dto.ServerInventoryUpdateRequest;

public interface ServerInventoryService {

	List<ServerInventoryResponse> findAll();

	ServerInventoryResponse findById(UUID id);

	ServerInventoryResponse create(ServerInventoryCreateRequest request);

	ServerInventoryResponse update(UUID id, ServerInventoryUpdateRequest request);

	void delete(UUID id);
}
