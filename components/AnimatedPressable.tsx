import { PropsWithChildren, useEffect } from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type AnimatedPressableProps = PropsWithChildren<
  Omit<PressableProps, 'style'> & {
    style?: StyleProp<ViewStyle>;
    pressedScale?: number;
    animationDuration?: number;
    disabledOpacity?: number;
  }
>;

export default function AnimatedPressable({
  children,
  style,
  pressedScale = 0.97,
  animationDuration = 120,
  disabledOpacity = 0.55,
  disabled = false,
  onPressIn,
  onPressOut,
  ...rest
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(disabled ? disabledOpacity : 1);

  useEffect(() => {
    opacity.value = withTiming(disabled ? disabledOpacity : 1, {
      duration: animationDuration,
    });
  }, [animationDuration, disabled, disabledOpacity, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn: PressableProps['onPressIn'] = (event) => {
    if (!disabled) {
      scale.value = withTiming(pressedScale, {
        duration: animationDuration,
      });
    }

    onPressIn?.(event);
  };

  const handlePressOut: PressableProps['onPressOut'] = (event) => {
    scale.value = withTiming(1, {
      duration: animationDuration,
    });

    onPressOut?.(event);
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        {...rest}
        disabled={disabled}
        style={style}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}