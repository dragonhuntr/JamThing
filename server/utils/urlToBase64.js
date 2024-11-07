const axios = require('axios');

/**
 * Fetches an image from a URL and converts it to a base64 string.
 * @param {string} url - The URL of the image to convert.
 * @returns {Promise<string>} - A promise that resolves to the base64 string of the image.
 */
async function urlToBase64(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        const base64 = buffer.toString('base64');
        return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
        throw new Error(`Failed to convert URL to base64: ${error.message}`);
    }
}

module.exports = { urlToBase64 };