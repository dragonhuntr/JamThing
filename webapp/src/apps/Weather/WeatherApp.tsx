import { useEffect, useState, useRef } from 'react';
import { CurrentWeather } from './components/CurrentWeather';
import { WeatherDetails } from './components/WeatherDetails';
import { Forecast } from './components/Forecast';
import WeatherHandler from './server/weather';
import moment from 'moment-timezone'; //bc time is hard

// NOTE: technically with how our weather data is being called, its always in US units, so conversion will always be from US to SI
// but i implemented it anyways if we ever change the api or send a unit parameter to the api
// why didnt i just send a unit parameter to the api? because heat index relies on the units being in Farhenheit
// so i would have to convert it anyways

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
  }, [units]);

  const fetchWeatherData = async () => {
    try {
      const response = await weatherHandlerRef.current?.getForecastData();
      if (response && Array.isArray(response)) {
        const updatedResponse = response.map(period => {
          const updatedPeriod = { ...period };
          updatedPeriod.temperature = units !== 'us' ? convertTemperature(period.temperature, units) : period.temperature;
          updatedPeriod.windSpeed = units !== 'us' ? convertWindSpeed(parseInt(period.windSpeed), units) : parseInt(period.windSpeed);
          updatedPeriod.feelsLike = calculateHeatIndex(updatedPeriod.temperature, period.relativeHumidity);
          return updatedPeriod;
        });
        setWeatherData({ periods: updatedResponse });
      }
    } catch (err) {
      setError('Failed to fetch weather data');
    }
  };

  const convertTemperature = (temperature: number, fromUnit: string): number => {
    if (fromUnit === 'us') {
      return Math.round((temperature * (9 / 5)) + 32);  // F to C
    } else {
      return Math.round((temperature - 32) * (5 / 9));  // C to F
    }
  };

  const convertWindSpeed = (speed: number, fromUnit: string): number => {
    // using this formula: https://www.weather.gov/media/epz/wxcalc/windConversion.pdf
    if (fromUnit === 'us') {
      return Math.round(speed * 0.621371)   // km/h to mph
    } else {
      return Math.round(speed * 1.609344)   // mph to km/h
    }
  }

  const calculateHeatIndex = (T: number, RH: number): number => {
    // heatIndex formula
    // https://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml
    let HI = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (RH * 0.094));
    if (HI >= 80) {
      HI = -42.379 + 2.04901523 * T + 10.14333127 * RH - 0.22475541 * T * RH - 0.00683783 * T * T - 0.05481717 * RH * RH + 0.00122874 * T * T * RH + 0.00085282 * T * RH * RH - 0.00000199 * T * T * RH * RH;
      if (RH < 13 && T >= 80 && T <= 112) {
        const adjustment = ((13 - RH) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
        HI -= adjustment;
      } else if (RH > 85 && T >= 80 && T <= 87) {
        const adjustment = ((RH - 85) / 10) * ((87 - T) / 5);
        HI += adjustment;
      }
    }
    return Math.round(HI);
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
              units,
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
