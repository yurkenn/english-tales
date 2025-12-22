import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function PrivacyPolicyScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { i18n } = useTranslation();

    const isEnglish = i18n.language.startsWith('en');

    const sectionsEN = [
        {
            title: '1. Data We Collect',
            content: 'When you create an account, we collect your email address and name. If you sign in with Google, your Google profile information is collected. No personal data is collected from guest users.',
        },
        {
            title: '2. Reading Data',
            content: 'The stories you read, your reading time, progress percentage, and completed stories are recorded. This data is used to provide personalized recommendations and track your achievement badges.',
        },
        {
            title: '3. Achievements and Statistics',
            content: 'Your earned badges, reading streaks, and total reading time are stored in connection with your account. This data is only visible to you.',
        },
        {
            title: '4. Your Reviews',
            content: 'Reviews and ratings you submit for stories are stored along with your profile information. Approved reviews become visible to other users.',
        },
        {
            title: '5. Firebase Services',
            content: 'We use Firebase Authentication for identity verification and Firestore for data storage. Your data is stored encrypted on Google\'s secure servers.',
        },
        {
            title: '6. Offline Content',
            content: 'Downloaded stories are stored locally on your device. Download history and size information are displayed. You can delete downloaded content at any time.',
        },
        {
            title: '7. Analytics',
            content: 'We may collect anonymous usage statistics to improve the app. This data consists of aggregate information that cannot personally identify you.',
        },
        {
            title: '8. Data Retention',
            content: 'Your data is retained as long as your account is active. When you delete your account, all your personal data will be deleted within 30 days.',
        },
        {
            title: '9. Your Rights',
            content: 'You have the right to access, correct, and delete your data. You can update your profile information or delete your account in Settings > Account.',
        },
        {
            title: '10. Children\'s Privacy',
            content: 'English Tales is an educational app and can be used by children. Parental supervision is recommended for children under 13.',
        },
        {
            title: '11. Contact',
            content: 'For privacy-related questions, you can reach us through the Settings > Support section.',
        },
    ];

    const sectionsTR = [
        {
            title: '1. Topladığımız Veriler',
            content: 'Hesap oluştururken email adresiniz ve adınız toplanır. Google ile giriş yaparsanız Google profil bilgileriniz alınır. Misafir kullanıcılardan kişisel veri toplanmaz.',
        },
        {
            title: '2. Okuma Verileri',
            content: 'Okuduğunuz hikayeler, okuma süreniz, ilerleme yüzdeniz ve tamamladığınız hikayeler kaydedilir. Bu veriler size kişiselleştirilmiş öneriler sunmak ve başarı rozetlerinizi takip etmek için kullanılır.',
        },
        {
            title: '3. Başarı ve İstatistikler',
            content: 'Kazandığınız rozetler, okuma serileri, toplam okuma süreniz gibi istatistikler hesabınıza bağlı olarak saklanır. Bu veriler yalnızca size gösterilir.',
        },
        {
            title: '4. Yorumlarınız',
            content: 'Hikayeler için yazdığınız yorumlar ve verdiğiniz puanlar profil bilgilerinizle birlikte saklanır. Onaylanan yorumlar diğer kullanıcılara görünür olur.',
        },
        {
            title: '5. Firebase Hizmetleri',
            content: 'Kimlik doğrulama için Firebase Authentication, veri saklama için Firestore kullanıyoruz. Verileriniz Google\'ın güvenli sunucularında şifrelenmiş olarak saklanır.',
        },
        {
            title: '6. Çevrimdışı İçerik',
            content: 'İndirdiğiniz hikayeler cihazınızda yerel olarak saklanır. İndirme geçmişi ve boyut bilgileri görüntülenir. İstediğiniz zaman indirilen içerikleri silebilirsiniz.',
        },
        {
            title: '7. Analitik',
            content: 'Uygulamayı geliştirmek için anonim kullanım istatistikleri toplayabiliriz. Bu veriler kişisel olarak sizi tanımlamamız mümkün olmayan toplu verilerdir.',
        },
        {
            title: '8. Veri Saklama Süresi',
            content: 'Verileriniz hesabınız aktif olduğu sürece saklanır. Hesabınızı sildiğinizde tüm kişisel verileriniz 30 gün içinde silinir.',
        },
        {
            title: '9. Haklarınız',
            content: 'Verilerinize erişme, düzeltme ve silme hakkına sahipsiniz. Ayarlar > Hesap bölümünden profil bilgilerinizi güncelleyebilir veya hesabınızı silebilirsiniz.',
        },
        {
            title: '10. Çocukların Gizliliği',
            content: 'English Tales eğitim amaçlı bir uygulamadır ve çocuklar tarafından kullanılabilir. 13 yaş altı çocukların ebeveyn gözetiminde kullanması önerilir.',
        },
        {
            title: '11. İletişim',
            content: 'Gizlilik ile ilgili sorularınız için Ayarlar > Destek bölümünden bize ulaşabilirsiniz.',
        },
    ];

    const sections = isEnglish ? sectionsEN : sectionsTR;
    const headerTitle = isEnglish ? 'Privacy Policy' : 'Gizlilik Politikası';
    const lastUpdated = isEnglish ? 'Last updated: December 2024' : 'Son güncelleme: Aralık 2024';
    const intro = isEnglish
        ? 'At English Tales, we value your privacy. This policy explains how we collect, use, and protect your data.'
        : 'English Tales olarak gizliliğinize önem veriyoruz. Bu politika, verilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu açıklar.';
    const footer = isEnglish
        ? 'Your data is important to us and is kept secure. 🔒'
        : 'Verileriniz bizim için önemli ve güvence altındadır. 🔒';

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </Pressable>
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
