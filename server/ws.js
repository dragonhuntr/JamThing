const WebSocket = require('ws');
const express = require('express');
const app = express();
const path = require('path');
const { handleSpotifyRequest } = require('./spotify/req');
const { handleWeatherRequest } = require('./weather/req');

app.use('/', express.static(path.resolve(__dirname, '../client')));

const myServer = app.listen(8891);

const wsServer = new WebSocket.Server({
    noServer: true
});

wsServer.on('connection', function (ws) {

    ws.on('open', function open() {
        console.log('Connected');
    });

    ws.on('message', async function (msg) {
        try {
            const message = JSON.parse(msg);
            console.log('Received:', message);

            if (message.app && message.type && message.message !== undefined) {
                if (message.app === 'spotify') {
                    const response = await handleSpotifyRequest(message.type, message.message);
                    ws.send(JSON.stringify({
                        app: 'spotify',
                        type: message.type,
                        message: response
                    }));
                } else if (message.app === 'weather') {
                    const response = await handleWeatherRequest(message.type, message.message);
                    ws.send(JSON.stringify({
                        app: 'weather',
                        type: message.type,
                        message: response
                    }));
                } else {
                    console.error('Unknown app:', message.app);
                }
            } else {
                console.error('Invalid message format');
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });
});

myServer.on('upgrade', function upgrade(request, socket, head) {
    wsServer.handleUpgrade(request, socket, head, function done(ws) {
        wsServer.emit('connection', ws, request);
    });
});