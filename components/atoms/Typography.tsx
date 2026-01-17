import { FC } from 'react';
import { Text as RNText, TextProps, TextStyle, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

export type TypographyVariant =
    | 'h1'
    | 'h2'
    | 'h3'
    | 'title'
    | 'subtitle'
    | 'body'
    | 'bodyBold'
    | 'caption'
    | 'label'
    | 'button';

interface TypographyProps extends TextProps {
    variant?: TypographyVariant;
    color?: string;
    align?: 'left' | 'center' | 'right';
    weight?: TextStyle['fontWeight'];
}

export const Typography: FC<TypographyProps> = ({
    variant = 'body',
    color,
    align,
    style,
    children,
    weight,
    ...props
}) => {
    const { theme } = useTheme();
    const { scaleFont } = useResponsiveLayout();

    const getVariantStyle = (): TextStyle => {
        const { typography } = theme;

        switch (variant) {
            case 'h1':
                return {
                    fontSize: scaleFont(typography.size.display),
                    fontFamily: typography.fontFamily.bold,
                    lineHeight: scaleFont(typography.size.display) * typography.lineHeight.tight,
                };
            case 'h2':
                return {
                    fontSize: scaleFont(typography.size.xxxl),
                    fontFamily: typography.fontFamily.bold,
                    lineHeight: scaleFont(typography.size.xxxl) * typography.lineHeight.tight,
                };
            case 'h3':
                return {
                    fontSize: scaleFont(typography.size.xxl),
                    fontFamily: typography.fontFamily.heading,
                    lineHeight: scaleFont(typography.size.xxl) * typography.lineHeight.tight,
                };
            case 'title':
                return {
                    fontSize: scaleFont(typography.size.xl),
                    fontFamily: typography.fontFamily.heading,
                    lineHeight: scaleFont(typography.size.xl) * typography.lineHeight.normal,
                };
            case 'subtitle':
                return {
                    fontSize: scaleFont(typography.size.lg),
                    fontFamily: typography.fontFamily.semiBold,
                    lineHeight: scaleFont(typography.size.lg) * typography.lineHeight.normal,
                };
            case 'bodyBold':
                return {
                    fontSize: scaleFont(typography.size.md),
                    fontFamily: typography.fontFamily.semiBold,
                    lineHeight: scaleFont(typography.size.md) * typography.lineHeight.relaxed,
                };
            case 'caption':
                return {
                    fontSize: scaleFont(typography.size.sm),
                    fontFamily: typography.fontFamily.body,
                    lineHeight: scaleFont(typography.size.sm) * typography.lineHeight.normal,
                };
            case 'label':
                return {
                    fontSize: scaleFont(typography.size.xs),
                    fontFamily: typography.fontFamily.semiBold,
                    lineHeight: scaleFont(typography.size.xs) * typography.lineHeight.normal,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                };
            case 'button':
                return {
                    fontSize: scaleFont(typography.size.lg),
                    fontFamily: typography.fontFamily.semiBold,
                    lineHeight: scaleFont(typography.size.lg) * typography.lineHeight.tight,
                };
            case 'body':
            default:
                return {
                    fontSize: scaleFont(typography.size.md),
                    fontFamily: typography.fontFamily.body,
                    lineHeight: scaleFont(typography.size.md) * typography.lineHeight.relaxed,
                };
        }
    };

    return (
        <RNText
            style={[
                getVariantStyle(),
                {
                    color: color || theme.colors.text,
                    textAlign: align,
                },
                style,
            ]}
            {...props}
        >
            {children}
        </RNText>
    );
};
