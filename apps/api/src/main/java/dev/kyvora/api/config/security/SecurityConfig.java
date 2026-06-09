package dev.kyvora.api.config.security;

import java.util.List;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import dev.kyvora.api.auth.security.JwtAuthenticationFilter;
import dev.kyvora.api.serverinventory.exception.ApiErrorResponse;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

	@Bean
	SecurityFilterChain securityFilterChain(
			HttpSecurity http,
			JwtAuthenticationFilter jwtAuthenticationFilter,
			AuthenticationEntryPoint authenticationEntryPoint) throws Exception {
		return http
				.cors(Customizer.withDefaults())
				.csrf(AbstractHttpConfigurer::disable)
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.exceptionHandling(exceptions -> exceptions.authenticationEntryPoint(authenticationEntryPoint))
				.authorizeHttpRequests(auth -> auth
						.requestMatchers("/actuator/health").permitAll()
						.requestMatchers("/actuator/info").permitAll()
						.requestMatchers("/swagger-ui.html", "/swagger-ui/**").permitAll()
						.requestMatchers("/v3/api-docs", "/v3/api-docs/**").permitAll()
						.requestMatchers("/api/v1/status").permitAll()
						.requestMatchers("/api/v1/auth/login", "/api/v1/auth/refresh").permitAll()
						.requestMatchers(HttpMethod.POST, "/api/v1/agents/*/heartbeat").permitAll()
						.requestMatchers("/api/v1/**").authenticated()
						.anyRequest().permitAll())
				.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
				.build();
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	AuthenticationEntryPoint authenticationEntryPoint(ObjectMapper objectMapper) {
		return (request, response, exception) -> {
			response.setStatus(HttpStatus.UNAUTHORIZED.value());
			response.setContentType(MediaType.APPLICATION_JSON_VALUE);
			objectMapper.writeValue(response.getOutputStream(), new ApiErrorResponse(
					java.time.Instant.now(),
					HttpStatus.UNAUTHORIZED.value(),
					HttpStatus.UNAUTHORIZED.getReasonPhrase(),
					"Authentication is required",
					request.getRequestURI(),
					List.of()));
		};
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOrigins(List.of("http://localhost:3000"));
		configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Kyvora-Agent-Token"));
		configuration.setAllowCredentials(true);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}
}
