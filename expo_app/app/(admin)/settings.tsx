import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Switch
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import apiClient from '@/src/api/client';
import { StatusBar } from 'expo-status-bar';

export default function AdminSettingsScreen() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/settings');
      setSettings(res.data);
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    // Auto-save logic or wait for manual save? Manual save is safer for config.
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await apiClient.put('/admin/settings', settings);
      Alert.alert("Success", "Platform configuration updated.");
    } catch (err) {
      Alert.alert("Error", "Could not update settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Configuration</Text>
        <TouchableOpacity onPress={saveSettings} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color={Theme.colors.primary} /> : <Text style={styles.saveBtn}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>FINANCIAL PARAMETERS</Text>
          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Commission Rate (%)</Text>
              <Text style={styles.settingDesc}>Platform fee taken from every artisan sale.</Text>
            </View>
            <TextInput 
              style={styles.input}
              value={String(settings.commissionRate || '10')}
              onChangeText={(v) => handleUpdate('commissionRate', v)}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Tax Rate (%)</Text>
              <Text style={styles.settingDesc}>Standard VAT applied to checkout.</Text>
            </View>
            <TextInput 
              style={styles.input}
              value={String(settings.taxRate || '12')}
              onChangeText={(v) => handleUpdate('taxRate', v)}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PLATFORM CONTROLS</Text>
          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Maintenance Mode</Text>
              <Text style={styles.settingDesc}>Disable marketplace for public users.</Text>
            </View>
            <Switch 
              value={settings.maintenanceMode === 'true'}
              onValueChange={(v) => handleUpdate('maintenanceMode', String(v))}
              trackColor={{ false: '#767577', true: Theme.colors.primary }}
            />
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Allow New Sellers</Text>
              <Text style={styles.settingDesc}>Enable artisan registration form.</Text>
            </View>
            <Switch 
              value={settings.allowNewSellers !== 'false'}
              onValueChange={(v) => handleUpdate('allowNewSellers', String(v))}
              trackColor={{ false: '#767577', true: Theme.colors.primary }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ADVANCED</Text>
          <TouchableOpacity 
            style={styles.dangerBtn} 
            onPress={() => {
              Alert.alert("Purge Caches", "This will clear all ephemeral system data. Proceed?", [
                { text: "Cancel" },
                { text: "Purge", style: 'destructive', onPress: async () => apiClient.post('/admin/purge-cache') }
              ]);
            }}
          >
            <Ionicons name="trash-outline" size={20} color={Theme.colors.error} />
            <Text style={styles.dangerBtnText}>Purge All System Caches</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Theme.colors.secondary },
  saveBtn: { fontSize: 16, fontWeight: '800', color: Theme.colors.primary },
  scrollContent: { padding: 24 },
  section: { marginBottom: 32 },
  sectionLabel: { fontSize: 10, fontWeight: '900', color: Theme.colors.textMuted, letterSpacing: 2, marginBottom: 16 },
  settingCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    padding: 20, 
    borderRadius: 20, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border
  },
  settingInfo: { flex: 1, marginRight: 16 },
  settingTitle: { fontSize: 15, fontWeight: '800', color: Theme.colors.secondary },
  settingDesc: { fontSize: 11, color: Theme.colors.textMuted, marginTop: 2 },
  input: { width: 60, height: 40, backgroundColor: Theme.colors.background, borderRadius: 8, textAlign: 'center', fontWeight: '800', color: Theme.colors.primary },
  dangerBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    padding: 20, 
    backgroundColor: '#EF444410', 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EF444430'
  },
  dangerBtnText: { color: Theme.colors.error, fontWeight: '800', fontSize: 14 }
});
