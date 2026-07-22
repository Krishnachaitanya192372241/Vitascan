// components/ui/Card.tsx
import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'outline' | 'glass';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'elevated',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return 'bg-slate-800 shadow-premium';
      case 'outline':
        return 'bg-transparent border border-slate-700';
      case 'glass':
        return 'bg-white/10 border border-white/20';
      default:
        return 'bg-slate-800';
    }
  };

  return (
    <View 
      className={`p-5 rounded-3xl overflow-hidden ${getVariantStyles()}`}
      style={style}
    >
      {children}
    </View>
  );
};
