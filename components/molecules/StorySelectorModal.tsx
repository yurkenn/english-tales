import React, { useState, useEffect } from 'react';
import { View, Modal, Pressable, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../atoms/Typography';
import { OptimizedImage } from '../atoms/OptimizedImage';
import { sanityClient, queries, getImageUrl } from '@/services/sanity';
import { Story } from '@/types';

interface StorySelectorModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (story: Story) => void;
}

export const StorySelectorModal: React.FC<StorySelectorModalProps> = ({
    visible,
    onClose,
    onSelect,
}) => {
    const { theme } = useUnistyles();
    const [search, setSearch] = useState('');
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!visible) {
            setSearch('');
            setStories([]);
            return;
        }
        // Fetch featured or popular stories initially
        loadInitialStories();
    }, [visible]);

    const loadInitialStories = async () => {
        setLoading(true);
        try {
            const data = await sanityClient.fetch<any[]>(queries.featuredStories);
            if (Array.isArray(data)) {
                setStories(data as any);
            }
        } catch (error) {
            console.error('Error fetching initial stories:', error);
        }
        setLoading(false);
    };

    const handleSearch = async (text: string) => {
        setSearch(text);
        if (text.length < 2) {
            if (text === '') loadInitialStories();
            return;
        }

        setLoading(true);
        try {
            const data = await sanityClient.fetch<any[]>(queries.searchStories, { query: text } as any);
            if (Array.isArray(data)) {
                setStories(data as any);
            }
        } catch (error) {
            console.error('Error searching stories:', error);
        }
        setLoading(false);
    };

    const renderItem = ({ item }: { item: Story }) => {
        const authorName = typeof item.author === 'object' ? (item.author as any).name : item.author;

        return (
            <Pressable
                style={styles.storyItem}
                onPress={() => onSelect(item)}
            >
                <OptimizedImage
                    source={{ uri: item.coverImage ? getImageUrl(item.coverImage, { width: 100 }) : '' }}
                    style={styles.cover}
                    placeholder="book"
                />
                <View style={styles.storyInfo}>
                    <Typography variant="bodyBold" numberOfLines={1}>{item.title}</Typography>
                    <Typography variant="caption" color={theme.colors.textMuted}>{authorName || 'Unknown Author'}</Typography>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.border} />
            </Pressable>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={theme.colors.text} />
                    </Pressable>
                    <Typography variant="h3">Tag a Story</Typography>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={theme.colors.textMuted} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search stories..."
                        placeholderTextColor={theme.colors.textMuted}
                        value={search}
                        onChangeText={handleSearch}
                    />
                </View>

                {loading ? (
                    <ActivityIndicator style={{ marginTop: 40 }} color={theme.colors.primary} />
                ) : (
                    <FlatList
                        data={stories}
                        keyExtractor={item => (item as any)._id || item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <Typography color={theme.colors.textMuted}>No stories found</Typography>
                            </View>
                        }
                    />
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    closeButton: {
        padding: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.borderLight,
        margin: theme.spacing.lg,
        borderRadius: 12,
        paddingHorizontal: theme.spacing.md,
    },
    searchIcon: {
        marginRight: theme.spacing.sm,
    },
    searchInput: {
        flex: 1,
        height: 44,
        color: theme.colors.text,
        fontSize: 16,
    },
    list: {
        paddingHorizontal: theme.spacing.lg,
    },
    storyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    cover: {
        width: 40,
        height: 56,
        borderRadius: 4,
        backgroundColor: theme.colors.borderLight,
    },
    storyInfo: {
        flex: 1,
        marginLeft: theme.spacing.md,
    },
    empty: {
        alignItems: 'center',
        paddingVertical: 40,
    },
}));
