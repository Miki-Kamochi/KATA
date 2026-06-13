import { useEffect, useMemo, useRef, useState } from "react";
import type { Deck } from "../data/decks";
import { usePoseClassifier } from "../hooks/usePoseClassifier";
import { MotionMatcher } from "../game/matcher";
import WebcamView from "./WebcamView";

type Props = {
  deck: Deck;
  onFinish: (score: number, elapsed: number) => void;
  onQuit: () => void;
};

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function GameScreen({ deck, onFinish, onQuit }: Props) {
  const [cardIndex, setCardIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [progress, setProgress] = useState(0);
  const [justCleared, setJustCleared] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const gameOverRef = useRef(false);

  const { videoRef, canvasRef, ready, isMock, prediction, allPredictions, error, simulate } =
    usePoseClassifier(deck.modelPath);

  const card = deck.cards[cardIndex];
  const matcher = useMemo(() => new MotionMatcher(card.motion), []); // eslint-disable-line react-hooks/exhaustive-deps

  // Point the matcher at each new card.
  useEffect(() => {
    matcher.setTarget(card.motion);
    setProgress(0);
  }, [card.motion, matcher]);

  // Stopwatch — starts when camera is ready, stops when deck is complete.
  useEffect(() => {
    if (!ready || gameOverRef.current) return;
    const id = window.setTimeout(() => setElapsed((t) => t + 1), 1000);
    return () => window.clearTimeout(id);
  }, [ready, elapsed]);

  // Guard so the brief "cleared" animation can't double-advance.
  const advancingRef = useRef(false);

  // Feed every prediction frame into the matcher.
  useEffect(() => {
    if (!ready || advancingRef.current) return;

    const matched = matcher.push(allPredictions);
    setProgress(matcher.progress);

    if (matched) {
      advancingRef.current = true;
      setJustCleared(true);
      setScore((s) => s + 1);

      window.setTimeout(() => {
        setJustCleared(false);
        advancingRef.current = false;
        if (cardIndex + 1 >= deck.cards.length) {
          gameOverRef.current = true;
          onFinish(score + 1, elapsed);
        } else {
          setCardIndex((i) => i + 1);
        }
      }, 700);
    }
  }, [allPredictions, ready, matcher, cardIndex, deck.cards.length, onFinish, score]);

  const matchesTarget = prediction.topClass === card.motion;

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col gap-6 px-6 py-6">
      {/* Top bar */}
      <div className="flex items-center justify-between text-sm text-neutral-400">
        <button
          onClick={onQuit}
          className="-ml-1 px-1 hover:text-neutral-900"
        >
          Quit
        </button>
        <div className="text-2xl font-medium tabular-nums tracking-tight text-neutral-900">
          {formatTime(elapsed)}
        </div>
        <div className="tabular-nums">
          {cardIndex + 1} / {deck.cards.length}
        </div>
      </div>

      {/* Word card */}
      <div
        className={`rounded-lg py-12 text-center transition-all duration-300 ${
          justCleared
            ? "scale-[1.02] bg-neutral-900 text-white"
            : "text-neutral-900"
        }`}
      >
        <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
          Act it out
        </div>
        <div className="mt-3 text-6xl font-semibold tracking-tight">
          {card.word}
        </div>
        <div
          className={`mt-3 text-sm ${
            justCleared ? "text-neutral-300" : "text-neutral-500"
          }`}
        >
          {card.hint}
        </div>
      </div>

      <WebcamView videoRef={videoRef} canvasRef={canvasRef} />

      {/* Confidence / progress bar */}
      <div>
        <div className="mb-2 flex justify-between text-xs text-neutral-400">
          <span>
            Detecting{" "}
            <span className={matchesTarget ? "font-medium text-neutral-900" : ""}>
              {prediction.topClass}
            </span>{" "}
            ({Math.round(prediction.probability * 100)}%)
          </span>
          <span className="tabular-nums">{Math.round(progress * 100)}%</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-neutral-900 transition-[width] duration-100"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Debug: all class probabilities */}
      {ready && !isMock && allPredictions.length > 0 && (
        <div className="border-t border-neutral-200 pt-4">
          <div className="mb-3 text-xs uppercase tracking-[0.2em] text-neutral-400">
            Live predictions
          </div>
          <div className="flex flex-col gap-1.5">
            {[...allPredictions]
              .sort((a, b) => b.probability - a.probability)
              .map((p) => (
                <div key={p.className} className="flex items-center gap-3 text-xs">
                  <span
                    className={`w-16 shrink-0 text-right font-mono ${
                      p.className === card.motion
                        ? "font-medium text-neutral-900"
                        : "text-neutral-400"
                    }`}
                  >
                    {p.className}
                  </span>
                  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200">
                    <div
                      className={`h-full rounded-full transition-[width] duration-100 ${
                        p.className === card.motion ? "bg-neutral-900" : "bg-neutral-300"
                      }`}
                      style={{ width: `${p.probability * 100}%` }}
                    />
                  </div>
                  <span className="w-9 shrink-0 text-right tabular-nums text-neutral-400">
                    {Math.round(p.probability * 100)}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Status / mock controls */}
      {!ready && !error && (
        <p className="text-center text-sm text-neutral-400">Starting camera…</p>
      )}
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
      {ready && isMock && (
        <div className="border-t border-neutral-200 pt-4 text-center">
          <p className="text-xs text-neutral-500">
            No trained model found — running in mock mode.
          </p>
          <button
            onClick={() => simulate(card.motion)}
            className="mt-3 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Simulate “{card.word}”
          </button>
        </div>
      )}
    </div>
  );
}
