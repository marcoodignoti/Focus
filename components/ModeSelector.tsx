import React, { useRef } from 'react';
import { StyleSheet, Text, View, ViewStyle, Animated, Pressable } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { GlassBackground } from './GlassBackground';
import * as haptics from '../utils/haptics';
import { getIconColor } from './ModeSelectionOverlay';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ModeSelectorProps {
  mode: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  style?: ViewStyle;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, icon, onPress, style }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    haptics.impactLight();
    Animated.spring(scaleAnim, {
      toValue: 0.85,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 40,
    }).start();
  };

  const content = (
    <View style={styles.innerContainer}>
      {icon && (
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color={getIconColor(icon)} style={{ opacity: 0.9 }} />
        </View>
      )}
      <Text style={styles.text} numberOfLines={2}>
        {mode}
      </Text>
      <MaterialIcons
        name="unfold-more"
        size={22}
        color="rgba(255, 255, 255, 0.4)"
        style={styles.chevron}
      />
    </View>
  );

  return (
    <AnimatedPressable
      style={[styles.container, style, { transform: [{ scale: scaleAnim }] }]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <GlassBackground
        style={StyleSheet.absoluteFill}
        glassStyle="clear"
        tint="light"
        intensity={20}
        fallbackColor="rgba(255, 255, 255, 0.15)"
      />
      {content}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 50,
    // @ts-ignore: cornerCurve is a valid iOS prop since RN 0.73
    cornerCurve: 'continuous',
    maxWidth: 220, // Give some constraint for long text
    overflow: 'hidden', // Ensures BlurView stays within pill
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  innerContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(53, 59, 96, 0.8)', // Darker bluish background from the image
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 20,
    fontFamily: 'SF-Pro-Rounded-Semibold',
    flexShrink: 1, // Allow text to wrap if it's too long
    textAlign: 'left',
  },
  chevron: {
    marginLeft: 12,
  },
});
