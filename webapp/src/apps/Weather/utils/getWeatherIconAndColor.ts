import { Sun, Cloud, CloudRain } from '../components/Icons';

export function getWeatherIconAndColor(condition: string) {
  switch (condition.toLowerCase()) {
    case 'sunny':
    case 'clear':
      return { Icon: Sun, color: 'text-yellow-400' };
    case 'cloudy':
    case 'overcast':
      return { Icon: Cloud, color: 'text-gray-400' };
    case 'rain':
    case 'showers':
      return { Icon: CloudRain, color: 'text-blue-400' };
    default:
      return { Icon: Sun, color: 'text-yellow-400' };
  }
}