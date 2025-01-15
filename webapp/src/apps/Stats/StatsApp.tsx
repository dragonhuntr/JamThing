import { useState, useEffect } from 'react';
import { SystemStats } from './components/SystemStats';
import { GpuStats } from './components/GpuStats';

interface Stats {
    cpu: {
        temperature: number;
        load: number;
        clockSpeed: number;
    };
    ram: {
        total: number;
        free: number;
        used: number;
    };
    gpus: Array<{
        index: number;
        name: string;
        temperature_C: number;
        fanSpeed_Percent: number;
        powerDraw_Watts: number;
        memoryUsed_MB: number;
        memoryTotal_MB: number;
        gpuUtilization_Percent: number;
    }>;
}

function StatsApp() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                /**const response = await fetch('https://pastebin.com/raw/5X1XpbF0');
                if (!response.ok) {
                  throw new Error('Failed to fetch stats');
                }
                const data = await response.json();*/
                const data = {
                    "gpus": [
                        {
                            "index": 0,
                            "name": "NVIDIA GeForce RTX 3090",
                            "temperature_C": 65.0,
                            "fanSpeed_Percent": 45.0,
                            "powerDraw_Watts": 250.0,
                            "memoryUsed_MB": 10240.0,
                            "memoryTotal_MB": 24576.0,
                            "gpuUtilization_Percent": 80.0
                        },
                        {
                            "index": 0,
                            "name": "NVIDIA GeForce RTX 3090",
                            "temperature_C": 65.0,
                            "fanSpeed_Percent": 45.0,
                            "powerDraw_Watts": 250.0,
                            "memoryUsed_MB": 10240.0,
                            "memoryTotal_MB": 24576.0,
                            "gpuUtilization_Percent": 80.0
                        },
                        {
                            "index": 0,
                            "name": "NVIDIA GeForce RTX 3090",
                            "temperature_C": 65.0,
                            "fanSpeed_Percent": 45.0,
                            "powerDraw_Watts": 250.0,
                            "memoryUsed_MB": 10240.0,
                            "memoryTotal_MB": 24576.0,
                            "gpuUtilization_Percent": 80.0
                        }
                    ],
                    "cpu": {
                        "temperature": 55.0,
                        "load": 0.25,
                        "clockSpeed": 3800
                    },
                    "ram": {
                        "total": 64000,
                        "free": 20000,
                        "used": 44000,
                        "active": 30000
                    }
                }
                setStats(data);
            } catch (err) {
                setError('Failed to fetch system statistics');
                console.error(err);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 1000); // Update every second

        return () => clearInterval(interval);
    }, []);

    if (error) {
        return (
            <div className="w-[800px] h-[480px] bg-gradient-to-br from-[#2D1E34] to-[#1E1E1E] rounded-xl overflow-hidden flex items-center justify-center text-white">
                <p>{error}</p>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="w-[800px] h-[480px] bg-gradient-to-br from-[#2D1E34] to-[#1E1E1E] rounded-xl overflow-hidden flex items-center justify-center text-white">
                <p>Loading stats...</p>
            </div>
        );
    }

    return (
        <div className="w-[800px] h-[480px] bg-gradient-to-br from-[#2D1E34] to-[#1E1E1E] rounded-xl overflow-hidden p-8">
            <div className="flex flex-col h-full">
                <h1 className="text-2xl font-bold text-white mb-8">System Statistics</h1>
                <div className="flex-1 flex gap-8">
                    <div className="flex-1">
                        <SystemStats cpu={stats.cpu} ram={stats.ram} />
                    </div>
                    <div className="flex-1">
                        <GpuStats gpus={stats.gpus} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StatsApp;