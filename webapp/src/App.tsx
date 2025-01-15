import { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import SpotifyApp from './apps/Spotify/SpotifyApp';
import WeatherApp from './apps/Weather/WeatherApp';
import StatsApp from './apps/Stats/StatsApp';
import ButtonControls from './utils/buttonHelper';

function App() {
  const [currentView, setCurrentView] = useState('spotify');

  useEffect(() => {
    const unregister = ButtonControls.onToggleView(() => {
      setCurrentView(prevView => {
        switch (prevView) {
          case 'spotify':
            return 'weather';
          case 'weather':
            return 'stats';
          case 'stats':
            return 'spotify';
          default:
            return 'stats';
        }
      });
    });
    return () => unregister();
  }, []);

  return (
    <Router>
      <div>
        <div style={{ display: currentView === 'spotify' ? 'block' : 'none' }}>
          <SpotifyApp />
        </div>
        <div style={{ display: currentView === 'weather' ? 'block' : 'none' }}>
          <WeatherApp />
        </div>
        <div style={{ display: currentView === 'stats' ? 'block' : 'none' }}>
          <StatsApp />
        </div>
      </div>
    </Router>
  );
}

export default App;