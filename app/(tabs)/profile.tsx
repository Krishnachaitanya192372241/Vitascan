// app/(tabs)/profile.tsx
import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Shield, Bell, Moon, ChevronRight, LogOut, Heart, Target } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import Colors from '@/constants/Colors';

export default function ProfileScreen() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const menuItems = [
    { icon: Heart, label: 'Health Profile', color: '#EF4444' },
    { icon: Target, label: 'Goals & Progress', color: '#8B5CF6' },
    { icon: Bell, label: 'Notifications', color: '#F59E0B' },
    { icon: Shield, label: 'Privacy & Security', color: '#10B981' },
  ];

  return (
    <View className="flex-1 bg-slate-950">
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <View className="items-center mt-10 mb-8">
            <View className="w-24 h-24 rounded-full bg-slate-800 items-center justify-center border-4 border-primary">
              <Text className="text-white text-3xl font-bold">AJ</Text>
            </View>
            <Text className="text-white text-2xl font-premium font-bold mt-4">Alex Johnson</Text>
            <Text className="text-slate-400 font-premium">alex.j@vitascan.ai</Text>
          </View>

          <View className="space-y-4 mb-8">
            <Card className="p-0 overflow-hidden">
              {menuItems.map((item, index) => (
                <TouchableOpacity key={index} className="flex-row items-center px-5 py-4 border-b border-slate-700/50">
                  <View className="w-10 h-10 rounded-xl items-center justify-center mr-4" style={{ backgroundColor: `${item.color}20` }}>
                    <item.icon size={20} color={item.color} />
                  </View>
                  <Text className="flex-1 text-white font-premium font-medium">{item.label}</Text>
                  <ChevronRight size={18} color="#475569" />
                </TouchableOpacity>
              ))}
            </Card>

            <Card className="flex-row items-center justify-between px-5 py-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-slate-700/50 items-center justify-center mr-4">
                  <Moon size={20} color="#CBD5E1" />
                </View>
                <Text className="text-white font-premium font-medium">Dark Mode</Text>
              </View>
              <Switch value={isDarkMode} onValueChange={setIsDarkMode} trackColor={{ false: '#334155', true: Colors.primary }} />
            </Card>

            <TouchableOpacity className="flex-row items-center justify-center bg-red-500/10 py-4 rounded-2xl border border-red-500/20 mt-8">
              <LogOut size={20} color="#EF4444" className="mr-2" />
              <Text className="text-red-500 font-premium font-bold">Log Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
