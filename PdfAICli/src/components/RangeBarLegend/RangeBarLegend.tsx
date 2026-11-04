/**
 * Referans araligi cubugu — etiket; tiklaninca Header kotasi gibi ok'lu uyari.
 */
import React, {useCallback, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import T from '../Text/T';
import {useT} from '../../store/useLocaleStore';
import {useResponsive} from '../../utils/deviceStore/device';
import {fontSize} from '../../constants/typography';
import {iconSize} from '../../constants/icons';
import colors from '../../theme/colors';

const ZONE = '#BBF7D0';
const TRACK = '#E5E7EB';

type Props = {
  style?: ViewStyle;
};

const RangeBarLegend: React.FC<Props> = ({style}) => {
  const t = useT();
  const {w1px, h1px, fs1px} = useResponsive();
  const [infoVisible, setInfoVisible] = useState(false);
  const [anchor, setAnchor] = useState({x: 12, y: 120, height: 0});
  const wrapRef = useRef<View>(null);

  const closeInfo = useCallback(() => setInfoVisible(false), []);

  const openInfo = useCallback(() => {
    wrapRef.current?.measureInWindow((x, y, _w, height) => {
      setAnchor({x, y, height});
      setInfoVisible(true);
    });
  }, []);

  const styles = StyleSheet.create({
    wrap: {
      alignSelf: 'flex-start',
      marginBottom: 10 * h1px,
      zIndex: 2,
    },
    tag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5 * w1px,
      paddingHorizontal: 10 * w1px,
      paddingVertical: 6 * h1px,
      borderRadius: 20 * fs1px,
      backgroundColor: colors.backgroundPurpleSoft,
      borderWidth: 1,
      borderColor: 'rgba(116, 83, 224, 0.28)',
    },
    dismissLayer: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    infoDrop: {
      position: 'absolute',
      width: 268 * w1px,
    },
    infoArrow: {
      position: 'absolute',
      top: 0,
      left: 20 * w1px,
      width: 0,
      height: 0,
      borderLeftWidth: 8 * w1px,
      borderRightWidth: 8 * w1px,
      borderBottomWidth: 9 * h1px,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: colors.white,
      zIndex: 2,
    },
    infoArrowBorder: {
      position: 'absolute',
      top: -1.5,
      left: 19 * w1px,
      width: 0,
      height: 0,
      borderLeftWidth: 9 * w1px,
      borderRightWidth: 9 * w1px,
      borderBottomWidth: 10 * h1px,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: 'rgba(116, 83, 224, 0.12)',
      zIndex: 1,
    },
    infoBubble: {
      marginTop: 8 * h1px,
      backgroundColor: colors.white,
      borderRadius: 16 * fs1px,
      paddingVertical: 14 * h1px,
      paddingHorizontal: 14 * w1px,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(116, 83, 224, 0.14)',
      shadowColor: '#3B2A7A',
      shadowOpacity: 0.22,
      shadowRadius: 16,
      shadowOffset: {width: 0, height: 6},
      elevation: 12,
      gap: 12 * h1px,
    },
    sampleBar: {
      flexDirection: 'row',
      height: 10 * h1px,
      borderRadius: 999,
      overflow: 'hidden',
      backgroundColor: TRACK,
    },
    legendCol: {
      gap: 8 * h1px,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8 * w1px,
    },
    swatch: {
      width: 20 * w1px,
      height: 9 * h1px,
      borderRadius: 999,
    },
  });

  return (
    <View ref={wrapRef} collapsable={false} style={[styles.wrap, style]}>
      <TouchableOpacity
        style={styles.tag}
        activeOpacity={0.85}
        onPress={openInfo}
        accessibilityRole="button"
        accessibilityLabel={t('history.rangeLegendTitle')}>
        <Ionicons
          name="help-circle-outline"
          size={iconSize.medium}
          color={colors.backgroundPurple}
        />
        <T
          size={fontSize.bodySmall}
          weight="600"
          color={colors.backgroundPurpleDark}>
          {t('history.rangeLegendTitle')}
        </T>
      </TouchableOpacity>

      <Modal
        visible={infoVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeInfo}>
        <Pressable style={styles.dismissLayer} onPress={closeInfo}>
          <Pressable
            style={[
              styles.infoDrop,
              {
                top: anchor.y + anchor.height + 28 * h1px,
                left: Math.max(12 * w1px, anchor.x),
              },
            ]}
            onPress={e => e.stopPropagation()}>
            <View style={styles.infoArrowBorder} />
            <View style={styles.infoArrow} />
            <View style={styles.infoBubble}>
              <View style={styles.sampleBar}>
                <View style={{flex: 1, backgroundColor: TRACK}} />
                <View style={{flex: 2.2, backgroundColor: ZONE}} />
                <View style={{flex: 1, backgroundColor: TRACK}} />
              </View>
              <View style={styles.legendCol}>
                <View style={styles.item}>
                  <View style={[styles.swatch, {backgroundColor: ZONE}]} />
                  <T size={fontSize.bodySmall} color={colors.textGraySoft}>
                    {t('history.rangeLegendNormal')}
                  </T>
                </View>
                <View style={styles.item}>
                  <View style={[styles.swatch, {backgroundColor: TRACK}]} />
                  <T size={fontSize.bodySmall} color={colors.textGraySoft}>
                    {t('history.rangeLegendOutside')}
                  </T>
                </View>
                <View style={styles.item}>
                  <Ionicons
                    name="heart"
                    size={iconSize.medium}
                    color={colors.backgroundPurple}
                  />
                  <T size={fontSize.bodySmall} color={colors.textGraySoft}>
                    {t('history.rangeLegendYou')}
                  </T>
                </View>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default RangeBarLegend;
