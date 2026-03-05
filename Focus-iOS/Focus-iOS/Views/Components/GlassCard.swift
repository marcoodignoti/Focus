import SwiftUI

/// A rounded glass-effect card backed by `.ultraThinMaterial`.
/// On older OS versions the material degrades gracefully.
struct GlassCard<Content: View>: View {
    var cornerRadius: CGFloat
    var content: () -> Content

    init(cornerRadius: CGFloat = 24, @ViewBuilder content: @escaping () -> Content) {
        self.cornerRadius = cornerRadius
        self.content = content
    }

    var body: some View {
        content()
            .background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
    }
}
