package dev.kyvora.api.serverinventory.mapper;

import java.util.List;

import org.springframework.stereotype.Component;

import dev.kyvora.api.serverinventory.dto.ServerInventoryCreateRequest;
import dev.kyvora.api.serverinventory.dto.ServerInventoryResponse;
import dev.kyvora.api.serverinventory.dto.ServerInventoryUpdateRequest;
import dev.kyvora.api.serverinventory.entity.ServerInventory;

@Component
public class ServerInventoryMapper {

	public ServerInventory toEntity(ServerInventoryCreateRequest request) {
		return new ServerInventory(request.name(), request.hostname(), request.ipAddress(), request.status());
	}

	public void updateEntity(ServerInventory entity, ServerInventoryUpdateRequest request) {
		entity.setName(request.name());
		entity.setHostname(request.hostname());
		entity.setIpAddress(request.ipAddress());
		entity.setStatus(request.status());
	}

	public ServerInventoryResponse toResponse(ServerInventory entity) {
		return new ServerInventoryResponse(
				entity.getId().toString(),
				entity.getName(),
				entity.getHostname(),
				entity.getIpAddress(),
				entity.getStatus());
	}

	public List<ServerInventoryResponse> toResponses(List<ServerInventory> entities) {
		return entities.stream().map(this::toResponse).toList();
	}
}
