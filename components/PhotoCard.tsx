"use client";

import Image from "next/image";

interface Photo {
  id: string;
  url: string;
  label?: string | null;
}

interface PhotoCardProps {
  photo: Photo;
  onClick: (id: string) => void;
  disabled?: boolean;
  winner?: boolean;
  loser?: boolean;
}

export default function PhotoCard({ photo, onClick, disabled, winner, loser }: PhotoCardProps) {
  return (
    <button
      onClick={() => onClick(photo.id)}
      disabled={disabled}
      className={`
        relative group w-full aspect-square max-w-lg rounded-2xl overflow-hidden
        transition-all duration-300 outline-none focus-visible:ring-4 focus-visible:ring-rose-500
        ${disabled ? "cursor-default" : "cursor-pointer hover:scale-[1.02] hover:shadow-2xl hover:shadow-rose-900/30"}
        ${winner ? "ring-4 ring-rose-500 scale-[1.02]" : ""}
        ${loser ? "opacity-40" : ""}
      `}
    >
      <Image
        src={photo.url}
        alt={photo.label ?? "Photo"}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      <div
        className={`
          absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent
          transition-opacity duration-200
          ${disabled ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
        `}
      />
      {photo.label && (
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-white font-semibold text-lg drop-shadow">{photo.label}</p>
        </div>
      )}
      {winner && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-sm font-bold px-4 py-1 rounded-full shadow-lg">
          Winner!
        </div>
      )}
    </button>
  );
}
