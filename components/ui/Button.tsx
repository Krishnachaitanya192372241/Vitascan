// components/ui/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/Colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';

  const containerStyle = "h-14 rounded-2xl flex-row items-center justify-center px-6 overflow-hidden";
  
  if (isPrimary) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        className={containerStyle}
        style={style}
      >
        <LinearGradient
          colors={Colors.gradient.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="absolute inset-0"
        />
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-premium text-lg font-bold" style={textStyle}>
            {title}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  const outlineStyles = isOutline ? "border-2 border-primary" : "";
  const ghostStyles = isGhost ? "" : "bg-slate-800";
  const textStyles = isOutline || isGhost ? "text-primary" : "text-white";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      className={`${containerStyle} ${outlineStyles} ${ghostStyles}`}
      style={style}
    >
      {loading ? (
        <ActivityIndicator color={isOutline || isGhost ? Colors.primary : "white"} />
      ) : (
        <Text className={`${textStyles} font-premium text-lg font-bold`} style={textStyle}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};
