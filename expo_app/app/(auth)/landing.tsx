import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ImageBackground, 
  Dimensions,
  SafeAreaView,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { Theme } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { height, width } = Dimensions.get('window');

export default function LandingScreen() {
  const handlePress = (target: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(target);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground 
        source={require('@/assets/images/barong-bg.jpg')} 
        style={styles.background}
        resizeMode="cover"
      >
        {/* Cinematic Gradient Overlays to match the system */}
        <LinearGradient
          colors={['rgba(28, 25, 23, 0.9)', 'rgba(28, 25, 23, 0.65)', 'rgba(28, 25, 23, 0.2)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['transparent', 'rgba(28, 25, 23, 0.7)']}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        
        <SafeAreaView style={styles.safeArea}>
          {/* Header Area */}
          <View style={styles.header}>
            <Text style={styles.logoText}>LumbaRong</Text>
            
            <View style={styles.navLinks}>
              <TouchableOpacity onPress={() => {}}>
                <Text style={styles.navItem}>GUIDE</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {}}>
                <Text style={styles.navItem}>ABOUT</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.heroSection}>
              <Text style={styles.heroTitle}>
                Wear the{"\n"}
                <Text style={styles.accentText}>Spirit</Text> of the{"\n"}
                Philippines.
              </Text>
              
              <Text style={styles.heroSubtitle}>
                Buy directly from the makers of Barong. High quality, handmade clothes sent to your home.
              </Text>

              <TouchableOpacity 
                style={styles.ctaButton}
                activeOpacity={0.8}
                onPress={() => handlePress('/(auth)/login')}
              >
                <Text style={styles.ctaText}>START SHOPPING</Text>
                <Ionicons name="arrow-forward" size={16} color="white" style={styles.ctaIcon} />
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <View style={styles.authLinks}>
                <TouchableOpacity onPress={() => handlePress('/(auth)/login')}>
                  <Text style={styles.authLinkText}>SIGN IN</Text>
                </TouchableOpacity>
                <View style={styles.authDivider} />
                <TouchableOpacity onPress={() => handlePress('/(auth)/register')}>
                  <Text style={styles.authLinkText}>CREATE ACCOUNT</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.copyright}>
                © 2026 LUMBARONG PHILIPPINES
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1917',
  },
  background: {
    flex: 1,
    width: width,
    height: height,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#D4B896', // Sand/Peach from system
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
  navLinks: {
    flexDirection: 'row',
    gap: 20,
  },
  navItem: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(212, 184, 150, 0.8)',
    letterSpacing: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  heroSection: {
    marginTop: height * 0.15,
  },
  heroTitle: {
    fontSize: 52,
    fontWeight: '900',
    color: '#F7F3EE', // Cream from system
    lineHeight: 52,
    letterSpacing: -1,
    marginBottom: 16,
  },
  accentText: {
    color: '#C0422A', // Rust from system
    fontStyle: 'italic',
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(212, 184, 150, 0.8)',
    fontStyle: 'italic',
    lineHeight: 22,
    maxWidth: '85%',
    marginBottom: 40,
  },
  ctaButton: {
    backgroundColor: '#C0422A',
    height: 60,
    width: '100%',
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C0422A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  ctaText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 2,
  },
  ctaIcon: {
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    gap: 24,
  },
  authLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 25, 23, 0.6)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 184, 150, 0.2)',
  },
  authLinkText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D4B896',
    letterSpacing: 1.5,
  },
  authDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(212, 184, 150, 0.2)',
    marginHorizontal: 20,
  },
  copyright: {
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(212, 184, 150, 0.3)',
    letterSpacing: 2,
  },
});
