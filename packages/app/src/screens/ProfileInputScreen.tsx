/**
 * @file ProfileInputScreen.tsx
 * @description Screen component for entering and updating user profile details (nickname, avatar) matching Figma UI specifications and API-USER-1.
 */
import { Text, TextInput } from '../components/common/Typography';
import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FigmaAsset } from '../components/common/FigmaAsset';
import { CachedImage } from '../components/common/CachedImage';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext, useBackground } from '../context';
import { palette } from '../theme/colors';
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
  if (trimmed.length < 2 || trimmed.length > 12) {
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
  const { setBackground, resetBackground } = useBackground();
  const insets = useSafeAreaInsets();
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    setBackground({ backgroundColor: palette.gray100 });
    return resetBackground;
  }, [setBackground, resetBackground]);
  const contentInset = StyleSheet.create({
    content: { paddingBottom: insets.bottom + 46 },
  });

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
    if (updateProfileMutation.isPending) return;
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

      if (!mounted.current) return;

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
              if (!onSaveSuccess && mounted.current) {
                onGoBack?.();
              }
            },
          },
        ],
      );
    } catch (err: any) {
      if (!mounted.current) return;
      Alert.alert(
        UI_STRINGS.PROFILE_INPUT.ERROR_TITLE,
        err?.message || UI_STRINGS.PROFILE_INPUT.UPDATE_FAILED_MESSAGE,
      );
    }
  };

  const handlePickImageFromGallery = async () => {
    try {
      if (!ImagePicker || !ImagePicker.launchImageLibraryAsync) {
        Alert.alert(
          UI_STRINGS.PROFILE_INPUT.ALERT_TITLE,
          UI_STRINGS.PROFILE_INPUT.GALLERY_UNAVAILABLE,
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
        error?.message || UI_STRINGS.PROFILE_INPUT.GALLERY_ERROR,
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
      <ScrollView
        contentContainerStyle={[styles.scrollContent, contentInset.content]}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode='interactive'
        keyboardShouldPersistTaps='handled'>
        <View style={styles.headerSection}>
          <TouchableOpacity
            testID='btn-back'
            style={styles.backBtn}
            onPress={onGoBack}
            accessibilityRole='button'
            accessibilityLabel={UI_STRINGS.COMMON.BACK}>
            <FigmaAsset
              source={require('../../assets/images/figma-course/back.svg')}
              width={24}
              height={24}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {UI_STRINGS.PROFILE_INPUT.HEADER_TITLE}
          </Text>
        </View>
        <View style={styles.formWrapper}>
          <TouchableOpacity
            testID='btn-avatar-picker'
            style={styles.avatarContainer}
            accessibilityRole='button'
            accessibilityLabel={UI_STRINGS.PROFILE_INPUT.AVATAR_ALERT_TITLE}
            activeOpacity={0.85}
            onPress={handleChangeAvatar}>
            {avatarUrl ? (
              <CachedImage
                source={{ uri: avatarUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.defaultAvatarPlaceholder}>
                <FigmaAsset
                  source={require('../../assets/figma/profile/avatar-large.svg')}
                  width={120}
                  height={120}
                  style={styles.avatarBackground}
                />
                <FigmaAsset
                  source={require('../../assets/figma/profile/person.svg')}
                  width={19.4689}
                  height={22}
                />
              </View>
            )}
            <View style={styles.cameraBadge}>
              <FigmaAsset
                source={require('../../assets/figma/profile/camera-background.svg')}
                width={32}
                height={32}
                style={styles.avatarBackground}
              />
              <FigmaAsset
                source={require('../../assets/figma/profile/camera.svg')}
                width={14.5}
                height={11.5}
              />
            </View>
          </TouchableOpacity>
          <Text style={styles.email} numberOfLines={1}>
            {email}
          </Text>
          <View style={styles.fieldBlock}>
            <View
              style={[
                styles.inputWrapper,
                nicknameError && styles.inputErrorBorder,
              ]}>
              <Text style={styles.fieldLabel}>
                {UI_STRINGS.PROFILE_INPUT.NICKNAME_LABEL}
              </Text>
              <TextInput
                testID='input-profile-nickname'
                accessibilityLabel={UI_STRINGS.PROFILE_INPUT.NICKNAME_LABEL}
                style={styles.textInput}
                value={displayName}
                onChangeText={handleNicknameChange}
                placeholder={UI_STRINGS.PROFILE_INPUT.NICKNAME_PLACEHOLDER}
                placeholderTextColor={palette.gray400}
                maxLength={12}
                editable={!updateProfileMutation.isPending}
                returnKeyType='done'
                onSubmitEditing={handleSave}
              />
            </View>
            <View style={styles.fieldStatus}>
              {nicknameError && (
                <Text testID='nickname-error-text' style={styles.errorText}>
                  {nicknameError}
                </Text>
              )}
              <Text style={styles.counter} testID='nickname-counter'>
                <Text style={styles.counterValue}>{displayName.length}</Text>
                {UI_STRINGS.PROFILE_INPUT.NICKNAME_COUNTER_SUFFIX}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.actionContainer}>
          <TouchableOpacity
            testID='btn-save-profile-input'
            accessibilityRole='button'
            accessibilityState={{
              disabled: updateProfileMutation.isPending,
              busy: updateProfileMutation.isPending,
            }}
            style={[
              styles.primaryButton,
              updateProfileMutation.isPending && styles.disabledButton,
            ]}
            activeOpacity={0.85}
            onPress={handleSave}
            disabled={updateProfileMutation.isPending}>
            <Text style={styles.primaryButtonText}>
              {UI_STRINGS.PROFILE_INPUT.SAVE_BUTTON}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  container: { flex: 1, backgroundColor: palette.gray100 },
  scrollContent: { paddingHorizontal: 20, flexGrow: 1 },
  headerSection: { height: 60, alignItems: 'center', justifyContent: 'center' },
  backBtn: {
    position: 'absolute',
    left: -8,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    lineHeight: 37,
    letterSpacing: -1,
    fontWeight: '600',
    color: palette.deepNavy,
  },
  formWrapper: { marginTop: 131, alignItems: 'center', width: '100%' },
  avatarContainer: { width: 120, height: 120, position: 'relative' },
  avatarImage: { width: 120, height: 120, borderRadius: 60 },
  defaultAvatarPlaceholder: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBackground: { position: 'absolute', left: 0, top: 0 },
  cameraBadge: {
    position: 'absolute',
    width: 32,
    height: 32,
    bottom: -4,
    right: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  email: {
    marginTop: 32,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -1,
    fontWeight: '500',
    color: palette.gray400,
  },
  fieldBlock: { marginTop: 11, width: '100%', gap: 8 },
  inputWrapper: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.white,
    borderRadius: 16,
    paddingHorizontal: 24,
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -1,
    color: palette.gray400,
  },
  textInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -1,
    color: palette.deepNavy,
    paddingVertical: 14,
  },
  inputErrorBorder: { borderColor: palette.red500 },
  fieldStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    gap: 8,
  },
  counter: {
    marginLeft: 'auto',
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -1,
    fontWeight: '500',
    color: palette.gray400,
  },
  counterValue: { color: palette.deepNavy },
  errorText: { flex: 1, fontSize: 12, lineHeight: 20, color: palette.red500 },
  actionContainer: { marginTop: 'auto', paddingTop: 40 },
  primaryButton: {
    minHeight: 62,
    backgroundColor: palette.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  disabledButton: { opacity: 0.45 },
  primaryButtonText: {
    fontSize: 20,
    lineHeight: 37,
    letterSpacing: -0.6,
    fontWeight: '500',
    color: palette.white,
  },
});
