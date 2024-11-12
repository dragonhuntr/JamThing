const QRCode = require('qrcode');
const axios = require('axios');
const { urlToBase64 } = require('../utils/urlToBase64');
const { getAccessToken, fetchSpotifyAuth } = require('./auth');

fetchSpotifyAuth();

async function makeSpotifyRequest(method, url, data = null, retryCount = 0) {
    const bearerToken = getAccessToken();
    if (!bearerToken) {
        throw new Error('No bearer token');
    }
    const headers = {
        'Spotify-App-Version': '8.9.82.628',
        'Accept': 'application/json',
        'App-Platform': 'iOS',
        'Accept-Language': 'en',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Spotify/8.9.82 iOS/18.0 (iPhone16,2)',
        'Connection': 'keep-alive',
        'Authorization': `Bearer ${bearerToken}`
    }

    try {
        const response = await axios({
            method: method,
            url: url,
            data: data,
            headers: headers
        });

        return response.data;
    } catch (error) {
        console.error('Error in makeSpotifyRequest:', error);

        switch (error.response?.status) {
            case 401:
                if (retryCount < 3) {
                    console.log('Received 401 Unauthorized. Refreshing bearer token.');
                    await fetchSpotifyAuth(); // Fetch a new bearer token
                    return makeSpotifyRequest(method, url, data, retryCount + 1);
                } else {
                    console.error('Max retries reached for 401 Unauthorized.');
                    return { success: false, error: 'Unauthorized access after multiple attempts' };
                }
            case 404:
                if (error.response.data.error.message === 'NO_ACTIVE_DEVICE') {
                    return { success: false, error: 'No active device' };
                }
                console.error('404 Error:', error.response.data);
                return { success: false, error: 'Resource not found' };
            default:
                console.error('Unexpected Error:', error.response ? error.response.data : error.message);
                return { success: false, error: 'An unexpected error occurred' };
        }
    }
}

async function handleSpotifyRequest(type, message) {
    switch (type) {
        case 'play':
            return await playSong();
        case 'pause':
            return await pauseSong();
        case 'likeSong':
            return await likeSong(message.isLiked);
        case 'next':
            return await nextTrack();
        case 'previous':
            return await previousTrack();
        case 'fastForward':
            return await fastForward(message.seconds);
        case 'rewind':
            return await rewind(message.seconds);
        case 'seek':
            return await seekPosition(message.position);
        case 'volume':
            return await setVolume(message.newVol);
        case 'repeat':
            return await setRepeat(message.state);
        case 'shuffle':
            return await setShuffle(message.state);
        case 'getCurrentPlayback':
            return await getCurrentPlayback();
        case 'checkLiked':
            return await checkIfTrackIsLiked(message.trackId);
        case 'getJamSession':
            return await getJamSession();
        default:
            return { error: 'Unknown request type' };
    }
}

async function getCurrentPlayback() {
    const url = 'https://api.spotify.com/v1/me/player';
    try {
        let data = await makeSpotifyRequest('get', url);
        if (!data || !data.item) {
            return { success: false, error: 'No current playback' };
        }
        // add new b64 field to not taint the original object
        const base64img = await urlToBase64(data.item.album.images[0].url);
        data.item.album.images[0].b64 = base64img
        return data; // Return the full playback data
    } catch (error) {
        console.error('Error in getCurrentPlayback:', error);
        return { success: false, error: error.message };
    }
}

async function checkIfTrackIsLiked(trackId) {
    const url = `https://api.spotify.com/v1/me/tracks/contains?ids=${trackId}`;
    try {
        const data = await makeSpotifyRequest('get', url);
        return { liked: data[0] };
    } catch (error) {
        console.error('Error in checkIfTrackIsLiked:', error);
        return { liked: false, error: error.message };
    }
}

async function playSong() {
    const url = 'https://api.spotify.com/v1/me/player/play';
    try {
        await makeSpotifyRequest('put', url);
        return { success: true };
    } catch (error) {
        console.error('Error in playSong:', error);
        return { success: false, error: error.message };
    }
}

async function pauseSong() {
    const url = 'https://api.spotify.com/v1/me/player/pause';
    try {
        await makeSpotifyRequest('put', url);
        return { success: true };
    } catch (error) {
        console.log(error.response.data.error)
        console.error('Error in pauseSong:', error);
        return { success: false, error: error.message };
    }
}

async function likeSong(isLiked) {
    try {
        const currentPlayback = await getCurrentPlayback();
        if (currentPlayback && currentPlayback.item && currentPlayback.item.id) {
            const trackId = currentPlayback.item.id;
            const url = `https://api.spotify.com/v1/me/tracks?ids=${trackId}`;
            if (isLiked) {
                await makeSpotifyRequest('delete', url);
            } else {
                await makeSpotifyRequest('put', url);
            }
            return { success: true };
        } else {
            return { success: false, error: 'No current track' };
        }
    } catch (error) {
        console.error('Error in likeSong:', error);
        return { success: false, error: error.message };
    }
}

async function nextTrack() {
    const url = 'https://api.spotify.com/v1/me/player/next';
    try {
        await makeSpotifyRequest('post', url);
        return { success: true };
    } catch (error) {
        console.error('Error in nextTrack:', error);
        return { success: false, error: error.message };
    }
}

async function previousTrack() {
    const url = 'https://api.spotify.com/v1/me/player/previous';
    try {
        await makeSpotifyRequest('post', url);
        return { success: true };
    } catch (error) {
        console.error('Error in previousTrack:', error);
        return { success: false, error: error.message };
    }
}

async function fastForward(seconds) {
    try {
        const currentPositionData = await getCurrentPlayback();
        if (currentPositionData && currentPositionData.progress_ms) {
            const newPosition = currentPositionData.progress_ms + seconds * 1000;
            return await seekPosition(newPosition);
        } else {
            return { success: false, error: 'Unable to get current playback position' };
        }
    } catch (error) {
        console.error('Error in fastForward:', error);
        return { success: false, error: error.message };
    }
}

async function rewind(seconds) {
    try {
        const currentPositionData = await getCurrentPlayback();
        if (currentPositionData && currentPositionData.progress_ms) {
            const newPosition = currentPositionData.progress_ms - seconds * 1000;
            return await seekPosition(newPosition);
        } else {
            return { success: false, error: 'Unable to get current playback position' };
        }
    } catch (error) {
        console.error('Error in rewind:', error);
        return { success: false, error: error.message };
    }
}

async function seekPosition(position) {
    const url = `https://api.spotify.com/v1/me/player/seek?position_ms=${position}`;
    try {
        await makeSpotifyRequest('put', url);
        return { success: true };
    } catch (error) {
        console.error('Error in seekPosition:', error);
        return { success: false, error: error.message };
    }
}

async function setVolume(newVol) {
    const url = `https://api.spotify.com/v1/me/player/volume?volume_percent=${newVol}`;
    try {
        await makeSpotifyRequest('put', url);
        return { success: true };
    } catch (error) {
        console.error('Error in setVolume:', error);
        return { success: false, error: error.message };
    }
}

async function setRepeat(state) {
    const url = `https://api.spotify.com/v1/me/player/repeat?state=${state}`;
    try {
        await makeSpotifyRequest('put', url);
        return { success: true };
    } catch (error) {
        console.error('Error in setRepeat:', error);
        return { success: false, error: error.message };
    }
}

async function setShuffle(state) {
    const url = `https://api.spotify.com/v1/me/player/shuffle?state=${state}`;
    try {
        await makeSpotifyRequest('put', url);
        return { success: true };
    } catch (error) {
        console.error('Error in setShuffle:', error);
        return { success: false, error: error.message };
    }
}

async function getJamSession() {
    const url = 'https://gue1-spclient.spotify.com/social-connect/v2/sessions/current_or_new?activate=false';
    try {
        const data = await makeSpotifyRequest('get', url);
        console.log(data)
        const jamLink = `https://open.spotify.com/socialsession/${data.join_session_token}`

        const generateQRCode = async (url) => {
            try {
                return await QRCode.toDataURL(url);
            } catch (error) {
                console.error('Error generating QR code:', error);
                throw error;
            }
        };

        const qrCode = await generateQRCode(jamLink);
        return qrCode;
    } catch (error) {
        console.error('Error in getCurrentPlayback:', error);
        throw error;
    }
}

async function setVolume(newVol) {
    const url = `https://api.spotify.com/v1/me/player/volume?volume_percent=${newVol}`;
    try {
        await makeSpotifyRequest('put', url);
        return { success: true };
    } catch (error) {
        console.error('Error in setVolume:', error);
        return { success: false, error: error.message };
    }
}

module.exports = { handleSpotifyRequest };