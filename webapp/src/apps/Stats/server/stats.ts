
class StatsHandler {
    private ws: WebSocket;
    private callbacks: { [key: string]: Function[] };

    constructor() {
        this.ws = new WebSocket('ws://localhost:8891');
        this.callbacks = {};

        this.ws.addEventListener('open', () => {
            console.log('Stats WebSocket connection established.');
        });

        this.ws.addEventListener('message', (event) => {
            try {
                const response = JSON.parse(event.data);
                console.log('Received Stats response:', response);

                if (response.type && this.callbacks[response.type]) {
                    this.callbacks[response.type].forEach(callback => callback(response.message));
                    this.callbacks[response.type] = [];
                }
            } catch (error) {
                console.error('Error parsing stats message:', error);
            }
        });

        this.ws.addEventListener('error', (err) => {
            console.error('Stats WebSocket error:', err);
        });

        this.ws.addEventListener('close', () => {
            console.log('Stats WebSocket connection closed. Attempting to reconnect...');
            setTimeout(() => this.reconnect(), 5000);
        });
    }

    private reconnect() {
        this.ws = new WebSocket('ws://localhost:8891');

        this.ws.addEventListener('open', () => {
            console.log('Stats WebSocket reconnected.');
        });

        this.ws.addEventListener('message', (event) => {
            try {
                const response = JSON.parse(event.data);
                console.log('Received Stats response:', response);

                if (response.type && this.callbacks[response.type]) {
                    this.callbacks[response.type].forEach(callback => callback(response.message));
                    this.callbacks[response.type] = [];
                }
            } catch (error) {
                console.error('Error parsing stats message:', error);
            }
        });

        this.ws.addEventListener('error', (err) => {
            console.error('Stats WebSocket error:', err);
        });

        this.ws.addEventListener('close', () => {
            console.log('Stats WebSocket connection closed. Attempting to reconnect...');
            setTimeout(() => this.reconnect(), 5000);
        });
    }

    private sendMessage(type: string, message: any = {}) {
        const payload = {
            app: 'stats',
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

    async getStatsData(): Promise<any[]> {
        return new Promise((resolve) => {
            this.addCallback('getStatsData', (statsData: any) => {
                resolve(statsData);
            });
            this.sendMessage('getStatsData');
        });
    }
}

export default StatsHandler;