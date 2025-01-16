import { useState, useEffect, useRef } from 'react';
import { SystemStats } from './components/SystemStats';
import { GpuStats } from './components/GpuStats';
import StatsHandler from './server/stats';

interface Stats {
    cpu: {
        temperature: number;
        load: number;
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
    const [isUpdating, setIsUpdating] = useState(false);
    const statsHandlerRef = useRef<StatsHandler | null>(null);

    const fetchStatsData = async () => {
        setIsUpdating(true);
        try {
            if (!statsHandlerRef.current) return;
            const data = await statsHandlerRef.current.getStatsData();
            setStats(data);
        } catch (err) {
            setError('Failed to fetch system statistics');
            console.error(err);
        } finally {
            setIsUpdating(false);
        }
    };

    useEffect(() => {
        if (!statsHandlerRef.current) {
            statsHandlerRef.current = new StatsHandler();
        }
        fetchStatsData();

        const interval = setInterval(fetchStatsData, 1000); // Update every second

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
                <h1 className="text-2xl font-bold text-white mb-5">System Statistics</h1>
                <div className="flex-1 flex gap-8">
                    <div className="w-2/5 h-full overflow-y-auto">
                        <SystemStats cpu={stats.cpu} ram={stats.ram} />
                    </div>
                    <div className="w-4/5 h-full overflow-y-auto pr-8">
                        <GpuStats gpus={stats.gpus} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StatsApp;