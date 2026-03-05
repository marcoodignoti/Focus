import UIKit

enum HapticManager {
    static func selection() {
        UISelectionFeedbackGenerator().selectionChanged()
    }

    static func impactLight() {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
    }

    static func impactMedium() {
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }

    static func notifySuccess() {
        UINotificationFeedbackGenerator().notificationOccurred(.success)
    }

    static func notifyWarning() {
        UINotificationFeedbackGenerator().notificationOccurred(.warning)
    }
}
