import {
  pick,
  types,
  keepLocalCopy,
  isErrorWithCode,
  errorCodes,
  type DocumentPickerResponse,
} from '@react-native-documents/picker';
import { useAnalysisLoadingStore } from '../store/useAnalysisLoadingStore';
import { useSessionStore } from '../store/useSessionStore';

/** Eski document-picker yanıtına uyumlu şekil (fileCopyUri dahil). */
export type PickedPdfFile = DocumentPickerResponse & {
  fileCopyUri: string;
};

/** Android/iOS FormData için file:// URI zorunlu. */
function toFileUri(uri: string): string {
  const trimmed = uri.trim();
  if (
    trimmed.startsWith('file://') ||
    trimmed.startsWith('content://') ||
    trimmed.startsWith('ph://')
  ) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    return `file://${trimmed}`;
  }
  return trimmed;
}

export async function pickPdfDocument(): Promise<PickedPdfFile> {
  // Picker sistem UI — app background'a düşer; tüm çağıranlarda oturum tutulsun
  useAnalysisLoadingStore.getState().acquireHold();
  useSessionStore.getState().touch();
  try {
    const [file] = await pick({
      type: [types.pdf],
      allowMultiSelection: false,
      presentationStyle: 'fullScreen',
    });

    const copyResults = await keepLocalCopy({
      files: [
        {
          uri: file.uri,
          fileName: file.name ?? 'document.pdf',
        },
      ],
      destination: 'cachesDirectory',
    });

    const copy = copyResults[0];
    if (!copy || copy.status !== 'success' || !copy.localUri) {
      const detail =
        copy && copy.status === 'error' ? copy.copyError : 'local copy failed';
      throw new Error(
        `PDF cihaza kopyalanamadı. Lütfen tekrar seçin. (${detail})`,
      );
    }

    return {
      ...file,
      fileCopyUri: toFileUri(copy.localUri),
    };
  } finally {
    useSessionStore.getState().touch();
    useAnalysisLoadingStore.getState().releaseHold();
  }
}

export function isPdfPickCanceled(err: unknown): boolean {
  return (
    isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED
  );
}
