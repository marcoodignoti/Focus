import SwiftUI

private let DIGIT_HEIGHT: CGFloat = 100
private let DIGIT_WIDTH: CGFloat  = 55

/// One scrolling digit column (0-9).
private struct AnimatedDigit: View {
    let value: Int

    var body: some View {
        // Clip window to one digit height
        ZStack {
            VStack(spacing: 0) {
                ForEach(0..<10, id: \.self) { n in
                    Text("\(n)")
                        .font(.system(size: 90, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                        .frame(width: DIGIT_WIDTH, height: DIGIT_HEIGHT)
                }
            }
            // Slide so that `value` row is visible
            .offset(y: -CGFloat(value) * DIGIT_HEIGHT)
            .animation(.timingCurve(0.33, 0, 0.00, 1.0, duration: 0.3), value: value)
        }
        .frame(width: DIGIT_WIDTH, height: DIGIT_HEIGHT)
        .clipped()
    }
}

/// Four-digit MM:SS countdown display with rolling animations.
struct TimerDisplayView: View {
    /// Total seconds for the current interval (used to compute initial display).
    let totalSeconds: Double
    /// Current seconds remaining.
    let timeRemaining: Double

    private var displayed: Int { max(0, Int(ceil(timeRemaining))) }

    private var min1: Int { (displayed / 60) / 10 }
    private var min2: Int { (displayed / 60) % 10 }
    private var sec1: Int { (displayed % 60) / 10 }
    private var sec2: Int { (displayed % 60) % 10 }

    var body: some View {
        HStack(spacing: 0) {
            AnimatedDigit(value: min1)
            AnimatedDigit(value: min2)
            Text(":")
                .font(.system(size: 90, weight: .bold, design: .rounded))
                .foregroundColor(.white)
                .frame(width: 30, height: DIGIT_HEIGHT)
            AnimatedDigit(value: sec1)
            AnimatedDigit(value: sec2)
        }
        .frame(height: DIGIT_HEIGHT)
    }
}
