/**
 * @file ProfileHeader.tsx
 * @description UI component for displaying user avatar, display name, and email according to DOM-3 specification.
 * @requirements REQ-11
 * @functional FUN-4
 * @api API-FB-8
 * @domain DOM-3
 * @author Antigravity Agent
 */
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { User } from '@yeolo/common';

import { theme } from '../../theme';
import { UI_STRINGS, APP_CONFIG } from '../../constants';

export interface ProfileHeaderProps {
  user?: Partial<User> | null;
  onEditAvatar?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  onEditAvatar,
}) => {
  const displayName = user?.displayName || UI_STRINGS.PROFILE.DEFAULT_USER_NAME;
  const email = user?.email || APP_CONFIG.DEFAULT_USER_EMAIL;
  const avatarUrl = user?.profileImageUrl;

  return (
    <View style={styles.container}>
      <View style={styles.avatarWrapper}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={36} color={theme.colors.primary} />
          </View>
        )}
      </View>

      <Text style={styles.displayName}>{displayName}</Text>
      <Text style={styles.email}>{email}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border.active,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.text.inverse,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: theme.colors.text.subtle,
    fontWeight: '500',
  },
});
