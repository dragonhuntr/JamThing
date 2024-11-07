import { getWeatherIconAndColor } from '../utils/getWeatherIconAndColor';

interface CurrentWeatherProps {
  location: string;
  currentWeather: {
    temperature: string;
    condition: string;
    icon: string;
  };
}

export function CurrentWeather({ location, currentWeather }: CurrentWeatherProps) {
  const { Icon, color } = getWeatherIconAndColor(currentWeather.condition);

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-white p-2 pt-6">
      <p className="text-white/60">Monday, 12:30 PM  |  {location}</p>
      <h1 className="text-[100px] font-bold mb-2">{currentWeather.temperature}</h1>
      <Icon className={`w-56 h-56 mb-3 ${color}`} />
      <p className="text-xl text-white/75 mb-4">{currentWeather.condition}</p>
    </div>
  );
}