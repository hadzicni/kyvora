package dev.kyvora.api.managedservice.controller;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import dev.kyvora.api.config.openapi.OpenApiConfig;
import dev.kyvora.api.managedservice.dto.ManagedServiceCreateRequest;
import dev.kyvora.api.managedservice.dto.ManagedServiceFilter;
import dev.kyvora.api.managedservice.dto.ManagedServicePageResponse;
import dev.kyvora.api.managedservice.dto.ManagedServiceResponse;
import dev.kyvora.api.managedservice.dto.ManagedServiceUpdateRequest;
import dev.kyvora.api.managedservice.entity.ManagedServiceCategory;
import dev.kyvora.api.managedservice.entity.ManagedServiceProtocol;
import dev.kyvora.api.managedservice.entity.ManagedServiceStatus;
import dev.kyvora.api.managedservice.service.ManagedServiceService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@Validated
@RestController
@RequestMapping("/api/v1/services")
@Tag(name = "Managed Services", description = "Manage manually registered service entries.")
@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH_SCHEME)
public class ManagedServiceController {

	private final ManagedServiceService service;

	public ManagedServiceController(ManagedServiceService service) {
		this.service = service;
	}

	@GetMapping
	@PreAuthorize("@permissions.canViewOperationalData(authentication)")
	@Operation(summary = "List service entries")
	public ResponseEntity<ManagedServicePageResponse> findAll(
			@Parameter(description = "Case-insensitive search across service fields.")
			@RequestParam(required = false, name = "q") String q,
			@RequestParam(required = false) String name,
			@RequestParam(required = false) String hostname,
			@RequestParam(required = false) String ipAddress,
			@RequestParam(required = false) ManagedServiceProtocol protocol,
			@RequestParam(required = false) ManagedServiceCategory category,
			@RequestParam(required = false) ManagedServiceStatus status,
			@RequestParam(required = false, name = "tags") List<String> tags,
			@RequestParam(required = false) UUID linkedServerId,
			@PageableDefault(size = 20, sort = "name") Pageable pageable) {
		ManagedServiceFilter filter = new ManagedServiceFilter(
				q,
				name,
				hostname,
				ipAddress,
				protocol,
				category,
				status,
				tags,
				linkedServerId);
		return ResponseEntity.ok(ManagedServicePageResponse.from(service.findAll(filter, pageable)));
	}

	@GetMapping("/{id}")
	@PreAuthorize("@permissions.canViewOperationalData(authentication)")
	@Operation(summary = "Get a service entry")
	public ResponseEntity<ManagedServiceResponse> findById(@PathVariable UUID id) {
		return ResponseEntity.ok(service.findById(id));
	}

	@PostMapping
	@PreAuthorize("@permissions.canManageServices(authentication)")
	@Operation(summary = "Create a service entry")
	public ResponseEntity<ManagedServiceResponse> create(@Valid @RequestBody ManagedServiceCreateRequest request) {
		ManagedServiceResponse created = service.create(request);
		return ResponseEntity.created(URI.create("/api/v1/services/" + created.id())).body(created);
	}

	@PutMapping("/{id}")
	@PreAuthorize("@permissions.canManageServices(authentication)")
	@Operation(summary = "Update a service entry")
	public ResponseEntity<ManagedServiceResponse> update(
			@PathVariable UUID id,
			@Valid @RequestBody ManagedServiceUpdateRequest request) {
		return ResponseEntity.ok(service.update(id, request));
	}

	@DeleteMapping("/{id}")
	@PreAuthorize("@permissions.canManageServices(authentication)")
	@Operation(summary = "Delete a service entry")
	public ResponseEntity<Void> delete(@PathVariable UUID id) {
		service.delete(id);
		return ResponseEntity.noContent().build();
	}
}
