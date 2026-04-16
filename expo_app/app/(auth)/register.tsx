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
  ScrollView 
} from 'react-native';
import { router } from 'expo-router';
import { Theme } from '@/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [role, setRole] = useState<'customer' | 'seller'>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [gcashNumber, setGcashNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [secureText, setSecureText] = useState(true);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setStatus({ type: 'error', message: 'CORE FIELDS ARE REQUIRED.' });
      return;
    }
    if (role === 'seller' && (!shopName || !gcashNumber || !shopDescription)) {
      setStatus({ type: 'error', message: 'ARTISAN DETAILS ARE REQUIRED.' });
      return;
    }
    setLoading(true);
    setStatus(null);
    const userData = {
      name, email, password, role,
      ...(role === 'seller' && { shopName, shopDescription, gcashNumber }),
    };
    const result = await register(userData);
    if (result.success) {
      setStatus({ type: 'success', message: 'REGISTRATION SUCCESSFUL! REDIRECTING...' });
    } else {
      setStatus({ type: 'error', message: result.message || 'REGISTRATION FAILED.' });
      setLoading(false);
    }
  };

  const Field = ({ label, icon, value, onChangeText, placeholder, keyboardType, secure, onToggleSecure, multiline }: any) => {
    const [focused, setFocused] = useState(false);
    return (
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.inputWrapper, focused && styles.inputFocused, multiline && styles.textAreaWrapper]}>
          <Ionicons name={icon} size={16} color={focused ? Theme.colors.primary : Theme.colors.border} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, multiline && styles.textArea]}
            placeholder={placeholder}
            placeholderTextColor={Theme.colors.border}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            autoCapitalize="none"
            secureTextEntry={secure}
            multiline={multiline}
            numberOfLines={multiline ? 4 : 1}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {onToggleSecure && (
            <TouchableOpacity onPress={onToggleSecure} style={styles.eyeBtn}>
              <Ionicons name={secure ? 'eye-outline' : 'eye-off-outline'} size={16} color={Theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={16} color={Theme.colors.textMuted} />
            </TouchableOpacity>
            <View style={styles.logoBlock}>
              <Text style={styles.logoText}>LumbaRong</Text>
              <Text style={styles.logoSub}>CREATE ACCOUNT</Text>
            </View>
          </View>

          {/* Status */}
          {status && (
            <View style={[styles.statusBanner, status.type === 'success' && styles.successBanner]}>
              <Ionicons name={status.type === 'success' ? 'checkmark-circle-outline' : 'shield-checkmark-outline'} size={16} color={status.type === 'success' ? Theme.colors.success : Theme.colors.primary} />
              <Text style={[styles.statusText, status.type === 'success' && styles.successText]}>{status.message}</Text>
            </View>
          )}

          <Field label="FULL NAME" icon="person-outline" value={name} onChangeText={setName} placeholder="Juan Dela Cruz" />
          <Field label="EMAIL ADDRESS" icon="mail-outline" value={email} onChangeText={setEmail} placeholder="" keyboardType="email-address" />

          {/* Role Selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>I AM A...</Text>
            <View style={styles.roleRow}>
              <TouchableOpacity style={[styles.roleCard, role === 'customer' && styles.roleCardActive]} onPress={() => setRole('customer')}>
                <View style={[styles.roleIconBox, role === 'customer' && styles.roleIconBoxActive]}>
                  <Ionicons name="person" size={20} color={role === 'customer' ? 'white' : Theme.colors.textMuted} />
                </View>
                <Text style={[styles.roleLabel, role === 'customer' && styles.roleLabelActive]}>MEMBER</Text>
                <Text style={styles.roleSub}>Shop & discover</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.roleCard, role === 'seller' && styles.roleCardActive]} onPress={() => setRole('seller')}>
                <View style={[styles.roleIconBox, role === 'seller' && styles.roleIconBoxActive]}>
                  <Ionicons name="storefront" size={20} color={role === 'seller' ? 'white' : Theme.colors.textMuted} />
                </View>
                <Text style={[styles.roleLabel, role === 'seller' && styles.roleLabelActive]}>ARTISAN</Text>
                <Text style={styles.roleSub}>Sell your craft</Text>
              </TouchableOpacity>
            </View>
          </View>

          {role === 'seller' && (
            <>
              <Field label="SHOP NAME" icon="storefront-outline" value={shopName} onChangeText={setShopName} placeholder="My Heritage Shop" />
              <Field label="GCASH NUMBER" icon="phone-portrait-outline" value={gcashNumber} onChangeText={setGcashNumber} placeholder="09123456789" keyboardType="number-pad" />
              <Field label="ARTISAN STORY" icon="document-text-outline" value={shopDescription} onChangeText={setShopDescription} placeholder="Tell us about your craft..." multiline />
            </>
          )}

          <Field label="PASSWORD" icon="lock-closed-outline" value={password} onChangeText={setPassword} placeholder="••••••••••••" secure={secureText} onToggleSecure={() => setSecureText(!secureText)} />

          <TouchableOpacity style={[styles.submitBtn, loading && styles.submitDisabled]} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            {loading ? (<ActivityIndicator color="white" size="small" />) : (
              <View style={styles.submitContent}>
                <Text style={styles.submitText}>{role === 'seller' ? 'FINALIZE REGISTRY' : 'CONTINUE'}</Text>
                <Ionicons name="arrow-forward" size={16} color="white" />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>ALREADY REGISTERED? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.footerLink}>SIGN-IN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  blobTopRight: { position: 'absolute', top: -100, right: -100, width: 320, height: 320, borderRadius: 160, backgroundColor: Theme.colors.primary, opacity: 0.04 },
  blobBottomLeft: { position: 'absolute', bottom: -80, left: -80, width: 240, height: 240, borderRadius: 120, backgroundColor: Theme.colors.accent, opacity: 0.12 },
  scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  card: {
    backgroundColor: 'white', borderRadius: 40, padding: 32,
    borderWidth: 1, borderColor: Theme.colors.border,
    shadowColor: 'rgba(60, 40, 20, 1)', shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08, shadowRadius: 60, elevation: 10,
  },
  cardHeader: { marginBottom: 28, alignItems: 'center', position: 'relative' },
  backBtn: {
    position: 'absolute', left: 0, top: 0, width: 36, height: 36,
    borderRadius: 12, backgroundColor: Theme.colors.inputBg,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Theme.colors.border,
  },
  logoBlock: { alignItems: 'center' },
  logoText: { fontSize: 24, fontWeight: '900', color: Theme.colors.primary, fontStyle: 'italic', letterSpacing: -0.5, marginBottom: 4 },
  logoSub: { fontSize: 9, fontWeight: '800', color: Theme.colors.textMuted, letterSpacing: 4 },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FEF0EE', borderWidth: 1, borderColor: '#F9D0C8',
    borderRadius: 20, padding: 14, marginBottom: 20, gap: 10,
  },
  successBanner: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  statusText: { fontSize: 10, fontWeight: '800', color: Theme.colors.primary, letterSpacing: 1, flexShrink: 1 },
  successText: { color: Theme.colors.success },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 9, fontWeight: '800', color: Theme.colors.textMuted, letterSpacing: 2.5, marginBottom: 8, paddingHorizontal: 20 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.inputBg,
    borderRadius: Theme.radius.full, paddingHorizontal: 20, height: 56,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  inputFocused: { borderColor: Theme.colors.primary, backgroundColor: 'white' },
  textAreaWrapper: { height: 108, borderRadius: 20, alignItems: 'flex-start', paddingVertical: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14, color: Theme.colors.text, fontWeight: '500' },
  textArea: { textAlignVertical: 'top' },
  eyeBtn: { padding: 8 },
  roleRow: { flexDirection: 'row', gap: 12 },
  roleCard: {
    flex: 1, backgroundColor: Theme.colors.inputBg, borderRadius: 20,
    padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent',
  },
  roleCardActive: {
    backgroundColor: 'white', borderColor: Theme.colors.primary,
    shadowColor: Theme.colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 4,
  },
  roleIconBox: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: Theme.colors.inputBg,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  roleIconBoxActive: { backgroundColor: Theme.colors.primary },
  roleLabel: { fontSize: 10, fontWeight: '900', color: Theme.colors.text, letterSpacing: 2 },
  roleLabelActive: { color: Theme.colors.primary },
  roleSub: { fontSize: 10, color: Theme.colors.textMuted, marginTop: 2 },
  submitBtn: {
    backgroundColor: Theme.colors.secondary, height: 56, borderRadius: Theme.radius.full,
    justifyContent: 'center', alignItems: 'center', marginTop: 8, marginBottom: 28,
    shadowColor: Theme.colors.secondary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 6,
  },
  submitDisabled: { opacity: 0.6 },
  submitContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  submitText: { color: 'white', fontWeight: '900', fontSize: 11, letterSpacing: 2.5 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 10, fontWeight: '800', color: Theme.colors.textMuted, letterSpacing: 1 },
  footerLink: { fontSize: 10, fontWeight: '800', color: Theme.colors.primary, letterSpacing: 1 },
});
