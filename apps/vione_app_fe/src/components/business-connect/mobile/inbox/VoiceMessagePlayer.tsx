import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, Sparkles } from "lucide-react";

interface VoiceMessagePlayerProps {
  url: string;
  duration?: number;
  fromMe?: boolean;
}

export function VoiceMessagePlayer({ url, duration: initialDuration, fromMe }: VoiceMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(Math.round(audio.duration));
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(Math.round(audio.currentTime));
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const toggleSpeed = () => {
    const nextSpeed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Waveform bars simulation
  const waveBars = [35, 65, 90, 45, 80, 50, 95, 70, 40, 60, 85, 30, 75, 90, 55, 40, 70, 85, 60, 45];

  return (
    <div className="flex items-center gap-3 p-3 select-none">
      <audio ref={audioRef} src={url} preload="metadata" />

      {/* Play / Pause Circular Button */}
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? "Tạm dừng" : "Phát tin nhắn thoại"}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all cursor-pointer shadow-md ${
          fromMe
            ? "bg-black text-[#F7D896] hover:bg-black/90 active:scale-95"
            : "bg-gradient-to-br from-[#F7D896] to-[#C49338] text-slate-950 hover:scale-105 active:scale-95"
        }`}
      >
        {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
      </button>

      {/* Waveform & Progress Track */}
      <div className="flex-1 min-w-[130px] space-y-1.5">
        <div className="flex items-center gap-1 h-6 cursor-pointer" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickPos = (e.clientX - rect.left) / rect.width;
          if (audioRef.current && duration > 0) {
            audioRef.current.currentTime = clickPos * duration;
            setCurrentTime(clickPos * duration);
          }
        }}>
          {waveBars.map((height, i) => {
            const barProgress = (i / waveBars.length) * 100;
            const isPassed = barProgress <= progressPercent;
            return (
              <div
                key={i}
                style={{ height: `${height}%` }}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isPassed
                    ? fromMe
                      ? "bg-slate-900"
                      : "bg-[#D8B282]"
                    : fromMe
                      ? "bg-black/25"
                      : "bg-slate-300 dark:bg-slate-700"
                } ${isPlaying && isPassed ? "animate-pulse" : ""}`}
              />
            );
          })}
        </div>

        {/* Timers & Speed toggle */}
        <div className="flex items-center justify-between text-[10.5px] font-mono leading-none">
          <span className={fromMe ? "text-slate-900/80 font-semibold" : "text-slate-500 dark:text-slate-400"}>
            {formatTime(currentTime || duration)}
          </span>

          <div className="flex items-center gap-2">
            <span className={`text-[9.5px] uppercase font-bold flex items-center gap-0.5 ${fromMe ? "text-slate-900/60" : "text-amber-500/80"}`}>
              <Volume2 className="w-3 h-3" /> Voice
            </span>
            <button
              type="button"
              onClick={toggleSpeed}
              className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold cursor-pointer transition-colors ${
                fromMe
                  ? "bg-black/10 hover:bg-black/20 text-slate-950"
                  : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
              }`}
            >
              {speed}x
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
