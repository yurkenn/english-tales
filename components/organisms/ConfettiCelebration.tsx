import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7', // Yellow
    '#DDA0DD', // Plum
    '#98D8C8', // Mint
    '#F7DC6F', // Gold
];

interface ConfettiPieceProps {
    delay: number;
    color: string;
    startX: number;
}

const ConfettiPiece: React.FC<ConfettiPieceProps> = ({ delay, color, startX }) => {
    const translateY = useRef(new Animated.Value(-50)).current;
    const translateX = useRef(new Animated.Value(startX)).current;
    const rotate = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const animation = Animated.parallel([
            Animated.timing(translateY, {
                toValue: SCREEN_HEIGHT + 50,
                duration: 3000 + Math.random() * 2000,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(translateX, {
                toValue: startX + (Math.random() - 0.5) * 200,
                duration: 3000 + Math.random() * 2000,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(rotate, {
                toValue: Math.random() * 10,
                duration: 3000,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 3000,
                delay: delay + 2000,
                useNativeDriver: true,
            }),
        ]);
        animation.start();
    }, [delay, startX, translateY, translateX, rotate, opacity]);

    const spin = rotate.interpolate({
        inputRange: [0, 10],
        outputRange: ['0deg', '3600deg'],
    });

    const size = 8 + Math.random() * 8;

    return (
        <Animated.View
            style={[
                styles.confetti,
                {
                    width: size,
                    height: size * 1.5,
                    backgroundColor: color,
                    transform: [
                        { translateX },
                        { translateY },
                        { rotate: spin },
                    ],
                    opacity,
                },
            ]}
        />
    );
};

interface ConfettiCelebrationProps {
    visible: boolean;
    onComplete?: () => void;
}

export const ConfettiCelebration: React.FC<ConfettiCelebrationProps> = ({
    visible,
    onComplete
}) => {
    const pieces = useRef(
        Array.from({ length: 100 }, (_, i) => ({
            id: i,
            delay: Math.random() * 1000,
            color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
            startX: Math.random() * SCREEN_WIDTH,
        }))
    ).current;

    useEffect(() => {
        if (visible && onComplete) {
            const timer = setTimeout(onComplete, 4000);
            return () => clearTimeout(timer);
        }
    }, [visible, onComplete]);

    if (!visible) return null;

    return (
        <View style={styles.container} pointerEvents="none">
            {pieces.map((piece) => (
                <ConfettiPiece
                    key={piece.id}
                    delay={piece.delay}
                    color={piece.color}
                    startX={piece.startX}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
    },
    confetti: {
        position: 'absolute',
        borderRadius: 2,
    },
});
