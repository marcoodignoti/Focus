import SwiftUI

struct ModeSelectionView: View {
    @EnvironmentObject var modesStore: FocusModesStore
    @EnvironmentObject var uiStore:    UIStateStore

    @State private var showNewMode    = false
    @State private var renameTarget:  FocusMode? = nil

    var body: some View {
        ZStack {
            // Backdrop
            Color.black.opacity(0.5)
                .ignoresSafeArea()
                .onTapGesture { uiStore.isModeSelectionVisible = false }

            VStack(spacing: 0) {
                Spacer()

                GlassCard(cornerRadius: 32) {
                    VStack(spacing: 0) {
                        // Title bar
                        HStack {
                            Text("Modes")
                                .font(.system(size: 20, weight: .bold, design: .rounded))
                                .foregroundColor(.white)
                            Spacer()
                            // Close button
                            Button {
                                HapticManager.impactLight()
                                uiStore.isModeSelectionVisible = false
                            } label: {
                                Image(systemName: "xmark")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(.white.opacity(0.7))
                                    .padding(10)
                                    .background(.ultraThinMaterial)
                                    .clipShape(Circle())
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 20)
                        .padding(.bottom, 12)

                        // Mode list
                        ScrollView {
                            LazyVStack(spacing: 2) {
                                ForEach(modesStore.modes) { mode in
                                    ModeRowView(
                                        mode:      mode,
                                        isCurrent: mode.id == modesStore.currentMode.id,
                                        isDefault: mode.id == modesStore.defaultModeId,
                                        onSelect: {
                                            HapticManager.selection()
                                            modesStore.setCurrentMode(mode)
                                            modesStore.resetTimer()
                                            uiStore.isModeSelectionVisible = false
                                        },
                                        onRename: {
                                            renameTarget = mode
                                        },
                                        onSetDefault: {
                                            modesStore.setDefaultMode(id: mode.id, isActive: false)
                                            HapticManager.impactLight()
                                        },
                                        onDelete: {
                                            modesStore.deleteMode(id: mode.id, isActive: false)
                                            HapticManager.impactMedium()
                                        }
                                    )
                                }
                            }
                            .padding(.horizontal, 12)
                        }
                        .frame(maxHeight: 300)

                        // Add new mode button
                        Button {
                            HapticManager.impactLight()
                            showNewMode = true
                        } label: {
                            HStack {
                                Image(systemName: "plus.circle.fill")
                                Text("New Mode")
                                    .font(.system(size: 17, weight: .semibold, design: .rounded))
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color.white.opacity(0.08))
                            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 16)
                    }
                }
                .padding(.horizontal, 8)
                .padding(.bottom, 12)
            }
        }
        .sheet(isPresented: $showNewMode) {
            NewModeView()
        }
        .sheet(item: $renameTarget) { mode in
            RenameModeView(mode: mode)
        }
    }
}

// MARK: – Mode row

private struct ModeRowView: View {
    let mode:        FocusMode
    let isCurrent:   Bool
    let isDefault:   Bool
    let onSelect:    () -> Void
    let onRename:    () -> Void
    let onSetDefault:() -> Void
    let onDelete:    () -> Void

    var body: some View {
        HStack(spacing: 12) {
            // Icon
            ZStack {
                Circle()
                    .fill(getIconColor(mode.icon).opacity(0.2))
                    .frame(width: 40, height: 40)
                Image(systemName: sfSymbol(for: mode.icon))
                    .font(.system(size: 16))
                    .foregroundColor(getIconColor(mode.icon))
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(mode.name)
                    .font(.system(size: 16, weight: .semibold, design: .rounded))
                    .foregroundColor(.white)
                Text("\(mode.duration) min")
                    .font(.system(size: 13, design: .rounded))
                    .foregroundColor(.white.opacity(0.5))
            }

            Spacer()

            // Default star
            if isDefault {
                Image(systemName: "star.fill")
                    .font(.system(size: 14))
                    .foregroundColor(Color(hex: "#FFD60A"))
            }

            // Checkmark if current
            if isCurrent {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 20))
                    .foregroundColor(.white)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(isCurrent ? Color.white.opacity(0.08) : Color.clear)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .contentShape(Rectangle())
        .onTapGesture(perform: onSelect)
        .contextMenu {
            Button { onRename() }    label: { Label("Rename",      systemImage: "pencil") }
            Button { onSetDefault() } label: { Label("Set as Default", systemImage: "star") }
            Divider()
            Button(role: .destructive) { onDelete() } label: { Label("Delete", systemImage: "trash") }
        }
    }
}
