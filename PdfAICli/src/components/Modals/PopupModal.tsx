import React, { useMemo } from 'react';
import { View, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useResponsive } from '../../utils/deviceStore/device';
import T from '../Text/T';
import Button from '../Buttons/Button';
import { fontSize } from '../../constants/typography';
import { iconSize } from '../../constants/icons';

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

const TYPE_CONFIG: Record<PopupType, { accent: string; defaultTitle: string; icon: string }> = {
    success: { accent: '#22C55E', defaultTitle: 'Tamam', icon: 'checkmark-circle' },
    error: { accent: '#EF4444', defaultTitle: 'Hata', icon: 'close-circle' },
    warning: { accent: '#EAB308', defaultTitle: 'Uyarı', icon: 'warning' },
    info: { accent: '#3B82F6', defaultTitle: 'Bilgi', icon: 'information-circle' },
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
                    maxWidth: '90%',
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
                iconWrap: {
                    marginBottom: 16 * h1px,
                },
                buttonRow: {
                    flexDirection: 'row',
                    justifyContent: 'center',
                    width: '100%',
                    gap: 12 * w1px,
                    marginTop: 20 * h1px,
                    paddingHorizontal: 4,
                },
            }),
        [w1px, h1px],
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
                            <View style={styles.iconWrap}>
                                <Ionicons
                                    name={config.icon as any}
                                    size={iconSize.xxl}
                                    color={config.accent}
                                />
                            </View>
                            <T
                                size={fontSize.title}
                                weight="700"
                                align="center"
                                color="#111827"
                                style={{ marginBottom: 10 * h1px }}>
                                {displayTitle}
                            </T>

                            <T
                                size={fontSize.bodyMedium}
                                color="#4B5563"
                                align="center"
                                style={{ lineHeight: 22 }}>
                                {message}
                            </T>

                            {(leftButtonText || rightButtonText) && (
                                <View style={styles.buttonRow}>
                                    {leftButtonText && (
                                        <View style={{ flex: 1 }}>
                                            <Button
                                                buttonText={leftButtonText}
                                                onPress={onLeftPress}
                                                width="100%"
                                                backgroundColor="#94A3B8"
                                            />
                                        </View>
                                    )}
                                    {rightButtonText && (
                                        <View style={{ flex: 1 }}>
                                            <Button
                                                buttonText={rightButtonText}
                                                onPress={onRightPress}
                                                width="100%"
                                            />
                                        </View>
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
