import SwiftUI

struct RenameModeView: View {
    @EnvironmentObject var modesStore: FocusModesStore
    @Environment(\.dismiss) private var dismiss

    let mode: FocusMode
    @State private var name: String

    init(mode: FocusMode) {
        self.mode = mode
        _name = State(initialValue: mode.name)
    }

    private var isSaveDisabled: Bool {
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        return trimmed.isEmpty || trimmed == mode.name
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color(hex: "#111116").ignoresSafeArea()

                VStack(alignment: .leading, spacing: 16) {
                    Text("NAME")
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                        .tracking(1)
                        .foregroundColor(.white.opacity(0.6))

                    TextField("e.g. Coding", text: $name)
                        .font(.system(size: 18, weight: .semibold, design: .rounded))
                        .foregroundColor(.white)
                        .padding(16)
                        .background(Color.white.opacity(0.05))
                        .clipShape(Capsule())
                        .submitLabel(.done)
                        .onSubmit { if !isSaveDisabled { save() } }

                    Spacer()
                }
                .padding(.horizontal, 24)
                .padding(.top, 24)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .foregroundColor(.white.opacity(0.7))
                }
                ToolbarItem(placement: .principal) {
                    Text("Rename Mode")
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

    private func save() {
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty, trimmed != mode.name else { return }
        HapticManager.notifySuccess()
        modesStore.updateModeParams(id: mode.id, updates: ModeUpdates(name: trimmed))
        dismiss()
    }
}
