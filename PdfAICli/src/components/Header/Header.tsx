import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../../utils/deviceStore/device';
import { useT } from '../../store/useLocaleStore';
import T from '../Text/T';
import colors from '../../theme/colors';
import { fontSize } from '../../constants/typography';
import { iconSize } from '../../constants/icons';

type Props = {
    title?: string;
    onSettingsPress?: () => void;
};

const Header: React.FC<Props> = ({ title, onSettingsPress }) => {
    const nav = useNavigation<any>();
    const t = useT();
    const { w1px, h1px, fs1px } = useResponsive();

    const headerGradient: [string, string] = [
        colors.backgroundPurpleDark,
        '#8B6FEB', // ana mor → hafif açık mor
    ];

    const styles = StyleSheet.create({
        header: {
            paddingLeft: 14 * w1px,
            paddingRight: 20 * w1px,
            paddingVertical: h1px * 14,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: h1px * 110,
            borderBottomRightRadius: fs1px * 14,
            borderBottomLeftRadius: fs1px * 14,
            overflow: 'hidden',
        },
        headerView:{
            marginTop:h1px*18,
            flex:1,
            alignItems:'center',
            justifyContent:'center',
            flexDirection:'row'
        },
        headerTitle: {
           
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 16 * w1px,
        },
        title: { marginLeft: w1px * 3 },
        scrollView: {
            flex: 1,
        },
        settingsView: {
            alignSelf: 'center',
            width: iconSize.xl * w1px,
            height: iconSize.xl * h1px,
            resizeMode: 'contain',
        },
    });

    return (
        <LinearGradient
            colors={headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.header}>
            <View style={styles.headerView}>
   <View style={styles.headerTitle}>
                <T size={fontSize.titleLarge} weight="700" color={colors.textWhite}>
                    {t('header.welcome')},
                </T>
                {title ? (
                    <View style={styles.title}>
                        <T size={fontSize.titleLarge} weight="600" color={colors.textWhite}>
                            {title.charAt(0).toUpperCase() + title.slice(1)}
                        </T>
                    </View>
                ) : null}
            </View>

            <TouchableOpacity
                onPress={onSettingsPress ?? (() => nav.navigate('Settings'))}
                activeOpacity={0.8}>
                <Image
                    source={require('../../assets/icons/settings2.png')}
                    style={styles.settingsView}
                />
            </TouchableOpacity>
            </View>
        </LinearGradient>
    );
};

export default Header;
