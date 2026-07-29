/**
 * @file AnalysisProgressStepper.tsx
 * @description Stepper loading view component for taste analysis onboarding progress.
 * @requirements REQ-8, REQ-11
 * @functional FUN-1
 * @author Antigravity Agent
 */
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { theme } from '../../theme';
import { UI_STRINGS } from '../../constants';

export interface AnalysisProgressStepperProps {
  stepIndex: number;
  pulseAnim: Animated.Value;
}

export const AnalysisProgressStepper: React.FC<AnalysisProgressStepperProps> = ({
  stepIndex,
  pulseAnim,
}) => {
  const steps = [
    { id: 1, text: UI_STRINGS.TASTE_ANALYSIS.STEP_1 },
    { id: 2, text: UI_STRINGS.TASTE_ANALYSIS.STEP_2 },
    { id: 3, text: UI_STRINGS.TASTE_ANALYSIS.STEP_3 },
  ];

  return (
    <View style={styles.stepperContainer} testID="stepper">
      {steps.map((step) => {
        const isCompleted = stepIndex > step.id;
        const isActive = stepIndex === step.id;
        const isInactive = stepIndex < step.id;

        return (
          <View key={step.id} style={styles.stepNode} testID={`step-${step.id}`}>
            {isCompleted && (
              <View style={[styles.stepCircle, styles.stepCircleCompleted]}>
                <AntDesign name="check" size={12} color={theme.colors.text.inverse} />
              </View>
            )}
            {isActive && (
              <Animated.View
                style={[
                  styles.stepCircle,
                  styles.stepCircleActive,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <View style={styles.pulseInner} />
              </Animated.View>
            )}
            {isInactive && (
              <View style={[styles.stepCircle, styles.stepCircleInactive]}>
                <View style={styles.pendingInner} />
              </View>
            )}
            <Text
              style={[
                styles.stepText,
                isCompleted && styles.stepTextCompleted,
                isActive && styles.stepTextActive,
                isInactive && styles.stepTextInactive,
              ]}
            >
              {step.text}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  stepperContainer: {
    paddingHorizontal: 32,
    gap: 20,
  },
  stepNode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleCompleted: {
    backgroundColor: theme.colors.primary,
  },
  stepCircleActive: {
    backgroundColor: theme.colors.primaryContainer,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  pulseInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  stepCircleInactive: {
    backgroundColor: theme.colors.bg.input,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  pendingInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.text.placeholder,
  },
  stepText: {
    fontSize: 15,
    fontWeight: '500',
  },
  stepTextCompleted: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  stepTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  stepTextInactive: {
    color: theme.colors.text.subtle,
  },
});
