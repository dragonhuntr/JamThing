import { getWeatherIconAndColor } from '../utils/getWeatherIconAndColor';

interface CurrentWeatherProps {
  location: string;
  time: string;
  currentWeather: {
    temperature: string;
    condition: string;
  };
  toggleUnits: () => void;
}

export function CurrentWeather({ location, time, currentWeather, toggleUnits }: CurrentWeatherProps) {
  const { Icon, color } = getWeatherIconAndColor(currentWeather.condition);

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-white p-2 pt-6">
      <p className="text-white/60">{time}</p>
      <p className="text-white/90 font-semibold">{location}</p>
      <h1 className="ml-1 text-[100px] font-bold" onClick={toggleUnits}>
        {currentWeather.temperature}
      </h1>
      <Icon className={`w-56 h-56 mb-3 ${color}`} />
      <p className="text-xl text-white/75 mb-4">{currentWeather.condition}</p>
    </div>
  );
}