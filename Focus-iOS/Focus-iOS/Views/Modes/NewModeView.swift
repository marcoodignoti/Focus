import SwiftUI

struct NewModeView: View {
    @EnvironmentObject var modesStore: FocusModesStore
    @Environment(\.dismiss) private var dismiss

    @State private var name:         String = ""
    @State private var selectedIcon: String = "flash"
    @State private var duration:     Int    = 25

    private var isSaveDisabled: Bool { name.trimmingCharacters(in: .whitespaces).isEmpty }

    var body: some View {
        NavigationStack {
            ZStack {
                Color(hex: "#111116").ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 32) {
                        // Name
                        sectionLabel("Name")
                        TextField("e.g. Deep Work", text: $name)
                            .font(.system(size: 18, weight: .semibold, design: .rounded))
                            .foregroundColor(.white)
                            .padding(16)
                            .background(Color.white.opacity(0.05))
                            .clipShape(Capsule())
                            .submitLabel(.done)
                            .onSubmit { if !isSaveDisabled { save() } }

                        // Icon
                        sectionLabel("Icon")
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 12) {
                                ForEach(CURATED_ICONS, id: \.self) { icon in
                                    Button {
                                        HapticManager.impactLight()
                                        selectedIcon = icon
                                    } label: {
                                        Image(systemName: sfSymbol(for: icon))
                                            .font(.system(size: 24))
                                            .foregroundColor(selectedIcon == icon ? Color(hex: "#111116") : .white)
                                            .frame(width: 56, height: 56)
                                            .background(selectedIcon == icon ? .white : Color.white.opacity(0.07))
                                            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                                    }
                                }
                            }
                        }

                        // Duration
                        sectionLabel("Duration")
                        RulerPickerView(value: $duration)
                            .frame(height: 100)
                            .background(Color.white.opacity(0.03))
                            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                    }
                    .padding(.horizontal, 24)
                    .padding(.vertical, 16)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .foregroundColor(.white.opacity(0.7))
                }
                ToolbarItem(placement: .principal) {
                    Text("New Mode")
                        .font(.system(size: 20, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }
                        .font(.system(size: 17, weight: .semibold, design: .rounded))
                        .foregroundColor(isSaveDisabled ? .white.opacity(0.3) : .white)
                        .disabled(isSaveDisabled)
                }
            }
        }
        .preferredColorScheme(.dark)
    }

    private func sectionLabel(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 14, weight: .semibold, design: .rounded))
            .tracking(1)
            .foregroundColor(.white.opacity(0.6))
            .textCase(.uppercase)
    }

    private func save() {
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        HapticManager.notifySuccess()
        modesStore.createMode(name: trimmed, duration: duration, icon: selectedIcon)
        dismiss()
    }
}
