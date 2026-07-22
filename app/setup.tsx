import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Heart, Check, ChevronDown } from 'lucide-react-native';

export default function SetupScreen() {
  const router = useRouter();
  
  // State for selections
  const [selectedDiet, setSelectedDiet] = useState('Balanced / Non-Veg');
  const [showDietDropdown, setShowDietDropdown] = useState(false);
  
  const [conditions, setConditions] = useState({
    diabetes: true,
    bloodPressure: true,
    thyroid: true,
    highCholesterol: true,
  });

  const toggleCondition = (key: keyof typeof conditions) => {
    setConditions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const dietOptions = ['Balanced / Non-Veg', 'Vegetarian', 'Vegan', 'Keto', 'Paleo'];

  return (
    <SafeAreaView className="flex-1 bg-orange-50/30">
      <ScrollView className="flex-1 px-4 py-8" showsVerticalScrollIndicator={false}>
        
        {/* Main Card Container */}
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-8 mt-10">
          
          {/* Header Icon */}
          <View className="items-center mb-6 mt-4">
            <View className="w-12 h-12 rounded-full bg-orange-50 items-center justify-center">
              <Heart color="#f97316" size={24} />
            </View>
          </View>

          {/* Titles */}
          <View className="items-center mb-10">
            <Text className="text-3xl font-black text-slate-800 mb-2">Set Up Your Health Profile</Text>
            <Text className="text-slate-500 text-center text-sm px-4">
              Let's customize your calorie targets, diet rules, and AI parameters
            </Text>
          </View>

          {/* Progress Bar */}
          <View className="flex-row items-center justify-center mb-12 px-6">
            <View className="w-8 h-8 rounded-full border-2 border-orange-500 items-center justify-center bg-white z-10">
              <Check color="#f97316" size={16} />
            </View>
            <View className="h-1 flex-1 bg-orange-500 -mx-1" />
            <View className="w-8 h-8 rounded-full border-2 border-orange-500 items-center justify-center bg-white z-10">
              <Check color="#f97316" size={16} />
            </View>
            <View className="h-1 flex-1 bg-orange-500 -mx-1" />
            <View className="w-8 h-8 rounded-full bg-orange-500 items-center justify-center z-10">
              <Text className="text-white font-bold text-xs">3</Text>
            </View>
          </View>

          {/* Step Title */}
          <Text className="text-xl font-bold text-slate-900 mb-6">Step 3: Medical & Dietary Preferences</Text>

          {/* Dietary Preference Dropdown */}
          <View className="mb-8 relative z-50">
            <Text className="text-xs font-bold text-slate-500 mb-2 tracking-wider">DIETARY PREFERENCE</Text>
            <TouchableOpacity 
              className="flex-row items-center justify-between border border-slate-200 rounded-xl px-4 py-3 bg-white"
              onPress={() => setShowDietDropdown(!showDietDropdown)}
              activeOpacity={0.7}
            >
              <Text className="text-slate-800 text-base">{selectedDiet}</Text>
              <ChevronDown color="#64748b" size={20} />
            </TouchableOpacity>

            {/* Simple inline dropdown for react native */}
            {showDietDropdown && (
              <View className="absolute top-[75px] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50">
                {dietOptions.map((option, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    className="px-4 py-3 border-b border-slate-100"
                    onPress={() => {
                      setSelectedDiet(option);
                      setShowDietDropdown(false);
                    }}
                  >
                    <Text className="text-slate-800">{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Health Conditions Checkboxes */}
          <View className="mb-10">
            <Text className="text-xs font-bold text-slate-500 mb-3 tracking-wider">ACTIVE HEALTH CONDITIONS</Text>
            
            <View className="flex-row flex-wrap justify-between">
              
              {/* Diabetes */}
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => toggleCondition('diabetes')}
                className={`w-[48%] flex-row items-center p-3 rounded-xl mb-3 border ${conditions.diabetes ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'}`}
              >
                <View className={`w-5 h-5 rounded items-center justify-center mr-3 ${conditions.diabetes ? 'bg-orange-500' : 'border border-slate-300'}`}>
                  {conditions.diabetes && <Check color="white" size={12} />}
                </View>
                <Text className={`${conditions.diabetes ? 'text-orange-500' : 'text-slate-600'}`}>Diabetes</Text>
              </TouchableOpacity>

              {/* Blood Pressure */}
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => toggleCondition('bloodPressure')}
                className={`w-[48%] flex-row items-center p-3 rounded-xl mb-3 border ${conditions.bloodPressure ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'}`}
              >
                <View className={`w-5 h-5 rounded items-center justify-center mr-3 ${conditions.bloodPressure ? 'bg-orange-500' : 'border border-slate-300'}`}>
                  {conditions.bloodPressure && <Check color="white" size={12} />}
                </View>
                <Text className={`${conditions.bloodPressure ? 'text-orange-500' : 'text-slate-600'}`}>Blood Pressure</Text>
              </TouchableOpacity>

              {/* Thyroid */}
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => toggleCondition('thyroid')}
                className={`w-[48%] flex-row items-center p-3 rounded-xl mb-3 border ${conditions.thyroid ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'}`}
              >
                <View className={`w-5 h-5 rounded items-center justify-center mr-3 ${conditions.thyroid ? 'bg-orange-500' : 'border border-slate-300'}`}>
                  {conditions.thyroid && <Check color="white" size={12} />}
                </View>
                <Text className={`${conditions.thyroid ? 'text-orange-500' : 'text-slate-600'}`}>Thyroid</Text>
              </TouchableOpacity>

              {/* High Cholesterol */}
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => toggleCondition('highCholesterol')}
                className={`w-[48%] flex-row items-center p-3 rounded-xl mb-3 border ${conditions.highCholesterol ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'}`}
              >
                <View className={`w-5 h-5 rounded items-center justify-center mr-3 ${conditions.highCholesterol ? 'bg-orange-500' : 'border border-slate-300'}`}>
                  {conditions.highCholesterol && <Check color="white" size={12} />}
                </View>
                <Text className={`${conditions.highCholesterol ? 'text-orange-500' : 'text-slate-600'}`}>High Cholesterol</Text>
              </TouchableOpacity>

            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row justify-between pb-4">
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => router.back()}
              className="w-[28%] h-14 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <Text className="text-slate-800 font-bold">Back</Text>
            </TouchableOpacity>

            <Link href="/(tabs)" asChild>
              <TouchableOpacity 
                activeOpacity={0.7}
                className="w-[68%] h-14 items-center justify-center rounded-xl bg-orange-500 shadow-md"
              >
                <Text className="text-white font-bold text-lg">Complete Profile Setup</Text>
              </TouchableOpacity>
            </Link>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
