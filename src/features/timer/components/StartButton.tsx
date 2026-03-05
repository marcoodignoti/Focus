import React from 'react';
import { StyleSheet, Text, ViewStyle, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { GlassContainer } from '@/components/GlassContainer';
import * as haptics from '@/utils/haptics';

interface StartButtonProps {
    label: string;
    onPress: () => void;
    style?: ViewStyle;
}

export const StartButton = React.memo(function StartButton({ label, onPress, style }: StartButtonProps) {
    const scale = useSharedValue(1);

    const handlePressIn = () => {
        haptics.impactLight();
        scale.value = withSpring(0.96, {
            damping: 10,
            stiffness: 100,
        });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, {
            damping: 10,
            stiffness: 100,
        });
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
        >
            <Animated.View style={[style, animatedStyle]}>
                <GlassContainer
                    borderRadius={50}
                    intensity={20}
                    tint="dark"
                    contentStyle={styles.innerContainer}
                    glassStyle="clear"
                    isInteractive={true}
                >
                    <Text style={styles.text}>{label}</Text>
                </GlassContainer>
            </Animated.View>
        </Pressable>
    );
});

const styles = StyleSheet.create({
    innerContainer: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: '#ffffff',
        fontSize: 20,
        fontFamily: 'SF-Pro-Rounded-Semibold',
    },
});
