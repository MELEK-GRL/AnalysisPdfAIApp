/**
 * Uygulama geneli segment sekme kontrolü.
 * Dikkat: kırmızı yazı/ikon; sayı sağda yuvarlak rozet.
 */
import React, {useMemo} from 'react';
import {View, TouchableOpacity, StyleSheet, ViewStyle} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useResponsive} from '../../utils/deviceStore/device';
import T from '../Text/T';
import colors from '../../theme/colors';
import {fontSize} from '../../constants/typography';
import {iconSize} from '../../constants/icons';

export type SegmentedTabItem<K extends string = string> = {
  key: K;
  label: string;
  icon: string;
  /** Bulgu sayısı; >0 ise sağda yuvarlak rozet */
  badge?: number;
  /** alert: kırmızı yazı / ikon */
  tone?: 'default' | 'alert';
};

type Props<K extends string> = {
  items: SegmentedTabItem<K>[];
  value: K;
  onChange: (key: K) => void;
  style?: ViewStyle;
};

function SegmentedTabs<K extends string>({
  items,
  value,
  onChange,
  style,
}: Props<K>) {
  const {w1px, h1px} = useResponsive();
  const badgeSize = 22 * w1px;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          backgroundColor: '#F4F5F7',
          borderRadius: 14 * w1px,
          padding: 5 * w1px,
          gap: 4 * w1px,
        },
        tab: {
          flex: 1,
          flexDirection: 'row',
          paddingVertical: 10 * h1px,
          paddingHorizontal: 10 * w1px,
          borderRadius: 10 * w1px,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: 'transparent',
        },
        tabActive: {
          backgroundColor: colors.white,
          borderColor: colors.backgroundPurple,
          shadowColor: colors.backgroundPurple,
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.12,
          shadowRadius: 6,
          elevation: 3,
        },
        tabInactiveAlert: {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        },
        leading: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8 * w1px,
          minWidth: 0,
        },
        label: {
          flexShrink: 1,
        },
        badge: {
          width: badgeSize,
          height: badgeSize,
          borderRadius: badgeSize / 2,
          marginLeft: 6 * w1px,
          backgroundColor: colors.white,
          borderWidth: 1.5,
          borderColor: colors.danger,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.danger,
          shadowOffset: {width: 0, height: 1},
          shadowOpacity: 0.25,
          shadowRadius: 2,
          elevation: 3,
        },
        badgeText: {
          textAlign: 'center',
          includeFontPadding: false,
          textAlignVertical: 'center',
          lineHeight: fontSize.caption * 1.1,
        },
      }),
    [w1px, h1px, badgeSize],
  );

  return (
    <View style={[styles.row, style]}>
      {items.map(item => {
        const active = value === item.key;
        const hasBadge = (item.badge ?? 0) > 0;
        const passiveAlert = item.tone === 'alert' && !active;

        let tabStyle = null;
        if (active) {
          tabStyle = styles.tabActive;
        } else if (passiveAlert) {
          tabStyle = styles.tabInactiveAlert;
        }

        let accent: string = colors.buttonGray;
        let labelColor: string = colors.textLight;
        if (active && item.tone === 'alert') {
          accent = colors.danger;
          labelColor = colors.dangerText;
        } else if (active) {
          accent = colors.backgroundPurple;
          labelColor = colors.backgroundPurpleDark;
        } else if (passiveAlert) {
          accent = colors.danger;
          labelColor = colors.dangerText;
        }

        return (
          <TouchableOpacity
            key={item.key}
            style={[styles.tab, tabStyle]}
            onPress={() => onChange(item.key)}
            activeOpacity={0.75}
            accessibilityRole="tab"
            accessibilityState={{selected: active}}>
            <View style={styles.leading}>
              <Ionicons
                name={item.icon as any}
                size={iconSize.medium}
                color={accent}
              />
              <T
                size={fontSize.body}
                weight="500"
                color={labelColor}
                style={styles.label}
                numberOfLines={1}>
                {item.label}
              </T>
            </View>
            {hasBadge ? (
              <View style={styles.badge}>
                <T
                  size={fontSize.caption}
                  weight="700"
                  color={colors.danger}
                  style={styles.badgeText}>
                  {(item.badge ?? 0) > 99 ? '99+' : String(item.badge)}
                </T>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default SegmentedTabs;
