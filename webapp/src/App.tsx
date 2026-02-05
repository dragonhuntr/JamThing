import { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import NowPlayingApp from './apps/NowPlaying/NowPlayingApp';
import WeatherApp from './apps/Weather/WeatherApp';
import ButtonControls from './utils/buttonHelper';

function App() {
  const [currentView, setCurrentView] = useState('nowplaying');

  useEffect(() => {
    const unregister = ButtonControls.onToggleView(() => {
      setCurrentView(prevView => {
        switch (prevView) {
          case 'nowplaying':
            return 'weather';
          case 'weather':
            return 'nowplaying';
          default:
            return 'nowplaying';
        }
      });
    });
    return () => unregister();
  }, []);

  return (
    <Router>
      <div>
        <div style={{ display: currentView === 'nowplaying' ? 'block' : 'none' }}>
          <NowPlayingApp />
        </div>
        <div style={{ display: currentView === 'weather' ? 'block' : 'none' }}>
          <WeatherApp />
        </div>
      </div>
    </Router>
  );
}

export default App;