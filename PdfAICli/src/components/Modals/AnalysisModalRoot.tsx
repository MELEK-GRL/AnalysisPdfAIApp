import React from 'react';
import { useAnalysisModalStore } from '../../store/useAnalysisModalStore';
import DetailModal from './DetailModal';
import { useT } from '../../store/useLocaleStore';

/**
 * Root-level Analysis Modal - renders above the Tab Navigator so it covers
 * the bottom menu bar. Must be rendered in App.tsx.
 */
const AnalysisModalRoot: React.FC = () => {
    const { visible, title, content, close } = useAnalysisModalStore();
    const t = useT();

    return (
        <DetailModal
            visible={visible}
            title={title}
            rightButtonText={t('common.close')}
            onRightPress={close}>
            {content}
        </DetailModal>
    );
};

export default AnalysisModalRoot;
