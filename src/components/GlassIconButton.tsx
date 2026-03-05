import React from 'react';
import { StyleSheet, Pressable, View, ViewStyle, StyleProp } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GlassContainer } from './GlassContainer';

const SPRING_CONFIG = { damping: 15, stiffness: 200 };
const SCALE_PRESSED = 0.92;

interface GlassIconButtonProps {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    iconSize?: number;
    onPress: () => void;
    disabled?: boolean;
    /** Outer size of the circular button (default 36) */
    size?: number;
    /** Controls whether the icon shrinks on press instead of scaling the whole button. Default: false */
    shrinkIconOnPress?: boolean;
    /** The solid color of the gradient highlight. Supports rgba() which enables the IDE color picker. Default: 'rgba(255, 255, 255, 0.15)' */
    gradientColor?: string;
    /** How far the solid gradient color should extend before fading (0 to 1). Default: 0 */
    gradientExtension?: number;
    style?: StyleProp<ViewStyle>;
    hitSlop?: { top: number; bottom: number; left: number; right: number };
    /** Fallback blur intensity for non-iOS 26 devices (default 40) */
    intensity?: number;
    /** When true, renders a simple transparent circle (no glass/blur). Use inside glass sheet containers. */
    noGlass?: boolean;
}

/**
 * Circular icon button with native Liquid Glass (iOS 26+) or BlurView fallback.
 * On iOS 26+: GlassView IS the root — no wrapping View.
 */
export const GlassIconButton: React.FC<GlassIconButtonProps> = ({
    icon,
    iconColor = '#ffffff',
    iconSize = 24,
    onPress,
    disabled = false,
    size = 36,
    style,
    hitSlop = { top: 20, bottom: 20, left: 20, right: 20 },
    gradientColor = 'rgba(255, 255, 255, 0.15)',
    intensity = 40,
    noGlass = false,
}) => {
    const scale = useSharedValue(1);
    const radius = size / 2;

    const handlePressIn = () => {
        scale.value = withSpring(SCALE_PRESSED, SPRING_CONFIG);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, SPRING_CONFIG);
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const innerContent = (
        <View style={styles.content}>
            <Ionicons name={icon} size={iconSize} color={iconColor} />
        </View>
    );

    return (
        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            hitSlop={hitSlop}
        >
            <Animated.View
                style={[
                    {
                        width: size,
                        height: size,
                        opacity: disabled ? 0.4 : 1,
                    },
                    animatedStyle,
                    style,
                ]}
            >
                {noGlass ? (
                    <View style={{
                        width: size,
                        height: size,
                        borderRadius: radius,
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        overflow: 'hidden',
                    }}>
                        {innerContent}
                    </View>
                ) : (
                    <GlassContainer
                        style={{
                            width: size,
                            height: size,
                        }}
                        borderRadius={radius}
                        intensity={intensity}
                        gradientColor={gradientColor}
                        isInteractive={true}
                        borderWidth={0.5}
                        tint="dark"
                        glassStyle="clear"
                    >
                        {innerContent}
                    </GlassContainer>
                )}
            </Animated.View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
