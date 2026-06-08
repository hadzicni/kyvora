package dev.kyvora.api.config.openapi;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(info = @Info(
		title = "Kyvora API",
		description = "Open-source Homelab Control Plane API",
		version = "0.1.0"))
@SecurityScheme(
		name = OpenApiConfig.BEARER_AUTH_SCHEME,
		type = SecuritySchemeType.HTTP,
		scheme = "bearer",
		bearerFormat = "JWT")
public class OpenApiConfig {

	public static final String BEARER_AUTH_SCHEME = "bearerAuth";
}
