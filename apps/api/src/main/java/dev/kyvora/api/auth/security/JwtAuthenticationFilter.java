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
			AuthenticatedUser principal = new AuthenticatedUser(user.getId(), user.getEmail(), user.getDisplayName(), user.getRole());
			UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
					principal,
					null,
					List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
			SecurityContextHolder.getContext().setAuthentication(authentication);
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
}
