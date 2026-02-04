type SpotifyMessagePayload =
    | Record<string, never> // Empty object for: play, pause, next, previous, getCurrentPlayback, getJamSession
    | { isLiked: boolean } // likeSong
    | { seconds: number } // fastForward, rewind
    | { position: string | number } // seek
    | { newVol: number } // volume
    | { state: boolean } // repeat, shuffle
    | { trackId: string }; // checkLiked

type SpotifyRequestType =
    | 'play'
    | 'pause'
    | 'likeSong'
    | 'next'
    | 'previous'
    | 'fastForward'
    | 'rewind'
    | 'seek'
    | 'volume'
    | 'repeat'
    | 'shuffle'
    | 'getCurrentPlayback'
    | 'checkLiked'
    | 'getJamSession';

interface SpotifyWebSocketRequest {
    app: 'spotify';
    type: SpotifyRequestType;
    message: SpotifyMessagePayload;
}

interface SpotifyWebSocketResponse {
    app: 'spotify';
    type: SpotifyRequestType;
    message: SpotifyResponsePayload;
}

type SpotifyResponsePayload =
    | SpotifyPlaybackData
    | { liked: boolean }
    | string // QR code for getJamSession
    | { success: boolean; error?: string };

interface SpotifyPlaybackData {
    item?: {
        id: string;
        name: string;
        duration_ms: number;
        album: {
            name: string;
            artists: Array<{ name: string }>;
            images: Array<{ url: string; b64?: string }>;
        };
    };
    progress_ms?: number;
    is_playing?: boolean;
    device?: {
        volume_percent: number;
    };
    shuffle_state?: boolean;
    success?: boolean;
    error?: string;
}

type SpotifyCallback = (data: SpotifyResponsePayload) => void;

class SpotifyHandler {
    private ws: WebSocket;
    private callbacks: { [key: string]: SpotifyCallback[] };

    // throttle requests to 5 per second to not spam spotify. change as needed.
    private requestCount = 0;
    private requestQueue: { type: SpotifyRequestType, message: SpotifyMessagePayload }[] = [];
    private isThrottling = false;

    constructor() {
        // Initialize WebSocket connection using the native WebSocket object
        this.ws = new WebSocket('ws://localhost:8891');

        this.callbacks = {};

        this.ws.addEventListener('open', () => {
            console.log('WebSocket connection established.');
            // Clear queue on connection - don't spam old messages
            this.requestQueue = [];
            this.requestCount = 0;
            this.isThrottling = false;
        });

        this.ws.addEventListener('message', (event) => {
            try {
                const response = JSON.parse(event.data) as SpotifyWebSocketResponse;
                console.log('Received response:', response);

                // Handle response
                if (response.type && this.callbacks[response.type]) {
                    this.callbacks[response.type].forEach(callback => callback(response.message));
                    // Clear callbacks after they are called
                    this.callbacks[response.type] = [];
                }
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        });

        this.ws.addEventListener('error', (err) => {
            console.error('WebSocket error:', err);
        });

        this.ws.addEventListener('close', () => {
            console.log('WebSocket connection closed. Attempting to reconnect...');
            setTimeout(() => this.reconnect(), 5000);
        });
    }

    private reconnect() {
        this.ws = new WebSocket('ws://localhost:8891');

        this.ws.addEventListener('open', () => {
            console.log('WebSocket reconnected.');
            // Clear queue on reconnection - don't spam old messages
            this.requestQueue = [];
            this.requestCount = 0;
            this.isThrottling = false;
        });

        this.ws.addEventListener('message', (event) => {
            try {
                const response = JSON.parse(event.data) as SpotifyWebSocketResponse;
                console.log(response)
                console.log('Received response:', response);

                if (response.type && this.callbacks[response.type]) {
                    this.callbacks[response.type].forEach(callback => callback(response.message));
                    this.callbacks[response.type] = [];
                }
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        });

        this.ws.addEventListener('error', (err) => {
            console.error('WebSocket error:', err);
        });

        this.ws.addEventListener('close', () => {
            console.log('WebSocket connection closed. Attempting to reconnect...');
            setTimeout(() => this.reconnect(), 5000);
        });
    }

    /**
     * Sends a message via WebSocket in the specified format
     * @param type The function name
     * @param message The message or arguments
     */

    private sendMessage(type: SpotifyRequestType, message: SpotifyMessagePayload = {}) {
        // If websocket is not open, queue the message instead of retrying
        if (this.ws.readyState !== WebSocket.OPEN) {
            // Only queue if not already queued (avoid duplicates)
            const alreadyQueued = this.requestQueue.some(
                item => item.type === type && JSON.stringify(item.message) === JSON.stringify(message)
            );
            if (!alreadyQueued) {
                this.requestQueue.push({ type, message });
            }
            return;
        }

        // If throttling, queue the message
        if (this.isThrottling) {
            this.requestQueue.push({ type, message });
            return;
        }

        // Send immediately
        const payload: SpotifyWebSocketRequest = {
            app: 'spotify',
            type: type,
            message: message
        };

        this.ws.send(JSON.stringify(payload));
        this.requestCount++;
        
        if (this.requestCount >= 5) {
            this.isThrottling = true;
            setTimeout(() => {
                this.requestCount = 0;
                this.isThrottling = false;
                this.processQueue();
            }, 1000);
        }
    }

    private processQueue() {
        // Only process queue when websocket is open and not throttling
        if (this.ws.readyState !== WebSocket.OPEN || this.isThrottling) {
            return;
        }

        while (this.requestQueue.length > 0 && !this.isThrottling) {
            const { type, message } = this.requestQueue.shift()!;
            const payload: SpotifyWebSocketRequest = {
                app: 'spotify',
                type: type,
                message: message
            };

            this.ws.send(JSON.stringify(payload));
            this.requestCount++;
            
            if (this.requestCount >= 5) {
                this.isThrottling = true;
                setTimeout(() => {
                    this.requestCount = 0;
                    this.isThrottling = false;
                    this.processQueue();
                }, 1000);
                break;
            }
        }
    }

    // Function to add a callback for a specific message type
    private addCallback(type: SpotifyRequestType, callback: SpotifyCallback) {
        if (!this.callbacks[type]) {
            this.callbacks[type] = [];
        }
        this.callbacks[type].push(callback);
    }

    // Function to request current playback data
    async getCurrentPlayback(): Promise<SpotifyPlaybackData> {
        return new Promise((resolve) => {
            this.addCallback('getCurrentPlayback', (data) => {
                resolve(data as SpotifyPlaybackData);
            });
            this.sendMessage('getCurrentPlayback');
        });
    }

    // Function to check if a track is liked
    async checkLiked(trackId: string): Promise<boolean> {
        return new Promise((resolve) => {
            this.addCallback('checkLiked', (data) => {
                if (typeof data !== 'string' && data !== null && !Array.isArray(data) && 'liked' in data) {
                    resolve((data as { liked: boolean }).liked);
                } else {
                    resolve(false);
                }
            });
            this.sendMessage('checkLiked', { trackId });
        });
    }

    async getJamSession(): Promise<string> {
        return new Promise((resolve) => {
            this.addCallback('getJamSession', (data) => {
                resolve(data as string);
            });
            this.sendMessage('getJamSession');
        });
    }

    // Example function to send play request
    async play() {
        this.sendMessage('play', {});
    }

    // Example function to send pause request
    async pause() {
        this.sendMessage('pause', {});
    }

    // Implement other methods similarly
    async likeSong(isLiked: boolean) {
        this.sendMessage('likeSong', { isLiked });
    }

    async next() {
        this.sendMessage('next', {});
    }

    async previous() {
        this.sendMessage('previous', {});
    }

    async fastForward(seconds = 15) {
        this.sendMessage('fastForward', { seconds });
    }

    async rewind(seconds = 15) {
        this.sendMessage('rewind', { seconds });
    }

    async seek(position: string | number) {
        this.sendMessage('seek', { position });
    }

    async repeat(state: boolean) {
        this.sendMessage('repeat', { state });
    }

    async shuffle(state: boolean) {
        this.sendMessage('shuffle', { state });
    }

    async volume(newVol: number) {
        this.sendMessage('volume', { newVol });
    }
}

export default SpotifyHandler;