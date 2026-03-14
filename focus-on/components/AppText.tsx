/**
 * AppText — Drop-in replacement for React Native Text.
 * Automatically applies Inter font based on fontWeight.
 * Usage: import AppText from '@/components/AppText'
 *        <AppText style={{ fontSize: 16, fontWeight: '700' }}>Hello</AppText>
 */
import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { FONTS } from '@/constants/theme';

function weightToFamily(weight?: string | number): string {
  const w = String(weight || '400');
  if (w === '800' || w === '900') return FONTS.extrabold;
  if (w === '700')                 return FONTS.bold;
  if (w === '600')                 return FONTS.semibold;
  if (w === '500')                 return FONTS.medium;
  return FONTS.regular;
}

export default function AppText({ style, ...props }: TextProps) {
  const flat = StyleSheet.flatten(style) || {};
  const family = flat.fontFamily ?? weightToFamily(flat.fontWeight as string);
  return (
    <Text
      {...props}
      style={[style, { fontFamily: family }]}
    />
  );
}
