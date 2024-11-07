class SpotifyHandler {
    private ws: WebSocket;
    private callbacks: { [key: string]: Function[] };

    constructor() {
        // Initialize WebSocket connection using the native WebSocket object
        this.ws = new WebSocket('ws://localhost:8891');

        this.callbacks = {};

        this.ws.addEventListener('open', () => {
            console.log('WebSocket connection established.');
        });

        this.ws.addEventListener('message', (event) => {
            try {
                const response = JSON.parse(event.data);
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
        });

        this.ws.addEventListener('message', (event) => {
            try {
                const response = JSON.parse(event.data);
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
    private sendMessage(type: string, message: any = {}) {
        const payload = {
            app: 'spotify',
            type: type,
            message: message
        };

        // Wait for WebSocket to be in OPEN state before sending
        const sendWhenReady = () => {
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify(payload));
            } else {
                setTimeout(sendWhenReady, 100);
            }
        };

        sendWhenReady();
    }

    // Function to add a callback for a specific message type
    private addCallback(type: string, callback: Function) {
        if (!this.callbacks[type]) {
            this.callbacks[type] = [];
        }
        this.callbacks[type].push(callback);
    }

    // Function to request current playback data
    async getCurrentPlayback(): Promise<any> {
        return new Promise((resolve) => {
            this.addCallback('getCurrentPlayback', (data: any) => {
                resolve(data);
            });
            this.sendMessage('getCurrentPlayback');
        });
    }

    // Function to check if a track is liked
    async checkLiked(trackId: string): Promise<boolean> {
        return new Promise((resolve) => {
            this.addCallback('checkLiked', (data: { liked: boolean }) => {
                resolve(data.liked);
            });
            this.sendMessage('checkLiked', { trackId });
        });
    }

    async getJamSession(): Promise<any> {
        return new Promise((resolve) => {
            this.addCallback('getJamSession', (data: any) => {
                resolve(data);
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