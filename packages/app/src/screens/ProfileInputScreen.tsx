/**
 * @file ProfileInputScreen.tsx
 * @description Screen component for entering and updating user profile details (nickname, avatar) matching Figma UI specifications and API-USER-1.
 */
import React, { useState, useEffect, useContext } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context';
import { palette, hexToRgba } from '../theme/colors';
import { UI_STRINGS } from '../constants';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';
import { useUpdateUserProfileMutation } from '../hooks/queries';
import { AvatarActionBottomSheet } from '../components/profile';

export interface ProfileInputScreenProps {
  onGoBack?: () => void;
  onSaveSuccess?: () => void;
}

export const validateNickname = (nickname: string): string | null => {
  const trimmed = nickname.trim();
  if (!trimmed) {
    return UI_STRINGS.PROFILE_INPUT.NICKNAME_ERROR_EMPTY;
  }
  if (trimmed.length < 2 || trimmed.length > 10) {
    return UI_STRINGS.PROFILE_INPUT.NICKNAME_ERROR_LENGTH;
  }
  const validRegex = /^[a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s]+$/;
  if (!validRegex.test(trimmed)) {
    return UI_STRINGS.PROFILE_INPUT.NICKNAME_ERROR_INVALID;
  }
  return null;
};

export const ProfileInputScreen: React.FC<ProfileInputScreenProps> = ({
  onGoBack,
  onSaveSuccess,
}) => {
  useGA4ScreenTracking('ProfileInputScreen');
  const { trackButtonClick } = useGA4ButtonClick();

  const auth = useContext(AuthContext);
  const user = auth?.user;

  const [displayName, setDisplayName] = useState<string>(
    user?.displayName || '',
  );
  const email = user?.email || UI_STRINGS.PROFILE_INPUT.EMAIL_PLACEHOLDER;
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    (user as any)?.profileImageUrl || (user as any)?.photoUrl || null,
  );
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [showAvatarSheet, setShowAvatarSheet] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setAvatarUrl(
        (user as any)?.profileImageUrl || (user as any)?.photoUrl || null,
      );
    }
  }, [user]);

  const updateProfileMutation = useUpdateUserProfileMutation();

  const handleNicknameChange = (text: string) => {
    setDisplayName(text);
    if (text.trim()) {
      setNicknameError(validateNickname(text));
    } else {
      setNicknameError(null);
    }
  };

  const handleSave = async () => {
    const validationError = validateNickname(displayName);
    if (validationError) {
      setNicknameError(validationError);
      Alert.alert(UI_STRINGS.PROFILE_INPUT.ALERT_TITLE, validationError);
      return;
    }
    setNicknameError(null);

    trackButtonClick('btn_save_profile_input', 'Save Profile Input', {
      nickname: displayName,
    });

    try {
      const result = await updateProfileMutation.mutateAsync({
        displayName: displayName.trim() || null,
        profileImage: avatarUrl || null,
      });

      if (result?.data?.user && auth?.updateUser) {
        auth.updateUser({
          displayName: result.data.user.displayName || displayName.trim(),
          profileImageUrl: result.data.user.profileImageUrl,
        });
      }

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
        ],
      );
    } catch (err: any) {
      Alert.alert(
        UI_STRINGS.PROFILE_INPUT.ERROR_TITLE,
        err?.message || UI_STRINGS.PROFILE_INPUT.UPDATE_FAILED_MESSAGE,
      );
    }
  };

  const handleSkip = () => {
    trackButtonClick('btn_skip_profile_input', 'Skip Profile Input');
    if (onGoBack) {
      onGoBack();
    }
  };

  const handlePickImageFromGallery = async () => {
    try {
      if (!ImagePicker || !ImagePicker.requestMediaLibraryPermissionsAsync) {
        Alert.alert(
          UI_STRINGS.PROFILE_INPUT.ALERT_TITLE,
          '네이티브 기기 모듈을 찾을 수 없습니다. 개발 빌드를 재기동(yarn android 또는 ios)해주세요.',
        );
        return;
      }

      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          UI_STRINGS.PROFILE_INPUT.ALERT_TITLE,
          UI_STRINGS.PROFILE_INPUT.AVATAR_PERMISSION_ERROR,
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images || ('Images' as any),
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUrl(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert(
        UI_STRINGS.PROFILE_INPUT.ERROR_TITLE,
        error?.message || '이미지를 불러오는 중 오류가 발생했습니다.',
      );
    }
  };

  const handleChangeAvatar = () => {
    trackButtonClick('btn_change_avatar', 'Change Avatar Click');
    setShowAvatarSheet(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      testID='profile-input-screen'>
      <View style={styles.auraGlow} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <TouchableOpacity
            testID='btn-back'
            style={styles.backBtn}
            onPress={onGoBack}
            activeOpacity={0.7}>
            <Ionicons name='chevron-back' size={24} color={palette.deepNavy} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {UI_STRINGS.PROFILE_INPUT.HEADER_TITLE}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Form Wrapper */}
        <View style={styles.formWrapper}>
          {/* Avatar Picker Section */}
          <View style={styles.avatarPickerSection}>
            <TouchableOpacity
              testID='btn-avatar-picker'
              style={styles.avatarContainer}
              activeOpacity={0.85}
              onPress={handleChangeAvatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View
                  style={[styles.avatarImage, styles.defaultAvatarPlaceholder]}>
                  <Ionicons name='person' size={44} color={palette.gray400} />
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Ionicons name='camera' size={14} color={palette.white} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formFields}>
            {/* Nickname Field */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                {UI_STRINGS.PROFILE_INPUT.NICKNAME_LABEL}
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  nicknameError ? styles.inputErrorBorder : null,
                ]}>
                <TextInput
                  testID='input-profile-nickname'
                  style={styles.textInput}
                  value={displayName}
                  onChangeText={handleNicknameChange}
                  placeholder={UI_STRINGS.PROFILE_INPUT.NICKNAME_PLACEHOLDER}
                  placeholderTextColor={palette.gray400}
                  maxLength={10}
                />
              </View>
              {nicknameError ? (
                <Text testID='nickname-error-text' style={styles.errorText}>
                  {nicknameError}
                </Text>
              ) : null}
            </View>

            {/* Email Field */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                {UI_STRINGS.PROFILE_INPUT.EMAIL_LABEL}
              </Text>
              <View style={[styles.inputWrapper, styles.inputDisabled]}>
                <Text style={styles.readOnlyText} numberOfLines={1}>
                  {email}
                </Text>
                <Ionicons
                  name='lock-closed'
                  size={16}
                  color={palette.gray400}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Action Container */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            testID='btn-save-profile-input'
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={handleSave}
            disabled={updateProfileMutation.isPending}>
            <Text style={styles.primaryButtonText}>
              {UI_STRINGS.PROFILE_INPUT.SAVE_BUTTON}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID='btn-skip-profile-input'
            style={styles.secondaryButton}
            activeOpacity={0.7}
            onPress={handleSkip}>
            <Text style={styles.secondaryButtonText}>
              {UI_STRINGS.PROFILE_INPUT.SKIP_BUTTON}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Avatar Action Bottom Sheet */}
      <AvatarActionBottomSheet
        visible={showAvatarSheet}
        onClose={() => setShowAvatarSheet(false)}
        onSelectGallery={handlePickImageFromGallery}
        onResetDefault={() => setAvatarUrl(null)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.softMint,
  },
  auraGlow: {
    position: 'absolute',
    top: -80,
    alignSelf: 'center',
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: hexToRgba(palette.lightTeal, 0.65),
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
    color: palette.deepNavy,
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
  defaultAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.gray100,
    borderColor: palette.gray200,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: palette.accent,
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
  inputErrorBorder: {
    borderColor: palette.red500,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    color: palette.red500,
    marginTop: 2,
  },
  inputDisabled: {
    backgroundColor: palette.gray100,
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
    backgroundColor: palette.primary,
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
    width: '100%',
    height: 54,
    backgroundColor: palette.transparent,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.subText,
  },
});
