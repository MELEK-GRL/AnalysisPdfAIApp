import React, { useMemo, ReactNode } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { useResponsive } from '../../utils/deviceStore/device';
import T from '../Text/T';
import Button from '../Buttons/Button';
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

const CenterModal: React.FC<Props> = ({
    visible,
    title = 'Uyarı',
    message = 'Devam etmek istediğine emin misin?',
    children,
    leftButtonText,
    rightButtonText,
    onLeftPress,
    onRightPress,
}) => {
    const { w1px, h1px, fs1px } = useResponsive();
    const hasChildren = !!children;

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
                    width: hasChildren ? '95%' : 320 * w1px,
                    maxWidth: 400,
                    maxHeight: '85%',
                    backgroundColor: '#fff',
                    borderRadius: 8 * w1px,
                    paddingVertical: 20 * h1px,
                    paddingHorizontal: 16 * w1px,
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOpacity: 0.15,
                    shadowRadius: 10 * w1px,
                    elevation: 5,
                    overflow: 'hidden',
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
        [w1px, h1px, fs1px, hasChildren],
    );

    if (!visible) {
        return null;
    }

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.box}>
                        <T
                            size={fontSize.title}
                            weight="700"
                            align="center"
                            style={{ marginBottom: 10 * h1px }}>
                            {title}
                        </T>

                        <View style={styles.contentWrap}>
                            {children ? (
                                children
                            ) : (
                                <T size={fontSize.body} color="#374151" align="center">
                                    {message}
                                </T>
                            )}
                        </View>

                        {(leftButtonText || rightButtonText) && (
                            <View style={styles.buttonRow}>
                                {leftButtonText && (
                                    <Button
                                        buttonText={leftButtonText}
                                        onPress={onLeftPress}
                                        width={h1px * 160}
                                    />
                                )}

                                {rightButtonText && (
                                    <Button
                                        buttonText={rightButtonText}
                                        onPress={onRightPress}
                                        width={h1px * 160}
                                    />
                                )}
                            </View>
                        )}
                </View>
            </View>
        </Modal>
    );
};

export default CenterModal;
