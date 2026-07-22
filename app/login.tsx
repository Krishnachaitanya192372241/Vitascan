// app/login.tsx
import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GradientBackground } from '@/components/ui/GradientBackground';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <View className="flex-1 px-8 justify-center">
            <View className="mb-12">
              <Text className="text-white text-3xl font-premium font-bold">Welcome Back</Text>
              <Text className="text-slate-400 font-premium mt-2 text-base">Sign in to continue your health journey</Text>
            </View>

            <View className="space-y-4">
              <Input label="Email Address" placeholder="Enter your email" icon={Mail} value={email} onChangeText={setEmail} />
              <Input label="Password" placeholder="Enter your password" icon={Lock} secureTextEntry value={password} onChangeText={setPassword} />
              
              <TouchableOpacity className="self-end mb-6">
                <Text className="text-primary font-premium text-sm">Forgot Password?</Text>
              </TouchableOpacity>

              <Button title="Login" onPress={() => router.replace('/(tabs)')} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}
