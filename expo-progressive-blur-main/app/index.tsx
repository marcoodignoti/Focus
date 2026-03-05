import MaskedView from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { SFSymbol, SymbolView } from "expo-symbols";
import React, { useState } from "react";
import {
  Appearance,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { easeGradient } from "react-native-easing-gradient";
import Animated, {
  Extrapolate,
  Extrapolation,
  interpolate,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

Appearance.setColorScheme("dark");
const { width } = Dimensions.get("window");
const MaxBlurIntensity = 50;

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

const HeroCard: React.FC = () => (
  <TouchableOpacity activeOpacity={0.96} style={styles.heroCard}>
    <View style={styles.heroPattern}>
      <View style={styles.patternDot} />
      <View style={[styles.patternDot, { top: 20, left: 40 }]} />
      <View style={[styles.patternDot, { top: 40, left: 20 }]} />
    </View>
    <LinearGradient
      colors={["rgba(255,255,255,0.05)", "rgba(255,255,255,0.01)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.heroGradient}
    >
      <View style={styles.heroHeader}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>FEATURED</Text>
        </View>
        <SymbolView
          name="arrow.up.forward"
          size={18}
          type="monochrome"
          tintColor="rgba(255,255,255,0.4)"
        />
      </View>

      <View style={styles.heroContent}>
        <Text style={styles.heroTitle}>Design System</Text>
        <Text style={styles.heroSubtitle}>
          Crafted components for modern interfaces
        </Text>

        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>24</Text>
            <Text style={styles.heroStatLabel}>Components</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>8.4k</Text>
            <Text style={styles.heroStatLabel}>Users</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>99%</Text>
            <Text style={styles.heroStatLabel}>Uptime</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

const MetricCards: React.FC = () => {
  const metrics = [
    { label: "Revenue", value: "$48.2k", change: "+12.5%", positive: true },
    { label: "Active Users", value: "2,847", change: "+8.2%", positive: true },
  ];

  return (
    <View style={styles.metricsContainer}>
      {metrics.map((metric, index) => (
        <TouchableOpacity
          key={index}
          activeOpacity={0.95}
          style={styles.metricCard}
        >
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>{metric.label}</Text>
            <View
              style={[
                styles.metricBadge,
                metric.positive
                  ? styles.metricBadgePositive
                  : styles.metricBadgeNegative,
              ]}
            >
              <SymbolView
                name={metric.positive ? "arrow.up.right" : "arrow.down.right"}
                size={10}
                type="monochrome"
                tintColor={metric.positive ? "#4ADE80" : "#F87171"}
              />
              <Text
                style={[
                  styles.metricChange,
                  { color: metric.positive ? "#4ADE80" : "#F87171" },
                ]}
              >
                {metric.change}
              </Text>
            </View>
          </View>
          <Text style={styles.metricValue}>{metric.value}</Text>
          <View style={styles.metricGraph}>
            {[...Array(7)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.metricBar,
                  {
                    height: Math.random() * 20 + 10,
                    opacity: i === 6 ? 1 : 0.3,
                  },
                ]}
              />
            ))}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const ActionButtons: React.FC = () => {
  const [activeButton, setActiveButton] = useState<string | null>(null);

  const actions = [
    { id: "scan", icon: "qrcode.viewfinder" as SFSymbol, label: "Scan" },
    { id: "send", icon: "paperplane.fill" as SFSymbol, label: "Send" },
    { id: "wallet", icon: "creditcard.fill" as SFSymbol, label: "Cards" },
    { id: "more", icon: "circle.grid.3x3.fill" as SFSymbol, label: "More" },
  ];

  return (
    <View style={styles.actionsContainer}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.id}
          activeOpacity={0.7}
          onPressIn={() => setActiveButton(action.id)}
          onPressOut={() => setActiveButton(null)}
          style={styles.actionButton}
        >
          <View
            style={[
              styles.actionIconContainer,
              activeButton === action.id && styles.actionIconActive,
            ]}
          >
            <SymbolView
              name={action.icon}
              size={22}
              type="monochrome"
              tintColor="rgba(255,255,255,0.9)"
            />
          </View>
          <Text style={styles.actionLabel}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const RecentActivity: React.FC = () => {
  const activities = [
    {
      icon: "cube.fill" as SFSymbol,
      title: "New component added",
      subtitle: "Button group with variants",
      time: "2h ago",
      iconColor: "rgba(168, 162, 158, 0.2)",
    },
    {
      icon: "sparkles" as SFSymbol,
      title: "Theme updated",
      subtitle: "Dark mode improvements",
      time: "5h ago",
      iconColor: "rgba(168, 162, 158, 0.2)",
    },
    {
      icon: "arrow.triangle.2.circlepath" as SFSymbol,
      title: "System sync",
      subtitle: "All changes synchronized",
      time: "1d ago",
      iconColor: "rgba(168, 162, 158, 0.2)",
    },
  ];

  return (
    <View style={styles.activityContainer}>
      <View style={styles.activityHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <TouchableOpacity>
          <Text style={styles.viewAllText}>View all</Text>
        </TouchableOpacity>
      </View>

      {activities.map((activity, index) => (
        <TouchableOpacity
          key={index}
          activeOpacity={0.8}
          style={styles.activityItem}
        >
          <View
            style={[
              styles.activityIcon,
              { backgroundColor: activity.iconColor },
            ]}
          >
            <SymbolView
              name={activity.icon}
              size={18}
              type="monochrome"
              tintColor="rgba(255,255,255,0.6)"
            />
          </View>
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>{activity.title}</Text>
            <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
          </View>
          <Text style={styles.activityTime}>{activity.time}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const FloatingAction: React.FC = () => (
  <TouchableOpacity activeOpacity={0.9} style={styles.floatingButton}>
    <View style={styles.floatingInner}>
      <SymbolView
        name="plus"
        size={20}
        type="monochrome"
        tintColor="rgba(255,255,255,0.9)"
      />
    </View>
  </TouchableOpacity>
);

export default function Index(): React.JSX.Element {
  const scrollY = useSharedValue(0);

  const { colors, locations } = easeGradient({
    colorStops: {
      1: { color: "transparent" },
      0: { color: "rgba(0,0,0,0.99)" },
      0.5: { color: "black" },
    },
  });

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const largeTitleStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 60],
      [1, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
    };
  });

  const smallHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [40, 80],
      [0, 1],
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [40, 80],
      [20, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const smallHeaderSubTitleStyle = useAnimatedStyle(() => {
    const shouldShow = scrollY.value > 70;

    return {
      opacity: withSpring(shouldShow ? 0.5 : 0, {
        damping: 18,
        stiffness: 120,
        mass: 1.2,
      }),
      transform: [
        {
          translateY: withSpring(shouldShow ? 0 : 30, {
            damping: 14,
            stiffness: 100,
            mass: 1,
          }),
        },
        {
          scale: withSpring(shouldShow ? 1 : 0.85, {
            damping: 16,
            stiffness: 150,
            mass: 0.8,
          }),
        },
      ],
    };
  });

  const headerBackgroundStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 80],
      [0, 1],
      Extrapolate.CLAMP
    );

    return {
      opacity,
    };
  });

  const animatedHeaderBlur = useAnimatedProps(() => {
    const opacity = interpolate(
      scrollY.value,
      [100, 0],
      [0, 1],
      Extrapolate.CLAMP
    );

    return {
      intensity: opacity * MaxBlurIntensity,
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 150,
            zIndex: 10,
          },
          headerBackgroundStyle,
        ]}
      >
        <MaskedView
          maskElement={
            <LinearGradient
              locations={locations as any}
              colors={colors as any}
              style={StyleSheet.absoluteFill}
            />
          }
          style={[StyleSheet.absoluteFill]}
        >
          <LinearGradient
            colors={["black", "rgba(0, 0, 0, 0.2)"]}
            style={StyleSheet.absoluteFill}
          />
          <BlurView
            intensity={15}
            tint={
              Platform.OS === "ios"
                ? "systemChromeMaterialDark"
                : "systemMaterialDark"
            }
            style={[StyleSheet.absoluteFill]}
          />
        </MaskedView>
      </Animated.View>

      <Animated.View style={[styles.fixedHeader, smallHeaderStyle]}>
        <View style={styles.fixedHeaderContent}>
          <Animated.Text style={[styles.smallHeaderTitle]}>
            Overview
          </Animated.Text>
          <Animated.Text
            style={[styles.smallHeaderSubtitle, smallHeaderSubTitleStyle]}
          >
            Your digital workspace
          </Animated.Text>
        </View>
        <TouchableOpacity style={styles.smallProfileButton}>
          <View style={styles.profileButton}>
            <SymbolView
              name="person.fill"
              size={14}
              type="monochrome"
              tintColor="rgba(255,255,255,0.8)"
            />
          </View>
        </TouchableOpacity>
        <AnimatedBlurView
          animatedProps={animatedHeaderBlur}
          tint={Platform.OS === "ios" ? "dark" : "systemMaterialDark"}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={onScroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Animated.View style={largeTitleStyle}>
            <Animated.Text style={styles.headerTitle}>Overview</Animated.Text>
            <Text style={styles.date}>YOUR DIGITAL WORKSPACE</Text>
          </Animated.View>
        </View>

        <HeroCard />
        <MetricCards />
        <ActionButtons />
        <RecentActivity />
        <FloatingAction />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  fixedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    paddingTop: 60,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 11,
    overflow: "hidden",
  },
  fixedHeaderContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  smallHeaderTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
  smallHeaderSubtitle: {
    fontSize: 12,
    fontWeight: "400",
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
  },
  smallProfileButton: {
    position: "absolute",
    right: 20,
    top: 58,
  },
  profileButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 100,
    paddingBottom: 24,
  },
  date: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.3)",
    paddingTop: 4,
    paddingLeft: 4,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: "700",
    color: "rgba(255,255,255,0.95)",
    marginTop: 6,
    letterSpacing: -0.5,
    paddingLeft: 2,
  },

  heroCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    backgroundColor: "#111111",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  heroGradient: {
    padding: 24,
  },
  heroPattern: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    opacity: 0.03,
  },
  patternDot: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  heroBadge: {
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 0.8,
  },
  heroContent: {
    gap: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "rgba(255,255,255,0.95)",
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 22,
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  heroStat: {
    flex: 1,
    alignItems: "center",
  },
  heroStatValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
    marginBottom: 4,
  },
  heroStatLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "500",
  },
  heroStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  metricsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#111111",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },
  metricBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metricBadgePositive: {
    backgroundColor: "rgba(74, 222, 128, 0.1)",
  },
  metricBadgeNegative: {
    backgroundColor: "rgba(248, 113, 113, 0.1)",
  },
  metricChange: {
    fontSize: 10,
    fontWeight: "600",
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "rgba(255,255,255,0.95)",
    marginBottom: 12,
  },
  metricGraph: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 30,
    gap: 3,
  },
  metricBar: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 2,
  },

  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  actionButton: {
    alignItems: "center",
    gap: 8,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  actionIconActive: {
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.5)",
  },

  activityContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: -0.3,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.3)",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111111",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
  },
  activityTime: {
    fontSize: 11,
    color: "rgba(255,255,255,0.25)",
    fontWeight: "500",
  },

  floatingButton: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
  },
  floatingInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
});
