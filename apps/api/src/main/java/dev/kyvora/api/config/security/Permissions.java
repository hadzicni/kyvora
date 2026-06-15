package dev.kyvora.api.config.security;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import dev.kyvora.api.auth.entity.UserPermission;

@Component("permissions")
public class Permissions {

	public boolean canReadDashboard(Authentication authentication) {
		return hasPermission(authentication, UserPermission.DASHBOARD_READ);
	}

	public boolean canReadAuditLogs(Authentication authentication) {
		return hasPermission(authentication, UserPermission.AUDIT_LOG_READ);
	}

	public boolean canReadNetworkMap(Authentication authentication) {
		return hasPermission(authentication, UserPermission.NETWORK_MAP_READ);
	}

	public boolean canReadUsers(Authentication authentication) {
		return hasPermission(authentication, UserPermission.USER_READ);
	}

	public boolean canCreateUsers(Authentication authentication) {
		return hasPermission(authentication, UserPermission.USER_CREATE);
	}

	public boolean canUpdateUsers(Authentication authentication) {
		return hasPermission(authentication, UserPermission.USER_UPDATE);
	}

	public boolean canDisableUsers(Authentication authentication) {
		return hasPermission(authentication, UserPermission.USER_DISABLE);
	}

	public boolean canEnableUsers(Authentication authentication) {
		return hasPermission(authentication, UserPermission.USER_ENABLE);
	}

	public boolean canResetUserPasswords(Authentication authentication) {
		return hasPermission(authentication, UserPermission.USER_PASSWORD_RESET);
	}

	public boolean canAccessUserManagement(Authentication authentication) {
		return hasAnyPermission(
				authentication,
				UserPermission.USER_READ,
				UserPermission.USER_CREATE,
				UserPermission.USER_UPDATE,
				UserPermission.USER_DISABLE,
				UserPermission.USER_ENABLE,
				UserPermission.USER_PASSWORD_RESET);
	}

	public boolean canReadSettings(Authentication authentication) {
		return hasPermission(authentication, UserPermission.SETTINGS_READ);
	}

	public boolean canUpdateSettings(Authentication authentication) {
		return hasPermission(authentication, UserPermission.SETTINGS_UPDATE);
	}

	public boolean canReadServers(Authentication authentication) {
		return hasPermission(authentication, UserPermission.SERVER_READ);
	}

	public boolean canCreateServers(Authentication authentication) {
		return hasPermission(authentication, UserPermission.SERVER_CREATE);
	}

	public boolean canUpdateServers(Authentication authentication) {
		return hasPermission(authentication, UserPermission.SERVER_UPDATE);
	}

	public boolean canDeleteServers(Authentication authentication) {
		return hasPermission(authentication, UserPermission.SERVER_DELETE);
	}

	public boolean canReadServices(Authentication authentication) {
		return hasPermission(authentication, UserPermission.SERVICE_READ);
	}

	public boolean canCreateServices(Authentication authentication) {
		return hasPermission(authentication, UserPermission.SERVICE_CREATE);
	}

	public boolean canUpdateServices(Authentication authentication) {
		return hasPermission(authentication, UserPermission.SERVICE_UPDATE);
	}

	public boolean canDeleteServices(Authentication authentication) {
		return hasPermission(authentication, UserPermission.SERVICE_DELETE);
	}

	public boolean canReadAgents(Authentication authentication) {
		return hasPermission(authentication, UserPermission.AGENT_READ);
	}

	public boolean canEnrollAgents(Authentication authentication) {
		return hasPermission(authentication, UserPermission.AGENT_ENROLL);
	}

	public boolean canPullAgents(Authentication authentication) {
		return hasPermission(authentication, UserPermission.AGENT_PULL);
	}

	public boolean canDecommissionAgents(Authentication authentication) {
		return hasPermission(authentication, UserPermission.AGENT_DECOMMISSION);
	}

	private boolean hasPermission(Authentication authentication, UserPermission permission) {
		if (authentication == null || !authentication.isAuthenticated()) {
			return false;
		}
		String authority = permission.authority();
		return authentication.getAuthorities().stream()
				.anyMatch(grantedAuthority -> authority.equals(grantedAuthority.getAuthority()));
	}

	private boolean hasAnyPermission(Authentication authentication, UserPermission... permissions) {
		for (UserPermission permission : permissions) {
			if (hasPermission(authentication, permission)) {
				return true;
			}
		}
		return false;
	}
}
