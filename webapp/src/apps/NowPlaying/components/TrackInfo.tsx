interface TrackInfoProps {
  title: string;
  artist: string;
}

export function TrackInfo({ title, artist }: TrackInfoProps) {
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

  const titleFontSize = calculateFontSize(title, 100);
  const artistFontSize = Math.min(titleFontSize * 0.5, calculateFontSize(artist, 24));

  return (
    <div className="text-white pl-6 pr-5">
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