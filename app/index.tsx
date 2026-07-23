// app/index.tsx
import React, { useEffect } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { GradientBackground } from '@/components/ui/GradientBackground';

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      router.replace('/welcome');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <GradientBackground>
      <View className="flex-1 items-center justify-center">
        <Animated.View 
          style={{ 
            opacity: fadeAnim, 
            transform: [{ scale: scaleAnim }] 
          }}
          className="items-center"
        >
          <View className="w-32 h-32 bg-primary rounded-3xl items-center justify-center shadow-2xl shadow-primary/50 mb-6">
            <Text className="text-white text-5xl font-bold">VS</Text>
          </View>
          <Text className="text-white text-4xl font-premium font-bold tracking-widest">VITASCAN</Text>
          <Text className="text-emerald-400 font-premium mt-2 tracking-widest text-sm opacity-80">AI HEALTH INTELLIGENCE</Text>
        </Animated.View>
      </View>
    </GradientBackground>
  );
}
