import React from 'react';
import { Platform, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

type GlassStyle = 'regular' | 'clear';

interface GlassBackgroundProps {
    /** Style applied to the glass/blur/fallback view */
    style?: StyleProp<ViewStyle>;
    /** Glass effect style — 'regular' for full glass, 'clear' for subtle */
    glassStyle?: GlassStyle;
    /** Tint color for the glass effect (iOS 26+ only) */
    tintColor?: string;
    /** BlurView tint fallback — 'dark' or 'light' */
    tint?: 'dark' | 'light' | 'default';
    /** BlurView intensity fallback (0–100) */
    intensity?: number;
    /** Opaque fallback color for Android or when glass is unavailable */
    fallbackColor?: string;
    /** Children to render inside the glass view */
    children?: React.ReactNode;
}

/**
 * Unified glass/blur background component.
 * - iOS 26+ with liquid glass → renders native `GlassView`
 * - Older iOS → renders `BlurView` with intensity/tint
 * - Android → renders a semi-transparent opaque `View`
 */
export const GlassBackground: React.FC<GlassBackgroundProps> = ({
    style,
    glassStyle = 'regular',
    tintColor,
    tint = 'dark',
    intensity = 80,
    fallbackColor = 'rgba(30, 30, 35, 0.85)',
    children,
}) => {
    // iOS 26+ with liquid glass available
    if (isLiquidGlassAvailable()) {
        return (
            <GlassView
                style={style}
                glassEffectStyle={glassStyle}
                tintColor={tintColor}
            >
                {children}
            </GlassView>
        );
    }

    // Older iOS — use BlurView
    if (Platform.OS === 'ios') {
        return (
            <BlurView intensity={intensity} tint={tint} style={style}>
                {children}
            </BlurView>
        );
    }

    // Android — opaque fallback
    return (
        <View style={[style, { backgroundColor: fallbackColor }]}>
            {children}
        </View>
    );
};
