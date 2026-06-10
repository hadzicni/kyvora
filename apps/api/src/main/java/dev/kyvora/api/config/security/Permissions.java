package dev.kyvora.api.config.security;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("permissions")
public class Permissions {

	public boolean canViewOperationalData(Authentication authentication) {
		return hasAnyRole(authentication, "ADMIN", "OPERATOR", "VIEWER");
	}

	public boolean canManageUsers(Authentication authentication) {
		return hasRole(authentication, "ADMIN");
	}

	public boolean canManageSettings(Authentication authentication) {
		return hasRole(authentication, "ADMIN");
	}

	public boolean canManageServers(Authentication authentication) {
		return hasAnyRole(authentication, "ADMIN", "OPERATOR");
	}

	public boolean canManageServices(Authentication authentication) {
		return hasAnyRole(authentication, "ADMIN", "OPERATOR");
	}

	public boolean canDeleteServers(Authentication authentication) {
		return hasRole(authentication, "ADMIN");
	}

	public boolean canManageAgents(Authentication authentication) {
		return hasAnyRole(authentication, "ADMIN", "OPERATOR");
	}

	private boolean hasAnyRole(Authentication authentication, String... roles) {
		for (String role : roles) {
			if (hasRole(authentication, role)) {
				return true;
			}
		}
		return false;
	}

	private boolean hasRole(Authentication authentication, String role) {
		if (authentication == null || !authentication.isAuthenticated()) {
			return false;
		}
		String authority = "ROLE_" + role;
		return authentication.getAuthorities().stream()
				.anyMatch(grantedAuthority -> authority.equals(grantedAuthority.getAuthority()));
	}
}
