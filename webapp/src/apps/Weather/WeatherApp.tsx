import { useEffect, useState, useRef } from 'react';
import { CurrentWeather } from './components/CurrentWeather';
import { WeatherDetails } from './components/WeatherDetails';
import { Forecast } from './components/Forecast';
import WeatherHandler from './server/weather';
import moment from 'moment-timezone'; //bc time is hard

interface WeatherData {
  periods: Period[];
}

interface Period {
  startTime: string;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  probabilityOfPrecipitation: number;
  relativeHumidity: number;
  shortForecast: string;
  feelsLike: number;
}

const WeatherApp = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [units, setUnits] = useState<string>('si');
  const [error, setError] = useState<string | null>(null);
  const weatherHandlerRef = useRef<WeatherHandler | null>(null);

  useEffect(() => {
    if (!weatherHandlerRef.current) {
      weatherHandlerRef.current = new WeatherHandler();
    }
    fetchWeatherData();
  }, []);

  const fetchWeatherData = async () => {
    try {
      const response = await weatherHandlerRef.current?.getForecastData();
      if (response && Array.isArray(response)) {
        // calculate feelslike
        // using formula here: https://www.weather.gov/media/epz/wxcalc/heatIndex.pdf
        const updatedResponse = response.map(period => {
          const T = period.temperature;
          const RH = period.relativeHumidity;
          const feelsLike = -42.379 + 2.04901523 * T + 10.14333127 * RH - 0.22475541 * T * RH - 0.00683783 * T * T - 0.05481717 * RH * RH + 0.00122874 * T * T * RH + 0.00085282 * T * RH * RH - 0.00000199 * T * T * RH * RH;
          return { ...period, feelsLike };
        });
        setWeatherData({ periods: updatedResponse });
      }
    } catch (err) {
      setError('Failed to fetch weather data');
    }
  };

  const toggleUnits = () => {
    setUnits(units === 'si' ? 'us' : 'si');
    fetchWeatherData();
  };

  if (error) {
    return <div>{error}</div>;
  }

  if (!weatherData) {
    return (
      <div className="w-[800px] h-[480px] bg-gradient-to-br from-[#2D1E34] to-[#1E1E1E] rounded-xl overflow-hidden flex flex-col items-center justify-center text-white">
        <button onClick={fetchWeatherData} className="mt-1 p-2 bg-blue-500 text-white rounded">
          Update Weather
        </button>
      </div>
    );
  }
  return (
    <div className="w-[800px] h-[480px] bg-gradient-to-br from-[#2D1E34] to-[#1E1E1E] rounded-xl overflow-hidden flex flex-col">
      <div className="flex flex-1">
        <CurrentWeather
          location="Erie, PA"
          time={moment(weatherData?.periods[0].startTime).format('dddd, D MMMM, h:mm A')}
          currentWeather={{
            temperature: `${weatherData?.periods[0].temperature}°`,
            condition: weatherData?.periods[0].shortForecast,
          }}
          toggleUnits={toggleUnits}
        />
        <div className="w-120 bg-white/5 backdrop-blur-sm pt-5 flex flex-col pl-14 pr-24">
          <h3 className="text-white/90 text-4xl font-semibold mb-2 pt-3">Weather Details</h3>
          <WeatherDetails
            details={{
              feelsLike: `${weatherData?.periods[0].feelsLike}°`,
              humidity: `${weatherData?.periods[0].relativeHumidity}%`,
              windSpeed: weatherData?.periods[0].windSpeed,
            }}
          />
          <Forecast
            forecast={weatherData?.periods.map(period => ({
              time: moment(period.startTime).format('h:mm a'),
              temperature: `${period.temperature} ${period.temperatureUnit}`,
              probabilityOfPrecipitation: period.probabilityOfPrecipitation,
            }))}
          />
        </div>
      </div>
    </div>
  );
}

export default WeatherApp;
