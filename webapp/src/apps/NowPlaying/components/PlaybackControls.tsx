import { Icons } from './Icons';

interface PlaybackControlsProps {
  isPlaying: boolean;
  isLiked: boolean;
  shuffle: boolean;
  onPlayPause: () => void;
  onLikeToggle: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onShuffleToggle: () => void;
  backgroundColor?: string;
}

export function PlaybackControls({ 
  isPlaying,
  isLiked,
  shuffle,
  onPlayPause,
  onLikeToggle,
  onNext,
  onPrevious,
  onShuffleToggle,
  backgroundColor = 'purple'
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center justify-between px-8 py-6 text-white">
      {/* Invisible spacer for shuffle button position */}
      <div className="w-11 h-11 p-2" />
      
      <button 
        className="p-2 transition-colors"
        onClick={onPrevious}
        style={{backgroundColor, outline: 'none'}}
      >
        <Icons.SkipBack className="w-11 h-11" fill={backgroundColor} />
      </button>
      <button 
        className="p-2 transition-colors"
        onClick={onPlayPause}
        style={{backgroundColor, outline: 'none'}}
      >
        {isPlaying ? 
          <Icons.Pause fill={backgroundColor} className="w-11 h-11" /> : 
          <Icons.Play fill={backgroundColor} className="w-11 h-11" />
        }
      </button>
      <button 
        className="p-2 transition-colors"
        onClick={onNext}
        style={{backgroundColor, outline: 'none'}}
      >
        <Icons.SkipForward className="w-11 h-11" fill={backgroundColor} />
      </button>
      
      {/* Invisible spacer for like button position */}
      <div className="w-11 h-11 p-2" />
    </div>
  );
}