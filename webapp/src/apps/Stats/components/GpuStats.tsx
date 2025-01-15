interface GPU {
    index: number;
    name: string;
    temperature_C: number;
    fanSpeed_Percent: number;
    powerDraw_Watts: number;
    memoryUsed_MB: number;
    memoryTotal_MB: number;
    gpuUtilization_Percent: number;
  }
  
  interface GpuStatsProps {
    gpus: GPU[];
  }
  
  export function GpuStats({ gpus }: GpuStatsProps) {
    return (
      <div className="text-white">
        <h2 className="text-2xl font-semibold mb-4">GPU</h2>
        <div className="space-y-6">
          {gpus.map((gpu) => (
            <div key={gpu.index}>
              <h3 className="text-white/60 mb-2">{gpu.name}</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Temperature</span>
                  <span>{gpu.temperature_C}°C</span>
                </div>
                <div className="flex justify-between">
                  <span>Fan Speed</span>
                  <span>{gpu.fanSpeed_Percent}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Power Draw</span>
                  <span>{gpu.powerDraw_Watts}W</span>
                </div>
                <div className="flex justify-between">
                  <span>Memory Usage</span>
                  <span>{gpu.memoryUsed_MB}/{gpu.memoryTotal_MB} MB</span>
                </div>
                <div className="flex justify-between">
                  <span>GPU Utilization</span>
                  <span>{gpu.gpuUtilization_Percent}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full mt-2">
                  <div 
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${gpu.gpuUtilization_Percent}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }