import { useEffect, useState, useMemo } from 'react';
import { CurrentWeather } from './components/CurrentWeather';
import { WeatherDetails } from './components/WeatherDetails';
import { Forecast } from './components/Forecast';
import WeatherHandler from './server/weather';

interface WeatherData {
  currentWeather: {
    temperature: string;
    condition: string;
    icon: string;
  };
  details: {
    feelsLike: string;
    humidity: string;
    windSpeed: string;
  };
  forecast: Array<{
    time: string;
    temperature: string;
    condition: string;
  }>;
}

export default function WeatherApp() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const weatherHandler = useMemo(() => new WeatherHandler(), []);

  const fetchWeatherData = async () => {
    setLoading(true);
    setError(null);
    try {
      const currentWeather = await weatherHandler.getCurrentWeather();
      const weatherDetails = await weatherHandler.getWeatherDetails();
      const forecastData = await weatherHandler.getForecastData();

      const data: WeatherData = {
        currentWeather: {
          temperature: currentWeather.temperature || 'N/A',
          condition: currentWeather.condition || 'N/A',
          icon: currentWeather.Icon.name || 'N/A',
        },
        details: {
          feelsLike: weatherDetails.feelsLike || 'N/A',
          humidity: weatherDetails.humidity || 'N/A',
          windSpeed: weatherDetails.windSpeed || 'N/A',
        },
        forecast: forecastData.map(forecast => ({
          time: forecast.time || 'N/A',
          temperature: forecast.temperature || 'N/A',
          condition: forecast.Icon.name || 'N/A',
        })),
      };

      setWeatherData(data);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setError('Failed to fetch weather data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, [weatherHandler]);

  if (loading) {
    return (
      <div>
        Loading...
        <button onClick={fetchWeatherData} className="mt-4 p-2 bg-blue-500 text-white rounded">
          Update Weather
        </button>
      </div>
    );
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!weatherData) {
    return (
      <div className="w-[800px] h-[480px] bg-gradient-to-br from-[#2D1E34] to-[#1E1E1E] rounded-xl overflow-hidden flex flex-col items-center justify-center text-white">
        <p>No weather data available. Please try updating.</p>
        <button onClick={fetchWeatherData} className="mt-4 p-2 bg-blue-500 text-white rounded">
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
          currentWeather={weatherData.currentWeather}
        />
        <div className="w-120 bg-white/5 backdrop-blur-sm pt-5 flex flex-col pl-14 pr-24">
          <h3 className="text-white/90 text-4xl font-semibold mb-2 pt-3">Weather Details</h3>
          <WeatherDetails details={weatherData.details} />
          <Forecast forecast={weatherData.forecast} />
          <button onClick={fetchWeatherData} className="mt-4 p-2 bg-blue-500 text-white rounded">
            Update Weather
          </button>
        </div>
      </div>
    </div>
  );
}