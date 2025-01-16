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

const mbToGb = (mb: number) => (mb / 1024).toFixed(2);

export function GpuStats({ gpus }: GpuStatsProps) {
    return (
        <div className="text-white">
            <h2 className="text-xl font-semibold mb-4">GPU</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full table-auto text-xl">
                    <thead>
                        <tr className="text-white/60 border-b border-white/20">
                            <th className="text-left py-2">Name</th>
                            <th className="text-center py-2">Temp</th>
                            <th className="text-center py-2">Power</th>
                            <th className="text-center py-2">Memory (GB)</th>
                            <th className="text-center py-2">Usage</th>
                        </tr>
                    </thead>
                    <tbody>
                        {gpus.map((gpu) => (
                            <tr key={gpu.index} className="border-b border-white/10">
                                <td className="py-2">{gpu.name.replace('NVIDIA GeForce ', '')}</td>
                                <td className="text-center py-2">{gpu.temperature_C}°C</td>
                                <td className="text-center py-2">{gpu.powerDraw_Watts}W</td>
                                <td className="text-center py-2">
                                    {mbToGb(gpu.memoryUsed_MB)}/{mbToGb(gpu.memoryTotal_MB)}
                                </td>
                                <td className="text-center py-2">{gpu.gpuUtilization_Percent}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}