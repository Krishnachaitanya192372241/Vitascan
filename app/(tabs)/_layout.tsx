// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Home, User, Scan } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { BlurView } from 'expo-blur';
import { Platform, View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.text.muted,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 30 : 20,
          left: 20,
          right: 20,
          backgroundColor: 'rgba(30, 41, 59, 0.9)',
          borderRadius: 24,
          height: 70,
          borderTopWidth: 0,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
          overflow: 'hidden',
        },
        tabBarBackground: () => (
          <BlurView intensity={20} tint="dark" className="absolute inset-0" />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scans"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, size }) => (
            <View className="bg-primary w-14 h-14 rounded-full items-center justify-center -mt-8 shadow-lg shadow-primary/40">
              <Scan size={28} color="white" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
