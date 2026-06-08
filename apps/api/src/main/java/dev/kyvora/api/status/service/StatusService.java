package dev.kyvora.api.status.service;

import java.time.Instant;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;

import dev.kyvora.api.status.dto.StatusResponse;

@Service
public class StatusService {

	private static final String VERSION_RESOURCE = "kyvora-version.txt";

	private final String version;

	public StatusService() {
		this.version = readVersion();
	}

	public StatusResponse status() {
		return new StatusResponse("kyvora-api", version, Instant.now());
	}

	private String readVersion() {
		try {
			ClassPathResource resource = new ClassPathResource(VERSION_RESOURCE);
			if (!resource.exists()) {
				return "unknown";
			}
			return StreamUtils.copyToString(resource.getInputStream(), java.nio.charset.StandardCharsets.UTF_8).trim();
		}
		catch (java.io.IOException exception) {
			return "unknown";
		}
	}
}
