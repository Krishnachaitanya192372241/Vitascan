// components/ui/Input.tsx
import React from 'react';
import { View, TextInput, Text, TextInputProps } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import Colors from '@/constants/Colors';

interface InputProps extends TextInputProps {
  label?: string;
  icon?: LucideIcon;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  icon: Icon,
  error,
  ...props
}) => {
  return (
    <View className="mb-4 w-full">
      {label && (
        <Text className="text-slate-400 font-premium mb-2 ml-1 text-sm">
          {label}
        </Text>
      )}
      <View 
        className={`flex-row items-center h-14 px-4 rounded-2xl bg-slate-800/50 border ${
          error ? 'border-red-500' : 'border-slate-700'
        }`}
      >
        {Icon && (
          <Icon 
            size={20} 
            color={error ? Colors.accent.red : Colors.text.muted} 
            className="mr-3"
          />
        )}
        <TextInput
          placeholderTextColor={Colors.text.muted}
          className="flex-1 text-white font-premium text-base"
          autoCapitalize="none"
          {...props}
        />
      </View>
      {error && (
        <Text className="text-red-500 font-premium mt-1 ml-1 text-xs">
          {error}
        </Text>
      )}
    </View>
  );
};
