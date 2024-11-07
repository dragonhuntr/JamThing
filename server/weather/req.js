const axios = require('axios');

async function makeWeatherRequest() {
    const url = 'https://api.weather.gov/gridpoints/CLE/139,99/forecast';

    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error in makeWeatherRequest:', error);
        throw error;
    }
}

async function handleWeatherRequest(type) {
    switch (type) {
        case 'getForecast':
            return await getForecast();
        default:
            return { error: 'Unknown request type' };
    }
}

async function getForecast() {
    try {
        const data = await makeWeatherRequest();
        const forecast = data.properties.periods.map(period => ({
            name: period.name,
            temperature: period.temperature,
            temperatureUnit: period.temperatureUnit,
            shortForecast: period.shortForecast,
            detailedForecast: period.detailedForecast,
            icon: period.icon
        }));
        return { success: true, forecast };
    } catch (error) {
        console.error('Error in getForecast:', error);
        return { success: false, error: error.message };
    }
}

module.exports = { handleWeatherRequest };