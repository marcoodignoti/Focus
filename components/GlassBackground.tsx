import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View, ViewStyle, StyleProp, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable, GlassStyle, GlassEffectStyleConfig, GlassColorScheme } from 'expo-glass-effect';

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
    /** iOS 26 glass effect color scheme (auto, dark, light) */
    colorScheme?: GlassColorScheme;
    /** If true, the background will natively fade in and out based on the visible prop */
    animated?: boolean;
    /** Controls the fade state if animated is true */
    visible?: boolean;
    /** Fade duration in milliseconds */
    fadeDuration?: number;
    /** Children to render inside the glass view */
    children?: React.ReactNode;
}

/**
 * Unified glass/blur background component.
 * - iOS 26+ with liquid glass → renders native `GlassView` natively mapped from opacity to avoid UIVisualEffectView bug.
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
    colorScheme = 'dark',
    animated = false,
    visible = true,
    fadeDuration = 300,
    children,
}) => {
    // Map default tintColor based on 'tint' fallback to prevent "white sheet" borders/surfaces
    // if tintColor is explicitly passed, it is respected.
    const computedTintColor = tintColor !== undefined ? tintColor : (tint === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.05)');

    const opacityAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;

    useEffect(() => {
        if (animated) {
            Animated.timing(opacityAnim, {
                toValue: visible ? 1 : 0,
                duration: fadeDuration,
                useNativeDriver: true,
            }).start();
        }
    }, [visible, animated, fadeDuration]);

    // iOS 26+ with liquid glass available
    if (isLiquidGlassAvailable()) {
        const effectStyle: GlassStyle | GlassEffectStyleConfig = animated
            ? { style: visible ? glassStyle : 'none', animate: true, animationDuration: fadeDuration / 1000 }
            : glassStyle;

        // Ensure we pass overflow hidden if the style demands it
        return (
            <GlassView
                style={style}
                glassEffectStyle={effectStyle}
                colorScheme={colorScheme}
                tintColor={computedTintColor}
            >
                {children}
            </GlassView>
        );
    }

    const Wrapper = animated ? Animated.View : View;
    const wrapperStyle = animated ? [style, { opacity: opacityAnim }] : style;

    // Older iOS — use BlurView
    if (Platform.OS === 'ios') {
        return (
            <Wrapper style={wrapperStyle}>
                <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill}>
                    {children}
                </BlurView>
            </Wrapper>
        );
    }

    // Android — opaque fallback
    return (
        <Wrapper style={[wrapperStyle, { backgroundColor: fallbackColor }]}>
            {children}
        </Wrapper>
    );
};
