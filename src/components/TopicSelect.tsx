import { DECKS, type Deck } from "../data/decks";

type Props = {
  onPick: (deck: Deck) => void;
};

export default function TopicSelect({ onPick }: Props) {
  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col px-6">
      <header className="pt-10 pb-8">
        <h1 className="text-6xl font-semibold tracking-tight">KATA</h1>
        <p className="mt-3 text-neutral-500">
          Your body is the controller. Act out the word to flip the card.
        </p>
      </header>

      <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
        Topics
      </div>

      <div className="mt-2 border-t border-neutral-200">
        {DECKS.map((deck) => (
          <button
            key={deck.id}
            onClick={() => onPick(deck)}
            className="group flex w-full items-baseline justify-between gap-6 border-b border-neutral-200 py-6 text-left"
          >
            <span>
              <span className="block text-2xl font-medium tracking-tight">
                {deck.title}
              </span>
              <span className="mt-1 block text-sm text-neutral-500">
                {deck.description}
              </span>
            </span>
            <span className="flex shrink-0 items-baseline gap-4 text-neutral-400">
              <span className="text-sm tabular-nums">{deck.cards.length}</span>
              <span className="text-xl transition-transform duration-200 group-hover:translate-x-1">
                →
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
