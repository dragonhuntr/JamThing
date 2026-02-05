const axios = require('axios');
const child = require('child_process');

async function handleNowPlayingRequest(type, message) {
    switch (type) {
        case 'getNowPlaying':
            return await getNowPlaying();
        case 'playTrack':
            return await playTrack();
        case 'pauseTrack':
            return await pauseTrack();
        case 'nextTrack':
            return await nextTrack();
        case 'previousTrack':
            return await previousTrack();
        default:
            return { error: 'Unknown request type' };
    }
}

async function getNowPlaying() {
    try {
        const data = await child.execSync('media-control get');

		// example output:
		/** no image url
		 * {"artist":"Yerlsd & Vince","timestamp":"2026-02-05T02:36:27Z","contentItemIdentifier":"5B43FFB6-22E4-45F1-87C6-9696373E823E","title":"River","elapsedTime":0,"bundleIdentifier":"com.untitledinbrackets.untitled-macos","playing":true,"processIdentifier":76656,"duration":247.27000000000001,"playbackRate":1,"artworkMimeType":"image\/jpeg"}
		 */

		/**
		 * with image url
		 * {"playbackRate":1,"elapsedTime":0,"timestamp":"2026-02-05T02:36:27Z","bundleIdentifier":"com.untitledinbrackets.untitled-macos","processIdentifier":76656,"artworkData":"base64 encoded image data","title":"River","artworkMimeType":"image\/jpeg","duration":247.27000000000001,"artist":"Yerlsd & Vince","contentItemIdentifier":"5B43FFB6-22E4-45F1-87C6-9696373E823E","playing":true}
		 */
        const nowPlaying = JSON.parse(data);
        return { success: true, nowPlaying };
    } catch (error) {
        console.error('Error in getNowPlaying:', error);
        return { success: false, error: error.message };
    }
}

async function playTrack() {
    try {
        await child.execSync(`media-control play`);
        return { success: true };
    } catch (error) {
        console.error('Error in playTrack:', error);
        return { success: false, error: error.message };
    }
}

async function pauseTrack() {
    try {
        await child.execSync(`media-control pause`);
        return { success: true };
    } catch (error) {
        console.error('Error in pauseTrack:', error);
        return { success: false, error: error.message };
    }
}

async function nextTrack() {
    try {
        await child.execSync(`media-control next-track`);
        return { success: true };
    } catch (error) {
        console.error('Error in nextTrack:', error);
        return { success: false, error: error.message };
    }
}

async function previousTrack() {
    try {
        await child.execSync(`media-control previous-track`);
        return { success: true };
    } catch (error) {
        console.error('Error in previousTrack:', error);
        return { success: false, error: error.message };
    }
}

module.exports = { handleNowPlayingRequest };