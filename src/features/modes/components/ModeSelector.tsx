import React from 'react';
import { StyleSheet, Text, View, ViewStyle, Pressable } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, SharedValue } from 'react-native-reanimated';
import { GlassContainer } from '@/components/GlassContainer';
import * as haptics from '@/utils/haptics';
import { getIconColor } from '@/lib/constants';

interface ModeSelectorProps {
  mode: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  style?: ViewStyle;
  parentOpacity?: SharedValue<number>;
}

export const ModeSelector = React.memo(function ModeSelector({ mode, icon, onPress, style, parentOpacity }: ModeSelectorProps) {
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);

  const handlePressIn = () => {
    haptics.impactLight();
    scaleX.value = withSpring(0.95, { damping: 10, stiffness: 100 });
    scaleY.value = withSpring(0.92, { damping: 10, stiffness: 100 });
  };

  const handlePressOut = () => {
    scaleX.value = withSpring(1, { damping: 10, stiffness: 100 });
    scaleY.value = withSpring(1, { damping: 10, stiffness: 100 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleX: scaleX.value },
      { scaleY: scaleY.value }
    ],
  }));

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View style={[style, animatedStyle]}>
        <GlassContainer
          borderRadius={50}
          intensity={20}
          tint="dark"
          style={styles.container}
          contentStyle={styles.innerContainer}
          glassStyle="clear"
          parentOpacity={parentOpacity}
          isInteractive={true}
        >
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
        </GlassContainer>
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    maxWidth: 220,
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
