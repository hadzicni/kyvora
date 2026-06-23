package dev.kyvora.api.agent.service;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Component;

import dev.kyvora.api.agent.exception.AgentConfigurationException;

@Component
public class AgentConnectionValidator {

	public String validateAndNormalize(String value) {
		List<String> errors = new ArrayList<>();
		URI uri = null;
		try {
			uri = URI.create(value == null ? "" : value.trim());
		}
		catch (IllegalArgumentException exception) {
			errors.add("baseUrl: enter a valid URL");
		}
		if (uri != null) {
			String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
			if (!scheme.equals("http") && !scheme.equals("https")) {
				errors.add("baseUrl: scheme must be http or https");
			}
			if (uri.getHost() == null || uri.getHost().isBlank()) {
				errors.add("baseUrl: host is required");
			}
			if (uri.getUserInfo() != null || uri.getQuery() != null || uri.getFragment() != null) {
				errors.add("baseUrl: credentials, query strings, and fragments are not allowed");
			}
			int port = uri.getPort();
			if (port < 1 || port > 65535) {
				errors.add("baseUrl: an explicit port between 1 and 65535 is required");
			}
			String path = uri.getPath();
			if (path != null && (path.contains("..") || path.contains("//"))) {
				errors.add("baseUrl: base path is malformed");
			}
		}
		if (!errors.isEmpty()) {
			throw new AgentConfigurationException(errors);
		}
		String normalizedPath = uri.getPath() == null ? "" : uri.getPath().replaceAll("/+$", "");
		return uri.getScheme().toLowerCase(Locale.ROOT) + "://" + uri.getRawAuthority() + normalizedPath;
	}
}
