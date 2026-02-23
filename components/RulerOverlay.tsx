import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Animated, Pressable, Text, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassBackground } from './GlassBackground';
import { RulerPicker } from './RulerPicker';
import * as haptics from '../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RulerOverlayProps {
    visible: boolean;
    onClose: () => void;
    initialValue: number;
    onValueChange: (value: number) => void;
}

export const RulerOverlay: React.FC<RulerOverlayProps> = ({
    visible,
    onClose,
    initialValue,
    onValueChange,
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height * 0.1)).current;

    const insets = useSafeAreaInsets();

    const [shouldRender, setShouldRender] = useState(visible);

    useEffect(() => {
        if (visible) {
            setShouldRender(true);
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 350,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 9,
                    tension: 40,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: Dimensions.get('window').height * 0.1,
                    friction: 9,
                    useNativeDriver: true,
                })
            ]).start(() => {
                if (!visible) setShouldRender(false);
            });
        }
    }, [visible]);

    if (!shouldRender) return null;

    return (
        <View
            style={[
                styles.fullScreenContainer,
                { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 20) }
            ]}
            pointerEvents={visible ? 'auto' : 'none'}
        >
            <GlassBackground
                animated={true}
                visible={visible}
                fadeDuration={visible ? 350 : 250}
                style={StyleSheet.absoluteFill}
                glassStyle="regular"
                tint="dark"
                intensity={90}
                fallbackColor="rgba(30,31,36,0.95)"
            />

            <Animated.View
                style={[
                    styles.content,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                ]}
            >
                <Text style={styles.title}>Adjust timer</Text>

                <View style={styles.rulerWrapper}>
                    <RulerPicker
                        containerWidth={SCREEN_WIDTH}
                        initialValue={initialValue}
                        onValueChange={onValueChange}
                    />
                </View>

                <View style={styles.bottomContainer}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.doneButton,
                            pressed && styles.doneButtonPressed
                        ]}
                        onPress={() => {
                            haptics.impactMedium();
                            onClose();
                        }}
                    >
                        <Text style={styles.doneButtonText}>Done</Text>
                    </Pressable>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    fullScreenContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 200,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingBottom: 40,
    },
    title: {
        color: '#ffffff',
        fontSize: 24,
        fontFamily: 'SF-Pro-Rounded-Semibold',
        opacity: 0.8,
    },
    rulerWrapper: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomContainer: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    doneButton: {
        width: '40%',
        height: 60,
        borderRadius: 50,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        // @ts-ignore
        cornerCurve: 'continuous',
    },
    doneButtonPressed: {
        backgroundColor: 'rgba(255,255,255,0.8)',
        transform: [{ scale: 0.98 }]
    },
    doneButtonText: {
        color: '#1E1F24',
        fontSize: 20,
        fontFamily: 'SF-Pro-Rounded-Bold',
    }
});
