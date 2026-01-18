import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function TermsOfServiceScreen() {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { i18n } = useTranslation();

    const isEnglish = i18n.language.startsWith('en');

    const sectionsEN = [
        {
            title: '1. Service Description',
            content: 'English Tales is an educational app that helps you learn English by reading classic stories. The app offers story reading, vocabulary learning, progress tracking, achievement badges, and offline reading features.',
        },
        {
            title: '2. Account Creation',
            content: 'To use the app, you can register with email, sign in with your Google account, or continue as a guest. Guest users cannot write reviews and use some features. You are responsible for the accuracy of your account information.',
        },
        {
            title: '3. Story Content',
            content: 'The stories in the app consist of classic works by authors such as Aesop, Brothers Grimm, Hans Christian Andersen, and Oscar Wilde. These works are in the public domain. Commercial copying or distribution of the content is prohibited.',
        },
        {
            title: '4. Reviews and Ratings',
            content: 'You can submit reviews and ratings for stories. Your reviews go through a moderation process. Reviews containing insults, spam, or inappropriate content will be deleted. Your account may be suspended for repeated violations.',
        },
        {
            title: '5. Offline Download',
            content: 'You can download stories to your device to read without internet. Downloaded content is for personal use only and cannot be shared on other platforms.',
        },
        {
            title: '6. Achievements and Progress',
            content: 'You earn achievement badges based on your reading activities. Your progress data is linked to your account. If you sign out from a guest account, your progress may be lost.',
        },
        {
            title: '7. Usage Rules',
            content: 'You may only use the app for educational purposes. Misusing the app, reverse engineering, or exploiting security vulnerabilities is prohibited.',
        },
        {
            title: '8. Disclaimer',
            content: 'English Tales is provided "as is". Language learning results depend on the user\'s effort. The app does not guarantee uninterrupted operation.',
        },
        {
            title: '9. Changes',
            content: 'We may change these terms without prior notice. Important changes will be announced through in-app notifications.',
        },
        {
            title: '10. Contact',
            content: 'For questions, you can reach us through the Settings > Support section in the app.',
        },
    ];

    const sectionsTR = [
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

    const sections = isEnglish ? sectionsEN : sectionsTR;
    const headerTitle = isEnglish ? 'Terms of Service' : 'Kullanım Koşulları';
    const lastUpdated = isEnglish ? 'Last updated: December 2024' : 'Son güncelleme: Aralık 2024';
    const intro = isEnglish
        ? 'By using English Tales, you agree to the following terms.'
        : 'English Tales uygulamasını kullanarak aşağıdaki koşulları kabul etmiş olursunuz.';
    const footer = isEnglish
        ? 'By accepting these terms, you can start using English Tales. Happy reading! 📚'
        : 'Bu koşulları kabul ederek English Tales\'i kullanmaya başlayabilirsiniz. İyi okumalar! 📚';

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{headerTitle}</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.lastUpdated}>{lastUpdated}</Text>

                <Text style={styles.intro}>{intro}</Text>

                {sections.map((section, index) => (
                    <View key={index} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <Text style={styles.sectionContent}>{section.content}</Text>
                    </View>
                ))}

                <View style={styles.footer}>
                    <Text style={styles.footerText}>{footer}</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const createStyles = (theme: Theme) => StyleSheet.create({
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
        backgroundColor: theme.colors.background,
        zIndex: 100,
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
});
