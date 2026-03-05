import SwiftUI

// MARK: – Constants
private let MIN_VALUE:        Int     = 1
private let MAX_VALUE:        Int     = 120
private let TICK_SPACING:     CGFloat = 16
private let INDICATOR_WIDTH:  CGFloat = 11

/// A horizontal ruler picker that snaps every 5 minutes and triggers haptics.
struct RulerPickerView: View {
    @Binding var value: Int

    var body: some View {
        GeometryReader { geo in
            let containerWidth = geo.size.width
            let spacerWidth    = (containerWidth - TICK_SPACING) / 2

            ZStack(alignment: .center) {
                ScrollViewReader { proxy in
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 0) {
                            // Left spacer so first tick is centred
                            Color.clear.frame(width: spacerWidth)

                            ForEach(MIN_VALUE...MAX_VALUE, id: \.self) { v in
                                TickView(tickValue: v, currentValue: value)
                                    .frame(width: TICK_SPACING)
                                    .id(v)
                            }

                            // Right spacer
                            Color.clear.frame(width: spacerWidth)
                        }
                    }
                    .onAppear {
                        proxy.scrollTo(value, anchor: .center)
                    }
                    // Use coordinateSpace to detect scroll position
                    .coordinateSpace(name: "rulerScroll")
                    .background(
                        GeometryReader { inner in
                            Color.clear.preference(
                                key:   ScrollOffsetKey.self,
                                value: -inner.frame(in: .named("rulerScroll")).minX
                            )
                        }
                    )
                    .onPreferenceChange(ScrollOffsetKey.self) { offset in
                        let raw     = Int(round(offset / TICK_SPACING)) + MIN_VALUE
                        let clamped = max(MIN_VALUE, min(MAX_VALUE, raw))
                        if clamped != value {
                            if clamped % 5 == 0 { HapticManager.selection() }
                            value = clamped
                        }
                    }
                }

                // Centre indicator
                Rectangle()
                    .fill(Color(hex: "#FF453A"))
                    .frame(width: INDICATOR_WIDTH, height: geo.size.height * 0.5)
                    .clipShape(Capsule())
                    .allowsHitTesting(false)
            }
        }
    }
}

// MARK: – Tick view

private struct TickView: View {
    let tickValue:   Int
    let currentValue: Int

    private var isMajor:  Bool { tickValue % 5 == 0 }
    private var distance: Int  { abs(tickValue - currentValue) }

    private var opacity: Double {
        let d = Double(distance)
        return max(0.15, 1.0 - d / 15.0)
    }

    var body: some View {
        VStack(spacing: 0) {
            if isMajor {
                Text("\(tickValue)")
                    .font(.system(size: distance == 0 ? 28 : 18, weight: .bold, design: .rounded))
                    .foregroundColor(.white.opacity(opacity))
                    .frame(height: 40)
                    .scaleEffect(distance == 0 ? 1.3 : 1.0)
                    .animation(.spring(response: 0.2, dampingFraction: 0.7), value: distance == 0)
            } else {
                Color.clear.frame(height: 40)
            }

            Capsule()
                .fill(Color.white.opacity(0.4 * opacity))
                .frame(width: 7, height: isMajor ? 28 : 14)
        }
    }
}

// MARK: – Preference key for scroll offset

private struct ScrollOffsetKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = nextValue()
    }
}
