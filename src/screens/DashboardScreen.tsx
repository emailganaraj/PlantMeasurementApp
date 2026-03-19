/**
 * DashboardScreen.tsx
 *
 * Home screen rendered as the first tab in MainTabsNavigator.
 * Shows a personalised greeting and three animated action tiles:
 *   1. New Analysis     → navigates to the "New Analysis" tab
 *   2. Analysis History → navigates to the "History" tab
 *   3. Submit For Development → placeholder alert
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Animated,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import HeaderBar from '../components/ui/HeaderBar';
import CardTile from '../components/ui/CardTile';
import { Colors, Typography, Spacing } from '../theme';
import type { DashboardNavigationProp } from '../navigation/types';

// ── Falling Seedling Component ────────────────────────────────────────────────
interface FallingSeedlingProps {
  delay: number;
  horizontalPos: number;
}

const FallingSeedling: React.FC<FallingSeedlingProps> = ({ delay, horizontalPos }) => {
  const screenHeight = Dimensions.get('window').height;
  const fallDistance = screenHeight + 100;
  
  const fallAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous fall animation loop
    const startAnimation = () => {
      // Reset values first
      fallAnim.setValue(0);
      rotateAnim.setValue(0);
      opacityAnim.setValue(0);
      
      Animated.parallel([
        // Fall down - full screen height
        Animated.timing(fallAnim, {
          toValue: fallDistance,
          duration: 6000, // 6 seconds for full fall
          delay,
          useNativeDriver: true,
        }),
        // Rotation
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 6000,
          delay,
          useNativeDriver: true,
        }),
        // Opacity: stay visible until end, then fade out
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.7,
            duration: 200,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.7,
            duration: 5200, // Stay visible most of fall
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Loop: wait a bit then restart
        setTimeout(() => startAnimation(), 300);
      });
    };

    startAnimation();
  }, [fallAnim, rotateAnim, opacityAnim, delay, fallDistance]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.fallingContainer,
        {
          left: horizontalPos,
          transform: [
            { translateY: fallAnim },
            { rotate: rotation },
          ],
          opacity: opacityAnim,
        },
      ]}
    >
      <Text style={styles.seedlingEmoji}>🌱</Text>
    </Animated.View>
  );
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface DashboardScreenProps {
  userId:     string;
  username:   string;
  apiUrl:     string;
}

// ── Helper ────────────────────────────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

// ── Component ─────────────────────────────────────────────────────────────────
const DashboardScreen: React.FC<DashboardScreenProps> = ({
  userId,
  username,
}) => {
  const navigation = useNavigation<DashboardNavigationProp>();

  // Greeting section fade-in + slide-down
  const greetOpacity = useRef(new Animated.Value(0)).current;
  const greetSlide   = useRef(new Animated.Value(-18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(greetOpacity, {
        toValue:  1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(greetSlide, {
        toValue:  0,
        tension:  60,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();
  }, [greetOpacity, greetSlide]);

  // ── Navigation handlers ───────────────────────────────────────────────────
  const goToNewAnalysis = () =>
    navigation.navigate('New Analysis' as any);

  const goToHistory = () =>
    navigation.navigate('History' as any);

  const handleSubmitForDevelopment = () =>
    Alert.alert(
      '🚀 Coming Soon',
      'Submit For Development will be available in a future update.\nStay tuned!',
      [{ text: 'Got it', style: 'default' }],
    );

  // ── Render ────────────────────────────────────────────────────────────────
  const screenWidth = Dimensions.get('window').width;
  
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surfaceWarm} />

      {/* Falling seedlings background animation */}
      <View style={styles.seedlingLayer} pointerEvents="none">
        <FallingSeedling delay={0} horizontalPos={screenWidth * 0.08} />
        <FallingSeedling delay={600} horizontalPos={screenWidth * 0.22} />
        <FallingSeedling delay={1200} horizontalPos={screenWidth * 0.35} />
        <FallingSeedling delay={1800} horizontalPos={screenWidth * 0.50} />
        <FallingSeedling delay={2400} horizontalPos={screenWidth * 0.65} />
        <FallingSeedling delay={3000} horizontalPos={screenWidth * 0.78} />
        <FallingSeedling delay={3600} horizontalPos={screenWidth * 0.90} />
        <FallingSeedling delay={4200} horizontalPos={screenWidth * 0.15} />
      </View>

      <HeaderBar
        title="🌱 Plant Measurement Pro"
        subtitle="AI-Powered Seedling Analysis"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Greeting ── */}
        <Animated.View
          style={[
            styles.greeting,
            { opacity: greetOpacity, transform: [{ translateY: greetSlide }] },
          ]}
        >
          <Text style={styles.greetText}>{getGreeting()},</Text>
          <Text style={styles.userText}>{username || userId}</Text>
          <Text style={styles.subText}>What would you like to do today?</Text>
        </Animated.View>

        {/* ── Action tiles ── */}
        <View style={styles.tiles}>
          <CardTile
            icon="🔬"
            title="New Analysis"
            subtitle="Capture and analyse seedling images with AI"
            color="green"
            onPress={goToNewAnalysis}
            entryDelay={100}
          />
          <CardTile
            icon="📊"
            title="Analysis History"
            subtitle="Review past analyses, measurements, and SVI data"
            color="blue"
            onPress={goToHistory}
            entryDelay={200}
          />
          <CardTile
            icon="🚀"
            title="Submit For Development"
            subtitle="Contribute analysis data to improve the AI model"
            color="orange"
            onPress={handleSubmitForDevelopment}
            badge="Coming Soon"
            entryDelay={300}
          />
        </View>

        {/* ── Footer ── */}
        <Animated.Text style={[styles.footer, { opacity: greetOpacity }]}>
          Plant Measurement Pro — AI-Powered Precision Agriculture
        </Animated.Text>
      </ScrollView>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Colors.primaryBg,
  },
  
  // Falling seedling animation layer (background)
  seedlingLayer: {
    position:        'absolute',
    top:             0,
    left:            0,
    right:           0,
    bottom:          0,
    zIndex:          1,
    overflow:        'hidden',
  },
  fallingContainer: {
    position:        'absolute',
    top:             -60,
  },
  seedlingEmoji: {
    fontSize:        24, // 50% smaller (was 48)
  },

  scroll: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    paddingHorizontal: Spacing[8],
    paddingTop:        Spacing[10],
    paddingBottom:     Spacing[24],
  },

  // Greeting block
  greeting: {
    marginBottom:    Spacing[10],
    paddingHorizontal: Spacing[2],
  },
  greetText: {
    fontSize:      Typography.sizes['3xl'],
    fontWeight:    Typography.weights.black,
    color:         Colors.gray800,
    letterSpacing: Typography.letterSpacing.tight,
  },
  userText: {
    fontSize:   Typography.sizes.xl,
    fontWeight: Typography.weights.extrabold,
    color:      Colors.primary,
    marginTop:  Spacing[1],
  },
  subText: {
    fontSize:   Typography.sizes.base,
    color:      Colors.gray500,
    fontWeight: Typography.weights.medium,
    marginTop:  Spacing[3],
  },

  // Tiles
  tiles: {
    marginBottom: Spacing[8],
  },

  // Footer
  footer: {
    textAlign:     'center',
    fontSize:      Typography.sizes.xs,
    color:         Colors.gray400,
    fontWeight:    Typography.weights.medium,
    letterSpacing: Typography.letterSpacing.wide,
    marginTop:     Spacing[4],
  },
});

export default DashboardScreen;
