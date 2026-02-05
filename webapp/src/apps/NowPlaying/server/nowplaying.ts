type NowPlayingMessagePayload = Record<string, never>; // Empty object for all requests

type NowPlayingRequestType =
    | 'playTrack'
    | 'pauseTrack'
    | 'nextTrack'
    | 'previousTrack'
    | 'getNowPlaying'
    | 'increaseVolume'
    | 'decreaseVolume';

interface NowPlayingWebSocketRequest {
    app: 'nowplaying';
    type: NowPlayingRequestType;
    message: NowPlayingMessagePayload;
}

interface NowPlayingWebSocketResponse {
    app: 'nowplaying';
    type: NowPlayingRequestType;
    message: NowPlayingResponsePayload;
}

type NowPlayingResponsePayload =
    | NowPlayingData
    | { success: boolean; error?: string };

interface NowPlayingData {
    success: boolean;
    nowPlaying?: {
        artist: string;
        title: string;
        album?: string;
        elapsedTime: number;
        duration: number;
        playing: boolean;
        artworkData?: string; // base64 encoded image
        artworkMimeType?: string;
        bundleIdentifier?: string;
    };
    error?: string;
}

type NowPlayingCallback = (data: NowPlayingResponsePayload) => void;

class NowPlayingHandler {
    private ws: WebSocket;
    private callbacks: { [key: string]: NowPlayingCallback[] };

    // throttle requests to 5 per second
    private requestCount = 0;
    private requestQueue: { type: NowPlayingRequestType, message: NowPlayingMessagePayload }[] = [];
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
                const response = JSON.parse(event.data) as NowPlayingWebSocketResponse;
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
                const response = JSON.parse(event.data) as NowPlayingWebSocketResponse;
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

    private sendMessage(type: NowPlayingRequestType, message: NowPlayingMessagePayload = {}) {
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
        const payload: NowPlayingWebSocketRequest = {
            app: 'nowplaying',
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
            const payload: NowPlayingWebSocketRequest = {
                app: 'nowplaying',
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
    private addCallback(type: NowPlayingRequestType, callback: NowPlayingCallback) {
        if (!this.callbacks[type]) {
            this.callbacks[type] = [];
        }
        this.callbacks[type].push(callback);
    }

    // Function to request current playback data
    async getNowPlaying(): Promise<NowPlayingData> {
        return new Promise((resolve) => {
            this.addCallback('getNowPlaying', (data) => {
                resolve(data as NowPlayingData);
            });
            this.sendMessage('getNowPlaying');
        });
    }

    // Function to send play request
    async play() {
        this.sendMessage('playTrack', {});
    }

    // Function to send pause request
    async pause() {
        this.sendMessage('pauseTrack', {});
    }

    async next() {
        this.sendMessage('nextTrack', {});
    }

    async previous() {
        this.sendMessage('previousTrack', {});
    }

    async increaseVolume() {
        this.sendMessage('increaseVolume', {});
    }

    async decreaseVolume() {
        this.sendMessage('decreaseVolume', {});
    }
}

export default NowPlayingHandler;
