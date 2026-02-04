const { loadProtobufs } = require('./proto-loader');
const crypto = require('crypto');
const https = require('https');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') })

const android_client_id = '9a8d2f0ce77a4e248bb71fefcb557637';

var accessToken = '';

// Generate a device ID (typically a UUID-like string for Android)
function generateDeviceId() {
    // Android device IDs are typically 40 hex characters
    return crypto.randomBytes(20).toString('hex');
}

// load protobufs
const root = loadProtobufs();

// get message types
const LoginRequest = root.lookupType('spotify.login5.v3.LoginRequest');
const LoginResponse = root.lookupType('spotify.login5.v3.LoginResponse');
// Try to lookup Duration type, but it might not be loaded
let Duration;
try {
    Duration = root.lookupType('google.protobuf.Duration');
} catch (e) {
    // Duration type not found, will use plain object
    Duration = null;
}

async function fetchSpotifyAuth() {
    try {
        const username = process.env.SPOTIFY_USERNAME;
        const password = process.env.SPOTIFY_PASSWORD;

        const tempToken = await login(username, password);
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
    const startTime = Date.now();
    const sha1 = crypto.createHash('sha1').update(login_context).digest();
    // Extract 8 bytes (bytes 12-19) from the SHA1 hash for the target
    const targetBytes = sha1.slice(12, 20);
    const target = BigInt('0x' + targetBytes.toString('hex'));
    let counter = BigInt(0);
    
    while (true) {
        const suffix = Buffer.alloc(16);
        suffix.writeBigUInt64BE(target, 0);
        suffix.writeBigUInt64BE(counter, 8);

        const sum = crypto.createHash('sha1')
            .update(Buffer.concat([prefix, suffix]))
            .digest();
        
        // Check trailing zeros in the last 8 bytes (bytes 12-19)
        const sumBytes = sum.slice(12, 20);
        if (trailingZeros64(BigInt('0x' + sumBytes.toString('hex'))) >= length) {
            const duration = Date.now() - startTime;
            return {
                suffix: suffix,
                duration: {
                    seconds: Math.floor(duration / 1000),
                    nanos: (duration % 1000) * 1000000
                }
            };
        }
        counter++;
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
    const MAX_LOGIN_TRIES = 3;
    const LOGIN_TIMEOUT = 3000; // 3 seconds
    
    const deviceId = generateDeviceId();
    
    // create initial login request with just credentials
    let loginRequest = LoginRequest.create({
        client_info: {
            client_id: android_client_id,
            device_id: deviceId
        },
        password: {
            id: username,
            password: password
        }
    });

    let count = 0;
    let response;

    try {
        while (count < MAX_LOGIN_TRIES) {
            count++;
            
            // make request
            response = await httpRequest('POST', 'https://login5.spotify.com/v3/login', 
                LoginRequest.encode(loginRequest).finish(), {
                    'Content-Type': 'application/x-protobuf',
                    'Accept': 'application/x-protobuf',
                    'User-Agent': 'Spotify/8.9.68.456 Android/23 (Android SDK built for x86)'
                }
            );

            // decode response
            const responseData = LoginResponse.decode(response);
            
            // Debug: log response structure
            const debugInfo = {
                hasOk: !!responseData.ok,
                hasChallenges: !!responseData.challenges,
                errorValue: responseData.error,
                loginContextPresent: !!responseData.login_context,
                okDetails: responseData.ok ? { username: responseData.ok.username, hasToken: !!responseData.ok.access_token } : null,
                challengesCount: responseData.challenges ? responseData.challenges.challenges?.length : null
            };
            console.log('Response data:', debugInfo);
            
            // check for success (oneof field: ok is set)
            if (responseData.ok) {
                return responseData.ok.access_token;
            }
            
            // check for challenges (oneof field: challenges is set)
            // Check challenges BEFORE error, since error enum defaults to 0 (falsy)
            if (responseData.challenges) {
                const challenges = responseData.challenges.challenges;
                
                if (!challenges || challenges.length === 0) {
                    throw new Error('unexpected response format - empty challenges');
                }
                
                // handle challenges
                const solutions = [];
                let loginContext = responseData.login_context;
                
                for (const challenge of challenges) {
                    // oneof field: check which challenge type is set
                    if (challenge.code) {
                        throw new Error('Code challenge is not supported');
                    }
                    
                    if (challenge.hashcash) {
                        const hashcashChallenge = challenge.hashcash;
                        const prefix = hashcashChallenge.prefix;
                        const length = hashcashChallenge.length || 10; // default to 10 if not provided
                        
                        console.log('Solving hashcash challenge:', {
                            prefixLength: prefix.length,
                            prefixHex: prefix.toString('hex').substring(0, 40) + '...',
                            length: length,
                            loginContextLength: loginContext.length,
                            loginContextHex: loginContext.toString('hex').substring(0, 40) + '...'
                        });
                        
                        // solve challenge
                        const solution = solveHashCash(loginContext, prefix, length);
                        
                        // Verify the solution is correct
                        const verifyHash = crypto.createHash('sha1')
                            .update(Buffer.concat([prefix, solution.suffix]))
                            .digest();
                        const verifyBytes = verifyHash.slice(12, 20);
                        const verifyZeros = trailingZeros64(BigInt('0x' + verifyBytes.toString('hex')));
                        
                        console.log('Hashcash solution:', {
                            suffixLength: solution.suffix.length,
                            suffixHex: solution.suffix.toString('hex'),
                            durationSeconds: solution.duration.seconds,
                            durationNanos: solution.duration.nanos,
                            requiredZeros: length,
                            actualZeros: verifyZeros,
                            isValid: verifyZeros >= length
                        });
                        
                        if (verifyZeros < length) {
                            throw new Error(`Hashcash solution invalid: got ${verifyZeros} zeros, need ${length}`);
                        }
                        
                        // Create Duration message properly if type is available, otherwise use plain object
                        const durationMsg = Duration 
                            ? Duration.create({
                                seconds: solution.duration.seconds,
                                nanos: solution.duration.nanos
                            })
                            : {
                                seconds: solution.duration.seconds,
                                nanos: solution.duration.nanos
                            };
                        
                        solutions.push({
                            hashcash: {
                                suffix: solution.suffix,
                                duration: durationMsg
                            }
                        });
                    }
                }
                
                // update login request with solutions and context
                loginRequest = LoginRequest.create({
                    client_info: {
                        client_id: android_client_id,
                        device_id: deviceId
                    },
                    login_context: loginContext,
                    challenge_solutions: {
                        solutions: solutions
                    },
                    password: {
                        id: username,
                        password: password
                    }
                });
                
                console.log('Sending request with solution, attempt:', count);
                
                // continue loop to retry with solution
                continue;
            }
            
            // check for error (oneof field: error is set)
            // Only check error if ok and challenges are not set
            // Note: error enum can be 0 (UNKNOWN_ERROR), which is falsy, so we check explicitly
            if (!responseData.ok && !responseData.challenges) {
                const errorCode = responseData.error;
                // Handle retryable errors
                // 4 = TIMEOUT, 6 = TOO_MANY_ATTEMPTS
                if (errorCode === 4 || errorCode === 6) {
                    if (count < MAX_LOGIN_TRIES) {
                        console.log(`Received error ${errorCode}, retrying in ${LOGIN_TIMEOUT}ms...`);
                        await new Promise(resolve => setTimeout(resolve, LOGIN_TIMEOUT));
                        continue;
                    }
                }
                throw new Error(`Login error: ${errorCode}`);
            }
            
            // unexpected response format
            throw new Error('unexpected response format - no ok, error, or challenges field set');
        }
        
        throw new Error(`Couldn't successfully authenticate after ${MAX_LOGIN_TRIES} times`);

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
        throw error;
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
        
        // Format set-cookie array as Cookie header string
        const cookieString = Array.isArray(csrfCookie) 
            ? csrfCookie.map(c => c.split(';')[0]).join('; ')
            : csrfCookie;

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
                'Cookie': cookieString,
                'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
                'Content-Type': 'text/plain;charset=UTF-8'
            }
        });

        // Format set-cookie array as Cookie header string
        const setCookieHeaders = cookieResp.headers['set-cookie'];
        return Array.isArray(setCookieHeaders)
            ? setCookieHeaders.map(c => c.split(';')[0]).join('; ')
            : setCookieHeaders;
    } catch (error) {
        console.error('Error in getCookie:', error);
        throw error;
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
        throw error;
    }
}

module.exports = {
    startTokenRefreshInterval,
    getAccessToken: () => accessToken,
    fetchSpotifyAuth,
};
