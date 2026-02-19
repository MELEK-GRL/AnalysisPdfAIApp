import React, { useMemo, ReactNode } from 'react';
import { View, StyleSheet, Modal, Dimensions } from 'react-native';
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

    const styles = useMemo(() => {
        const { width, height } = Dimensions.get('window');
        return StyleSheet.create({
                overlay: {
                    width,
                    height,
                    backgroundColor: colors.white,
                },
                box: {
                    flex: 1,
                    width: '100%',
                    backgroundColor: colors.white,
                    paddingVertical: 18 * h1px,
                    paddingHorizontal: 16 * w1px,
                    alignItems: 'stretch',
                },
                buttonRow: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    width: '100%',
                    gap: 12 * w1px,
                    marginTop: 20 * h1px,
                },
                contentWrap: {
                    flex: 1,
                    marginTop: 6 * h1px,
                    width: '100%',
                },
            });
    }, [w1px, h1px, fs1px]);

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
                        <T
                            size={fontSize.title}
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
                                <T size={fontSize.body} color="#374151" align="center">
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
