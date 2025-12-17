import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function TermsOfServiceScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const sections = [
        {
            title: '1. Hizmet Tanımı',
            content: 'English Tales, klasik İngilizce hikayeleri okuyarak dil öğrenmenizi sağlayan bir eğitim uygulamasıdır. Uygulama; hikaye okuma, kelime öğrenme, ilerleme takibi, başarı rozetleri ve çevrimdışı okuma özellikleri sunar.',
        },
        {
            title: '2. Hesap Oluşturma',
            content: 'Uygulamayı kullanmak için email ile kayıt olabilir, Google hesabınızla giriş yapabilir veya misafir olarak devam edebilirsiniz. Misafir kullanıcılar yorum yapma ve bazı özellikleri kullanamaz. Hesap bilgilerinizin doğruluğundan siz sorumlusunuz.',
        },
        {
            title: '3. Hikaye İçerikleri',
            content: 'Uygulamadaki hikayeler; Ezop Masalları, Grimm Kardeşler, Hans Christian Andersen ve Oscar Wilde gibi yazarların klasik eserlerinden oluşmaktadır. Bu eserler kamu malıdır (public domain). İçeriklerin ticari amaçla kopyalanması veya dağıtılması yasaktır.',
        },
        {
            title: '4. Yorumlar ve Değerlendirmeler',
            content: 'Hikayeler için yorum ve puan verebilirsiniz. Yorumlarınız moderasyon sürecinden geçer. Hakaret, spam veya uygunsuz içerik barındıran yorumlar silinir. Tekrarlayan ihlallerde hesabınız askıya alınabilir.',
        },
        {
            title: '5. Çevrimdışı İndirme',
            content: 'Hikayeleri cihazınıza indirerek internet olmadan okuyabilirsiniz. İndirilen içerikler yalnızca kişisel kullanım içindir ve başka platformlarda paylaşılamaz.',
        },
        {
            title: '6. Başarılar ve İlerleme',
            content: 'Okuma aktivitelerinize göre başarı rozetleri kazanırsınız. İlerleme verileriniz hesabınıza bağlıdır. Misafir hesaptan çıkış yaparsanız ilerlemeniz kaybolabilir.',
        },
        {
            title: '7. Kullanım Kuralları',
            content: 'Uygulamayı yalnızca eğitim amaçlı kullanabilirsiniz. Uygulamayı kötüye kullanmak, tersine mühendislik yapmak veya güvenlik açıklarını istismar etmek yasaktır.',
        },
        {
            title: '8. Sorumluluk Reddi',
            content: 'English Tales "olduğu gibi" sunulmaktadır. Dil öğrenme sonuçları kullanıcının çabasına bağlıdır. Uygulama kesintisiz çalışacağını garanti etmez.',
        },
        {
            title: '9. Değişiklikler',
            content: 'Bu koşulları önceden bildirmeksizin değiştirebiliriz. Önemli değişiklikler uygulama içi bildirimle duyurulur.',
        },
        {
            title: '10. İletişim',
            content: 'Sorularınız için uygulama içindeki Ayarlar > Destek bölümünden bize ulaşabilirsiniz.',
        },
    ];

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Kullanım Koşulları</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.lastUpdated}>Son güncelleme: Aralık 2024</Text>

                <Text style={styles.intro}>
                    English Tales uygulamasını kullanarak aşağıdaki koşulları kabul etmiş olursunuz.
                </Text>

                {sections.map((section, index) => (
                    <View key={index} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <Text style={styles.sectionContent}>{section.content}</Text>
                    </View>
                ))}

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Bu koşulları kabul ederek English Tales'i kullanmaya başlayabilirsiniz. İyi okumalar! 📚
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.surface,
    },
    headerTitle: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    placeholder: {
        width: 40,
    },
    content: {
        paddingHorizontal: theme.spacing.xl,
        paddingTop: theme.spacing.lg,
    },
    lastUpdated: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
        marginBottom: theme.spacing.md,
    },
    intro: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        lineHeight: 24,
        marginBottom: theme.spacing.xl,
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    sectionContent: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        lineHeight: 24,
    },
    footer: {
        marginTop: theme.spacing.lg,
        paddingTop: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    footerText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
        textAlign: 'center',
        lineHeight: 20,
    },
}));
