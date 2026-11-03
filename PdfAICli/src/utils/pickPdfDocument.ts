import {
  pick,
  types,
  keepLocalCopy,
  isErrorWithCode,
  errorCodes,
  type DocumentPickerResponse,
} from '@react-native-documents/picker';

/** Eski document-picker yanıtına uyumlu şekil (fileCopyUri dahil). */
export type PickedPdfFile = DocumentPickerResponse & {
  fileCopyUri: string | null;
};

export async function pickPdfDocument(): Promise<PickedPdfFile> {
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
  const fileCopyUri =
    copy && copy.status === 'success' ? copy.localUri : null;

  return {
    ...file,
    fileCopyUri,
  };
}

export function isPdfPickCanceled(err: unknown): boolean {
  return (
    isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED
  );
}
