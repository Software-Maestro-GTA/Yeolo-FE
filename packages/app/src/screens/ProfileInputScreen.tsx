/**
 * @file ProfileInputScreen.tsx
 * @description Screen component for entering and updating user profile details (nickname, avatar), matching Figma UI specifications.
 */
import React, { useState, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context';
import { palette, theme } from '../theme/colors';
import { UI_STRINGS } from '../constants';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';

export interface ProfileInputScreenProps {
  onGoBack?: () => void;
  onSaveSuccess?: () => void;
}

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';

export const ProfileInputScreen: React.FC<ProfileInputScreenProps> = ({
  onGoBack,
  onSaveSuccess,
}) => {
  useGA4ScreenTracking('ProfileInputScreen');
  const { trackButtonClick } = useGA4ButtonClick();

  const auth = useContext(AuthContext);
  const user = auth?.user;

  const [displayName, setDisplayName] = useState<string>(user?.displayName || '김선규');
  const email = user?.email || 'ksk85628781@gmail.com';
  const [avatarUrl, setAvatarUrl] = useState<string>((user as any)?.photoUrl || DEFAULT_AVATAR);

  const handleSave = () => {
    if (!displayName.trim()) {
      Alert.alert('알림', '닉네임을 입력해 주세요.');
      return;
    }

    trackButtonClick('btn_save_profile_input', 'Save Profile Input', { nickname: displayName });

    if (onSaveSuccess) {
      onSaveSuccess();
    }

    Alert.alert(
      UI_STRINGS.PROFILE_INPUT.SUCCESS_ALERT_TITLE,
      UI_STRINGS.PROFILE_INPUT.SUCCESS_ALERT_MESSAGE,
      [
        {
          text: UI_STRINGS.COMMON.CONFIRM,
          onPress: () => {
            if (onGoBack) {
              onGoBack();
            }
          },
        },
      ]
    );
  };

  const handleSkip = () => {
    trackButtonClick('btn_skip_profile_input', 'Skip Profile Input');
    if (onGoBack) {
      onGoBack();
    }
  };

  const handleChangeAvatar = () => {
    trackButtonClick('btn_change_avatar', 'Change Avatar Click');
    Alert.alert('프로필 이미지', '카메라 또는 갤러리에서 프로필 사진을 변경하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '기본 이미지 적용',
        onPress: () => setAvatarUrl(DEFAULT_AVATAR),
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      testID="profile-input-screen"
    >
      <View style={styles.auraGlow} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <TouchableOpacity
            testID="btn-back"
            style={styles.backBtn}
            onPress={onGoBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={palette.deepNavy} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{UI_STRINGS.PROFILE_INPUT.HEADER_TITLE}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Form Wrapper */}
        <View style={styles.formWrapper}>
          {/* Avatar Picker Section */}
          <View style={styles.avatarPickerSection}>
            <TouchableOpacity
              testID="btn-avatar-picker"
              style={styles.avatarContainer}
              activeOpacity={0.85}
              onPress={handleChangeAvatar}
            >
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={14} color={palette.white} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formFields}>
            {/* Nickname Field */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>{UI_STRINGS.PROFILE_INPUT.NICKNAME_LABEL}</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  testID="input-profile-nickname"
                  style={styles.textInput}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder={UI_STRINGS.PROFILE_INPUT.NICKNAME_PLACEHOLDER}
                  placeholderTextColor={palette.gray400}
                  maxLength={20}
                />
              </View>
            </View>

            {/* Email Field */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>{UI_STRINGS.PROFILE_INPUT.EMAIL_LABEL}</Text>
              <View style={[styles.inputWrapper, styles.inputDisabled]}>
                <Text style={styles.readOnlyText} numberOfLines={1}>
                  {email}
                </Text>
                <Ionicons name="lock-closed" size={16} color={palette.gray400} />
              </View>
            </View>
          </View>
        </View>

        {/* Action Container */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            testID="btn-save-profile-input"
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={handleSave}
          >
            <Text style={styles.primaryButtonText}>
              {UI_STRINGS.PROFILE_INPUT.SAVE_BUTTON}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="btn-skip-profile-input"
            style={styles.secondaryButton}
            activeOpacity={0.7}
            onPress={handleSkip}
          >
            <Text style={styles.secondaryButtonText}>
              {UI_STRINGS.PROFILE_INPUT.SKIP_BUTTON}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.softMint, // #F5FAF8
  },
  auraGlow: {
    position: 'absolute',
    top: -80,
    alignSelf: 'center',
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(224, 247, 241, 0.65)',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 20,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.deepNavy, // #0D2137
  },
  formWrapper: {
    gap: 32,
    alignItems: 'center',
    width: '100%',
  },
  avatarPickerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  avatarContainer: {
    position: 'relative',
    width: 96,
    height: 96,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: palette.lightTeal,
    borderWidth: 2,
    borderColor: palette.white,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: palette.accent, // #00C9A7
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: palette.white,
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  formFields: {
    width: '100%',
    gap: 20,
  },
  fieldBlock: {
    gap: 8,
    width: '100%',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.deepNavy,
  },
  inputWrapper: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.gray200,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    justifyContent: 'center',
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  inputDisabled: {
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textInput: {
    fontSize: 15,
    fontWeight: '500',
    color: palette.deepNavy,
  },
  readOnlyText: {
    fontSize: 15,
    fontWeight: '500',
    color: palette.subText,
    flex: 1,
  },
  actionContainer: {
    width: '100%',
    gap: 12,
    marginTop: 40,
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    height: 54,
    backgroundColor: palette.primary, // #2D7DD2
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.white,
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.mutedText,
  },
});
