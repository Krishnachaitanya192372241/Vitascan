// app/(tabs)/scans.tsx
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Zap, ZapOff, Image as ImageIcon, X, Mic, Barcode, Pizza, Settings } from 'lucide-react-native';
import { ScannerOverlay } from '@/components/ScannerOverlay';
import Colors from '@/constants/Colors';

const modes = [
  { id: 'food', label: 'Food', icon: Pizza },
  { id: 'barcode', label: 'Barcode', icon: Barcode },
  { id: 'voice', label: 'Voice', icon: Mic },
];

export default function ScansScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState(false);
  const [activeMode, setActiveMode] = useState('food');
  const cameraRef = useRef(null);

  if (!permission) return <View className="flex-1 bg-slate-950" />;
  if (!permission.granted) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center p-8">
        <TouchableOpacity className="bg-primary px-8 py-4 rounded-2xl" onPress={requestPermission}>
          <Text className="text-white font-premium font-bold">Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView style={StyleSheet.absoluteFill} flash={flash ? 'on' : 'off'} ref={cameraRef}>
        <SafeAreaView className="flex-1">
          <View className="flex-row justify-between items-center px-6 py-4">
            <TouchableOpacity className="w-12 h-12 rounded-full bg-black/40 items-center justify-center">
              <X color="white" size={24} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFlash(!flash)}>
              {flash ? <Zap color={Colors.primary} size={24} /> : <ZapOff color="white" size={24} />}
            </TouchableOpacity>
          </View>

          <View className="flex-1 items-center justify-center">
            <ScannerOverlay />
          </View>

          <View className="pb-32 items-center">
            <TouchableOpacity className="w-24 h-24 rounded-full border-4 border-primary items-center justify-center bg-black/20 p-2">
              <View className="w-full h-full rounded-full bg-white items-center justify-center" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}
