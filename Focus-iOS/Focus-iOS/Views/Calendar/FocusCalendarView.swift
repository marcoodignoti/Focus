import SwiftUI

private let HOUR_HEIGHT: CGFloat = 150
private let SIDE_MARGIN: CGFloat = 16
private let NAV_HEIGHT:  CGFloat = 44
private let ITALIAN_DAYS = ["D", "L", "M", "M", "G", "V", "S"]

struct FocusCalendarView: View {
    @EnvironmentObject var historyStore: FocusHistoryStore
    @EnvironmentObject var uiStore:      UIStateStore

    @State private var currentWeekOffset = 0   // weeks from today
    @State private var selectedSession: FocusSession? = nil
    @State private var showAddSession   = false

    // MARK: – Derived

    private var displayedWeek: [Date] {
        let monday = weekMonday(offset: currentWeekOffset)
        return (0..<7).map { i in
            Calendar.current.date(byAdding: .day, value: i, to: monday)!
        }
    }

    private var filteredSessions: [FocusSession] {
        historyStore.sessions.filter {
            Calendar.current.isDate($0.startDate, inSameDayAs: uiStore.selectedDate)
        }
    }

    private var headerTitle: String {
        let df = DateFormatter()
        df.locale = Locale(identifier: "en_US")
        let months = ["Jan","Feb","Mar","Apr","May","Jun",
                      "Jul","Aug","Sep","Oct","Nov","Dec"]
        let isToday = Calendar.current.isDateInToday(uiStore.selectedDate)
        let m = Calendar.current.component(.month, from: uiStore.selectedDate) - 1
        let d = Calendar.current.component(.day,   from: uiStore.selectedDate)
        return "\(months[m]) \(d)\(isToday ? ", Today" : "")"
    }

    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: [Color(hex: "#353B60"), Color(hex: "#1C1D2A"), Color(hex: "#111116")],
                startPoint: .top,
                endPoint:   .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                // ── Header ────────────────────────────────────────────────────
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Text(headerTitle)
                            .font(.system(size: 32, weight: .bold, design: .rounded))
                            .foregroundColor(.white)
                        Spacer()
                        // Add session button
                        Button {
                            showAddSession = true
                        } label: {
                            Image(systemName: "plus")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.white)
                                .padding(10)
                                .background(.ultraThinMaterial)
                                .clipShape(Circle())
                        }
                        // Clear history button
                        Button {
                            confirmClearHistory()
                        } label: {
                            Image(systemName: "trash")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.white)
                                .padding(10)
                                .background(.ultraThinMaterial)
                                .clipShape(Circle())
                        }
                    }
                    .padding(.top, 12)

                    // Week strip with swipe gesture
                    WeekStripView(
                        week:         displayedWeek,
                        selectedDate: uiStore.selectedDate,
                        onSelect:     { uiStore.selectedDate = $0 },
                        onSwipe:      { delta in currentWeekOffset += delta }
                    )
                }
                .padding(.horizontal, SIDE_MARGIN)
                .padding(.bottom, 16)
                .background(
                    // Frosted blur behind the header
                    LinearGradient(
                        colors: [Color(hex: "#353B60").opacity(0.95), Color(hex: "#353B60").opacity(0)],
                        startPoint: .top, endPoint: .bottom
                    )
                    .ignoresSafeArea()
                )

                // ── Timeline ──────────────────────────────────────────────────
                TimelineView(sessions: filteredSessions) { session in
                    selectedSession = session
                }
            }
        }
        // Session context menu / delete sheet
        .overlay {
            if let session = selectedSession {
                SessionMenuView(session: session) {
                    selectedSession = nil
                } onDelete: {
                    historyStore.deleteSession(id: session.id)
                    HapticManager.notifySuccess()
                    selectedSession = nil
                }
            }
        }
        .sheet(isPresented: $showAddSession) {
            AddSessionView(date: uiStore.selectedDate)
        }
    }

    @State private var showClearAlert = false

    private func confirmClearHistory() {
        let alert = UIAlertController(
            title:   "Svuota Cronologia",
            message: "Sei sicuro di voler eliminare tutte le sessioni del calendario?",
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "Annulla", style: .cancel))
        alert.addAction(UIAlertAction(title: "Svuota", style: .destructive) { _ in
            historyStore.clearHistory()
            HapticManager.notifySuccess()
        })
        // Use connectedScenes to avoid deprecated `windows` API (iOS 15+)
        if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let root  = scene.windows.first?.rootViewController {
            root.present(alert, animated: true)
        }
    }
}

// MARK: – Week strip

private struct WeekStripView: View {
    let week:         [Date]
    let selectedDate: Date
    let onSelect:     (Date) -> Void
    let onSwipe:      (Int) -> Void

    var body: some View {
        HStack(spacing: 0) {
            ForEach(week, id: \.self) { day in
                DayPillView(day: day,
                            isSelected: Calendar.current.isDate(day, inSameDayAs: selectedDate),
                            onTap: { onSelect(day) })
            }
        }
        .gesture(
            DragGesture(minimumDistance: 30)
                .onEnded { g in
                    if g.translation.width < -50 {
                        HapticManager.impactLight()
                        onSwipe(1)
                    } else if g.translation.width > 50 {
                        HapticManager.impactLight()
                        onSwipe(-1)
                    }
                }
        )
    }
}

private struct DayPillView: View {
    let day:        Date
    let isSelected: Bool
    let onTap:      () -> Void

    private var isToday:  Bool { Calendar.current.isDateInToday(day) }
    private var dayInit:  String {
        let idx = Calendar.current.component(.weekday, from: day) - 1
        return ITALIAN_DAYS[idx]
    }
    private var dayNum:   Int { Calendar.current.component(.day, from: day) }

    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 4) {
                Text(dayInit)
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundColor(isSelected ? .white : .white.opacity(0.5))
                Text("\(dayNum)")
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(
                Group {
                    if isSelected {
                        Color.white.opacity(0.25)
                    } else if isToday {
                        Color.white.opacity(0.1)
                    } else {
                        Color.clear
                    }
                }
            )
            .clipShape(Capsule())
        }
    }
}

// MARK: – Timeline

private struct TimelineView: View {
    let sessions:    [FocusSession]
    let onLongPress: (FocusSession) -> Void

    var body: some View {
        ScrollView {
            ZStack(alignment: .topLeading) {
                // Hour rows
                VStack(spacing: 0) {
                    ForEach(0..<25, id: \.self) { h in
                        HourRow(hour: h)
                    }
                }

                // Session blocks (positioned absolutely)
                ForEach(sessions) { session in
                    SessionBlockView(session: session, onLongPress: onLongPress)
                }
                .padding(.leading, 70)
                .padding(.trailing, 20)
            }
            .padding(.bottom, 100)
        }
        .scrollIndicators(.hidden)
    }
}

private struct HourRow: View {
    let hour: Int
    var body: some View {
        HStack(spacing: 0) {
            Text(String(format: "%02d:00", hour))
                .font(.system(size: 16, weight: .semibold, design: .rounded))
                .foregroundColor(.white)
                .frame(width: 70, alignment: .center)
                .offset(y: -10)

            Rectangle()
                .fill(Color.white.opacity(0.2))
                .frame(height: 1)
                .padding(.trailing, 20)
        }
        .frame(height: HOUR_HEIGHT)
    }
}

private struct SessionBlockView: View {
    let session:     FocusSession
    let onLongPress: (FocusSession) -> Void

    private var topOffset: CGFloat {
        let h = Double(Calendar.current.component(.hour,   from: session.startDate))
        let m = Double(Calendar.current.component(.minute, from: session.startDate))
        return CGFloat(h + m / 60) * HOUR_HEIGHT
    }

    private var height: CGFloat {
        max(50, CGFloat(session.duration) * HOUR_HEIGHT / 60)
    }

    private var color: Color { Color(hex: session.color) }

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(session.modeTitle)
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                Text("\(session.duration) min")
                    .font(.system(size: 16, weight: .semibold, design: .rounded))
                    .foregroundColor(.white.opacity(0.9))
            }
            .padding(.horizontal, 20)
            Spacer()
        }
        .frame(maxWidth: .infinity)
        .frame(height: height)
        .background(color)
        .clipShape(RoundedRectangle(cornerRadius: 30, style: .continuous))
        .shadow(color: .black.opacity(0.3), radius: 8, x: 0, y: 4)
        .offset(y: topOffset)
        .onLongPressGesture(minimumDuration: 0.5) {
            HapticManager.impactMedium()
            onLongPress(session)
        }
    }
}

// MARK: – Session context menu

private struct SessionMenuView: View {
    let session:  FocusSession
    let onCancel: () -> Void
    let onDelete: () -> Void

    var body: some View {
        ZStack {
            Color.black.opacity(0.4)
                .ignoresSafeArea()
                .onTapGesture { onCancel() }

            VStack {
                Spacer()
                GlassCard(cornerRadius: 24) {
                    VStack(spacing: 0) {
                        Text(session.modeTitle)
                            .font(.system(size: 18, weight: .bold, design: .rounded))
                            .foregroundColor(.white)
                            .padding(.top, 20)
                            .padding(.bottom, 16)

                        Divider().background(Color.white.opacity(0.1))

                        Button(action: onDelete) {
                            HStack {
                                Image(systemName: "trash")
                                    .foregroundColor(Color(hex: "#FF453A"))
                                Text("Elimina Sessione")
                                    .font(.system(size: 17, weight: .bold, design: .rounded))
                                    .foregroundColor(Color(hex: "#FF453A"))
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color(hex: "#FF453A").opacity(0.15))
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)

                        Button(action: onCancel) {
                            Text("Annulla")
                                .font(.system(size: 17, weight: .semibold, design: .rounded))
                                .foregroundColor(.white.opacity(0.6))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                        }
                        .padding(.horizontal, 16)
                        .padding(.bottom, 8)
                    }
                }
                .padding(.horizontal, 40)
                .padding(.bottom, 40)
            }
        }
    }
}

// MARK: – Helpers

private func weekMonday(offset: Int) -> Date {
    // Find the Monday of the current week, then add `offset` weeks.
    let cal    = Calendar(identifier: .iso8601)  // ISO 8601 starts weeks on Monday
    let today  = Date()
    let monday = cal.date(from: cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: today))!
    return cal.date(byAdding: .weekOfYear, value: offset, to: monday)!
}
