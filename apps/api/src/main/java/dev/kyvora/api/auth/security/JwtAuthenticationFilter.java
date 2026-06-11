package dev.kyvora.api.auth.security;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.fasterxml.jackson.databind.ObjectMapper;

import dev.kyvora.api.auth.service.InvalidTokenException;
import dev.kyvora.api.auth.service.JwtService;
import dev.kyvora.api.auth.service.UserService;
import dev.kyvora.api.serverinventory.exception.ApiErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private final JwtService jwtService;
	private final UserService userService;
	private final ObjectMapper objectMapper;

	public JwtAuthenticationFilter(JwtService jwtService, UserService userService, ObjectMapper objectMapper) {
		this.jwtService = jwtService;
		this.userService = userService;
		this.objectMapper = objectMapper;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {
		String header = request.getHeader("Authorization");
		if (header == null || !header.startsWith("Bearer ")) {
			filterChain.doFilter(request, response);
			return;
		}

		try {
			JwtClaims claims = jwtService.validate(header.substring(7));
			var user = userService.findEnabledById(claims.userId());
			AuthenticatedUser principal = new AuthenticatedUser(
					user.getId(),
					user.getEmail(),
					user.getDisplayName(),
					user.getPermissions(),
					user.isMustChangePassword());
			UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
					principal,
					null,
					user.getPermissions().stream()
							.map(permission -> new SimpleGrantedAuthority(permission.authority()))
							.toList());
			SecurityContextHolder.getContext().setAuthentication(authentication);
			if (user.isMustChangePassword() && !isPasswordChangeAllowed(request)) {
				writePasswordChangeRequired(response, request);
				return;
			}
			filterChain.doFilter(request, response);
		}
		catch (InvalidTokenException exception) {
			SecurityContextHolder.clearContext();
			response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
			response.setContentType(MediaType.APPLICATION_JSON_VALUE);
			objectMapper.writeValue(response.getOutputStream(), new ApiErrorResponse(
					Instant.now(),
					HttpStatus.UNAUTHORIZED.value(),
					HttpStatus.UNAUTHORIZED.getReasonPhrase(),
					"Invalid or expired token",
					request.getRequestURI(),
					List.of()));
		}
	}

	private boolean isPasswordChangeAllowed(HttpServletRequest request) {
		String path = request.getRequestURI();
		String method = request.getMethod();
		return ("GET".equals(method) && "/api/v1/auth/me".equals(path))
				|| ("POST".equals(method) && "/api/v1/me/change-password".equals(path))
				|| ("POST".equals(method) && "/api/v1/auth/logout".equals(path))
				|| ("POST".equals(method) && "/api/v1/auth/refresh".equals(path));
	}

	private void writePasswordChangeRequired(HttpServletResponse response, HttpServletRequest request) throws IOException {
		SecurityContextHolder.clearContext();
		response.setStatus(HttpServletResponse.SC_FORBIDDEN);
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		objectMapper.writeValue(response.getOutputStream(), new ApiErrorResponse(
				Instant.now(),
				HttpStatus.FORBIDDEN.value(),
				HttpStatus.FORBIDDEN.getReasonPhrase(),
				"Password change required before accessing this resource.",
				request.getRequestURI(),
				List.of()));
	}
}
