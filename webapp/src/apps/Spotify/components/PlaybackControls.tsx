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
      <button 
        className={`p-2 transition-colors ${shuffle ? 'text-purple-500' : ''}`}
        onClick={onShuffleToggle}
        style={{backgroundColor, outline: 'none'}}
      >
        <Icons.Shuffle className="w-11 h-11" fill={backgroundColor} />
      </button>
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
      <button 
        className="p-2 transition-colors"
        onClick={onLikeToggle}
        style={{backgroundColor, outline: 'none'}}
      >
        <Icons.Heart 
          className={`w-11 h-11 ${isLiked ? 'fill-purple-500 text-purple-500' : 'hover:text-purple-300'}`}
          fill={isLiked ? "currentColor" : backgroundColor}
        />
      </button>
    </div>
  );
}