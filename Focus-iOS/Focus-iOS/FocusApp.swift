import SwiftUI

@main
struct FocusApp: App {
    @StateObject private var modesStore   = FocusModesStore()
    @StateObject private var historyStore = FocusHistoryStore()
    @StateObject private var uiStore      = UIStateStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(modesStore)
                .environmentObject(historyStore)
                .environmentObject(uiStore)
        }
    }
}
