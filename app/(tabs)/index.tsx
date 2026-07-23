// app/(tabs)/index.tsx
import React from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Droplet, Flame, Zap, Clock, ChevronRight } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import Colors from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-slate-950">
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-6 pb-24" showsVerticalScrollIndicator={false}>
          <View className="flex-row justify-between items-center mt-6 mb-8">
            <View>
              <Text className="text-slate-400 font-premium text-base">Welcome back,</Text>
              <Text className="text-white text-3xl font-premium font-bold">Alex Johnson</Text>
            </View>
            <TouchableOpacity className="w-12 h-12 rounded-full bg-slate-800 items-center justify-center border border-slate-700">
              <Text className="text-white">AJ</Text>
            </TouchableOpacity>
          </View>

          <Card className="mb-6 p-0 overflow-hidden">
            <LinearGradient colors={['#1E293B', '#0F172A']} className="p-6">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-slate-400 font-premium text-sm uppercase tracking-wider">Health Score</Text>
                  <Text className="text-white text-5xl font-premium font-bold mt-1">84<Text className="text-lg text-slate-500">/100</Text></Text>
                  <View className="bg-emerald-500/20 px-3 py-1 rounded-full mt-3 self-start">
                    <Text className="text-emerald-400 text-xs font-premium font-bold">+2.4% from last week</Text>
                  </View>
                </View>
                <View className="w-24 h-24 rounded-full border-8 border-primary items-center justify-center">
                  <Text className="text-white font-bold">EXCELLENT</Text>
                </View>
              </View>
            </LinearGradient>
          </Card>

          <View className="flex-row space-x-4 mb-6">
            <View className="flex-1">
              <Card className="items-center py-6">
                <View className="w-12 h-12 rounded-2xl bg-orange-500/20 items-center justify-center mb-3">
                  <Flame size={24} color="#F97316" />
                </View>
                <Text className="text-slate-400 text-xs font-premium">Calories</Text>
                <Text className="text-white text-xl font-premium font-bold mt-1">1,840</Text>
              </Card>
            </View>
            <View className="flex-1">
              <Card className="items-center py-6">
                <View className="w-12 h-12 rounded-2xl bg-blue-500/20 items-center justify-center mb-3">
                  <Droplet size={24} color="#3B82F6" />
                </View>
                <Text className="text-slate-400 text-xs font-premium">Water</Text>
                <Text className="text-white text-xl font-premium font-bold mt-1">1.2L</Text>
              </Card>
            </View>
          </View>

          <View className="h-24" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
