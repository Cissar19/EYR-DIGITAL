/**
 * Read a File as a data URL (base64)
 */
export function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Create a cropped image from a source image and pixel crop area.
 * Returns a compressed JPEG data URL suitable for Firestore storage.
 * Target: ~10-20KB base64 string (well under Firestore's 1MB doc limit).
 */
export async function getCroppedImg(imageSrc, pixelCrop, outputSize = 128) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        outputSize,
        outputSize
    );

    // Compress progressively until under 50KB base64
    const maxBase64Bytes = 50_000;
    let quality = 0.7;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);

    while (dataUrl.length > maxBase64Bytes && quality > 0.2) {
        quality -= 0.1;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
    }

    return dataUrl;
}

function createImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.src = url;
    });
}
