package dev.kyvora.api.serverinventory.service;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import dev.kyvora.api.serverinventory.dto.ServerInventoryCreateRequest;
import dev.kyvora.api.serverinventory.dto.ServerInventoryFilter;
import dev.kyvora.api.serverinventory.dto.ServerInventoryResponse;
import dev.kyvora.api.serverinventory.dto.ServerInventoryUpdateRequest;

public interface ServerInventoryService {

	Page<ServerInventoryResponse> findAll(ServerInventoryFilter filter, Pageable pageable);

	ServerInventoryResponse findById(UUID id);

	ServerInventoryResponse create(ServerInventoryCreateRequest request);

	ServerInventoryResponse update(UUID id, ServerInventoryUpdateRequest request);

	void delete(UUID id);
}
