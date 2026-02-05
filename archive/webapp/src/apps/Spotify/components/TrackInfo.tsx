interface TrackInfoProps {
  title: string;
  album: string;
  artist: string;
}

export function TrackInfo({ title, album, artist }: TrackInfoProps) {
  const maxLength = 30; // change as needed
  const minFontSize = 36;
  const maxFontSize = 60;

  const truncateText = (text: string) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const calculateFontSize = (text: string, baseSize: number) => {
    const scaleFactor = 0.2; // Adjust this factor to control scaling sensitivity
    const fontSize = Math.max(minFontSize, Math.min(maxFontSize, baseSize - text.length * scaleFactor));
    return fontSize;
  };

  const titleFontSize = calculateFontSize(title, 80);
  const albumFontSize = Math.min(titleFontSize * 0.5, calculateFontSize(album, 20)); // Reduced to 70% of titleFontSize
  const artistFontSize = Math.min(titleFontSize * 0.5, calculateFontSize(artist, 24)); // Reduced to 70% of titleFontSize

  return (
    <div className="text-white pl-6 pr-5">
      <div
        className="font-normal mb-1 opacity-40"
        style={{ fontSize: `${albumFontSize}px` }}
      >
        {truncateText(album)}
      </div>
      <h1
        className="leading-[1.1] font-bold mb-2"
        style={{ fontSize: `${titleFontSize}px` }}
      >
        {truncateText(title)}
      </h1>
      <div
        className="opacity-75"
        style={{ fontSize: `${artistFontSize}px` }}
      >
        {truncateText(artist)}
      </div>
    </div>
  );
}