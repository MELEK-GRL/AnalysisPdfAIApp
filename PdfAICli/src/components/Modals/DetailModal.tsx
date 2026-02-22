import React, { useMemo, ReactNode } from 'react';
import { View, StyleSheet, Modal, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../../utils/deviceStore/device';
import T from '../Text/T';
import Button from '../Buttons/Button';
import colors from '../../theme/colors';
import { fontSize } from '../../constants/typography';

type Props = {
    visible: boolean;
    title?: string;
    message?: string;
    children?: ReactNode;
    leftButtonText?: string;
    rightButtonText?: string;
    onLeftPress?: () => void;
    onRightPress?: () => void;
};

const DetailModal: React.FC<Props> = ({
    visible,
    title = 'Uyarı',
    message,
    children,
    leftButtonText,
    rightButtonText,
    onLeftPress,
    onRightPress,
}) => {
    const { w1px, h1px, fs1px } = useResponsive();
    const insets = useSafeAreaInsets();

    const styles = useMemo(() => {
        const { width, height } = Dimensions.get('screen');
        return StyleSheet.create({
                overlay: {
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width,
                    height,
                    backgroundColor: colors.backgroundLight,
                },
                box: {
                    flex: 1,
                    width: '100%',
                    backgroundColor: colors.white,
                    paddingVertical: 20 * h1px,
                    paddingHorizontal: 20 * w1px,
                    alignItems: 'stretch',
                },
                titleWrap: {
                    marginBottom: 16 * h1px,
                    paddingBottom: 14 * h1px,
                    borderBottomWidth: 3,
                    borderBottomColor: colors.backgroundPurpleSoft,
                    alignItems: 'center',
                },
                buttonRow: {
                    flexDirection: 'row',
                    justifyContent: 'center',
                    width: '100%',
                    gap: 12 * w1px,
                    marginTop: 20 * h1px,
                    paddingTop: 16 * h1px,
                    paddingBottom: Math.max(8 * h1px, insets.bottom),
                    borderTopWidth: 1,
                    borderTopColor: '#F3F4F6',
                },
                contentWrap: {
                    flex: 1,
                    marginTop: 4 * h1px,
                    width: '100%',
                    paddingVertical: 8 * h1px,
                },
            });
    }, [w1px, h1px, fs1px, insets.bottom]);

    if (!visible) {
        return null;
    }

    return (
        <Modal
            visible={visible}
            animationType="slide"
            statusBarTranslucent
            presentationStyle="fullScreen">
            <View style={styles.overlay}>
                <View style={styles.box}>
                        <View style={styles.titleWrap}>
                            <T
                                size={fontSize.titleXl}
                                weight="700"
                                align="center"
                                color={colors.textDark}>
                                {title}
                            </T>
                        </View>

                        {/* İçerik */}
                        <View style={styles.contentWrap}>
                            {children ? (
                                children
                            ) : (
                                <T size={fontSize.body} color={colors.textGraySoft} align="center">
                                    {message}
                                </T>
                            )}
                        </View>

                        {/* Butonlar */}
                        {(leftButtonText || rightButtonText) && (
                            <View style={styles.buttonRow}>
                                {leftButtonText && (
                                    <Button
                                        buttonText={leftButtonText}
                                        onPress={onLeftPress}
                                        width={h1px * 140}
                                        color="#E5E7EB"
                                    />
                                )}

                                {rightButtonText && (
                                    <Button
                                        buttonText={rightButtonText}
                                        onPress={onRightPress}
                                        width={h1px * 140}
                                    />
                                )}
                            </View>
                        )}
                    </View>
            </View>
        </Modal>
    );
};

export default DetailModal;
