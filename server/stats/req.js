const axios = require('axios');

async function makeStatsRequest() {
    const url = `https://stats.wai.sh/stats`;

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'JamThing (https://github.com/dragonhuntr/JamThing)'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error in makeStatsRequest:', error);
        throw error;
    }
}

async function handleStatsRequest(type) {
    switch (type) {
        case 'getStatsData':
            return await getStatsData();
        default:
            return { error: 'Unknown request type' };
    }
}

async function getStatsData() {
    try {
        const data = await makeStatsRequest();
        return { success: true, data };
    } catch (error) {
        console.error('Error in getStats:', error);
        return { success: false, error: error.message };
    }
}

module.exports = { handleStatsRequest };