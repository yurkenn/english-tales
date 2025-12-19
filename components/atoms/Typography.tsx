import React from 'react';
import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

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

export const Typography: React.FC<TypographyProps> = ({
    variant = 'body',
    color,
    align,
    style,
    children,
    weight,
    ...props
}) => {
    const { theme } = useUnistyles();

    const getVariantStyle = (): TextStyle => {
        const { typography } = theme;

        switch (variant) {
            case 'h1':
                return {
                    fontSize: typography.size.display,
                    fontFamily: typography.fontFamily.bold,
                    lineHeight: typography.size.display * typography.lineHeight.tight,
                };
            case 'h2':
                return {
                    fontSize: typography.size.xxxl,
                    fontFamily: typography.fontFamily.bold,
                    lineHeight: typography.size.xxxl * typography.lineHeight.tight,
                };
            case 'h3':
                return {
                    fontSize: typography.size.xxl,
                    fontFamily: typography.fontFamily.heading,
                    lineHeight: typography.size.xxl * typography.lineHeight.tight,
                };
            case 'title':
                return {
                    fontSize: typography.size.xl,
                    fontFamily: typography.fontFamily.heading,
                    lineHeight: typography.size.xl * typography.lineHeight.normal,
                };
            case 'subtitle':
                return {
                    fontSize: typography.size.lg,
                    fontFamily: typography.fontFamily.semiBold,
                    lineHeight: typography.size.lg * typography.lineHeight.normal,
                };
            case 'bodyBold':
                return {
                    fontSize: typography.size.md,
                    fontFamily: typography.fontFamily.semiBold,
                    lineHeight: typography.size.md * typography.lineHeight.relaxed,
                };
            case 'caption':
                return {
                    fontSize: typography.size.sm,
                    fontFamily: typography.fontFamily.body,
                    lineHeight: typography.size.sm * typography.lineHeight.normal,
                };
            case 'label':
                return {
                    fontSize: typography.size.xs,
                    fontFamily: typography.fontFamily.semiBold,
                    lineHeight: typography.size.xs * typography.lineHeight.normal,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                };
            case 'button':
                return {
                    fontSize: typography.size.lg,
                    fontFamily: typography.fontFamily.semiBold,
                    lineHeight: typography.size.lg * typography.lineHeight.tight,
                };
            case 'body':
            default:
                return {
                    fontSize: typography.size.md,
                    fontFamily: typography.fontFamily.body,
                    lineHeight: typography.size.md * typography.lineHeight.relaxed,
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
