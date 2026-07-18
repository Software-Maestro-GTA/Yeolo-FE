/**
 * @file HomeScreen.tsx
 * @description Standard blank landing screen displayed upon successful Google OAuth authentication.
 * @requirements REQ-11
 * @functional FUN-1
 * @api N/A
 * @author Antigravity Agent
 */
import React, { useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';

export default function HomeScreen() {
  const auth = useContext(AuthContext);

  if (!auth) {
    return null;
  }

  const { user, logout } = auth;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>여로 (Yeolo)</Text>
          <Text style={styles.subtitle}>로그인에 성공했습니다! 🎉</Text>
          
          {user && (
            <View style={styles.userInfo}>
              <Text style={styles.userLabel}>사용자 프로필</Text>
              <Text style={styles.userName}>{user.displayName || '이름 없음'}</Text>
              {user.email && <Text style={styles.userEmail}>{user.email}</Text>}
            </View>
          )}

          <TouchableOpacity style={styles.button} onPress={logout}>
            <Text style={styles.buttonText}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6fafe',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4648d4',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#76777c',
    marginBottom: 24,
  },
  userInfo: {
    width: '100%',
    backgroundColor: '#f0f6ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  userLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4648d4',
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#030612',
  },
  userEmail: {
    fontSize: 14,
    color: '#76777c',
    marginTop: 2,
  },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: '#4648d4',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
