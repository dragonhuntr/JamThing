import { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import SpotifyApp from './apps/Spotify/SpotifyApp';
import WeatherApp from './apps/Weather/WeatherApp';
import ButtonControls from './utils/buttonHelper'; // Import ButtonControls

function App() {
  const [currentView, setCurrentView] = useState('weather');

  // Function to toggle between 'weather' and 'spotify'
  const toggleView = () => {
    setCurrentView(prevView => (prevView === 'spotify' ? 'weather' : 'spotify'));
  };

  useEffect(() => {
    // Register the toggleView function with ButtonControls
    const unregister = ButtonControls.onToggleView(toggleView);
    return () => unregister(); // Cleanup on component unmount
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