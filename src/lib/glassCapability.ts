import { isLiquidGlassAvailable, isGlassEffectAPIAvailable } from 'expo-glass-effect';

/**
 * Module-level cache for glass availability checks.
 * Avoids redundant synchronous native bridge calls on every component render.
 */
let _cachedResult: boolean | null = null;

export function canUseGlass(): boolean {
    if (_cachedResult !== null) return _cachedResult;
    try {
        _cachedResult = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
    } catch {
        _cachedResult = false;
    }
    return _cachedResult;
}
