import { DECKS } from "../data/decks";

type Props = { onClose: () => void };

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

export default function DashboardSheet({ onClose }: Props) {
  const best: Record<string, number> = JSON.parse(
    localStorage.getItem("kata.best") ?? "{}"
  );
  const stats = JSON.parse(
    localStorage.getItem("kata.stats") ?? '{"totalGames":0,"totalCards":0,"totalTime":0}'
  );
  const activity: Record<string, number> = JSON.parse(
    localStorage.getItem("kata.activity") ?? "{}"
  );

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const label = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
    return { key, label, count: activity[key] ?? 0 };
  });
  const maxDay = Math.max(...days.map((d) => d.count), 1);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Stats
          </span>
          <button
            onClick={onClose}
            className="text-xl leading-none text-neutral-400 hover:text-neutral-900"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-6 flex flex-col gap-6">
          {/* Stat tiles */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Cards", value: stats.totalCards },
              { label: "Games", value: stats.totalGames },
              { label: "Time",  value: formatTime(stats.totalTime) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-neutral-200 py-4">
                <div className="text-2xl font-semibold tabular-nums">{value}</div>
                <div className="mt-1 text-xs uppercase tracking-widest text-neutral-400">{label}</div>
              </div>
            ))}
          </div>

          {/* Per-deck progress */}
          <div className="flex flex-col gap-4">
            {DECKS.map((deck) => {
              const b = best[deck.id] ?? 0;
              const pct = deck.cards.length > 0 ? (b / deck.cards.length) * 100 : 0;
              return (
                <div key={deck.id}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium">{deck.emoji} {deck.title}</span>
                    <span className="tabular-nums text-neutral-400">{b} / {deck.cards.length}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-neutral-900 transition-[width] duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 7-day activity */}
          <div>
            <div className="mb-3 text-xs uppercase tracking-widest text-neutral-400">Last 7 days</div>
            <div className="flex gap-2">
              {days.map(({ key, label, count }) => (
                <div key={key} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-12 w-full items-end overflow-hidden rounded-md bg-neutral-100">
                    <div
                      className="w-full bg-neutral-900 transition-[height] duration-500"
                      style={{ height: `${(count / maxDay) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-neutral-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
