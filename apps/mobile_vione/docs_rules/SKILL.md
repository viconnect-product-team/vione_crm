---
name: vione-mobile-skills
description: Kỹ năng và tiêu chuẩn lập trình dành cho Mobile Native React Native ViOne
---

# KỸ NĂNG & TIÊU CHUẨN REACT NATIVE VIONE (MOBILE)

## 1. Công nghệ & Thư viện
- React Native 0.74+ / Expo SDK 51.
- TypeScript, StyleSheet chuẩn React Native (hạn chế style inline).
- React Navigation (BottomTabs, Stack Navigator).
- `@react-native-async-storage/async-storage` cho lưu trữ offline và session AI.
- `lucide-react-native` cho icon vector sắc nét.
- Android SDK Build Tools 34.0.0, Gradle 8.3+.

## 2. Kỹ năng vận hành Native & Hiệu năng
- Tối ưu FlatList và ScrollView: `removeClippedSubviews`, `initialNumToRender`, `maxToRenderPerBatch`.
- Quản lý bộ nhớ và tránh rerender: `useMemo`, `useCallback`.
- Build APK Native tối ưu: `./gradlew assembleRelease` với proguard/minify.
