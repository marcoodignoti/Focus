import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import Animated, {
    SharedValue,
    useAnimatedProps,
    useDerivedValue,
} from 'react-native-reanimated';
import { GlassView, GlassStyle } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { canUseGlass } from '@/lib/glassCapability';

const AnimatedGlassView = Animated.createAnimatedComponent(GlassView);

interface GlassContainerProps {
    children?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
    glassStyle?: GlassStyle;
    intensity?: number;
    tint?: 'dark' | 'light' | 'default';
    borderRadius?: number;
    borderColor?: string;
    borderWidth?: number;
    fallbackColor?: string;
    /** Whether the glass effect should be interactive (iOS 26+ only) */
    isInteractive?: boolean;
    /** Tint color for the native glass effect (iOS 26+ only) */
    tintColor?: string;
    /** Shared value that represents parent's opacity. Used to fix native visual bugs */
    parentOpacity?: SharedValue<number>;
    /** The solid color of the gradient highlight. Supports rgba() which enables the IDE color picker. Default: 'rgba(255, 255, 255, 0.2)' */
    gradientColor?: string;
    /** How far the solid gradient color should extend before fading (0 to 1). Default: 0 */
    gradientExtension?: number;
    /** Gradient stops for the classic diagonal fallback (legacy param, overrides gradientExtension if used) */
    gradientLocations?: [number, number, number, number];
}

/**
 * A global container for glassmorphism elements.
 *
 * Native glass path (iOS 26+):
 *   - Without parentOpacity: plain GlassView as root (most reliable).
 *   - With parentOpacity: AnimatedGlassView + useAnimatedProps to toggle
 *     glassEffectStyle between desired style and 'none' (opacity workaround).
 *
 * Fallback path: BlurView inside a clipping View.
 */
export const GlassContainer: React.FC<GlassContainerProps> = ({
    children,
    style,
    contentStyle,
    glassStyle = 'clear',
    intensity = 20,
    tint = 'light',
    borderRadius = 100,
    borderColor = 'transparent',
    borderWidth = 0.5,
    fallbackColor,
    isInteractive = false,
    tintColor,
    parentOpacity,
    gradientColor = 'rgba(255, 255, 255, 0.15)',
}) => {
    const useNativeGlass = canUseGlass();

    if (useNativeGlass) {
        // When parentOpacity is provided, use AnimatedGlassView with animated props
        // to toggle glassEffectStyle (official expo opacity workaround).
        if (parentOpacity) {
            return (
                <AnimatedGlassContainer
                    style={style}
                    contentStyle={contentStyle}
                    glassStyle={glassStyle}
                    borderRadius={borderRadius}
                    isInteractive={isInteractive}
                    tintColor={tintColor}
                    parentOpacity={parentOpacity}
                    tint={tint}
                >
                    {children}
                </AnimatedGlassContainer>
            );
        }

        // Without parentOpacity, use plain GlassView — most reliable on mount.
        return (
            <GlassView
                style={[
                    styles.outer,
                    { borderRadius },
                    fallbackColor ? { backgroundColor: fallbackColor } : undefined,
                    style,
                ]}
                glassEffectStyle={glassStyle}
                isInteractive={isInteractive}
                colorScheme={tint === 'light' ? 'light' : 'dark'}
                tintColor={tintColor}
            >
                <View style={[styles.inner, { borderRadius }, contentStyle]}>
                    {children}
                </View>
            </GlassView>
        );
    }

    // --- Fallback path (BlurView + gradient border) ---
    const innerRadius = Math.max(0, borderRadius - borderWidth);

    return (
        <View style={[
            styles.outer,
            {
                borderRadius,
                borderWidth,
                borderColor: gradientColor,
            },
            fallbackColor ? { backgroundColor: fallbackColor } : undefined,
            style,
        ]}>
            {/* Inner clipping view */}
            <View
                style={[
                    StyleSheet.absoluteFill,
                    { borderRadius: innerRadius, overflow: 'hidden' },
                ]}
            >
                {/* Opaque backing to block gradient bleed-through */}
                <View style={[StyleSheet.absoluteFill, {
                    backgroundColor: tint === 'dark' ? 'rgba(15, 15, 20, 0.92)' : 'rgba(240, 240, 245, 0.88)',
                }]} />
                <BlurView
                    intensity={intensity}
                    tint={tint}
                    style={StyleSheet.absoluteFill}
                />
            </View>
            <View style={[styles.inner, { borderRadius: innerRadius }, contentStyle]}>
                {children}
            </View>
        </View>
    );
};

// --- Internal: animated variant for the opacity workaround ---
const AnimatedGlassContainer: React.FC<{
    children?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
    glassStyle: GlassStyle;
    borderRadius: number;
    isInteractive: boolean;
    tintColor?: string;
    parentOpacity: SharedValue<number>;
    tint: 'dark' | 'light' | 'default';
}> = ({ children, style, contentStyle, glassStyle, borderRadius, isInteractive, tintColor, parentOpacity, tint }) => {
    const derivedGlassStyle = useDerivedValue(() => {
        return parentOpacity.value > 0.01 ? glassStyle : 'none';
    });

    const glassViewProps = useAnimatedProps<any>(() => ({
        glassEffectStyle: derivedGlassStyle.value,
    }));

    return (
        <AnimatedGlassView
            style={[
                { borderRadius, overflow: 'hidden' as const },
                style,
            ]}
            animatedProps={glassViewProps as any}
            isInteractive={isInteractive}
            colorScheme={tint === 'light' ? 'light' : 'dark'}
            tintColor={tintColor}
        >
            <View style={[styles.inner, { borderRadius }, contentStyle]}>
                {children}
            </View>
        </AnimatedGlassView>
    );
};

const styles = StyleSheet.create({
    outer: {
        overflow: 'hidden',
        backgroundColor: 'transparent',
    },
    inner: {
        flex: 1,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
