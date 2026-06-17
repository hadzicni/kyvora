package dev.kyvora.api.agent.client;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

import dev.kyvora.api.agent.dto.AgentHostFactsRequest;
import dev.kyvora.api.agent.entity.Agent;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class AgentPullClient {

	public static final String SHARED_SECRET_HEADER = "X-Kyvora-Agent-Secret";

	private final HttpClient httpClient;
	private final ObjectMapper objectMapper;
	private final Duration requestTimeout;

	public AgentPullClient(
			ObjectMapper objectMapper,
			@Value("${kyvora.agent.pull-timeout-seconds:5}") long timeoutSeconds) {
		this.objectMapper = objectMapper;
		this.requestTimeout = Duration.ofSeconds(timeoutSeconds);
		this.httpClient = HttpClient.newBuilder()
				.connectTimeout(requestTimeout)
				.build();
	}

	public AgentPullSnapshot pull(Agent agent) {
		log.debug("Starting pull for agent {}", agent.getId());
		HealthResponse health = get(agent, "/health", HealthResponse.class);
		CapabilitiesResponse capabilities = get(agent, "/capabilities", CapabilitiesResponse.class);
		AgentHostFactsRequest system = get(agent, "/system", AgentHostFactsRequest.class);
		log.debug("Completed HTTP pull for agent {}", agent.getId());
		return new AgentPullSnapshot(health, capabilities, system);
	}

	private <T> T get(Agent agent, String path, Class<T> responseType) {
		try {
			HttpRequest request = HttpRequest.newBuilder(resolve(agent.getBaseUrl(), path))
					.timeout(requestTimeout)
					.GET()
					.header("Accept", "application/json")
					.header(SHARED_SECRET_HEADER, agent.getSharedSecret())
					.build();
			HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
			if (response.statusCode() == 401 || response.statusCode() == 403) {
				log.warn("Agent {} rejected Kyvora credentials while requesting {}", agent.getId(), path);
				throw new AgentPullException("Agent rejected Kyvora credentials");
			}
			if (response.statusCode() < 200 || response.statusCode() >= 300) {
				log.warn("Agent {} returned HTTP {} while requesting {}", agent.getId(), response.statusCode(), path);
				throw new AgentPullException("Agent returned HTTP " + response.statusCode());
			}
			return objectMapper.readValue(response.body(), responseType);
		}
		catch (InterruptedException exception) {
			Thread.currentThread().interrupt();
			log.warn("Agent pull interrupted for {} while requesting {}", agent.getId(), path);
			throw new AgentPullException("Agent pull was interrupted", exception);
		}
		catch (IOException | IllegalArgumentException exception) {
			log.warn("Unable to reach agent {} while requesting {}: {}", agent.getId(), path, exception.getClass().getSimpleName());
			throw new AgentPullException("Unable to reach agent: " + exception.getMessage(), exception);
		}
	}

	private URI resolve(String baseUrl, String path) {
		return URI.create(baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) + path : baseUrl + path);
	}

	public record AgentPullSnapshot(
			HealthResponse health,
			CapabilitiesResponse capabilities,
			AgentHostFactsRequest system) {
	}

	public record HealthResponse(
			String status,
			String service,
			String version,
			String hostname,
			Instant generatedAt) {
	}

	public record CapabilitiesResponse(
			String version,
			List<String> supports,
			Instant generatedAt) {
	}
}
