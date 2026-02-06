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
    private ws: WebSocket | null = null;
    private callbacks: { [key: string]: NowPlayingCallback[] };
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private isReconnecting = false;

    // throttle requests to 5 per second
    private requestCount = 0;
    private requestQueue: { type: NowPlayingRequestType, message: NowPlayingMessagePayload }[] = [];
    private isThrottling = false;

    // Store event handlers so we can remove them
    private openHandler: (() => void) | null = null;
    private messageHandler: ((event: MessageEvent) => void) | null = null;
    private errorHandler: ((err: Event) => void) | null = null;
    private closeHandler: (() => void) | null = null;

    constructor() {
        this.callbacks = {};
        this.connect();
    }

    private connect() {
        // Clean up old connection if it exists
        this.cleanup();

        // Create new WebSocket connection
        this.ws = new WebSocket('ws://localhost:8891');
        this.setupEventHandlers();
    }

    private setupEventHandlers() {
        if (!this.ws) return;

        this.openHandler = () => {
            console.log('WebSocket connection established.');
            // Clear queue on connection - don't spam old messages
            this.requestQueue = [];
            this.requestCount = 0;
            this.isThrottling = false;
            this.isReconnecting = false;
            // Process any queued messages
            this.processQueue();
        };

        this.messageHandler = (event: MessageEvent) => {
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
        };

        this.errorHandler = (err: Event) => {
            console.error('WebSocket error:', err);
        };

        this.closeHandler = () => {
            console.log('WebSocket connection closed.');
            this.cleanup();
            // Only reconnect if not already reconnecting
            if (!this.isReconnecting) {
                this.isReconnecting = true;
                this.reconnectTimeout = setTimeout(() => {
                    this.reconnectTimeout = null;
                    this.connect();
                }, 5000);
            }
        };

        this.ws.addEventListener('open', this.openHandler);
        this.ws.addEventListener('message', this.messageHandler);
        this.ws.addEventListener('error', this.errorHandler);
        this.ws.addEventListener('close', this.closeHandler);
    }

    private cleanup() {
        // Clear reconnection timeout
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        // Remove event listeners and close old WebSocket
        if (this.ws) {
            if (this.openHandler) {
                this.ws.removeEventListener('open', this.openHandler);
            }
            if (this.messageHandler) {
                this.ws.removeEventListener('message', this.messageHandler);
            }
            if (this.errorHandler) {
                this.ws.removeEventListener('error', this.errorHandler);
            }
            if (this.closeHandler) {
                this.ws.removeEventListener('close', this.closeHandler);
            }

            // Close the WebSocket if it's still open
            if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
                this.ws.close();
            }

            this.ws = null;
        }

        // Clear handler references
        this.openHandler = null;
        this.messageHandler = null;
        this.errorHandler = null;
        this.closeHandler = null;
    }

    private reconnect() {
        // reconnect() is now just an alias for connect() since cleanup handles everything
        this.connect();
    }

    /**
     * Sends a message via WebSocket in the specified format
     * @param type The function name
     * @param message The message or arguments
     */

    private sendMessage(type: NowPlayingRequestType, message: NowPlayingMessagePayload = {}) {
        // If websocket is not open, queue the message instead of retrying
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
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
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN || this.isThrottling) {
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
