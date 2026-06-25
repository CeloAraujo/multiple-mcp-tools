export const getFileExtension = (fileName: string) => {
    const parts = fileName.toLowerCase().split('.');
    return parts.length > 1 ? parts.at(-1) ?? '' : '';
};

export const normalizeBase64 = (content: string) => {
    const marker = ';base64,';
    const markerIndex = content.indexOf(marker);

    if (markerIndex >= 0) {
        return content.slice(markerIndex + marker.length);
    }

    return content;
};

export const decodeBase64 = (content: string) => Buffer.from(normalizeBase64(content), 'base64');

export const normalizeWhitespace = (value: string) =>
    value
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
