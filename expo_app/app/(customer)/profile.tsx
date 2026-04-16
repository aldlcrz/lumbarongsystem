import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, Alert, Image, Switch
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to log out from your heritage account?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive", 
          onPress: async () => {
            await logout();
            router.replace('/(auth)/landing');
          } 
        }
      ]
    );
  };

  const ProfileItem = ({ icon, label, sublabel, onPress, rightContent, destructive }: any) => (
    <TouchableOpacity 
      style={styles.item} 
      onPress={onPress} 
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={[styles.iconBox, destructive && styles.destructiveIconBox]}>
        <Ionicons name={icon} size={20} color={destructive ? '#EF4444' : Theme.colors.secondary} />
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemLabel, destructive && styles.destructiveText]}>{label}</Text>
        {sublabel && <Text style={styles.itemSublabel}>{sublabel}</Text>}
      </View>
      {rightContent ? rightContent : (
        onPress && <Ionicons name="chevron-forward" size={18} color={Theme.colors.border} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
            </View>
            <TouchableOpacity style={styles.editAvatarBtn}>
              <Ionicons name="camera" size={16} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userRole}>{user?.role?.toUpperCase()} MEMBER</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>4</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>820</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View>
        </View>

        {/* Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT SETTINGS</Text>
          <View style={styles.card}>
            <ProfileItem 
              icon="person-outline" 
              label="Personal Information" 
              sublabel={user?.email}
              onPress={() => {}} 
            />
            <View style={styles.divider} />
            <ProfileItem 
              icon="location-outline" 
              label="Delivery Addresses" 
              sublabel="Manage where you receive orders"
              onPress={() => router.push('/(customer)/addresses')} 
            />
            <View style={styles.divider} />
            <ProfileItem 
              icon="notifications-outline" 
              label="Notifications" 
              sublabel="Alerts, orders & updates"
              rightContent={
                <Switch 
                  value={notificationsEnabled} 
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#E5DDD5', true: Theme.colors.primary }}
                  thumbColor="white"
                />
              }
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ORDER HISTORY</Text>
          <View style={styles.card}>
            <ProfileItem 
              icon="bag-handle-outline" 
              label="My Orders" 
              sublabel="Track and view past purchases"
              onPress={() => router.push('/(customer)/orders')} 
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORT & LEGAL</Text>
          <View style={styles.card}>
            <ProfileItem 
              icon="help-circle-outline" 
              label="Help Center" 
              onPress={() => {}} 
            />
            <View style={styles.divider} />
            <ProfileItem 
              icon="shield-checkmark-outline" 
              label="Privacy Policy" 
              onPress={() => {}} 
            />
            <View style={styles.divider} />
            <ProfileItem 
              icon="log-out-outline" 
              label="Sign Out" 
              destructive
              onPress={handleLogout} 
            />
          </View>
        </View>

        <Text style={styles.version}>LumbaRong Version 1.0.2 (Heritage Edition)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Theme.colors.secondary },
  scrollContent: { padding: 20, paddingBottom: 40 },
  userCard: { 
    backgroundColor: 'white', 
    borderRadius: 30, 
    padding: 24, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatarPlaceholder: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: Theme.colors.primary, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avatarText: { fontSize: 40, fontWeight: '800', color: 'white' },
  editAvatarBtn: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    backgroundColor: Theme.colors.secondary, 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white'
  },
  userName: { fontSize: 22, fontWeight: '900', color: Theme.colors.secondary },
  userRole: { fontSize: 10, fontWeight: '800', color: Theme.colors.primary, letterSpacing: 2, marginTop: 4 },
  statsRow: { flexDirection: 'row', marginTop: 20, width: '100%', justifyContent: 'space-evenly' },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: Theme.colors.secondary },
  statLabel: { fontSize: 11, color: Theme.colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: '60%', backgroundColor: Theme.colors.border, alignSelf: 'center' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: Theme.colors.textMuted, letterSpacing: 2, marginBottom: 12, marginLeft: 10 },
  card: { 
    backgroundColor: 'white', 
    borderRadius: 24, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.border
  },
  item: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16,
    gap: 16
  },
  iconBox: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    backgroundColor: Theme.colors.background, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  destructiveIconBox: { backgroundColor: '#FEF2F2' },
  itemContent: { flex: 1 },
  itemLabel: { fontSize: 15, fontWeight: '700', color: Theme.colors.secondary },
  itemSublabel: { fontSize: 13, color: Theme.colors.textMuted, marginTop: 2 },
  destructiveText: { color: '#EF4444' },
  divider: { height: 1, backgroundColor: Theme.colors.border, marginHorizontal: 16 },
  version: { textAlign: 'center', fontSize: 11, color: Theme.colors.textMuted, marginTop: 10, opacity: 0.5 }
});
