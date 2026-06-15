package dev.kyvora.api.auth.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUserProvider {

	private static final String SYSTEM_ACTOR = "system";

	public AuthenticatedUser currentPrincipal() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser principal)) {
			return null;
		}
		return principal;
	}

	public String currentActor() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
			return SYSTEM_ACTOR;
		}
		if (authentication.getPrincipal() instanceof AuthenticatedUser user) {
			return user.email();
		}
		return authentication.getName();
	}
}
