
class WeatherHandler {
    private ws: WebSocket;
    private callbacks: { [key: string]: Function[] };

    constructor() {
        this.ws = new WebSocket('ws://localhost:8891');
        this.callbacks = {};

        this.ws.addEventListener('open', () => {
            console.log('Weather WebSocket connection established.');
        });

        this.ws.addEventListener('message', (event) => {
            try {
                const response = JSON.parse(event.data);
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
        });

        this.ws.addEventListener('message', (event) => {
            try {
                const response = JSON.parse(event.data);
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

    private sendMessage(type: string, message: any = {}) {
        const payload = {
            app: 'weather',
            type: type,
            message: message
        };
        const sendWhenReady = () => {
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify(payload));
            } else {
                setTimeout(sendWhenReady, 100);
            }
        };
        sendWhenReady();
    }

    private addCallback(type: string, callback: Function) {
        if (!this.callbacks[type]) {
            this.callbacks[type] = [];
        }
        this.callbacks[type].push(callback);
    }

    async getForecastData(): Promise<any[]> {
        return new Promise((resolve) => {
            this.addCallback('getForecastData', (weatherData: any) => {
                resolve(weatherData.forecast);
            });
            this.sendMessage('getForecastData');
        });
    }
    }

export default WeatherHandler;