import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { easeGradient } from 'react-native-easing-gradient';
import { canUseGlass } from '@/lib/glassCapability';

type Direction = 'top-to-bottom' | 'bottom-to-top';

interface ProgressiveBlurProps {
    /** BlurView intensity (0–100). Default: 15 */
    intensity?: number;
    /** BlurView tint. Defaults to 'systemChromeMaterialDark' on iOS, 'systemMaterialDark' on Android. */
    tint?: string;
    /** Direction of the gradient mask fade-out. Default: 'top-to-bottom' */
    direction?: Direction;
    /** Optional overlay color gradient (e.g. a tinted background). Must have at least 2 colors. */
    overlayColors?: [string, string, ...string[]];
    /** Style applied to the outermost container */
    style?: StyleProp<ViewStyle>;
    /** Children rendered on top */
    children?: React.ReactNode;
}

// Pre-compute the eased gradient mask — same values used by the reference
const { colors: EASED_MASK_COLORS, locations: EASED_MASK_LOCATIONS } = easeGradient({
    colorStops: {
        0: { color: 'rgba(0,0,0,0.99)' },  // solid (fully visible)
        0.5: { color: 'black' },               // still solid midway
        1: { color: 'transparent' },          // fully faded
    },
});

/**
 * Reusable progressive blur component.
 *
 * Reproduces the iOS-like progressive blur from expo-progressive-blur reference:
 * 1. MaskedView with an eased gradient mask (smooth, natural fade)
 * 2. LinearGradient background layer BEFORE the BlurView (gives blur content)
 * 3. BlurView with systemChromeMaterialDark tint (native iOS chrome feel)
 * 4. Optional colored overlay on top
 */
export const ProgressiveBlur: React.FC<ProgressiveBlurProps> = ({
    intensity = 15,
    tint,
    direction = 'top-to-bottom',
    overlayColors,
    style,
    children,
}) => {
    const resolvedTint = tint ?? 'default';
    const useNativeGlass = canUseGlass();

    // Flip gradient direction based on prop
    const gradientStart = direction === 'top-to-bottom' ? { x: 0, y: 0 } : { x: 0, y: 1 };
    const gradientEnd = direction === 'top-to-bottom' ? { x: 0, y: 1 } : { x: 0, y: 0 };

    return (
        <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
            <MaskedView
                style={StyleSheet.absoluteFill}
                maskElement={
                    <LinearGradient
                        colors={EASED_MASK_COLORS as any}
                        locations={EASED_MASK_LOCATIONS as any}
                        start={gradientStart}
                        end={gradientEnd}
                        style={StyleSheet.absoluteFill}
                    />
                }
            >
                {/* Blur layer (Native UIVisualEffectView breaks inside MaskedView on iOS 26) */}
                {!useNativeGlass && (
                    <BlurView
                        intensity={intensity}
                        tint={resolvedTint as any}
                        style={StyleSheet.absoluteFill}
                    />
                )}

                {/* Optional colored overlay */}
                {overlayColors && (
                    <LinearGradient
                        colors={overlayColors}
                        start={gradientStart}
                        end={gradientEnd}
                        style={StyleSheet.absoluteFill}
                    />
                )}
            </MaskedView>

            {children}
        </View>
    );
};
