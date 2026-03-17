import { MODULE_REGISTRY } from '../data/moduleRegistry';

/**
 * Resolves effective permissions for a user using 3 layers:
 *   1. Hardcoded defaults (moduleRegistry defaultRoles)
 *   2. Role defaults from Firestore (roleDefaults)
 *   3. User-level overrides (user.permissionOverrides)
 *
 * Returns an object: { [moduleKey]: boolean }
 *
 * Safety net: super_admin and admin always get full access.
 */
export function resolvePermissions(user, roleDefaults = {}) {
    if (!user?.role) return {};

    const role = user.role;
    const isFullAccess = role === 'super_admin' || role === 'admin';

    const result = {};

    for (const mod of MODULE_REGISTRY) {
        // Layer 1: hardcoded default
        let allowed;
        if (mod.defaultRoles === null) {
            allowed = true; // visible to everyone
        } else {
            allowed = mod.defaultRoles.includes(role);
        }

        // Layer 2: role override from Firestore
        const roleOverride = roleDefaults[role]?.modules?.[mod.key];
        if (roleOverride !== undefined) {
            allowed = roleOverride;
        }

        // Layer 3: user-level override
        const userOverride = user.permissionOverrides?.[mod.key];
        if (userOverride !== undefined) {
            allowed = userOverride;
        }

        // Safety net: admin/super_admin always see everything
        if (isFullAccess) {
            allowed = true;
        }

        result[mod.key] = allowed;
    }

    return result;
}

/**
 * Quick check: can user access a specific module?
 */
export function canAccessModule(user, roleDefaults, moduleKey) {
    const perms = resolvePermissions(user, roleDefaults);
    return perms[moduleKey] === true;
}
