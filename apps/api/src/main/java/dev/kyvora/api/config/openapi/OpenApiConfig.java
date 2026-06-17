package dev.kyvora.api.config.openapi;

import dev.kyvora.api.status.service.StatusService;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

	public static final String BEARER_AUTH_SCHEME = "bearerAuth";

	@Bean
	public OpenAPI openAPI(StatusService statusService) {
		return new OpenAPI()
				.info(new Info()
						.title("Kyvora API")
						.description("Open-source Homelab Control Plane API")
						.version(statusService.status().version()))
				.components(new Components()
						.addSecuritySchemes(BEARER_AUTH_SCHEME,
								new SecurityScheme()
										.name(BEARER_AUTH_SCHEME)
										.type(SecurityScheme.Type.HTTP)
										.scheme("bearer")
										.bearerFormat("JWT")))
				.addSecurityItem(new SecurityRequirement()
						.addList(BEARER_AUTH_SCHEME));
	}
}
