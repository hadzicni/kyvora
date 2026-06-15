package dev.kyvora.api.search.service;

import org.springframework.security.core.Authentication;

import dev.kyvora.api.search.dto.SearchResponse;

public interface SearchService {

	SearchResponse search(String query, int limit, Authentication authentication);
}
