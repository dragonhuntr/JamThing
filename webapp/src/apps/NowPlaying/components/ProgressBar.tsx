import { useEffect, useState } from 'react';

interface ProgressBarProps {
  currentTime: number;
  totalTime: number;
  isPlaying: boolean; // Add isPlaying prop
}

function formatTime(timeInMs: number): string {
  const totalSeconds = Math.floor(timeInMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function ProgressBar({ currentTime, totalTime, isPlaying }: ProgressBarProps) {
  const [displayTime, setDisplayTime] = useState(currentTime);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isPlaying) {
      interval = setInterval(() => {
        setDisplayTime((prevTime) => Math.min(prevTime + 1000, totalTime));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, totalTime]);

  useEffect(() => {
    setDisplayTime(currentTime);
  }, [currentTime]);

  return (
    <div>
      <div className="relative w-full h-1 bg-white/10 rounded-full cursor-pointer group">
        <div
          className="absolute left-0 top-0 h-full bg-white/25 rounded-full group-hover:bg-white/40 transition-all duration-300"
          style={{ width: `${(displayTime / totalTime) * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-sm mt-2 text-white/40">
        <span>{formatTime(displayTime)}</span>
        <span>{formatTime(totalTime)}</span>
      </div>
    </div>
  );
}