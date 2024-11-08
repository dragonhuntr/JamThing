const axios = require('axios');

async function makeWeatherRequest() {
    const url = `https://api.weather.gov/gridpoints/CLE/139,99/forecast/hourly`;

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'JamThing (https://github.com/dragonhuntr/JamThing)'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error in makeWeatherRequest:', error);
        throw error;
    }
}

async function handleWeatherRequest(type, message) {
    switch (type) {
        case 'getForecastData':
            return await getForecast(message);
        default:
            return { error: 'Unknown request type' };
    }
}

async function getForecast(units) {
    try {
        const data = await makeWeatherRequest(units);
        const offset = new Date().getTimezoneOffset() * 60000; //in milliseconds
        const forecast = data.properties.periods.map(period => ({
            startTime: new Date(period.startTime).toISOString(),
            offset: offset, // carthing timezone is invalid
            temperature: period.temperature,
            temperatureUnit: period.temperatureUnit,
            windSpeed: period.windSpeed,
            probabilityOfPrecipitation: period.probabilityOfPrecipitation.value,
            relativeHumidity: period.relativeHumidity.value,
            shortForecast: period.shortForecast,
        }));
        return { success: true, forecast };
    } catch (error) {
        console.error('Error in getForecast:', error);
        return { success: false, error: error.message };
    }
}

module.exports = { handleWeatherRequest };