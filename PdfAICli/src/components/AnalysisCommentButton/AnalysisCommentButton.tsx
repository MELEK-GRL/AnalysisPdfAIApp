/**
 * Tahlil Yorumu satırı — Home / HistoryDetail ortak kart.
 */
import React, {useMemo} from 'react';
import {View, TouchableOpacity, StyleSheet, ViewStyle} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import T from '../Text/T';
import {useT} from '../../store/useLocaleStore';
import {useResponsive} from '../../utils/deviceStore/device';
import {fontSize} from '../../constants/typography';
import {iconSize} from '../../constants/icons';
import colors from '../../theme/colors';

type Props = {
  onPress: () => void;
  style?: ViewStyle;
};

const AnalysisCommentButton: React.FC<Props> = ({onPress, style}) => {
  const t = useT();
  const {w1px, h1px} = useResponsive();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        btn: {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'stretch',
          gap: 7 * w1px,
          marginBottom: 8 * h1px,
          paddingVertical: 7 * h1px,
          paddingHorizontal: 10 * w1px,
          backgroundColor: colors.white,
          borderRadius: 10 * w1px,
          borderWidth: 1,
          borderColor: 'rgba(116, 83, 224, 0.22)',
        },
        iconWrap: {
          width: 28 * w1px,
          height: 28 * w1px,
          borderRadius: 8 * w1px,
          backgroundColor: colors.backgroundPurpleSoft,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [w1px, h1px],
  );

  return (
    <TouchableOpacity
      style={[styles.btn, style]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={t('history.analysisComment')}>
      <View style={styles.iconWrap}>
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={iconSize.medium}
          color={colors.backgroundPurple}
        />
      </View>
      <T
        size={fontSize.body}
        weight="600"
        color={colors.backgroundPurpleDark}
        style={{flex: 1}}>
        {t('history.analysisComment')}
      </T>
      <Ionicons
        name="chevron-forward"
        size={iconSize.small}
        color={colors.backgroundPurple}
      />
    </TouchableOpacity>
  );
};

export default AnalysisCommentButton;
