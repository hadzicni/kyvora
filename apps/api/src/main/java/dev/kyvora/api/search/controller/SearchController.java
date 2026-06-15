package dev.kyvora.api.search.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import dev.kyvora.api.config.openapi.OpenApiConfig;
import dev.kyvora.api.search.dto.SearchResponse;
import dev.kyvora.api.search.service.SearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1/search")
@Tag(name = "Search", description = "Search across Kyvora resources visible to the current user.")
@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH_SCHEME)
public class SearchController {

	private final SearchService searchService;

	public SearchController(SearchService searchService) {
		this.searchService = searchService;
	}

	@GetMapping
	@Operation(summary = "Search visible resources")
	public ResponseEntity<SearchResponse> search(
			@RequestParam(name = "q", required = false) String query,
			@RequestParam(defaultValue = "12") int limit,
			Authentication authentication) {
		return ResponseEntity.ok(searchService.search(query, limit, authentication));
	}
}
