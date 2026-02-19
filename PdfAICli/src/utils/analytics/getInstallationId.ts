import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = 'installation_id';

export async function getInstallationId(): Promise<string> {
    let id = await AsyncStorage.getItem(STORAGE_KEY);
    if (!id) {
        id = `${Platform.OS}-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 10)}`;
        await AsyncStorage.setItem(STORAGE_KEY, id);
    }
    return id;
}
