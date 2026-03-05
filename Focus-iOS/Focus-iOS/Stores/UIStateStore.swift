import Foundation

class UIStateStore: ObservableObject {
    @Published var isModeSelectionVisible = false
    @Published var isRulerVisible         = false
    @Published var selectedDate: Date     = Date()
}
