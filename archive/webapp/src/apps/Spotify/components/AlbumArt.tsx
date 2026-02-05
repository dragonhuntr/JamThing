interface AlbumArtProps {
  imageUrl: string;
}

export function AlbumArt({ imageUrl }: AlbumArtProps) {
  return (
    <div className="w-[250px] h-[250px] shrink-0">
      <img 
        src={imageUrl}
        className="w-full h-full object-cover rounded-lg"
      />
    </div>
  );
}