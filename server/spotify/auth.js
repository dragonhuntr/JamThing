const protobuf = require('protobufjs/minimal');
const crypto = require('crypto');
const https = require('https');
const axios = require('axios');
const cheerio = require('cheerio');

const android_client_id = '9a8d2f0ce77a4e248bb71fefcb557637';

async function fetchSpotifyAuth() {
    try {
        const username = process.env.USERNAME;
        const password = process.env.PASSWORD;

        tempToken = await login(username, password);
        accessToken = await getApiToken(tempToken);

        console.log('New access token obtained.');

    } catch (error) {
        console.error('Error fetching Spotify auth:', error);
    }
}

function startTokenRefreshInterval() {
    fetchSpotifyAuth();

    // Refresh token every 45 minutes, but token technically expires after 60 minutes
    setInterval(fetchSpotifyAuth, 45 * 60 * 1000);
}

// Helper functions and classes from testauth.js

// Solve hash cash challenge
function solveHashCash(login_context, prefix, length) {
    const sha1 = crypto.createHash('sha1').update(login_context).digest();
    let counter = BigInt(0);
    let target = BigInt('0x' + sha1.slice(12).toString('hex'));

    while (true) {
        const suffix = Buffer.alloc(16);
        suffix.writeBigUInt64BE(target, 0);
        suffix.writeBigUInt64BE(counter, 8);

        const sum = crypto.createHash('sha1').update(Buffer.concat([prefix, suffix])).digest();
        const sumValue = BigInt('0x' + sum.slice(12).toString('hex'));

        if (trailingZeros64(sumValue) >= length) {
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

// Helper functions to encode and decode Protobuf messages
function encodeMessage(fields) {
    const writer = protobuf.Writer.create();

    for (const field of fields) {
        const { number, type, value } = field;

        if (type === 'bytes') {
            writer.uint32((number << 3) | 2); // Wire type 2 (length-delimited)
            writer.bytes(value);
        } else if (type === 'string') {
            writer.uint32((number << 3) | 2); // Wire type 2 (length-delimited)
            writer.string(value);
        } else if (type === 'message') {
            const nestedBuffer = encodeMessage(value);
            writer.uint32((number << 3) | 2); // Wire type 2 (length-delimited)
            writer.bytes(nestedBuffer);
        } else if (type === 'int32') {
            writer.uint32((number << 3) | 0); // Wire type 0 (varint)
            writer.int32(value);
        } else if (type === 'uint32') {
            writer.uint32((number << 3) | 0); // Wire type 0 (varint)
            writer.uint32(value);
        } else if (type === 'bool') {
            writer.uint32((number << 3) | 0); // Wire type 0 (varint)
            writer.bool(value);
        }
    }

    return writer.finish();
}

function decodeMessage(buffer) {
    const reader = protobuf.Reader. create(buffer);
    const message = {};

    while (reader.pos < reader.len) {
        const tag = reader.uint32();
        const number = tag >>> 3;
        const wireType = tag & 7;

        if (wireType === 0) {
            const value = reader.uint64();
            message[number] = value;
        } else if (wireType === 1) {
            const value = reader.fixed64();
            message[number] = value;
        } else if (wireType === 2) {
            const length = reader.uint32();
            const end = reader.pos + length;
            const bytes = reader.buf.slice(reader.pos, end);
            reader.pos = end;
            message[number] = bytes;
        } else if (wireType === 5) {
            const value = reader.fixed32();
            message[number] = value;
        } else {
            throw new Error(`Unsupported wire type: ${wireType}`);
        }
    }

    return message;
}

class LoginOk {
    constructor(message) {
        this.message = message;
    }

    accessToken() {
        const okMessage = decodeMessage(this.message[1]);
        const accessTokenBytes = okMessage[2];
        if (!accessTokenBytes) {
            return [null, false];
        }
        return [accessTokenBytes.toString(), true];
    }
}

class LoginResponse {
    constructor(message) {
        this.message = message;
    }

    loginContext() {
        const loginContext = this.message[5];
        if (loginContext) {
            return [loginContext, true];
        }
        return [null, false];
    }

    prefix() {
        const challengesMessage = decodeMessage(this.message[3]);
        const challengeMessage = decodeMessage(challengesMessage[1]);
        const hashcashChallengeMessage = decodeMessage(challengeMessage[1]);
        const prefix = hashcashChallengeMessage[1];
        if (prefix) {
            return [prefix, true];
        }
        return [null, false];
    }
}

async function login(username, password) {
    // Step 1: Initial request without proof
    let loginRequestFields = [
        {
            number: 1,
            type: 'message',
            value: [
                { number: 1, type: 'string', value: android_client_id }
            ],
        },
        {
            number: 101,
            type: 'message',
            value: [
                { number: 1, type: 'bytes', value: Buffer.from(username) },
                { number: 2, type: 'bytes', value: Buffer.from(password) },
            ],
        },
    ];

    let loginRequestBuffer = encodeMessage(loginRequestFields);

    let responseBuffer = await httpRequest('POST', 'https://login5.spotify.com/v3/login', loginRequestBuffer, {
        'Content-Type': 'application/x-protobuf',
    });

    let loginResponseMessage = decodeMessage(responseBuffer);
    let loginResponse = new LoginResponse(loginResponseMessage);

    // Step 2: Check for challenges
    const [loginContext, contextOk] = loginResponse.loginContext();
    const [prefix, prefixOk] = loginResponse.prefix();

    if (!contextOk || !prefixOk) {
        throw new Error('Failed to retrieve login context or prefix from login response.');
    }

    // Solve the hash cash challenge
    const solution = solveHashCash(loginContext, prefix, 10);

    // Build the proof message
    const proofFields = [
        {
            number: 1,
            type: 'message',
            value: [
                {
                    number: 1,
                    type: 'message',
                    value: [
                        { number: 1, type: 'bytes', value: solution },
                    ],
                },
            ],
        },
    ];

    // Step 3: Send login request with proof
    loginRequestFields = [
        {
            number: 1,
            type: 'message',
            value: [
                { number: 1, type: 'string', value: android_client_id },
            ],
        },
        {
            number: 2,
            type: 'bytes',
            value: loginContext,
        },
        {
            number: 3,
            type: 'message',
            value: proofFields,
        },
        {
            number: 101,
            type: 'message',
            value: [
                { number: 1, type: 'bytes', value: Buffer.from(username) },
                { number: 2, type: 'bytes', value: Buffer.from(password) },
            ],
        },
    ];

    loginRequestBuffer = encodeMessage(loginRequestFields);

    responseBuffer = await httpRequest('POST', 'https://login5.spotify.com/v3/login', loginRequestBuffer, {
        'Content-Type': 'application/x-protobuf',
        'User-Agent': 'Spotify/8.9.68.456 Android/23 (Android SDK built for x86)',
    });

    // Decode the final response to get the access token
    const loginOkMessage = decodeMessage(responseBuffer);
    const loginOk = new LoginOk(loginOkMessage);

    const [accessToken, success] = loginOk.accessToken();
    if (success) {
        return accessToken;
    } else {
        throw new Error('Failed to retrieve access token.');
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
                if (res.statusCode !== 200) {
                    return reject(new Error(`Request failed with status code: ${res.statusCode}`));
                }
                resolve(Buffer.concat(chunks));
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
        console.error('Error in transferSession:', error);
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
        console.log(data);
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
