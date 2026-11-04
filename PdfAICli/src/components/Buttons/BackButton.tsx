/**
 * Ortak geri satırı — Ayarlar / Yeni Şifre vb. aynı görünüm.
 */
import React, { useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import T from '../Text/T';
import { useT } from '../../store/useLocaleStore';
import { useResponsive } from '../../utils/deviceStore/device';
import { fontSize } from '../../constants/typography';
import { iconSize } from '../../constants/icons';
import colors from '../../theme/colors';

type Props = {
  onPress: () => void;
  /** Varsayılan: common.back */
  label?: string;
  style?: ViewStyle;
};

const BackButton: React.FC<Props> = ({ onPress, label, style }) => {
  const t = useT();
  const { w1px, h1px } = useResponsive();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 16 * h1px,
        },
        iconWrap: {
          width: 38 * w1px,
          height: 38 * w1px,
          borderRadius: 19 * w1px,
          backgroundColor: colors.backgroundPurpleSoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12 * w1px,
          borderWidth: 1,
          borderColor: 'rgba(116, 83, 224, 0.2)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 3,
          elevation: 2,
        },
        label: {
          flexShrink: 1,
        },
      }),
    [w1px, h1px],
  );

  return (
    <TouchableOpacity
      style={[styles.row, style]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label ?? t('common.back')}>
      <View style={styles.iconWrap}>
        <Ionicons
          name="arrow-back"
          size={iconSize.medium}
          color={colors.backgroundPurple}
        />
      </View>
      <T
        size={fontSize.subtitleLarge}
        weight="600"
        color="#1F2937"
        style={styles.label}>
        {label ?? t('common.back')}
      </T>
    </TouchableOpacity>
  );
};

export default BackButton;
