package dev.kyvora.api.serverinventory.controller;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import dev.kyvora.api.serverinventory.dto.ServerInventoryCreateRequest;
import dev.kyvora.api.serverinventory.dto.ServerInventoryResponse;
import dev.kyvora.api.serverinventory.dto.ServerInventoryUpdateRequest;
import dev.kyvora.api.serverinventory.service.ServerInventoryService;
import jakarta.validation.Valid;

@Validated
@RestController
@RequestMapping("/api/v1/servers")
public class ServerInventoryController {

	private final ServerInventoryService service;

	public ServerInventoryController(ServerInventoryService service) {
		this.service = service;
	}

	@GetMapping
	public ResponseEntity<List<ServerInventoryResponse>> findAll() {
		return ResponseEntity.ok(service.findAll());
	}

	@GetMapping("/{id}")
	public ResponseEntity<ServerInventoryResponse> findById(@PathVariable UUID id) {
		return ResponseEntity.ok(service.findById(id));
	}

	@PostMapping
	public ResponseEntity<ServerInventoryResponse> create(@Valid @RequestBody ServerInventoryCreateRequest request) {
		ServerInventoryResponse created = service.create(request);
		return ResponseEntity.created(URI.create("/api/v1/servers/" + created.id())).body(created);
	}

	@PutMapping("/{id}")
	public ResponseEntity<ServerInventoryResponse> update(
			@PathVariable UUID id,
			@Valid @RequestBody ServerInventoryUpdateRequest request) {
		return ResponseEntity.ok(service.update(id, request));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable UUID id) {
		service.delete(id);
		return ResponseEntity.noContent().build();
	}
}
