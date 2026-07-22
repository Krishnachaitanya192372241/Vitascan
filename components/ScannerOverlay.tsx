// components/ScannerOverlay.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import Colors from '@/constants/Colors';

const { width } = Dimensions.get('window');
const SCANNER_SIZE = width * 0.7;

export const ScannerOverlay = () => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(SCANNER_SIZE, {
        duration: 2000,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true
    );
  }, []);

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Corner Brackets */}
      <View style={[styles.corner, styles.topLeft]} />
      <View style={[styles.corner, styles.topRight]} />
      <View style={[styles.corner, styles.bottomLeft]} />
      <View style={[styles.corner, styles.bottomRight]} />

      {/* Animated Scan Line */}
      <Animated.View style={[styles.scanLine, lineStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    position: 'relative',
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.primary,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  scanLine: {
    height: 2,
    width: '100%',
    backgroundColor: Colors.primary,
  }
});
