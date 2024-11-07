import { useState, useEffect, useRef } from 'react';
import { Icons } from './components/Icons';
import { AlbumArt } from './components/AlbumArt';
import { TrackInfo } from './components/TrackInfo';
import { PlaybackControls } from './components/PlaybackControls';
import { ProgressBar } from './components/ProgressBar';
import { Jam } from './components/Jam';
import { VolumeBar } from './components/VolumeBar';
import { findAlbumArtColor } from './utils/colorBg';
import SpotifyHandler from './server/spotify'; // Import SpotifyHandler
import ButtonControl from '../../utils/buttonHelper';

function SpotifyApp() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [visibleComponent, setVisibleComponent] = useState('stats');
  const [backgroundColor, setBackgroundColor] = useState<string>('#2D1E34');
  const [fetchedQrCode, setFetchedQrCode] = useState<string | null>(null);
  const [volume, setVolume] = useState(50);
  const [isInitialFetch, setIsInitialFetch] = useState(true); // Initialize directly to true
  const [trackInfo, setTrackInfo] = useState({
    id: '',
    title: 'Unknown Title',
    album: 'Unknown Album',
    artist: 'Unknown Artist',
    duration: 0,
    progress: 0,
    imageUrl: './images/Igor.jpg',
    shuffle: false
  });

  const spotifyHandlerRef = useRef<SpotifyHandler | null>(null);

  useEffect(() => {
    if (!spotifyHandlerRef.current) {
      spotifyHandlerRef.current = new SpotifyHandler(); // Initialize SpotifyHandler once
    }

    if (isInitialFetch) {
      fetchCurrentPlayback();
    }

    const interval = setInterval(fetchCurrentPlayback, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [isInitialFetch]);

  const fetchCurrentPlayback = async () => {
    console.log(isInitialFetch)
    console.log('Fetching current playback...');
    try {
      const playback = await spotifyHandlerRef.current?.getCurrentPlayback();
      if (playback && playback.item) {
        const newTrackId = playback.item.id;
        const previousTrackId = trackInfo.id;

        setTrackInfo({
          id: newTrackId,
          title: playback.item.name,
          album: playback.item.album.name,
          artist: playback.item.album.artists[0].name,
          duration: playback.item.duration_ms,
          progress: playback.progress_ms,
          imageUrl: playback.item.album.images[0].b64,
          shuffle: playback.shuffle_state
        });
        setIsPlaying(playback.is_playing);
        const isLiked = await spotifyHandlerRef.current?.checkLiked(newTrackId) ?? false;
        setIsLiked(isLiked);

        if (isInitialFetch) { // Only set volume on initial fetch
          setVolume(playback.device.volume_percent);
        }

        if (newTrackId !== previousTrackId) {
          const image = new Image();
          image.src = playback.item.album.images[0].b64; // Assuming this is a base64 string
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

        setIsInitialFetch(false); // Mark initial fetch as complete
      }
      else {
        setTrackInfo({
          id: '',
          title: 'Unknown Title',
          album: 'Unknown Album',
          artist: 'Unknown Artist',
          duration: 0,
          progress: 0,
          imageUrl: './images/Igor.jpg',
          shuffle: false
        });
        setIsPlaying(false);
        setIsLiked(false);
      }
    } catch (error) {
      console.error('Error fetching current playback:', error);
    }
  };

  useEffect(() => {
    const buttonControl = ButtonControl; // Get the singleton instance

    const handleVolumeChange = (volumeDelta: number) => {
      setVolume(prevVolume => {
        const newVolume = Math.max(0, Math.min(100, prevVolume + volumeDelta));

        // Limit volume to 0-100 range, 200 is the max volume delta
        if ((prevVolume + newVolume) >= 200 && volumeDelta > 0) return 100;
        if ((prevVolume + newVolume) <= 0 && volumeDelta < 0) return 0
    
        spotifyHandlerRef.current?.volume(newVolume); // Send new volume to Spotify
        return newVolume; // Ensure immediate state update
      });
    };

    const removeVolumeListener = buttonControl.onVolumeChange(handleVolumeChange);
    const removeJamInitListener = buttonControl.onJamInit(handleJamInit); // Register handleJamInit
    
    return () => {
      removeVolumeListener(); // Clean up the listener on component unmount
      removeJamInitListener();
    };
  }, []);

  const toggleVisibleComponent = (component: string) => {
    setVisibleComponent(component);
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      await spotifyHandlerRef.current?.pause();
      await fetchCurrentPlayback();
      setIsPlaying(false);
    } else {
      await spotifyHandlerRef.current?.play();
      await fetchCurrentPlayback();
      setIsPlaying(true);
    }
  };

  const handleLikeToggle = async () => {
    try {
      const newLikeStatus = !isLiked;
      console.log('Toggling like status:', newLikeStatus);
      await spotifyHandlerRef.current?.likeSong(newLikeStatus);
      await fetchCurrentPlayback();
      setIsLiked(newLikeStatus);
    } catch (error) {
      console.error('Error toggling like status:', error);
    }
  };

  const handleNext = async () => {
    await spotifyHandlerRef.current?.next();
  };

  const lastPreviousPressRef = useRef<number | null>(null);

  const handlePrevious = async () => {
    const now = Date.now();
    if (lastPreviousPressRef.current && (now - lastPreviousPressRef.current) < 2000) {
      // If pressed again within 2000ms, go to the previous track
      await spotifyHandlerRef.current?.previous();
    } else {
      // Otherwise, seek to the start of the current track
      await spotifyHandlerRef.current?.seek(0);
    }
    lastPreviousPressRef.current = now;
  };

  const handleShuffleToggle = async () => {
    const newShuffleState = !trackInfo.shuffle;
    await spotifyHandlerRef.current?.shuffle(newShuffleState);
    setTrackInfo({ ...trackInfo, shuffle: newShuffleState });
  };

  const handleJamInit = async () => {
    try {
      toggleVisibleComponent('jam')
      const qrResponse = await spotifyHandlerRef.current?.getJamSession();
      let newQrCode = qrResponse
      if (typeof newQrCode === 'string') {
        setFetchedQrCode(newQrCode);
      } else {
        console.log(newQrCode);
        console.error('Unexpected response type for QR code');
      }
    } catch (error) {
      console.error('Error fetching jam session:', error);
    }
  };

  return (
    <div className="w-[800px] h-[480px] rounded-xl overflow-hidden flex flex-col justify-center relative"
    style={{ backgroundColor }}
    >
      <button
        onClick={async () => {
          await handleJamInit();
        }}
        className="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors"
        style={{backgroundColor}}
      >
        <Icons.QRCodeIcon className="w-8 h-8" />
      </button>

      <VolumeBar volume={volume} />

      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-6 pt-6 pl-8">
          <AlbumArt imageUrl={trackInfo.imageUrl} />
          <TrackInfo
            title={trackInfo.title}
            album={trackInfo.album}
            artist={trackInfo.artist}
          />
        </div>
      </div>

      <div className="mt-auto">
        <div className="px-8 pb-2">
          <ProgressBar
            currentTime={trackInfo.progress}
            totalTime={trackInfo.duration}
            isPlaying={isPlaying} // Pass isPlaying to ProgressBar
          />
        </div>
        <div className="h-px bg-white/10" />
        <PlaybackControls
          isPlaying={isPlaying}
          isLiked={isLiked}
          shuffle={trackInfo.shuffle}
          onPlayPause={handlePlayPause}
          onLikeToggle={handleLikeToggle}
          onNext={handleNext} // Add next handler
          onPrevious={handlePrevious} // Add previous handler
          onShuffleToggle={handleShuffleToggle} // Add shuffle handler
          backgroundColor={backgroundColor}
        />
      </div>

      {visibleComponent === 'jam' && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center">
          <Jam
            visible={true}
            fetchedQrCode={fetchedQrCode}
            setVisibleComponent={setVisibleComponent}
          />
        </div>
      )}
    </div>
  );
}

export default SpotifyApp;