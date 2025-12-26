import { useState, useCallback, useEffect } from 'react';
import * as Speech from 'expo-speech';
import { haptics } from '@/utils/haptics';

interface UseAudioAssistProps {
    storyText: string;
}

export function useAudioAssist({ storyText }: UseAudioAssistProps) {
    const [showAudioPlayer, setShowAudioPlayer] = useState(false);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [isAudioBuffering, setIsAudioBuffering] = useState(false);

    const handlePlayPauseAudio = useCallback(async () => {
        haptics.selection();
        if (isAudioPlaying) {
            Speech.pause();
            setIsAudioPlaying(false);
        } else {
            const isPaused = await Speech.isSpeakingAsync();
            if (isPaused) {
                Speech.resume();
                setIsAudioPlaying(true);
            } else {
                setIsAudioBuffering(true);
                Speech.speak(storyText, {
                    language: 'en',
                    onStart: () => {
                        setIsAudioPlaying(true);
                        setIsAudioBuffering(false);
                    },
                    onDone: () => {
                        setIsAudioPlaying(false);
                        setIsAudioBuffering(false);
                    },
                    onStopped: () => {
                        setIsAudioPlaying(false);
                        setIsAudioBuffering(false);
                    },
                    onError: () => {
                        setIsAudioPlaying(false);
                        setIsAudioBuffering(false);
                    },
                });
            }
        }
    }, [isAudioPlaying, storyText]);

    const handleStopAudio = useCallback(() => {
        haptics.selection();
        Speech.stop();
        setIsAudioPlaying(false);
        setIsAudioBuffering(false);
    }, []);

    const toggleAudioPlayer = useCallback(() => {
        haptics.light();
        setShowAudioPlayer(prev => {
            if (prev) {
                Speech.stop();
                setIsAudioPlaying(false);
            }
            return !prev;
        });
    }, []);

    useEffect(() => {
        return () => {
            Speech.stop();
        };
    }, []);

    return {
        showAudioPlayer,
        isAudioPlaying,
        isAudioBuffering,
        handlePlayPauseAudio,
        handleStopAudio,
        toggleAudioPlayer,
    };
}
