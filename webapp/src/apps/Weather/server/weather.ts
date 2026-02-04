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
    private ws: WebSocket;
    private callbacks: { [key: string]: WeatherCallback[] };
    private messageQueue: { type: WeatherRequestType, message: WeatherMessagePayload }[] = [];

    constructor() {
        this.ws = new WebSocket('ws://localhost:8891');
        this.callbacks = {};

        this.ws.addEventListener('open', () => {
            console.log('Weather WebSocket connection established.');
            // Clear queue on connection - don't spam old messages
            this.messageQueue = [];
        });

        this.ws.addEventListener('message', (event) => {
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
        });

        this.ws.addEventListener('error', (err) => {
            console.error('Weather WebSocket error:', err);
        });

        this.ws.addEventListener('close', () => {
            console.log('Weather WebSocket connection closed. Attempting to reconnect...');
            setTimeout(() => this.reconnect(), 5000);
        });
    }

    private reconnect() {
        this.ws = new WebSocket('ws://localhost:8891');

        this.ws.addEventListener('open', () => {
            console.log('Weather WebSocket reconnected.');
            // Clear queue on reconnection - don't spam old messages
            this.messageQueue = [];
        });

        this.ws.addEventListener('message', (event) => {
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
        });

        this.ws.addEventListener('error', (err) => {
            console.error('Weather WebSocket error:', err);
        });

        this.ws.addEventListener('close', () => {
            console.log('Weather WebSocket connection closed. Attempting to reconnect...');
            setTimeout(() => this.reconnect(), 5000);
        });
    }

    private sendMessage(type: WeatherRequestType, message: WeatherMessagePayload = {}) {
        // If websocket is not open, queue the message instead of retrying
        if (this.ws.readyState !== WebSocket.OPEN) {
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