import { Sun, Cloud, CloudRain, CloudLightning, CloudSnow } from './Icons';

interface ForecastItemProps {
  time: string;
  temperature: string;
  probabilityOfPrecipitation: number;
  shortForecast: string;
}

interface ForecastProps {
  forecast: Array<{
    time: string;
    temperature: string;
    probabilityOfPrecipitation: number;
    shortForecast: string;
  }>;
}

function ForecastItem({ time, temperature, probabilityOfPrecipitation, shortForecast }: ForecastItemProps) {
  const getWeatherIcon = (forecast: string) => {
    // filtered from https://www.weather.gov/eax/pointforecasttextphrase
    const weatherMapping = {
      "Thunderstorms": CloudLightning,
      "Sprinkles": CloudRain,
      "Rain": CloudRain,
      "Showers": CloudRain,
      "Drizzle": CloudRain,
      "Heavy Rain": CloudRain,
      "Snow": CloudSnow,
      "Flurries": CloudSnow,
      "Sleet": CloudSnow,
      "Sunny": Sun,
      "Cloudy": Cloud,
      "Clear": Sun,
      "Clearing": Cloud,
      "Decreasing Clouds": Cloud,
      "Wintry Mix": CloudSnow
    };

    const matchedWeather = Object.keys(weatherMapping).find(key => 
      forecast.toLowerCase().includes(key.toLowerCase())
    );

    const IconComponent = matchedWeather ? weatherMapping[matchedWeather as keyof typeof weatherMapping] : Cloud;
    return <IconComponent className="w-8 h-8 text-white/60" />;
  };
  
  return (
    <div className="flex flex-col items-center text-lg">
      <span className="text-white/60">{time}</span>
      {getWeatherIcon(shortForecast)}
      <span className="text-white">{temperature}</span>
      <span className="text-white/60">{probabilityOfPrecipitation}%</span>
    </div>
  );
}

export function Forecast({ forecast }: ForecastProps) {
  return (
    <div className="mt-auto pt-4 mb-8 text-4xl">
      <h3 className="text-white/90 font-semibold mb-4 text-center">Next Hours</h3>
      <div className="flex flex-wrap justify-between">
        {forecast.slice(3).filter((_, index) => index % 3 === 0).slice(0, 3).map((item, index) => (
          <ForecastItem
            key={index}
            time={item.time}
            temperature={item.temperature}
            probabilityOfPrecipitation={item.probabilityOfPrecipitation}
            shortForecast={item.shortForecast}
          />
        ))}
      </div>
    </div>
  );
}