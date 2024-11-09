import { Sun, Cloud, CloudRain, CloudLightning, CloudSnow } from '../components/Icons';

export function getWeatherIconAndColor(condition: string) {
  const weatherMapping = {
    "thunderstorms": { Icon: CloudLightning, color: 'text-purple-400' },
    "sprinkles": { Icon: CloudRain, color: 'text-blue-400' },
    "rain": { Icon: CloudRain, color: 'text-blue-400' },
    "showers": { Icon: CloudRain, color: 'text-blue-400' },
    "drizzle": { Icon: CloudRain, color: 'text-blue-400' },
    "heavy rain": { Icon: CloudRain, color: 'text-blue-400' },
    "snow": { Icon: CloudSnow, color: 'text-white' },
    "flurries": { Icon: CloudSnow, color: 'text-white' },
    "sleet": { Icon: CloudSnow, color: 'text-white' },
    "sunny": { Icon: Sun, color: 'text-yellow-400' },
    "cloudy": { Icon: Cloud, color: 'text-gray-400' },
    "clear": { Icon: Sun, color: 'text-yellow-400' },
    "clearing": { Icon: Cloud, color: 'text-gray-400' },
    "decreasing clouds": { Icon: Cloud, color: 'text-gray-400' },
    "wintry mix": { Icon: CloudSnow, color: 'text-white' }
  };

  const matchedWeather = Object.keys(weatherMapping).find(key => 
    condition.toLowerCase().includes(key)
  );

  return matchedWeather ? weatherMapping[matchedWeather as keyof typeof weatherMapping] : { Icon: Sun, color: 'text-yellow-400' };
}