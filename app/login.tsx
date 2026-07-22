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
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  const handleAuth = () => {
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    // Route to setup if creating a new account, otherwise go straight to tabs
    if (!isLogin) {
      router.push('/setup' as any);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <View className="flex-1 px-8 justify-center">
            <View className="mb-12">
              <Text className="text-white text-3xl font-premium font-bold">{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
              <Text className="text-slate-400 font-premium mt-2 text-base">
                {isLogin ? 'Sign in to continue your health journey' : 'Join VitaScan for AI health intelligence'}
              </Text>
            </View>

            <View className="space-y-4">
              {error ? <Text className="text-red-400 font-premium text-sm">{error}</Text> : null}
              
              <Input label="Email Address" placeholder="Enter your email" icon={Mail} value={email} onChangeText={setEmail} autoCapitalize="none" />
              <Input label="Password" placeholder="Enter your password" icon={Lock} secureTextEntry value={password} onChangeText={setPassword} />
              
              {isLogin && (
                <TouchableOpacity className="self-end mb-6">
                  <Text className="text-primary font-premium text-sm">Forgot Password?</Text>
                </TouchableOpacity>
              )}

              <View className={!isLogin ? "mt-6" : ""}>
                <Button title={isLogin ? 'Login' : 'Create Account'} onPress={handleAuth} />
              </View>

              <View className="flex-row justify-center mt-6">
                <Text className="text-slate-400 font-premium text-sm">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                </Text>
                <TouchableOpacity onPress={() => { setIsLogin(!isLogin); setError(''); }}>
                  <Text className="text-primary font-premium text-sm font-bold">
                    {isLogin ? 'Create Account' : 'Login'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}
