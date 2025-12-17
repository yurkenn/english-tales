import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyPolicyScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const sections = [
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

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Gizlilik Politikası</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.lastUpdated}>Son güncelleme: Aralık 2024</Text>

                <Text style={styles.intro}>
                    English Tales olarak gizliliğinize önem veriyoruz. Bu politika, verilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu açıklar.
                </Text>

                {sections.map((section, index) => (
                    <View key={index} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <Text style={styles.sectionContent}>{section.content}</Text>
                    </View>
                ))}

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Verileriniz bizim için önemli ve güvence altındadır. 🔒
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
