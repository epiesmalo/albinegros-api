import { PropsWithChildren, useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

type AnimatedCardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  delay?: number;
  duration?: number;
  translateY?: number;
  initialScale?: number;
  /** Activa o desactiva completamente la animación */
  enabled?: boolean;
  /** Permite volver a lanzar la animación cuando cambie este valor */
  animateKey?: string | number;
}>;

export default function AnimatedCard({
  children,
  style,
  delay = 0,
  duration = 240,
  translateY = 10,
  initialScale = 0.985,
  enabled = true,
  animateKey,
}: AnimatedCardProps) {
  const opacity = useSharedValue(enabled ? 0 : 1);
  const offsetY = useSharedValue(enabled ? translateY : 0);
  const scale = useSharedValue(enabled ? initialScale : 1);

  useEffect(() => {
    if (!enabled) {
      opacity.value = 1;
      offsetY.value = 0;
      scale.value = 1;
      return;
    }

    // Reinicia para poder repetir la animación cuando cambie animateKey
    opacity.value = 0;
    offsetY.value = translateY;
    scale.value = initialScale;

    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration,
        easing: Easing.out(Easing.cubic),
      })
    );

    offsetY.value = withDelay(
      delay,
      withTiming(0, {
        duration,
        easing: Easing.out(Easing.cubic),
      })
    );

    scale.value = withDelay(
      delay,
      withTiming(1, {
        duration,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [
    animateKey,
    enabled,
    delay,
    duration,
    translateY,
    initialScale,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: offsetY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}