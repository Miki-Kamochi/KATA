import { useEffect } from "react";
import type { Deck } from "../data/decks";

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

type Props = {
  deck: Deck;
  score: number;
  elapsed: number;
  best: number;
  onReplay: () => void;
  onHome: () => void;
};

export default function ResultScreen({
  deck,
  score,
  elapsed,
  best,
  onReplay,
  onHome,
}: Props) {
  const total = deck.cards.length;
  const isBest = score >= best;

  useEffect(() => {
    // nothing yet — placeholder for a future celebratory effect
  }, []);

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col justify-center px-6">
      <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
        {deck.title}
      </div>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">
        Deck complete
      </h1>

      <div className="mt-12 flex items-end gap-12">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
            Score
          </div>
          <div className="mt-1 text-6xl font-semibold tabular-nums tracking-tight">
            {score}
            <span className="text-2xl text-neutral-400">/{total}</span>
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
            Time
          </div>
          <div className="mt-1 text-6xl font-semibold tabular-nums tracking-tight">
            {formatTime(elapsed)}
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-neutral-500">
        {isBest ? "New best" : `Best ${best}/${total}`}
      </div>

      <div className="mt-12 flex gap-3">
        <button
          onClick={onReplay}
          className="rounded-lg bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Play again
        </button>
        <button
          onClick={onHome}
          className="rounded-lg border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-900 hover:border-neutral-900"
        >
          Home
        </button>
      </div>
    </div>
  );
}
