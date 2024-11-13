const { loadProtobufs } = require('./proto-loader');
const crypto = require('crypto');
const https = require('https');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const android_client_id = '9a8d2f0ce77a4e248bb71fefcb557637';

var accessToken = '';

// load protobufs
const root = loadProtobufs();

// get message types
const LoginRequest = root.lookupType('spotify.login5.v3.LoginRequest');
const LoginResponse = root.lookupType('spotify.login5.v3.LoginResponse');

async function fetchSpotifyAuth() {
    try {
        const username = process.env.SPOTIFY_USERNAME;
        const password = process.env.SPOTIFY_PASSWORD;

        tempToken = await login(username, password);
        accessToken = await getApiToken(tempToken);

        console.log('New access token obtained.');

    } catch (error) {
        console.error('Error fetching Spotify auth:', error);
    }
}

function startTokenRefreshInterval() {
    fetchSpotifyAuth();

    // refresh token every 45 minutes, but token technically expires after 60 minutes
    setInterval(fetchSpotifyAuth, 45 * 60 * 1000);
}

// solve hash cash challenge
function solveHashCash(login_context, prefix, length) {
    const sha1 = crypto.createHash('sha1').update(login_context).digest();
    let counter = BigInt(0);
    let target = BigInt('0x' + sha1.slice(12).toString('hex'));
    
    while (true) {
        const suffix = Buffer.alloc(16);
        suffix.writeBigUInt64BE(target, 0);
        suffix.writeBigUInt64BE(counter, 8);

        const sum = crypto.createHash('sha1')
            .update(Buffer.concat([prefix, suffix]))
            .digest();
        
        if (trailingZeros64(BigInt('0x' + sum.slice(12).toString('hex'))) >= length) {
            return suffix;
        }
        counter++;
        target++;
    }
}

function trailingZeros64(value) {
    let zeros = 0;
    while ((value & BigInt(1)) === BigInt(0)) {
        zeros++;
        value >>= BigInt(1);
    }
    return zeros;
}

async function login(username, password) {
    // create initial login request with just credentials
    const loginRequest = LoginRequest.create({
        client_info: {
            client_id: android_client_id
        },
        password: {
            id: username,
            password: password
        }
    });

    try {
        // first request to get challenge
        const response = await httpRequest('POST', 'https://login5.spotify.com/v3/login', 
            LoginRequest.encode(loginRequest).finish(), {
                'Content-Type': 'application/x-protobuf',
                'User-Agent': 'Spotify/8.9.68.456 Android/23 (Android SDK built for x86)'
            }
        );

        // decode response
        const responseData = LoginResponse.decode(response);
        
        // add error checking
        if (!responseData.challenges || !responseData.challenges.challenges || !responseData.challenges.challenges[0]) {
            throw new Error('unexpected response format - missing challenges');
        }
        
        if (!responseData.challenges.challenges[0].hashcash) {
            throw new Error('unexpected challenge type - expected hashcash');
        }
        
        // get challenge params
        const login_context = responseData.login_context;
        const prefix = responseData.challenges.challenges[0].hashcash.prefix;
        
        // solve challenge
        const solution = solveHashCash(login_context, prefix, 10);

        // create new request with solution
        const finalRequest = LoginRequest.create({
            client_info: {
                client_id: android_client_id
            },
            login_context: login_context,
            challenge_solutions: {
                solutions: [{
                    hashcash: {
                        suffix: solution
                    }
                }]
            },
            password: {
                id: username,
                password: password
            }
        });

        // make final request
        const finalResponse = await httpRequest('POST', 'https://login5.spotify.com/v3/login',
            LoginRequest.encode(finalRequest).finish(), {
                'Content-Type': 'application/x-protobuf',
                'User-Agent': 'Spotify/8.9.68.456 Android/23 (Android SDK built for x86)'
            }
        );

        const finalResponseData = LoginResponse.decode(finalResponse);
        
        if (!finalResponseData.ok) {
            throw new Error('login failed');
        }

        return finalResponseData.ok.access_token;

    } catch (error) {
        console.error('login error:', error);
        throw error;
    }
}

function httpRequest(method, url, data, headers) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            method: method,
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            headers: headers,
        };

        const req = https.request(options, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                const responseBuffer = Buffer.concat(chunks);
                if (res.statusCode !== 200) {
                    console.error('response status:', res.statusCode);
                    console.error('response headers:', res.headers);
                    console.error('response content-type:', res.headers['content-type']);
                    
                    // try different ways to show the response
                    console.error('response as buffer:', responseBuffer);
                    console.error('response as string:', responseBuffer.toString());
                    try {
                        console.error('response as json:', JSON.parse(responseBuffer.toString()));
                    } catch (e) {
                        // not json, ignore
                    }
                    
                    return reject(new Error(`request failed with status code: ${res.statusCode}`));
                }
                resolve(responseBuffer);
            });
        });

        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
}

async function transferSession(loginToken) {
    try {
        const data = {
            "url": "https://www.spotify.com/account/overview/?utm_source=spotify&utm_medium=menu&utm_campaign=your_account"
        };

        const response = await axios.post('https://gue1-spclient.spotify.com/sessiontransfer/v1/token', data, {
            headers: {
                'Host': 'gue1-spclient.spotify.com',
                'Connection': 'keep-alive',
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache, no-store, max-age=0',
                'Accept-Language': 'en-GB',
                'App-Platform': 'OSX_ARM64',
                'Authorization': `Bearer ${loginToken}`,
                'Spotify-App-Version': '124900439',
                'User-Agent': 'Spotify/124900439 OSX_ARM64/OS X 14.4.1 [arm 2]',
                'Origin': 'https://gue1-spclient.spotify.com',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-Mode': 'no-cors',
                'Sec-Fetch-Dest': 'empty',
                'Content-Type': 'application/json'
            }
        });

        return response.data.token;
    } catch (error) {
        console.error('error in transferSession:', error);
        return { success: false, error: error.message };
    }
}

async function getCookie(tempToken) {
    try {
        const csrfResp = await axios.get(`https://accounts.spotify.com/en-GB/login/ott/v2#token=${tempToken}`, {
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Pragma': 'no-cache',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
                'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"'
            }
        });

        const $ = cheerio.load(csrfResp.data);
        const csrfToken = JSON.parse($('#__NEXT_DATA__').text()).props.pageProps.csrfSettings.initialToken;
        const csrfCookie = csrfResp.headers['set-cookie'];

        const cookieResp = await axios.post('https://accounts.spotify.com/api/login/ott/verify', { "token": tempToken }, {
            headers: {
                'Host': 'accounts.spotify.com',
                'Connection': 'keep-alive',
                'sec-ch-ua-platform': '"macOS"',
                'X-CSRF-Token': csrfToken,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
                'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
                'sec-ch-ua-mobile': '?0',
                'Origin': 'https://accounts.spotify.com',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Dest': 'empty',
                'Referer': 'https://accounts.spotify.com/en-GB/login/ott/v2',
                'Cookie': csrfCookie,
                'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
                'Content-Type': 'text/plain;charset=UTF-8'
            }
        });

        return cookieResp.headers['set-cookie'];
    } catch (error) {
        console.error('Error in getCookie:', error);
        return { success: false, error: error.message };
    }
}

async function getApiToken(loginToken) {
    try {
        const tempToken = await transferSession(loginToken);
        const cookie = await getCookie(tempToken);

        const response = await axios.get('https://open.spotify.com/get_access_token?reason=transport&productType=embed', {
            headers: {
                'Cookie': cookie,
                'app-platform': "Embed"
            }
        });

        const data = response.data;
        console.log('Got API token!');
        return data.accessToken;
    } catch (error) {
        console.error('Error in getApiToken:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    startTokenRefreshInterval,
    getAccessToken: () => accessToken,
    fetchSpotifyAuth,
};
