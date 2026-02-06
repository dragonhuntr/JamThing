type WeatherMessagePayload =
    | Record<string, never> // Empty object for: getForecastData
    | { units?: string }; // Optional units parameter

type WeatherRequestType = 'getForecastData';

interface WeatherWebSocketRequest {
    app: 'weather';
    type: WeatherRequestType;
    message: WeatherMessagePayload;
}

interface WeatherWebSocketResponse {
    app: 'weather';
    type: WeatherRequestType;
    message: WeatherResponsePayload;
}

interface WeatherForecastPeriod {
    startTime: string;
    offset: number;
    temperature: number;
    temperatureUnit: string;
    windSpeed: string;
    probabilityOfPrecipitation: number;
    relativeHumidity: number;
    shortForecast: string;
}

type WeatherResponsePayload =
    | { success: boolean; forecast: WeatherForecastPeriod[]; error?: string }
    | { error: string };

type WeatherCallback = (data: WeatherResponsePayload) => void;

class WeatherHandler {
    private ws: WebSocket | null = null;
    private callbacks: { [key: string]: WeatherCallback[] };
    private messageQueue: { type: WeatherRequestType, message: WeatherMessagePayload }[] = [];
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private isReconnecting = false;

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
            console.log('Weather WebSocket connection established.');
            // Clear queue on connection - don't spam old messages
            this.messageQueue = [];
            this.isReconnecting = false;
        };

        this.messageHandler = (event: MessageEvent) => {
            try {
                const response = JSON.parse(event.data) as WeatherWebSocketResponse;
                console.log('Received weather response:', response);

                if (response.type && this.callbacks[response.type]) {
                    this.callbacks[response.type].forEach(callback => callback(response.message));
                    this.callbacks[response.type] = [];
                }
            } catch (error) {
                console.error('Error parsing weather message:', error);
            }
        };

        this.errorHandler = (err: Event) => {
            console.error('Weather WebSocket error:', err);
        };

        this.closeHandler = () => {
            console.log('Weather WebSocket connection closed.');
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

    private sendMessage(type: WeatherRequestType, message: WeatherMessagePayload = {}) {
        // If websocket is not open, queue the message instead of retrying
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            // Only queue if not already queued (avoid duplicates)
            const alreadyQueued = this.messageQueue.some(
                item => item.type === type && JSON.stringify(item.message) === JSON.stringify(message)
            );
            if (!alreadyQueued) {
                this.messageQueue.push({ type, message });
            }
            return;
        }

        // Send immediately
        const payload: WeatherWebSocketRequest = {
            app: 'weather',
            type: type,
            message: message
        };
        this.ws.send(JSON.stringify(payload));
    }

    private addCallback(type: WeatherRequestType, callback: WeatherCallback) {
        if (!this.callbacks[type]) {
            this.callbacks[type] = [];
        }
        this.callbacks[type].push(callback);
    }

    async getForecastData(): Promise<WeatherForecastPeriod[]> {
        return new Promise((resolve) => {
            this.addCallback('getForecastData', (weatherData) => {
                if ('forecast' in weatherData && Array.isArray(weatherData.forecast)) {
                    resolve(weatherData.forecast);
                } else {
                    resolve([]);
                }
            });
            this.sendMessage('getForecastData');
        });
    }
}

export default WeatherHandler;