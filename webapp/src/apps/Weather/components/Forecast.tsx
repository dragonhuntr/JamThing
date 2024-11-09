import { getWeatherIconAndColor } from '../utils/getWeatherIconAndColor';

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
  const { Icon, color } = getWeatherIconAndColor(shortForecast);
  return (
    <div className="flex flex-col items-center text-lg">
      <span className="text-white/60">{time}</span>
      <Icon className={`w-10 h-10 ${color}`} />
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