import React, { useMemo } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TouchableWithoutFeedback,
    ScrollView,
} from 'react-native';
import { useResponsive } from '../../utils/deviceStore/device';
import T from '../Text/T';
import Button from '../Buttons/Button';

type Props = {
    visible: boolean;
    title?: string;
    message?: string;

    leftButtonText?: string;
    rightButtonText?: string;
    onLeftPress?: () => void;
    onRightPress?: () => void;
};

const CenterModal: React.FC<Props> = ({
    visible,
    title = 'Uyarı',
    message = 'Devam etmek istediğine emin misin?',
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
                    width: 320 * w1px,
                    backgroundColor: '#fff',
                    borderRadius: 8 * w1px,
                    paddingVertical: 20 * h1px,
                    paddingHorizontal: 16 * w1px,
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
                button: {
                    flex: 1,
                    borderRadius: 12 * w1px,
                    paddingVertical: 10 * h1px,
                    alignItems: 'center',
                },
                leftButton: {
                    backgroundColor: '#E5E7EB',
                },
                rightButton: {
                    backgroundColor: '#3B82F6',
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
                            size={18}
                            weight="700"
                            align="center"
                            style={{ marginBottom: 10 * h1px }}>
                            {title}
                        </T>

                        <T size={14} color="#374151" align="center">
                            {message}
                        </T>

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
            </TouchableWithoutFeedback>
        </Modal>
    );
};

export default CenterModal;
