import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo,
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
        }

        return this.props.children;
    }
}

interface ErrorFallbackProps {
    error: Error | null;
    onReset: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onReset }) => {
    const { theme } = useUnistyles();

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.iconContainer}>
                    <Ionicons
                        name="alert-circle-outline"
                        size={64}
                        color={theme.colors.error}
                    />
                </View>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                    Something went wrong
                </Text>
                <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
                    {error?.message || 'An unexpected error occurred'}
                </Text>
                {__DEV__ && error?.stack && (
                    <View style={[styles.stackContainer, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.stackText, { color: theme.colors.textMuted }]}>
                            {error.stack}
                        </Text>
                    </View>
                )}
                <Pressable
                    style={[styles.button, { backgroundColor: theme.colors.primary }]}
                    onPress={onReset}
                    accessibilityRole="button"
                    accessibilityLabel="Try again"
                >
                    <Text style={[styles.buttonText, { color: theme.colors.textInverse }]}>
                        Try Again
                    </Text>
                </Pressable>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xl,
    },
    iconContainer: {
        marginBottom: theme.spacing.xl,
    },
    title: {
        fontSize: theme.typography.size.xxl,
        fontWeight: theme.typography.weight.bold,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },
    message: {
        fontSize: theme.typography.size.md,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
        lineHeight: 22,
    },
    stackContainer: {
        width: '100%',
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        marginBottom: theme.spacing.xl,
        maxHeight: 200,
    },
    stackText: {
        fontSize: theme.typography.size.xs,
        fontFamily: 'monospace',
    },
    button: {
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.radius.full,
        minWidth: 200,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
    },
}));
