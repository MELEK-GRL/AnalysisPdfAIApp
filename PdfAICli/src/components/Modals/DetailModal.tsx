import React, { useMemo, ReactNode } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Modal } from 'react-native';
import { useResponsive } from '../../utils/deviceStore/device';
import T from '../Text/T';
import Button from '../Buttons/Button';
import colors from '../../theme/colors';

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

    const styles = useMemo(
        () =>
            StyleSheet.create({
                overlay: {
                    flex: 1,
                    backgroundColor: 'rgba(17, 24, 39, 0.4)',
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                box: {
                    width: '95%',
                    backgroundColor: colors.white,
                    borderRadius: 8 * w1px,
                    paddingVertical: 18 * h1px,
                    paddingHorizontal: 8 * w1px,
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOpacity: 0.15,
                    shadowRadius: 10 * w1px,
                    elevation: 5,
                },
                buttonRow: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    width: '100%',
                    gap: 12 * w1px,
                    marginTop: 20 * h1px,
                },
                contentWrap: {
                    marginTop: 6 * h1px,
                    alignItems: 'center',
                    width: '100%',
                },
            }),
        [w1px, h1px, fs1px],
    );

    if (!visible) {
        return null;
    }

    return (
        <Modal visible={visible} transparent animationType="fade">
            <TouchableWithoutFeedback>
                <View style={styles.overlay}>
                    <View style={styles.box}>
                        <T
                            size={18 * fs1px}
                            weight="700"
                            align="center"
                            style={{ marginBottom: 10 * h1px }}>
                            {title}
                        </T>

                        {/* İçerik */}
                        <View style={styles.contentWrap}>
                            {children ? (
                                children
                            ) : (
                                <T size={14 * fs1px} color="#374151" align="center">
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
            </TouchableWithoutFeedback>
        </Modal>
    );
};

export default DetailModal;
