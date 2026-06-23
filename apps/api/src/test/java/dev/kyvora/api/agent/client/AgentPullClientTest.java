package dev.kyvora.api.agent.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.json.JsonMapper;
import com.sun.net.httpserver.HttpServer;

class AgentPullClientTest {

	private HttpServer server;

	@AfterEach
	void stopServer() {
		if (server != null) {
			server.stop(0);
		}
	}

	@Test
	void testConnectionReturnsVersionAndCapabilities() throws Exception {
		startServer((exchange) -> {
			if (!"correct-secret".equals(exchange.getRequestHeaders().getFirst(AgentPullClient.SHARED_SECRET_HEADER))) {
				exchange.sendResponseHeaders(401, -1);
				return;
			}
			String body = exchange.getRequestURI().getPath().equals("/health")
					? "{\"status\":\"UP\",\"service\":\"kyvora-agent\",\"version\":\"1.2.3\",\"hostname\":\"node\",\"generatedAt\":\"2026-06-23T12:00:00Z\"}"
					: "{\"version\":\"1.2.3\",\"supports\":[\"system\"],\"generatedAt\":\"2026-06-23T12:00:00Z\"}";
			byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
			exchange.getResponseHeaders().add("Content-Type", "application/json");
			exchange.sendResponseHeaders(200, bytes.length);
			exchange.getResponseBody().write(bytes);
			exchange.close();
		});

		AgentPullClient.AgentConnectionSnapshot result = client().test(baseUrl(), "correct-secret");

		assertThat(result.health().version()).isEqualTo("1.2.3");
		assertThat(result.capabilities().supports()).containsExactly("system");
	}

	@Test
	void testConnectionClassifiesUnauthorizedResponse() throws Exception {
		startServer((exchange) -> {
			exchange.sendResponseHeaders(401, -1);
			exchange.close();
		});

		assertThatThrownBy(() -> client().test(baseUrl(), "incorrect-secret"))
				.isInstanceOfSatisfying(AgentPullException.class,
						exception -> assertThat(exception.getErrorCode()).isEqualTo("UNAUTHORIZED"));
	}

	private AgentPullClient client() {
		return new AgentPullClient(JsonMapper.builder().findAndAddModules().build(), 1);
	}

	private String baseUrl() {
		return "http://127.0.0.1:" + server.getAddress().getPort();
	}

	private void startServer(com.sun.net.httpserver.HttpHandler handler) throws IOException {
		server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
		server.createContext("/", handler);
		server.start();
	}
}
