import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusHistory, FocusSession } from '../store/useFocusHistory';
import { useFocusModes } from '../store/useFocusModes';
import { GlassBackground } from './GlassBackground';
import { Ionicons } from '@expo/vector-icons';
import { getIconColor } from './ModeSelectionOverlay';

const { width } = Dimensions.get('window');
const HOUR_HEIGHT = 60; // 60 pixels per hour
const TIMELINE_START = 0; // 00:00
const TIMELINE_END = 24; // 24:00

export default function CalendarView() {
    const scrollViewRef = useRef<ScrollView>(null);
    const { sessions } = useFocusHistory();
    const { modes } = useFocusModes();

    const getModeColor = (modeId: string) => {
        const mode = modes.find(m => m.id === modeId);
        if (mode && mode.icon) {
            return getIconColor(mode.icon);
        }
        return '#0A84FF'; // Default fallback color
    };

    // Calculate initial scroll position
    useEffect(() => {
        const now = new Date();
        const startHour = Math.max(0, now.getHours() - 1); // Scroll to 1 hour before current time
        const yOffset = startHour * HOUR_HEIGHT;
        setTimeout(() => {
            scrollViewRef.current?.scrollTo({ y: yOffset, animated: false });
        }, 100);
    }, []);

    // Filter sessions for today
    const { todaySessions, earliestTime, latestTime } = useMemo(() => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

        const filtered = sessions.filter(
            s => s.startTime >= startOfDay && s.startTime < endOfDay
        );

        return {
            todaySessions: filtered,
            earliestTime: startOfDay,
            latestTime: endOfDay
        };
    }, [sessions]);

    // Renders the block for a completed session
    const renderSessionBlock = (session: FocusSession) => {
        const sessionDate = new Date(session.startTime);
        const hours = sessionDate.getHours();
        const minutes = sessionDate.getMinutes();
        const topOffset = (hours + minutes / 60) * HOUR_HEIGHT;

        // 1 hour = 60 mins -> 60px height. So 1px per min.
        const height = Math.max(20, session.duration * (HOUR_HEIGHT / 60)); // Min height 20px

        const modeColor = getModeColor(session.modeId);

        return (
            <View
                key={session.id}
                style={[
                    styles.sessionBlock,
                    {
                        top: topOffset,
                        height,
                        backgroundColor: modeColor
                    }
                ]}
            >
                {/* For really short sessions we don't show text, just the block */}
                {height >= 30 && (
                    <Text style={styles.sessionText}>Mode {session.modeId}</Text>
                )}
            </View>
        );
    };

    // Render timeline marks (00:00, 01:00...)
    const renderTimeline = () => {
        const hours = [];
        for (let i = TIMELINE_START; i < TIMELINE_END; i++) {
            const timeString = `${i.toString().padStart(2, '0')}:00`;
            hours.push(
                <View key={i} style={styles.hourRow}>
                    <Text style={styles.hourText}>{timeString}</Text>
                    <View style={styles.hourLine} />
                </View>
            );
        }
        return hours;
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#353B60', '#1C1D2A', '#111116']}
                style={styles.background}
            />

            {/* Header / Week Strip */}
            <View style={styles.headerContainer}>
                <GlassBackground style={styles.glassHeader} intensity={60} tint="dark">
                    <Text style={styles.headerTitle}>Calendar</Text>
                    <View style={styles.weekStrip}>
                        {/* Mocking week selection for now */}
                        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day, ix) => (
                            <View key={day} style={[styles.dayCircle, ix === new Date().getDay() - 1 ? styles.dayCircleActive : null]}>
                                <Text style={[styles.dayText, ix === new Date().getDay() - 1 ? styles.dayTextActive : null]}>{day}</Text>
                            </View>
                        ))}
                    </View>
                </GlassBackground>
            </View>

            {/* Timeline Scroll */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {renderTimeline()}
                <View style={styles.sessionsContainer}>
                    {todaySessions.map(renderSessionBlock)}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    headerContainer: {
        zIndex: 10,
        paddingTop: 60, // Adjust for safe area
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    glassHeader: {
        borderRadius: 24,
        padding: 20,
        overflow: 'hidden',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 24,
        fontFamily: 'SF-Pro-Rounded-Bold',
        marginBottom: 16,
    },
    weekStrip: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dayCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayCircleActive: {
        backgroundColor: '#fff',
        shadowColor: 'rgba(255, 255, 255, 0.5)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 10,
    },
    dayText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 14,
        fontFamily: 'SF-Pro-Rounded-Semibold',
    },
    dayTextActive: {
        color: '#1C1D2A',
        fontFamily: 'SF-Pro-Rounded-Bold',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 20,
        paddingBottom: 60,
    },
    hourRow: {
        flexDirection: 'row',
        height: HOUR_HEIGHT,
        alignItems: 'flex-start',
    },
    hourText: {
        width: 60,
        textAlign: 'right',
        paddingRight: 15,
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 12,
        fontFamily: 'SF-Pro-Rounded-Semibold',
        // Slight vertical offset to align with the line visually
        marginTop: -7,
    },
    hourLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginRight: 20,
    },
    sessionsContainer: {
        position: 'absolute',
        top: 20,
        left: 60,
        right: 20,
        bottom: 60,
    },
    sessionBlock: {
        position: 'absolute',
        left: 0,
        right: 0,
        borderRadius: 8,
        padding: 4,
        overflow: 'hidden',
        // Slight opacity and border for glass look
        opacity: 0.9,
    },
    sessionText: {
        color: '#fff',
        fontSize: 12,
        fontFamily: 'SF-Pro-Rounded-Bold',
    }
});
