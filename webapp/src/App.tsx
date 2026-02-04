import { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import SpotifyApp from './apps/Spotify/SpotifyApp';
import WeatherApp from './apps/Weather/WeatherApp';
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
            return 'spotify';
          default:
            return 'spotify';
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
      </div>
    </Router>
  );
}

export default App;