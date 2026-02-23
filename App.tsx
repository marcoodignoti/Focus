import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, Animated, Pressable, DeviceEventEmitter } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';

import { TimerDisplay } from './components/TimerDisplay';
import { ModeSelector } from './components/ModeSelector';
import { StartButton } from './components/StartButton';
import { ModeSelectionOverlay, FocusMode } from './components/ModeSelectionOverlay';
import { RulerOverlay } from './components/RulerOverlay';
import { NewModeSheet } from './components/NewModeSheet';
import { RenameSheet } from './components/RenameSheet';
import * as haptics from './utils/haptics';
import { useFocusModes } from './store/useFocusModes';
import { useFocusAnimations } from './store/useFocusAnimations';
import { useFocusHistory } from './store/useFocusHistory';
import PagerView from 'react-native-pager-view';
import CalendarView from './components/CalendarView';

export type RootStackParamList = {
  Home: {
    createdMode?: Omit<FocusMode, 'id'>,
    renamedMode?: { id: string, name: string }
  } | undefined;
  NewModeSheet: undefined;
  RenameSheet: {
    id: string;
    currentName: string;
  };
};

const initialModes: FocusMode[] = [
  { id: '1', name: 'Study', duration: 35, icon: 'book' },
  { id: '2', name: 'Work', duration: 45, icon: 'briefcase' },
  { id: '3', name: 'Focus', duration: 15, icon: 'fitness' },
  { id: '4', name: 'Fitness', duration: 45, icon: 'barbell' },
  { id: '5', name: 'Read', duration: 20, icon: 'library' },
];

const Stack = createNativeStackNavigator<RootStackParamList>();

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, route }) => {
  const {
    modes,
    currentMode,
    defaultModeId,
    timerResetKey,
    setCurrentMode,
    resetTimer,
    updateModeParams,
    handleSetDefaultMode,
    handleDeleteMode,
    handleCreateMode
  } = useFocusModes();

  const { addSession } = useFocusHistory();
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [isModeSelectionVisible, setIsModeSelectionVisible] = useState(false);
  const [isRulerVisible, setIsRulerVisible] = useState(false);

  const stopFocus = useCallback(() => {
    setIsActive(false);
    resetTimer();
    setSessionStartTime(null);
  }, [resetTimer]);

  const {
    fadeAnim,
    invertedFadeAnim,
    progressBarOpacityAnim,
    widthInterpolation,
    startFocusAnimation,
    stopFocusAnimation,
    handlePressIn,
    handlePressOut,
  } = useFocusAnimations(isActive, stopFocus);

  // Trigger stop animation when isActive turns false from hold-to-stop
  // Trigger start animation when isActive turns true
  useEffect(() => {
    if (isActive) {
      startFocusAnimation();
    } else {
      stopFocusAnimation();
    }
  }, [isActive, startFocusAnimation, stopFocusAnimation]);

  useEffect(() => {
    const subCreate = DeviceEventEmitter.addListener('createMode', (newMode) => {
      handleCreateMode(newMode);
    });
    const subRename = DeviceEventEmitter.addListener('renameMode', ({ id, name }) => {
      updateModeParams(id, { name });
    });
    return () => {
      subCreate.remove();
      subRename.remove();
    };
  }, [handleCreateMode, updateModeParams]);

  const handleTimerComplete = () => {
    setIsActive(false);
    haptics.notifySuccess();
    if (sessionStartTime) {
      addSession({
        modeId: currentMode.id,
        startTime: sessionStartTime,
        duration: currentMode.duration
      });
      setSessionStartTime(null);
    } else {
      addSession({
        modeId: currentMode.id,
        startTime: Date.now() - (currentMode.duration * 60 * 1000),
        duration: currentMode.duration
      });
    }
  };

  const startFocus = () => {
    haptics.impactMedium();
    setIsActive(true);
    setSessionStartTime(Date.now());
  };

  const toggleRuler = () => {
    if (isActive) return;
    haptics.impactLight();
    setIsRulerVisible(true);
  };

  return (
    <PagerView style={styles.container} initialPage={0}>
      <View key="1" style={styles.container}>
        <StatusBar style="light" />

        {/* Base Gradient Background */}
        <LinearGradient
          colors={['#353B60', '#1C1D2A', '#111116']}
          style={styles.background}
        />

        {/* Dark Overlay Background for Focus Mode */}
        <Animated.View
          style={[styles.background, { backgroundColor: '#141414', opacity: fadeAnim }]}
          pointerEvents="none"
        />

        <Pressable
          style={styles.pressableArea}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={!isActive}
        >
          <View style={styles.content}>
            <View style={styles.topSection}>
              <Pressable
                onPress={toggleRuler}
                disabled={isActive}
                style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
              >
                <TimerDisplay
                  key={`${currentMode.id}-${timerResetKey}`}
                  durationInMinutes={currentMode.duration}
                  isActive={isActive}
                  onComplete={handleTimerComplete}
                />
              </Pressable>

              <View style={styles.selectorContainer}>
                <Animated.View
                  style={[
                    styles.modeSelector,
                    { opacity: invertedFadeAnim }
                  ]}
                  pointerEvents={isActive ? 'none' : 'auto'}
                >
                  <ModeSelector
                    mode={currentMode.name}
                    icon={currentMode.icon}
                    onPress={() => setIsModeSelectionVisible(true)}
                  />
                </Animated.View>
              </View>
            </View>

            {/* Start Button Container */}
            <Animated.View
              style={[styles.bottomSection, { opacity: invertedFadeAnim }]}
              pointerEvents={isActive ? 'none' : 'auto'}
            >
              <StartButton
                label="Start Focus"
                onPress={startFocus}
              />
            </Animated.View>

            {/* Hold to Stop Container */}
            <Animated.View
              style={[styles.holdToStopContainer, { opacity: fadeAnim }]}
              pointerEvents="none"
            >
              <Text style={styles.holdText}>Hold to stop focus</Text>
              <Animated.View style={[styles.progressBarBackground, { opacity: progressBarOpacityAnim }]}>
                <Animated.View style={[styles.progressBarFill, { width: widthInterpolation }]} />
              </Animated.View>
            </Animated.View>
          </View>
        </Pressable>

        <ModeSelectionOverlay
          visible={isModeSelectionVisible}
          onClose={() => setIsModeSelectionVisible(false)}
          modes={modes}
          activeModeId={currentMode.id}
          defaultModeId={defaultModeId}
          onSelectMode={(m) => {
            haptics.impactMedium();
            setCurrentMode(m);
            resetTimer();
            setIsModeSelectionVisible(false);
          }}
          onUpdateMode={(id, val) => updateModeParams(id, { duration: val })}
          onUpdateModeIcon={(id, icon) => updateModeParams(id, { icon })}
          onRenameMode={(id, name) => updateModeParams(id, { name })}
          onSetDefaultMode={(id) => handleSetDefaultMode(id, isActive)}
          onDeleteMode={handleDeleteMode}
          onCreateMode={handleCreateMode}
          navigation={navigation}
        />

        <RulerOverlay
          visible={isRulerVisible}
          onClose={() => setIsRulerVisible(false)}
          initialValue={currentMode.duration}
          onValueChange={(val) => updateModeParams(currentMode.id, { duration: val })}
        />
      </View>
      <View key="2" style={styles.container}>
        <CalendarView />
      </View>
    </PagerView>
  );
};

export default function App() {
  const [loaded] = useFonts({
    'SF-Pro-Rounded-Bold': require('./assets/fonts/SF-Pro-Rounded-Bold.otf'),
    'SF-Pro-Rounded-Semibold': require('./assets/fonts/SF-Pro-Rounded-Semibold.otf'),
  });

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="NewModeSheet"
            component={NewModeSheet}
            options={{
              presentation: 'transparentModal',
              animation: 'none',
              contentStyle: { backgroundColor: 'transparent' },
            }}
          />
          <Stack.Screen
            name="RenameSheet"
            component={RenameSheet}
            options={{
              presentation: 'transparentModal',
              animation: 'none',
              contentStyle: { backgroundColor: 'transparent' },
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  pressableArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 60, // Adjust according to safe area
    paddingBottom: 60,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    marginTop: 150,
  },
  selectorContainer: {
    marginTop: 10,
    height: 100,
    width: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeSelector: {
    position: 'absolute',
  },
  rulerContainer: {
    position: 'absolute',
    width: '100%',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 110,
  },
  holdToStopContainer: {
    position: 'absolute',
    bottom: 110,
    alignItems: 'center',
  },
  holdText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'SF-Pro-Rounded-Semibold',
    marginBottom: 14,
  },
  progressBarBackground: {
    width: 180,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 4,
  }
});

