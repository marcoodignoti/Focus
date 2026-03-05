# 🚀 Expo Progressive Blur

This component recreates the modern, layered **Apple-style translucent headers** you’ll find across iOS apps like **Settings**, **Wallet**, and **Music** now entirely in **React Native**

---

## 🧠 Overview

The **Progressive Blur Header** uses:

- **`MaskedView`** → for applying a _gradient-based mask_ on top of the header background.
- **`BlurView` (expo-blur)** → to add real-time iOS-like material blur.
- **`react-native-reanimated`** → to animate the header opacity, scale, and intensity of blur as you scroll.
- **`expo-linear-gradient`** → for the dynamic light-to-dark transitions.
- **`easeGradient` (react-native-easing-gradient)** → for natural easing between color stops.

It’s designed to feel _native_ — blending the blurred background with subtle spring animations and masked gradients that progressively reveal the content below.

## 🧩 Tech Stack

| Library                                                                                          | Purpose                    |
| ------------------------------------------------------------------------------------------------ | -------------------------- |
| [expo-blur](https://docs.expo.dev/versions/latest/sdk/blur-view/)                                | System material blur       |
| [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/)                   | Scroll animations          |
| [expo-linear-gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/)               | Gradient overlays          |
| [@react-native-masked-view/masked-view](https://github.com/react-native-masked-view/masked-view) | Gradient masking           |
| [react-native-easing-gradient](https://github.com/iyegoroff/react-native-easing-gradient)        | Eased gradient transitions |
| [expo-symbols](https://github.com/expo/expo/tree/main/packages/expo-symbols)                     | Native SF Symbols icons    |

---

## 🖼️ Visual Concept

🌀 As you scroll down:

- The **large title** fades out.
- The **compact header** fades in with a **soft spring**.
- The **blur intensity** and **gradient opacity** increase progressively.
- The masked gradient reveals the _translucent material_ underneath, creating that signature _iOS floating glass_ effect.

---

## ⚙️ Using

```bash
git clone https://github.com/rit3zh/expo-progressive-blur
cd expo-progressive-blur
bun install
bun start --reset-cache
```

## ✨ Demo Preview


https://github.com/user-attachments/assets/044032ff-721c-4d03-a22c-487b23e3be8f

