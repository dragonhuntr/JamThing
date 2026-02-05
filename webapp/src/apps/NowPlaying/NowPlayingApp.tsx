import { useState, useEffect, useRef } from 'react';
import { AlbumArt } from './components/AlbumArt';
import { TrackInfo } from './components/TrackInfo';
import { PlaybackControls } from './components/PlaybackControls';
import { ProgressBar } from './components/ProgressBar';
import { findAlbumArtColor } from './utils/colorBg';
import NowPlayingHandler from './server/nowplaying';

function NowPlayingApp() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState<string>('#2D1E34');
  const [isInitialFetch, setIsInitialFetch] = useState(true);
  
  const defaultTrackInfo = {
    title: 'No Music Playing',
    artist: 'Unknown Artist',
    duration: 0,
    progress: 0,
    imageUrl: './images/Igor.jpg',
  };

  const [trackInfo, setTrackInfo] = useState(defaultTrackInfo);

  const nowPlayingHandlerRef = useRef<NowPlayingHandler | null>(null);
  const cachedImageRef = useRef<string | null>(null); // Cache for artwork

  useEffect(() => {
    if (!nowPlayingHandlerRef.current) {
      nowPlayingHandlerRef.current = new NowPlayingHandler();
    }

    if (isInitialFetch) {
      fetchCurrentPlayback();
    }

    const interval = setInterval(fetchCurrentPlayback, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [isInitialFetch]);

  const fetchCurrentPlayback = async () => {
    try {
      const response = await nowPlayingHandlerRef.current?.getNowPlaying();
      
      if (response && response.success && response.nowPlaying) {
        const nowPlaying = response.nowPlaying;
        const previousTrackTitle = trackInfo.title;

        // Construct the image URL from base64 data if available, or use cached image
        let imageUrl: string;
        if (nowPlaying.artworkData) {
          // New artwork data available - construct URL and cache it
          imageUrl = `data:${nowPlaying.artworkMimeType || 'image/jpeg'};base64,${nowPlaying.artworkData}`;
          cachedImageRef.current = imageUrl;
        } else if (cachedImageRef.current) {
          // No artwork in response, use cached image
          imageUrl = cachedImageRef.current;
        } else {
          // No artwork and no cache, use default
          imageUrl = './images/Igor.jpg';
        }

        setTrackInfo({
          title: nowPlaying.title || 'Unknown Title',
          artist: nowPlaying.artist || 'Unknown Artist',
          duration: nowPlaying.duration * 1000, // Convert seconds to ms
          progress: nowPlaying.elapsedTime * 1000, // Convert seconds to ms
          imageUrl: imageUrl,
        });

        // Update background color when track changes and we have new artwork
        if (nowPlaying.title !== previousTrackTitle && nowPlaying.artworkData) {
          const image = new Image();
          image.src = imageUrl;
          image.onload = async () => {
            try {
              const dominantColor = await findAlbumArtColor(image);
              if (dominantColor) {
                setBackgroundColor(`rgb(${dominantColor.join(',')})`);
              }
            } catch (error) {
              console.error('Error finding dominant color:', error);
            }
          }
        }

        setIsPlaying(nowPlaying.playing);
        setIsInitialFetch(false);
      } else {
        setTrackInfo(defaultTrackInfo);
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error fetching current playback:', error);
      setTrackInfo(defaultTrackInfo);
      setIsPlaying(false);
    }
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      await nowPlayingHandlerRef.current?.pause();
      setIsPlaying(false);
    } else {
      await nowPlayingHandlerRef.current?.play();
      setIsPlaying(true);
    }
    // Fetch updated state after a short delay
    setTimeout(fetchCurrentPlayback, 500);
  };

  const handleNext = async () => {
    await nowPlayingHandlerRef.current?.next();
    setTimeout(fetchCurrentPlayback, 500);
  };

  const handlePrevious = async () => {
    await nowPlayingHandlerRef.current?.previous();
    setTimeout(fetchCurrentPlayback, 500);
  };

  return (
    <div className="w-[800px] h-[480px] rounded-xl overflow-hidden flex flex-col justify-center relative"
      style={{ backgroundColor }}
    >
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-6 pt-6 pl-8">
          <AlbumArt imageUrl={trackInfo.imageUrl} />
          <TrackInfo
            title={trackInfo.title}
            artist={trackInfo.artist}
          />
        </div>
      </div>

      <div className="mt-auto">
        <div className="px-8 pb-2">
          <ProgressBar
            currentTime={trackInfo.progress}
            totalTime={trackInfo.duration}
            isPlaying={isPlaying}
          />
        </div>
        <div className="h-px bg-white/10" />
        <PlaybackControls
          isPlaying={isPlaying}
          isLiked={false}
          shuffle={false}
          onPlayPause={handlePlayPause}
          onLikeToggle={() => {}} // Not supported in nowplaying
          onNext={handleNext}
          onPrevious={handlePrevious}
          onShuffleToggle={() => {}} // Not supported in nowplaying
          backgroundColor={backgroundColor}
        />
      </div>
    </div>
  );
}

export default NowPlayingApp;
