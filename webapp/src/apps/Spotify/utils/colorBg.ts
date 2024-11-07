export const findAlbumArtColor = async (image: HTMLImageElement): Promise<number[]> => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
        console.error('Failed to get 2D context from canvas.');
        return [128, 128, 128]; // Default color if context is not available
    }

    canvas.width = image.width;
    canvas.height = image.height;
    context.drawImage(image, 0, 0, image.width, image.height);

    const { data } = context.getImageData(0, 0, image.width, image.height);
    const colorCounts: Record<string, number> = {};
    let dominantColor: number[] = [128, 128, 128]; // Default color
    let maxCount = 0;

    for (let i = 0; i < data.length; i += 4) {
        const [r, g, b, alpha] = [data[i], data[i + 1], data[i + 2], data[i + 3]];

        if (alpha < 255 || r + g + b < 130) continue; // Skip transparent and very dark pixels

        const colorKey = `${Math.floor(r / 10) * 10},${Math.floor(g / 10) * 10},${Math.floor(b / 10) * 10}`;
        colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;

        if (colorCounts[colorKey] > maxCount) {
            maxCount = colorCounts[colorKey];
            dominantColor = [r, g, b];
        }
    }

    // Check brightness and find a secondary color if necessary
    const brightness = (dominantColor[0] * 0.299 + dominantColor[1] * 0.587 + dominantColor[2] * 0.114);
    const maxBrightness = 100; // Adjust the threshold as needed
    if (brightness > maxBrightness) {
        let secondaryColor: number[] = dominantColor;
        let foundSecondaryColor = false;

        while (!foundSecondaryColor) {
            let secondMaxCount = 0;

            for (const colorKey in colorCounts) {
                if (colorCounts[colorKey] > secondMaxCount && colorCounts[colorKey] < maxCount) {
                    const [r, g, b] = colorKey.split(',').map(Number);
                    const secondaryBrightness = (r * 0.299 + g * 0.587 + b * 0.114);
                    if (secondaryBrightness <= maxBrightness) { // Ensure the secondary color is not too bright
                        secondMaxCount = colorCounts[colorKey];
                        secondaryColor = [r, g, b];
                        foundSecondaryColor = true;
                    }
                }
            }

            // If no suitable secondary color is found, break the loop to avoid infinite loop
            if (!foundSecondaryColor) {
                break;
            }
        }

        return secondaryColor;
    }

    return dominantColor;
};