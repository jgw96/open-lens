import { fileOpen } from "browser-fs-access";

export const chooseFileToAnalyze = async () => {
    const blob = await fileOpen({
        mimeTypes: ['image/*'],
    });

    return blob;
}