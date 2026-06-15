package dev.kyvora.api.auth.entity;

import java.util.EnumSet;
import java.util.Set;

public enum PermissionPreset {

	ADMIN(EnumSet.allOf(UserPermission.class)),
	OPERATOR(EnumSet.of(
			UserPermission.DASHBOARD_READ,
			UserPermission.AUDIT_LOG_READ,
			UserPermission.NETWORK_MAP_READ,
			UserPermission.SERVER_READ,
			UserPermission.SERVER_CREATE,
			UserPermission.SERVER_UPDATE,
			UserPermission.SERVICE_READ,
			UserPermission.SERVICE_CREATE,
			UserPermission.SERVICE_UPDATE,
			UserPermission.SERVICE_DELETE,
			UserPermission.AGENT_READ,
			UserPermission.AGENT_ENROLL,
			UserPermission.AGENT_PULL,
			UserPermission.AGENT_DECOMMISSION)),
	VIEWER(EnumSet.of(
			UserPermission.DASHBOARD_READ,
			UserPermission.AUDIT_LOG_READ,
			UserPermission.NETWORK_MAP_READ,
			UserPermission.SERVER_READ,
			UserPermission.SERVICE_READ,
			UserPermission.AGENT_READ));

	private final Set<UserPermission> permissions;

	PermissionPreset(Set<UserPermission> permissions) {
		this.permissions = Set.copyOf(permissions);
	}

	public Set<UserPermission> permissions() {
		return permissions;
	}
}
