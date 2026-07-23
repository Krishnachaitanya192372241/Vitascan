// app/welcome.tsx
import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { GradientBackground } from '@/components/ui/GradientBackground';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-8 justify-between py-12">
          <View className="items-center mt-8">
            <View className="w-full h-80 rounded-3xl overflow-hidden bg-slate-800/50 items-center justify-center border border-white/10 shadow-2xl">
              <View className="w-64 h-64 bg-primary/20 rounded-full items-center justify-center">
                 <View className="w-32 h-32 bg-primary rounded-full items-center justify-center shadow-2xl shadow-primary/50">
                    <Text className="text-white text-4xl">🔬</Text>
                 </View>
              </View>
            </View>
          </View>

          <View>
            <Text className="text-white text-4xl font-premium font-bold leading-tight">
              Personalized AI{"\n"}
              <Text className="text-primary">Health Insights</Text>
            </Text>
            <Text className="text-slate-400 font-premium mt-4 text-lg leading-6">
              Track your nutrition, monitor vital signs, and achieve your health goals with advanced AI analysis.
            </Text>
          </View>

          <View className="space-y-4">
            <Button title="Get Started" onPress={() => router.push('/login')} />
            <Button title="Login" variant="ghost" onPress={() => router.push('/login')} />
          </View>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}
