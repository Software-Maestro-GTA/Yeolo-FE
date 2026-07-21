/**
 * @file GenerateCourseButton.tsx
 * @description Floating gradient button component for generating AI course path matching Figma UI v1.
 * @requirements REQ-11
 * @functional FUN-4
 * @api API-FB-8
 * @author Antigravity Agent
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export interface GenerateCourseButtonProps {
  onPress?: () => void;
  label?: string;
}

export const GenerateCourseButton: React.FC<GenerateCourseButtonProps> = ({
  onPress,
  label = 'AI 경로 생성하기',
}) => {
  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.touchable}
        onPress={onPress}
      >
        <LinearGradient
          colors={['#4648D4', '#4EDEA3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <Ionicons name="sparkles" size={20} color="#FFFFFF" style={styles.icon} />
          <Text style={styles.text}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 10,
  },
  touchable: {
    width: '100%',
    borderRadius: 9999,
    shadowColor: '#4648D4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  gradient: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default GenerateCourseButton;
