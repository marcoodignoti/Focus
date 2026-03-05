# Focus – Native iOS (Swift / SwiftUI)

This directory contains a complete **Swift / SwiftUI** rewrite of the original React Native / Expo *Focus* app.

## Requirements

| Tool | Minimum version |
|------|----------------|
| Xcode | 15.3 + |
| iOS Deployment Target | 17.0 |
| Swift | 5.9 |

## Project structure

```
Focus-iOS/
├── Focus-iOS.xcodeproj/        ← Xcode project (open this)
└── Focus-iOS/                  ← All Swift source files
    ├── FocusApp.swift           ← @main entry point
    ├── Info.plist
    ├── Assets.xcassets/
    ├── Models/
    │   ├── FocusMode.swift      ← FocusMode, PomodoroPhase/State structs
    │   └── FocusSession.swift   ← FocusSession struct
    ├── Stores/
    │   ├── FocusModesStore.swift   ← Mode list + pomodoro state (UserDefaults)
    │   ├── FocusHistoryStore.swift ← Session history (UserDefaults)
    │   └── UIStateStore.swift      ← Transient UI flags & selected date
    ├── Utils/
    │   ├── Constants.swift      ← Icon→SF Symbol map, icon colours
    │   ├── Color+Hex.swift      ← SwiftUI Color initialiser from hex string
    │   └── HapticManager.swift  ← UIKit haptic wrappers
    └── Views/
        ├── ContentView.swift    ← Root TabView (swipeable pages)
        ├── Components/
        │   └── GlassCard.swift  ← Rounded .ultraThinMaterial container
        ├── Timer/
        │   ├── TimerView.swift       ← Pomodoro screen with hold-to-stop
        │   ├── TimerDisplayView.swift← Rolling MM:SS digit display
        │   ├── StartButtonView.swift ← Spring-animated glass button
        │   └── ModeSelectorView.swift← Current-mode pill button
        ├── Modes/
        │   ├── ModeSelectionView.swift ← Mode list overlay (select / rename / delete)
        │   ├── NewModeView.swift       ← Sheet: create a mode
        │   ├── RenameModeView.swift    ← Sheet: rename a mode
        │   ├── RulerPickerView.swift   ← Horizontal snapping duration ruler
        │   └── RulerOverlayView.swift  ← Bottom sheet wrapping the ruler
        └── Calendar/
            ├── FocusCalendarView.swift ← Week strip + 24 h timeline
            └── AddSessionView.swift    ← Sheet: manually add a session
```

## Feature parity with the React Native version

| Feature | React Native | SwiftUI |
|---------|-------------|---------|
| Pomodoro timer (focus / short break / long break) | ✅ | ✅ |
| Hold-to-stop (3 s progress bar) | ✅ | ✅ |
| Animated rolling digit display (MM:SS) | ✅ | ✅ |
| Mode selector & mode creation / rename / delete | ✅ | ✅ |
| Duration ruler picker (1 – 120 min, snaps every 5) | ✅ | ✅ |
| Swipeable week strip calendar (101 weeks) | ✅ | ✅ |
| 24 h timeline with colour-coded session blocks | ✅ | ✅ |
| Long-press to delete a session | ✅ | ✅ |
| Manually add a session with time & duration pickers | ✅ | ✅ |
| Clear all history | ✅ | ✅ |
| Persist all data across launches (UserDefaults / AsyncStorage) | ✅ | ✅ |
| Dark mode only | ✅ | ✅ |
| Haptic feedback | ✅ | ✅ |
| Glass-morphism UI (.ultraThinMaterial) | ✅* | ✅ |

*The React Native version uses `expo-glass-effect` (iOS 26 API); the SwiftUI version uses `.ultraThinMaterial` which works on all iOS 17+ devices.

## Running the app

1. Open `Focus-iOS/Focus-iOS.xcodeproj` in Xcode.
2. Select your target device or simulator (iOS 17+).
3. Press **⌘ R** to build and run.

No third-party dependencies are required — the app uses only SwiftUI, UIKit, and Foundation from the Apple SDK.
