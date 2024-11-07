import { useState, useEffect } from 'react';

interface VolumeBarProps {
  volume: number;
}

export function VolumeBar({ volume }: VolumeBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (volume !== null) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [volume]);

  return (
    <div
      className={`fixed left-0 top-1/2 transform -translate-y-1/2 transition-transform ${
        visible ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="text-white p-2 rounded-r-lg">
        <div className="relative h-48 w-2 bg-white/10 rounded-full cursor-pointer group">
          <div
            className="absolute bottom-0 left-0 w-full bg-white/25 rounded-full group-hover:bg-white/40 transition-all duration-300"
            style={{ height: `${volume}%` }}
          />
        </div>
      </div>
    </div>
  );
}