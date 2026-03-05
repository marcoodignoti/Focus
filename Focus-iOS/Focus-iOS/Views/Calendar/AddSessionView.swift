import SwiftUI

struct AddSessionView: View {
    @EnvironmentObject var modesStore:   FocusModesStore
    @EnvironmentObject var historyStore: FocusHistoryStore
    @Environment(\.dismiss) private var dismiss

    let date: Date

    @State private var selectedMode: FocusMode
    @State private var startTime: Date
    @State private var duration: Int

    init(date: Date) {
        self.date = date
        let first = FocusMode.defaults[0]
        _selectedMode = State(initialValue: first)
        _duration     = State(initialValue: first.duration)
        let cal = Calendar.current
        let d   = cal.date(bySettingHour: cal.component(.hour, from: date),
                           minute: 0, second: 0, of: date) ?? date
        _startTime = State(initialValue: d)
    }


    var body: some View {
        NavigationStack {
            ZStack {
                Color(hex: "#111116").ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 28) {

                        // Mode picker
                        sectionLabel("Modalità")
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 10) {
                                ForEach(modesStore.modes) { mode in
                                    let isActive = mode.id == selectedMode.id
                                    let color    = getIconColor(mode.icon)
                                    Button {
                                        HapticManager.impactLight()
                                        selectedMode = mode
                                        duration     = mode.duration
                                    } label: {
                                        HStack(spacing: 8) {
                                            Image(systemName: sfSymbol(for: mode.icon))
                                                .font(.system(size: 16))
                                                .foregroundColor(isActive ? Color(hex: "#111116") : .white)
                                            Text(mode.name)
                                                .font(.system(size: 15, weight: .semibold, design: .rounded))
                                                .foregroundColor(isActive ? Color(hex: "#111116") : .white)
                                        }
                                        .padding(.horizontal, 16)
                                        .padding(.vertical, 10)
                                        .background(isActive ? color : Color.white.opacity(0.08))
                                        .clipShape(Capsule())
                                    }
                                }
                            }
                        }

                        // Start time
                        sectionLabel("Ora di inizio")
                        DatePicker("", selection: $startTime, displayedComponents: .hourAndMinute)
                            .datePickerStyle(.wheel)
                            .labelsHidden()
                            .colorScheme(.dark)
                            .frame(maxWidth: .infinity)
                            .background(Color.white.opacity(0.03))
                            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))

                        // Duration
                        sectionLabel("Durata · \(duration) min")
                        RulerPickerView(value: $duration)
                            .frame(height: 100)
                            .background(Color.white.opacity(0.03))
                            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                    }
                    .padding(.horizontal, 24)
                    .padding(.top, 16)
                    .padding(.bottom, 40)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Annulla") { dismiss() }
                        .foregroundColor(.white.opacity(0.7))
                }
                ToolbarItem(placement: .principal) {
                    Text("Nuova Sessione")
                        .font(.system(size: 20, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Salva") { save() }
                        .font(.system(size: 17, weight: .semibold, design: .rounded))
                        .foregroundColor(.white)
                }
            }
        }
        .preferredColorScheme(.dark)
        .onAppear {
            // Sync selected mode to the first mode in the store
            if let first = modesStore.modes.first {
                selectedMode = first
                duration     = first.duration
            }
        }
    }

    private func sectionLabel(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 14, weight: .semibold, design: .rounded))
            .tracking(1)
            .foregroundColor(.white.opacity(0.6))
            .textCase(.uppercase)
    }

    private func save() {
        HapticManager.notifySuccess()
        // Merge the selected time into the date
        let cal  = Calendar.current
        var comps = cal.dateComponents([.year, .month, .day], from: date)
        comps.hour   = cal.component(.hour,   from: startTime)
        comps.minute = cal.component(.minute, from: startTime)
        let finalDate = cal.date(from: comps) ?? startTime

        historyStore.addSession(
            modeId:    selectedMode.id,
            modeTitle: selectedMode.name,
            color:     getIconColorHex(selectedMode.icon),
            startTime: finalDate.timeIntervalSince1970 * 1000,
            duration:  duration
        )
        dismiss()
    }
}
