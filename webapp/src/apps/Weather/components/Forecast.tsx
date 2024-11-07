import { getWeatherIconAndColor } from '../utils/getWeatherIconAndColor';

interface ForecastItemProps {
  time: string;
  Icon: React.ComponentType<{ className?: string }>; // Use React.ComponentType for Icon
  temperature: string;
  iconColor: string;
}

interface ForecastProps {
  forecast: Array<{
    time: string;
    temperature: string;
    condition: string;
  }>;
}

function ForecastItem({ time, Icon, temperature, iconColor }: ForecastItemProps) {
  return (
    <div className="flex flex-col items-center text-lg">
      <span className="text-white/60">{time}</span>
      <Icon className={`w-12 h-12 my-2 ${iconColor}`} />
      <span className="text-white">{temperature}</span>
    </div>
  );
}

export function Forecast({ forecast }: ForecastProps) {
  return (
    <div className="mt-auto pt-4 mb-8 text-4xl">
      <h3 className="text-white/90 font-semibold mb-4 text-center">Next Hours</h3>
      <div className="flex flex-wrap justify-between">
        {forecast.map((item, index) => {
          const { Icon, color } = getWeatherIconAndColor(item.condition);
          return (
            <ForecastItem
              key={index}
              time={item.time}
              Icon={Icon}
              temperature={item.temperature}
              iconColor={color}
            />
          );
        })}
      </div>
    </div>
  );
}