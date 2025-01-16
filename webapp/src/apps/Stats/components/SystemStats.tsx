interface SystemStatsProps {
  cpu: {
    temperature: number;
    load: number;
  };
  ram: {
    total: number;
    free: number;
    used: number;
  };
}

export function SystemStats({ cpu, ram }: SystemStatsProps) {
  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const ramUsagePercent = (ram.used / ram.total) * 100;

  return (
    <div className="text-white h-full">
      <h2 className="text-xl font-semibold mb-4">CPU & RAM</h2>
      
      <div className="space-y-6 text-xl">
        <div>
          <h3 className="text-white/60 mb-2">CPU</h3>
          <div className="space-y-2">
            <div className="flex justify-between max-w-[200px]">
              <span>Temperature</span>
              <span>{cpu.temperature}°C</span>
            </div>
            <div className="flex justify-between max-w-[200px]">
              <span>Load</span>
              <span>{cpu.load.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-white/60 mb-2">RAM</h3>
          <div className="space-y-2">
            <div className="flex justify-between max-w-[200px]">
              <span>Total</span>
              <span>{formatBytes(ram.total)}</span>
            </div>
            <div className="flex justify-between max-w-[200px]">
              <span>Used</span>
              <span>{formatBytes(ram.used)}</span>
            </div>
            <div className="flex justify-between max-w-[200px]">
              <span>Free</span>
              <span>{formatBytes(ram.free)}</span>
            </div>
            <div className="w-full max-w-[200px] h-2 bg-white/10 rounded-full mt-4">
              <div 
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${ramUsagePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}