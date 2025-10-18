import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../../utils/deviceStore/device';
import T from '../Text/T';
import colors from '../../theme/colors';

type Props = {
    title?: string;
    onSettingsPress?: () => void;
};

const Header: React.FC<Props> = ({ title, onSettingsPress }) => {
    const nav = useNavigation<any>();
    const { w1px, h1px, fs1px } = useResponsive();

    const styles = StyleSheet.create({
        header: {
            paddingHorizontal: 10 * w1px,
            paddingVertical: h1px * 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: colors.backgroundPrupleDark,
            height: h1px * 90,
            borderBottomRightRadius: fs1px * 14,
            borderBottomLeftRadius: fs1px * 14,
        },
        headerTitle: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        },
        title: { marginLeft: w1px * 3 },
        scrollView: {
            flex: 1,
        },
        settingsView: {
            alignSelf: 'center',
            width: 27 * w1px,
            height: 27 * w1px,
            resizeMode: 'contain',
        },
    });

    return (
        <View style={styles.header}>
            <View style={styles.headerTitle}>
                <T size={20} weight="700" color={colors.textWhite}>
                    Hoş geldin,
                </T>
                {title ? (
                    <View style={styles.title}>
                        <T size={20} weight="600" color={colors.textWhite}>
                            {title.charAt(0).toUpperCase() + title.slice(1)}
                        </T>
                    </View>
                ) : null}
            </View>

            <TouchableOpacity
                onPress={onSettingsPress ?? (() => nav.navigate('Logout'))}
                activeOpacity={0.8}>
                <Image
                    source={require('../../assets/icons/settings2.png')}
                    style={styles.settingsView}
                />
            </TouchableOpacity>
        </View>
    );
};

export default Header;
