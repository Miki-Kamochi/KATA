import { DECKS, type Deck } from "../data/decks";

type Props = {
  onPick: (deck: Deck) => void;
};

// Vary book heights so the shelf looks natural, not uniform
const BOOK_HEIGHTS = ["h-36", "h-44", "h-40"];
const BOOK_WIDTHS  = ["w-14", "w-12", "w-16"];

export default function TopicSelect({ onPick }: Props) {
  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col px-6">
      <header className="pt-10 pb-16">
        <h1 className="text-6xl font-semibold tracking-tight">KATA</h1>
        <p className="mt-3 text-neutral-500">
          Your body is the controller. Act out the word to flip the card.
        </p>
      </header>

      {/* Books */}
      <div className="flex items-end gap-1.5">
        {DECKS.map((deck, i) => (
          <button
            key={deck.id}
            onClick={() => onPick(deck)}
            className={`${BOOK_HEIGHTS[i % BOOK_HEIGHTS.length]} ${BOOK_WIDTHS[i % BOOK_WIDTHS.length]} flex shrink-0 items-center justify-center rounded-t border-2 border-neutral-900 bg-white transition-transform duration-150 hover:-translate-y-2 active:scale-95`}
          >
            <span
              className="text-xs font-medium text-neutral-900"
              style={{ writingMode: "vertical-lr", transform: "rotate(180deg)" }}
            >
              {deck.title}
            </span>
          </button>
        ))}
      </div>

      {/* Shelf */}
      <div className="h-1 rounded-full bg-neutral-900" />
    </div>
  );
}
