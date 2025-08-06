// components/LoadingStates.jsx
import React from 'react';
import { View, StyleSheet, Animated, Image } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/Colors';
import { ActivityIndicator } from 'react-native';
import { useRef, useEffect } from 'react';



export function LoadingInit() {
  // Referências para animação
  const fadeAnim = useRef(new Animated.Value(0)).current;     // Opacidade inicia em 0
  const scaleAnim = useRef(new Animated.Value(0.7)).current;  // Scale inicia pequeno

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,           // Fica totalmente visível
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,           // Fica no tamanho normal
        friction: 5,          // Suaviza a animação
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={loadingInitStyles.loadingContainer}>
      {/* LOGO animada */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }}
      >
        <Image
          source={require('../assets/images/LIMCIsemFundo.png')}
          style={loadingInitStyles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Loading spinner */}
      <View style={loadingInitStyles.loadingSection}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    </View>
  );
}

const loadingInitStyles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 60,
  },
  loadingSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});



// Skeleton animado para cards de pacientes
export function PatientCardSkeleton() {
  const shimmerValue = new Animated.Value(0);

  React.useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmerValue, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    shimmer.start();
  }, []);

  const opacity = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.skeletonCard}>
      <Animated.View style={[styles.skeletonAvatar, { opacity }]} />
      <View style={styles.skeletonInfo}>
        <Animated.View style={[styles.skeletonLine, styles.skeletonTitle, { opacity }]} />
        <Animated.View style={[styles.skeletonLine, styles.skeletonSubtitle, { opacity }]} />
      </View>
    </View>
  );
}

// Loading para análises
export function AnalysisCardSkeleton() {
  return (
    <View style={styles.analysisSkeletonCard}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonAnalysisInfo}>
        <View style={[styles.skeletonLine, { width: '70%' }]} />
        <View style={[styles.skeletonLine, { width: '50%', marginTop: 8 }]} />
        <View style={[styles.skeletonBadge, { width: 80 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.large,
    marginBottom: SPACING.sm,
  },
  skeletonAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.border,
    marginRight: SPACING.md,
  },
  skeletonInfo: {
    flex: 1,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.small,
    marginBottom: 6,
  },
  skeletonTitle: {
    width: '80%',
    height: 16,
  },
  skeletonSubtitle: {
    width: '60%',
  },
});