import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Animated
} from 'react-native';
import { router } from 'expo-router';
import { Theme } from '@/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secureText, setSecureText] = useState(true);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please provide a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);
    
    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.message || 'Authentication failed. Check your credentials.');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="dark" />
      {/* Warm background blobs */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Card */}
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={16} color={Theme.colors.textMuted} />
            </TouchableOpacity>
            <View style={styles.logoBlock}>
              <Text style={styles.logoText}>LumbaRong</Text>
              <Text style={styles.logoSub}>AUTHENTICATION PORTAL</Text>
            </View>
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="shield-checkmark-outline" size={16} color={Theme.colors.primary} />
              <Text style={styles.errorText}>{error.toUpperCase()}</Text>
            </View>
          )}

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <View style={[styles.inputWrapper, emailFocused && styles.inputFocused]}>
              <Ionicons name="mail-outline" size={16} color={emailFocused ? Theme.colors.primary : Theme.colors.border} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder=""
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>PASSWORD</Text>
              <TouchableOpacity>
                <Text style={styles.forgotText}>FORGOT PASSWORD?</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.inputWrapper, passwordFocused && styles.inputFocused]}>
              <Ionicons name="lock-closed-outline" size={16} color={passwordFocused ? Theme.colors.primary : Theme.colors.border} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••••••"
                placeholderTextColor={Theme.colors.border}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureText}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeBtn}>
                <Ionicons name={secureText ? 'eye-outline' : 'eye-off-outline'} size={16} color={Theme.colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity 
            style={[styles.submitBtn, loading && styles.submitDisabled]} 
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <View style={styles.submitContent}>
                <Text style={styles.submitText}>LOG-IN</Text>
                <Ionicons name="arrow-forward" size={16} color="white" />
              </View>
            )}
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>DON'T HAVE AN ACCOUNT? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.footerLink}>CREATE ACCOUNT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  blobTopRight: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: Theme.colors.primary,
    opacity: 0.04,
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: Theme.colors.accent,
    opacity: 0.12,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 40,
    padding: 32,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    shadowColor: 'rgba(60, 40, 20, 1)',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 60,
    elevation: 10,
  },
  cardHeader: {
    marginBottom: 32,
    alignItems: 'center',
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Theme.colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  logoBlock: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    color: Theme.colors.primary,
    fontStyle: 'italic',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  logoSub: {
    fontSize: 9,
    fontWeight: '800',
    color: Theme.colors.textMuted,
    letterSpacing: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF0EE',
    borderWidth: 1,
    borderColor: '#F9D0C8',
    borderRadius: 20,
    padding: 14,
    marginBottom: 24,
    gap: 10,
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.primary,
    letterSpacing: 1,
    flexShrink: 1,
    textAlign: 'center',
  },
  fieldGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    color: Theme.colors.textMuted,
    letterSpacing: 2.5,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.inputBg,
    borderRadius: Theme.radius.full,
    paddingHorizontal: 20,
    height: 56,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: Theme.colors.primary,
    backgroundColor: 'white',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Theme.colors.text,
    fontWeight: '500',
  },
  eyeBtn: {
    padding: 8,
  },
  forgotText: {
    fontSize: 9,
    fontWeight: '800',
    color: Theme.colors.primary,
    letterSpacing: 1,
  },
  submitBtn: {
    backgroundColor: Theme.colors.secondary,
    height: 56,
    borderRadius: Theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
    shadowColor: Theme.colors.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 6,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  submitText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 2.5,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.textMuted,
    letterSpacing: 1,
  },
  footerLink: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.primary,
    letterSpacing: 1,
  },
});
