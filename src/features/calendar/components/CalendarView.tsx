import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedScrollHandler, FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { LongPressGestureHandler, State } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { ProgressiveBlur } from '@/components/ProgressiveBlur';
import { useFocusHistory } from '@/features/calendar/store/useFocusHistory';
import { useUIStore } from '@/hooks/useUIStore';
import * as haptics from '@/utils/haptics';
import { FocusSession } from '@/lib/types';

import { GlassContainer } from '@/components/GlassContainer';
import { Ionicons } from '@expo/vector-icons';
import { canUseGlass } from '@/lib/glassCapability';

import PagerView from 'react-native-pager-view';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NAV_BAR_HEIGHT = 44;
const SIDE_MARGIN = 16;
const GUTTER = 16;
const HOUR_HEIGHT = 150;
const TIMELINE_START = 0;
const TIMELINE_END = 24;

const ITALIAN_DAYS = ['D', 'L', 'M', 'M', 'G', 'V', 'S'];

const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
};

const formatDay = (d: Date) => {
    return {
        date: new Date(d),
        dayInit: ITALIAN_DAYS[d.getDay()],
        dayNum: d.getDate(),
        isToday: d.toDateString() === new Date().toDateString(),
    };
};

const generateWeek = (monday: Date) => {
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return formatDay(d);
    });
};

const DayPill = React.memo(({ day, isSelected, onSelectDate }: { day: any, isSelected: boolean, onSelectDate: (d: Date) => void }) => {
    const useNativeGlass = canUseGlass();
    return (
        <Pressable
            style={styles.dayStripItem}
            onPress={() => onSelectDate(day.date)}
        >
            <GlassContainer
                style={[
                    styles.dayPill,
                    day.isToday && styles.dayPillToday,
                    isSelected && styles.dayPillSelected
                ]}
                intensity={isSelected ? 60 : day.isToday ? 40 : 20}
                tint={isSelected ? "light" : "dark"}
                borderRadius={50}
                glassStyle="clear"
            >
                <Text style={[
                    styles.dayInit,
                    day.isToday && styles.dayTextActive,
                    isSelected && (!useNativeGlass ? styles.dayTextSelectedFallback : styles.dayTextSelectedNative)
                ]}>
                    {day.dayInit}
                </Text>
                <Text style={[
                    styles.dayNum,
                    day.isToday && styles.dayTextActive,
                    isSelected && (!useNativeGlass ? styles.dayTextSelectedFallback : styles.dayTextSelectedNative)
                ]}>
                    {day.dayNum}
                </Text>
            </GlassContainer>
        </Pressable>
    );
});

const WeekPage = React.memo(({ week, selectedDate, onSelectDate }: { week: any[], selectedDate: Date, onSelectDate: (d: Date) => void }) => {
    const selectedStr = selectedDate.toDateString();
    return (
        <View style={styles.weekPage}>
            {week.map((day, dayIx) => (
                <DayPill
                    key={dayIx}
                    day={day}
                    isSelected={day.date.toDateString() === selectedStr}
                    onSelectDate={onSelectDate}
                />
            ))}
        </View>
    );
});

/** Number of pages to render on each side of the current page */
const PAGE_RENDER_WINDOW = 2;

const SessionBlock = React.memo(function SessionBlock({
    session,
    onLongPress,
}: {
    session: FocusSession;
    onLongPress: (session: FocusSession) => void;
}) {
    const sessionDate = new Date(session.startTime);
    const hours = sessionDate.getHours();
    const minutes = sessionDate.getMinutes();
    const topOffset = (hours + minutes / 60) * HOUR_HEIGHT;
    const height = Math.max(50, session.duration * (HOUR_HEIGHT / 60));

    return (
        <LongPressGestureHandler
            onHandlerStateChange={(e) => {
                if (e.nativeEvent.state === State.ACTIVE) {
                    haptics.impactMedium();
                    onLongPress(session);
                }
            }}
            minDurationMs={500}
        >
            <View
                style={[
                    styles.sessionBlock,
                    {
                        top: topOffset,
                        height,
                        backgroundColor: session.color || '#0A84FF',
                    }
                ]}
            >
                <View style={styles.sessionInfo}>
                    <Text style={styles.sessionModeTitle}>{session.modeTitle}</Text>
                    <Text style={styles.sessionDuration}>{session.duration} min</Text>
                </View>
            </View>
        </LongPressGestureHandler>
    );
});

const WEEKS_DATA = (() => {
    const today = new Date();
    const currentMonday = getMonday(today);
    return Array.from({ length: 101 }, (_, i) => {
        const monday = new Date(currentMonday);
        monday.setDate(currentMonday.getDate() + (i - 50) * 7);
        return generateWeek(monday);
    });
})();

export default function CalendarView() {
    const insets = useSafeAreaInsets();
    const HEADER_HEIGHT = insets.top + NAV_BAR_HEIGHT;

    const scrollViewRef = useRef<ScrollView>(null);
    const pagerRef = useRef<PagerView>(null);
    const sessions = useFocusHistory(state => state.sessions);
    const deleteSession = useFocusHistory(state => state.deleteSession);

    const selectedDate = useUIStore(state => state.selectedDate);
    const setSelectedDate = useUIStore(state => state.setSelectedDate);
    const [selectedSession, setSelectedSession] = useState<FocusSession | null>(null);
    const [isReady, setIsReady] = useState(false);
    const scrollY = useSharedValue(0);

    // Track current week page for windowed rendering
    const [currentWeekPage, setCurrentWeekPage] = useState(50);

    const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    const isTodaySelected = selectedDate.toDateString() === new Date().toDateString();
    const todayDateStr = `${months[selectedDate.getMonth()]} ${selectedDate.getDate()}${isTodaySelected ? ', Today' : ''}`;

    const hourRows = useMemo(() =>
        Array.from({ length: TIMELINE_END - TIMELINE_START + 1 }, (_, i) => {
            const h = i + TIMELINE_START;
            const timeString = `${h.toString().padStart(2, '0')}:00`;
            return (
                <View key={h} style={styles.hourRow}>
                    <Text style={styles.hourText}>{timeString}</Text>
                    <View style={styles.dottedLineContainer}>
                        <View style={styles.dottedLine} />
                    </View>
                </View>
            );
        }),
        []
    );

    const selectedDateStr = selectedDate.toDateString();
    const filteredSessions = useMemo(() =>
        sessions.filter(s => new Date(s.startTime).toDateString() === selectedDateStr),
        [sessions, selectedDateStr]
    );

    const handleSessionLongPress = useCallback((session: FocusSession) => {
        setSelectedSession(session);
    }, []);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    useEffect(() => {
        const handle = requestIdleCallback(() => {
            setIsReady(true);
            const now = new Date();
            const startHour = Math.max(0, now.getHours() - 1);
            const yOffset = startHour * HOUR_HEIGHT;
            setTimeout(() => {
                scrollViewRef.current?.scrollTo({ y: yOffset, animated: false });
            }, 50);
        });
        return () => cancelIdleCallback(handle);
    }, []);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#353B60', '#1C1D2A', '#111116']}
                style={styles.background}
            />

            {isReady && (
                <Animated.ScrollView
                    ref={scrollViewRef as any}
                    style={styles.timelineScrollView}
                    contentContainerStyle={{ paddingTop: HEADER_HEIGHT + 100, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    onScroll={scrollHandler}
                    scrollEventThrottle={16}
                    removeClippedSubviews={true}
                >
                    <View style={styles.timelineLayout}>
                        {hourRows}
                        <View style={styles.sessionsOverlay}>
                            {filteredSessions.map(session => (
                                <SessionBlock
                                    key={session.id}
                                    session={session}
                                    onLongPress={handleSessionLongPress}
                                />
                            ))}
                        </View>
                    </View>
                </Animated.ScrollView>
            )}

            <View style={[StyleSheet.absoluteFill, { zIndex: 6, height: HEADER_HEIGHT + 150 }]} pointerEvents="none">
                <ProgressiveBlur
                    intensity={6}
                    tint="light"
                    overlayColors={['rgba(53, 59, 96, 1)', 'rgba(53, 59, 96, 0.2)']}
                />
            </View>

            <View style={styles.headerContentContainer} pointerEvents="box-none">
                <View style={[styles.header, { paddingTop: insets.top }]}>
                    <View style={styles.headerTop}>
                        <Animated.Text
                            key={todayDateStr}
                            entering={FadeInDown.springify().damping(80)}
                            exiting={FadeOutUp.duration(200)}
                            style={styles.headerDate}
                        >
                            {todayDateStr}
                        </Animated.Text>
                    </View>

                    <View style={styles.weekStripContainer}>
                        <PagerView
                            ref={pagerRef}
                            style={styles.weekPager}
                            initialPage={50}
                            offscreenPageLimit={1}
                            onPageSelected={(e) => setCurrentWeekPage(e.nativeEvent.position)}
                        >
                            {WEEKS_DATA.map((week: any[], weekIx: number) => (
                                <View key={weekIx}>
                                    {Math.abs(weekIx - currentWeekPage) <= PAGE_RENDER_WINDOW ? (
                                        <WeekPage
                                            week={week}
                                            selectedDate={selectedDate}
                                            onSelectDate={setSelectedDate}
                                        />
                                    ) : null}
                                </View>
                            ))}
                        </PagerView>
                    </View>
                </View>
            </View>

            {selectedSession && (
                <Pressable
                    style={[StyleSheet.absoluteFill, { zIndex: 20 }]}
                    onPress={() => setSelectedSession(null)}
                >
                    <View style={styles.menuOverlay}>
                        <GlassContainer
                            intensity={60}
                            tint="dark"
                            style={styles.menuContent}
                            contentStyle={styles.menuInner}
                            borderRadius={24}
                            glassStyle="regular"
                        >
                            <Text style={styles.menuTitle}>{selectedSession.modeTitle}</Text>
                            <Pressable
                                style={styles.deleteMenuItem}
                                onPress={() => {
                                    deleteSession(selectedSession.id);
                                    setSelectedSession(null);
                                    haptics.notifySuccess();
                                }}
                            >
                                <Ionicons name="trash-outline" size={20} color="#FF453A" />
                                <Text style={styles.deleteMenuText}>Elimina Sessione</Text>
                            </Pressable>
                            <Pressable
                                style={styles.cancelMenuItem}
                                onPress={() => setSelectedSession(null)}
                            >
                                <Text style={styles.cancelMenuText}>Annulla</Text>
                            </Pressable>
                        </GlassContainer>
                    </View>
                </Pressable>
            )}
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
    timelineScrollView: {
        flex: 1,
    },
    timelineLayout: {
        flex: 1,
    },
    timelineContent: {
        paddingBottom: 100,
    },
    headerContentContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    header: {
        paddingHorizontal: SIDE_MARGIN,
        paddingBottom: 15,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: NAV_BAR_HEIGHT,
    },
    headerDate: {
        color: '#fff',
        fontSize: 32,
        fontFamily: 'SF-Pro-Rounded-Bold',
    },
    weekStripContainer: {
        height: 60,
        marginTop: 16,
    },
    weekPager: {
        flex: 1,
    },
    weekPage: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: SCREEN_WIDTH - (SIDE_MARGIN * 2),
    },
    dayStripItem: {
        width: (SCREEN_WIDTH - (SIDE_MARGIN * 2) - (GUTTER * 6)) / 7,
        alignItems: 'center',
    },
    dayPill: {
        width: '100%',
        height: 56,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    dayPillToday: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    dayPillSelected: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    dayInit: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 13,
        fontFamily: 'SF-Pro-Rounded-Semibold',
        marginBottom: 2,
    },
    dayNum: {
        color: 'rgba(255, 255, 255, 1)',
        fontSize: 18,
        fontFamily: 'SF-Pro-Rounded-Bold',
    },
    dayTextSelectedNative: {
        color: '#ffffff',
    },
    dayTextSelectedFallback: {
        color: '#000000',
    },
    dayTextActive: {
        color: '#fff',
    },
    hourRow: {
        flexDirection: 'row',
        height: HOUR_HEIGHT,
        alignItems: 'flex-start',
    },
    hourText: {
        width: 70,
        textAlign: 'center',
        color: '#fff',
        fontSize: 16,
        fontFamily: 'SF-Pro-Rounded-Semibold',
        marginTop: -10,
    },
    dottedLineContainer: {
        flex: 1,
        height: 1,
        justifyContent: 'center',
        paddingRight: 20,
    },
    dottedLine: {
        height: 1,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderStyle: 'dashed',
        borderRadius: 1,
    },
    sessionsOverlay: {
        position: 'absolute',
        top: 0,
        left: 70,
        right: 20,
        bottom: 0,
    },
    sessionBlock: {
        position: 'absolute',
        left: 0,
        right: 0,
        borderRadius: 30,
        paddingHorizontal: 20,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    sessionInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sessionModeTitle: {
        color: '#fff',
        fontSize: 18,
        fontFamily: 'SF-Pro-Rounded-Bold',
    },
    sessionDuration: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 16,
        fontFamily: 'SF-Pro-Rounded-Semibold',
    },
    menuOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
        paddingHorizontal: 40,
    },
    menuContent: {
        width: '100%',
        borderRadius: 24,
        overflow: 'hidden',
    },
    menuInner: {
        flex: 0,
        padding: 20,
        alignItems: 'stretch',
    },
    menuTitle: {
        color: '#fff',
        fontSize: 18,
        fontFamily: 'SF-Pro-Rounded-Bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    deleteMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 69, 58, 0.15)',
        paddingVertical: 12,
        borderRadius: 14,
        marginBottom: 10,
    },
    deleteMenuText: {
        color: '#FF453A',
        fontSize: 17,
        fontFamily: 'SF-Pro-Rounded-Bold',
        marginLeft: 8,
    },
    cancelMenuItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    cancelMenuText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 17,
        fontFamily: 'SF-Pro-Rounded-Semibold',
    }
});
