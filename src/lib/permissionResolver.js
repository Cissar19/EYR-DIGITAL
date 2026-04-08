import { MODULE_REGISTRY } from '../data/moduleRegistry';

/**
 * Resolves effective permissions for a user using 3 layers:
 *   1. Hardcoded defaults (moduleRegistry defaultRoles → 'edit')
 *   2. Role defaults from Firestore (roleDefaults)
 *   3. User-level overrides (user.permissionOverrides)
 *
 * Returns: { [moduleKey]: false | 'view' | 'edit' }
 *
 * Safety net: super_admin and admin always get 'edit' on everything.
 * Backward compat: stored boolean true → 'edit', false → false.
 */

function normalize(v) {
    if (v === true) return 'edit';
    if (!v) return false;
    if (v === 'view' || v === 'edit') return v;
    return false;
}

export function resolvePermissions(user, roleDefaults = {}) {
    if (!user?.role) return {};

    const role = user.role;
    const isFullAccess = role === 'super_admin' || role === 'admin';

    const result = {};

    for (const mod of MODULE_REGISTRY) {
        // Layer 1: hardcoded default — in defaultRoles → 'edit', else false
        let allowed;
        if (mod.defaultRoles === null) {
            allowed = 'edit';
        } else {
            allowed = mod.defaultRoles.includes(role) ? 'edit' : false;
        }

        // Layer 2: role override from Firestore
        const roleOverride = roleDefaults[role]?.modules?.[mod.key];
        if (roleOverride !== undefined) {
            allowed = normalize(roleOverride);
        }

        // Layer 3: user-level override
        const userOverride = user.permissionOverrides?.[mod.key];
        if (userOverride !== undefined) {
            allowed = normalize(userOverride);
        }

        // Safety net: admin/super_admin always get edit on everything
        if (isFullAccess) {
            allowed = 'edit';
        }

        result[mod.key] = allowed;
    }

    return result;
}

/**
 * Quick check: can user access (view or edit) a specific module?
 */
export function canAccessModule(user, roleDefaults, moduleKey) {
    const perms = resolvePermissions(user, roleDefaults);
    return !!perms[moduleKey];
}
