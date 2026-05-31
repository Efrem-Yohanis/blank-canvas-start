import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, Download } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { recordChapterCompletion } from "@/lib/audio-progress";
import { audioService } from "@/services/api";

type Props = {
  bookId?: number;
  chapter: number;
  audioUrl?: string | null;
  language: string;
  hasNext: boolean;
  hasPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
  onCompleted?: (chapter: number) => void;
};

const INTENT_KEY = "audio.userIntentPlaying";

function readIntent(): boolean {
  try {
    return localStorage.getItem(INTENT_KEY) === "1";
  } catch {
    return false;
  }
}
function writeIntent(v: boolean) {
  try {
    localStorage.setItem(INTENT_KEY, v ? "1" : "0");
  } catch {}
}

function formatTime(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function ChapterAudioPlayer({
  bookId,
  chapter,
  audioUrl,
  language,
  hasNext,
  hasPrev,
  onNext,
  onPrev,
  onCompleted,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { user } = useAuth();
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const recordedRef = useRef<number | null>(null);
  const intentRef = useRef<boolean>(false);

  // Expose playing state globally so the auth layer can keep the session alive
  // while audio is playing (and skip auto-logout on transient 401s).
  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as any).__bibleAudioPlaying = playing;
    return () => {
      (window as any).__bibleAudioPlaying = false;
    };
  }, [playing]);

  // Initialize intent from storage once on mount only; do NOT auto-play on first chapter load.
  useEffect(() => {
    intentRef.current = readIntent();
  }, []);

  // On chapter/source change: reset, and only auto-play if the user is actively playing.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    setCurrent(0);
    setDuration(0);
    recordedRef.current = null;
    if (audioUrl) {
      el.load();
      if (intentRef.current) {
        el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      } else {
        setPlaying(false);
      }
    } else {
      setPlaying(false);
    }
  }, [audioUrl, chapter]);

  // Throttled position sync to backend while playing (every 10s)
  const lastSyncRef = useRef(0);
  useEffect(() => {
    if (!user || !bookId || !playing) return;
    const id = window.setInterval(() => {
      const el = audioRef.current;
      if (!el || el.paused) return;
      const pos = Math.floor(el.currentTime);
      if (pos === lastSyncRef.current) return;
      lastSyncRef.current = pos;
      audioService
        .updateProgress(bookId, { chapter_number: chapter, current_position: pos })
        .catch(() => {});
    }, 10000);
    return () => window.clearInterval(id);
  }, [user, bookId, chapter, playing]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el || !audioUrl) return;
    if (el.paused) {
      intentRef.current = true;
      writeIntent(true);
      el.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      intentRef.current = false;
      writeIntent(false);
      el.pause();
      setPlaying(false);
    }
  };

  const handleEnded = async () => {
    setPlaying(false);
    if (bookId && recordedRef.current !== chapter) {
      recordedRef.current = chapter;
      try {
        await recordChapterCompletion({
          bookId,
          chapter,
          language,
          isAuthenticated: !!user,
        });
        if (user) {
          audioService
            .updateProgress(bookId, { chapter_number: chapter, completed_chapter: chapter })
            .catch(() => {});
        }
        onCompleted?.(chapter);
      } catch {}
    }
    // Keep intent true so the next chapter auto-plays in a continuous listen session.
    if (hasNext && intentRef.current) onNext();
  };

  // If the user pauses via media keys / OS controls, respect that.
  const handleNativePause = () => {
    const el = audioRef.current;
    // Ignore the pause event that fires as part of natural end-of-track —
    // otherwise it would clear intent and break auto-advance to next chapter.
    if (el && el.ended) return;
    setPlaying(false);
    intentRef.current = false;
    writeIntent(false);
    if (user && bookId && el) {
      audioService
        .updateProgress(bookId, {
          chapter_number: chapter,
          current_position: Math.floor(el.currentTime),
        })
        .catch(() => {});
    }
  };
  const handleNativePlay = () => {
    setPlaying(true);
    intentRef.current = true;
    writeIntent(true);
  };

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current;
    if (!el) return;
    const v = Number(e.target.value);
    el.currentTime = v;
    setCurrent(v);
  };

  if (!audioUrl) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <Volume2 className="h-4 w-4" /> No audio available for this chapter.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onTimeUpdate={(e) => setCurrent((e.target as HTMLAudioElement).currentTime)}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
        onEnded={handleEnded}
        onPlay={handleNativePlay}
        onPause={handleNativePause}
      />
      <button
        onClick={onPrev}
        disabled={!hasPrev}
        aria-label="Previous chapter"
        className="rounded-full p-2 text-muted-foreground hover:bg-secondary disabled:opacity-30"
      >
        <SkipBack className="h-4 w-4" />
      </button>
      <button
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow hover:opacity-90"
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <button
        onClick={onNext}
        disabled={!hasNext}
        aria-label="Next chapter"
        className="rounded-full p-2 text-muted-foreground hover:bg-secondary disabled:opacity-30"
      >
        <SkipForward className="h-4 w-4" />
      </button>
      <div className="flex flex-1 items-center gap-2 text-xs tabular-nums text-muted-foreground">
        <span>{formatTime(current)}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={current}
          onChange={onSeek}
          className="h-1 flex-1 cursor-pointer accent-primary"
        />
        <span>{formatTime(duration)}</span>
      </div>
      <a
        href={audioUrl}
        download={`chapter-${chapter}.mp3`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Download audio"
        title="Download audio"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <Download className="h-4 w-4" />
      </a>
    </div>
  );
}
