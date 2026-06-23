package dev.kyvora.api.agent.client;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpTimeoutException;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

import javax.net.ssl.SSLException;

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
				.followRedirects(HttpClient.Redirect.NEVER)
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

	public AgentConnectionSnapshot test(String baseUrl, String sharedSecret) {
		HealthResponse health = get(baseUrl, sharedSecret, "/health", HealthResponse.class, "connection test");
		if (!"kyvora-agent".equals(health.service()) || health.status() == null) {
			throw new AgentPullException("INVALID_RESPONSE", "The endpoint did not return a valid Kyvora Agent health response");
		}
		CapabilitiesResponse capabilities = get(baseUrl, sharedSecret, "/capabilities", CapabilitiesResponse.class, "connection test");
		return new AgentConnectionSnapshot(health, capabilities);
	}

	private <T> T get(Agent agent, String path, Class<T> responseType) {
		return get(agent.getBaseUrl(), agent.getSharedSecret(), path, responseType, "agent " + agent.getId());
	}

	private <T> T get(String baseUrl, String sharedSecret, String path, Class<T> responseType, String target) {
		try {
			HttpRequest request = HttpRequest.newBuilder(resolve(baseUrl, path))
					.timeout(requestTimeout)
					.GET()
					.header("Accept", "application/json")
					.header(SHARED_SECRET_HEADER, sharedSecret)
					.build();
			HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
			if (response.statusCode() == 401 || response.statusCode() == 403) {
				log.warn("Agent credentials rejected while requesting {}", path);
				throw new AgentPullException("UNAUTHORIZED", "The agent rejected the shared secret");
			}
			if (response.statusCode() < 200 || response.statusCode() >= 300) {
				log.warn("Agent returned HTTP {} while requesting {}", response.statusCode(), path);
				throw new AgentPullException("INVALID_RESPONSE", "The endpoint returned HTTP " + response.statusCode());
			}
			return objectMapper.readValue(response.body(), responseType);
		}
		catch (InterruptedException exception) {
			Thread.currentThread().interrupt();
			log.warn("Agent request interrupted while requesting {}", path);
			throw new AgentPullException("UNKNOWN_ERROR", "The connection test was interrupted", exception);
		}
		catch (HttpTimeoutException exception) {
			throw new AgentPullException("TIMEOUT", "Timed out waiting for the agent", exception);
		}
		catch (SSLException exception) {
			throw new AgentPullException("TLS_ERROR", "TLS negotiation with the agent failed", exception);
		}
		catch (com.fasterxml.jackson.core.JsonProcessingException exception) {
			throw new AgentPullException("INVALID_RESPONSE", "The endpoint returned invalid JSON", exception);
		}
		catch (IOException | IllegalArgumentException exception) {
			log.warn("Unable to reach {} while requesting {}: {}", target, path, exception.getClass().getSimpleName());
			throw new AgentPullException("UNREACHABLE", "The Kyvora API could not reach the agent", exception);
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

	public record AgentConnectionSnapshot(HealthResponse health, CapabilitiesResponse capabilities) {
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
