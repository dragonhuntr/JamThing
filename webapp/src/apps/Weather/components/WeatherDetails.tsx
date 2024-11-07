import { Thermometer, Droplets, Wind } from './Icons';

interface WeatherDetailsProps {
  details: {
    feelsLike: string;
    humidity: string;
    windSpeed: string;
  };
}

export function WeatherDetails({ details }: WeatherDetailsProps) {
  return (
    <div className="space-y-4 text-2xl pt-2">
      <div className="flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <Thermometer className="w-5 h-5 text-purple-400" />
          <span className="text-white/60">Feels like</span>
        </div>
        <span>{details.feelsLike}</span>
      </div>

      <div className="flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <Droplets className="w-5 h-5 text-blue-400" />
          <span className="text-white/60">Humidity</span>
        </div>
        <span>{details.humidity}</span>
      </div>

      <div className="flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <Wind className="w-5 h-5 text-green-400" />
          <span className="text-white/60">Wind speed</span>
        </div>
        <span>{details.windSpeed}</span>
      </div>
    </div>
  );
}