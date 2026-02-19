import React, { useMemo } from 'react';
import { View, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { useResponsive } from '../../utils/deviceStore/device';
import T from '../Text/T';
import Button from '../Buttons/Button';

export type PopupType = 'info' | 'warning' | 'error' | 'success';

type Props = {
    visible: boolean;
    title?: string;
    message?: string;
    type?: PopupType;
    leftButtonText?: string;
    rightButtonText?: string;
    onLeftPress?: () => void;
    onRightPress?: () => void;
};

const TYPE_CONFIG: Record<PopupType, { accent: string; defaultTitle: string }> = {
    info: { accent: '#3B82F6', defaultTitle: 'Bilgi' },
    warning: { accent: '#F59E0B', defaultTitle: 'Uyarı' },
    error: { accent: '#EF4444', defaultTitle: 'Hata' },
    success: { accent: '#10B981', defaultTitle: 'Tamam' },
};

const PopupModal: React.FC<Props> = ({
    visible,
    title,
    message = '',
    type = 'info',
    leftButtonText,
    rightButtonText,
    onLeftPress,
    onRightPress,
}) => {
    const { w1px, h1px } = useResponsive();
    const config = TYPE_CONFIG[type];
    const displayTitle = title ?? config.defaultTitle;

    const styles = useMemo(
        () =>
            StyleSheet.create({
                overlay: {
                    flex: 1,
                    backgroundColor: 'rgba(17, 24, 39, 0.45)',
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                box: {
                    width: 320 * w1px,
                    maxWidth: 340,
                    backgroundColor: '#fff',
                    borderRadius: 12 * w1px,
                    paddingVertical: 24 * h1px,
                    paddingHorizontal: 20 * w1px,
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    elevation: 6,
                },
                accentBar: {
                    width: 48 * w1px,
                    height: 4 * h1px,
                    borderRadius: 2,
                    backgroundColor: config.accent,
                    marginBottom: 16 * h1px,
                },
                buttonRow: {
                    flexDirection: 'row',
                    justifyContent: 'center',
                    width: '100%',
                    gap: 12 * w1px,
                    marginTop: 20 * h1px,
                },
            }),
        [w1px, h1px, config.accent],
    );

    if (!visible) {
        return null;
    }

    return (
        <Modal visible={visible} transparent animationType="fade">
            <TouchableWithoutFeedback>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.box}>
                            <View style={styles.accentBar} />
                            <T
                                size={18}
                                weight="700"
                                align="center"
                                color="#111827"
                                style={{ marginBottom: 10 * h1px }}>
                                {displayTitle}
                            </T>

                            <T
                                size={15}
                                color="#4B5563"
                                align="center"
                                style={{ lineHeight: 22 }}>
                                {message}
                            </T>

                            {(leftButtonText || rightButtonText) && (
                                <View style={styles.buttonRow}>
                                    {leftButtonText && (
                                        <Button
                                            buttonText={leftButtonText}
                                            onPress={onLeftPress}
                                            width={h1px * 120}
                                            backgroundColor="#94A3B8"
                                        />
                                    )}
                                    {rightButtonText && (
                                        <Button
                                            buttonText={rightButtonText}
                                            onPress={onRightPress}
                                            width={h1px * 120}
                                        />
                                    )}
                                </View>
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

export default PopupModal;
