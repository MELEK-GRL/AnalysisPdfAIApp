import useDeviceStore from '../../store/useDeviceStore';

export const useResponsive = () => {
    const { width, height } = useDeviceStore.getState();

    const w1px = width / 375;
    const h1px = height / 812;
    const fs1px = Math.min(w1px, h1px);

    return { w1px, h1px, fs1px };
};
