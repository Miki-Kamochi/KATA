// A single vocabulary card. `motion` must exactly match a Teachable Machine
// class name in the deck's exported model (besides the reserved "idle" class).
export type Card = {
  word: string;
  motion: string;
  hint: string;
};

export type Deck = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  // Folder under /public/models/<id>/ holding model.json, metadata.json, weights.bin.
  // Until the real model is trained, the app falls back to the mock classifier.
  modelPath: string;
  cards: Card[];
};

// The reserved neutral class every model must include so the app does not
// false-trigger while the player is standing still.
export const IDLE_CLASS = "idle";

export const DECKS: Deck[] = [
  {
    id: "directions",
    title: "Directions",
    description: "Point your way through left, right, up and forward.",
    emoji: "🧭",
    modelPath: "/models/directions/",
    cards: [
      { word: "Left",    motion: "left",    hint: "Extend your left arm to the left" },
      { word: "West",    motion: "left",    hint: "Extend your left arm — West on a map" },
      { word: "Right",   motion: "right",   hint: "Extend your right arm to the right" },
      { word: "East",    motion: "right",   hint: "Extend your right arm — East on a map" },
      { word: "Up",      motion: "up",      hint: "Raise your arms upward" },
      { word: "Above",   motion: "up",      hint: "Raise both arms upward" },
      { word: "North",   motion: "up",      hint: "Point up — North on a compass" },
      { word: "Forward", motion: "forward", hint: "Push both arms straight forward" },
      { word: "Ahead",   motion: "forward", hint: "Push both arms forward" },
    ],
  },
  {
    id: "body-parts",
    title: "Body Parts",
    description: "Touch your head, shoulders, knees and toes.",
    emoji: "🦴",
    modelPath: "/models/body-parts/",
    cards: [
      { word: "Head",     motion: "head",     hint: "Touch or point to your head" },
      { word: "Face",     motion: "head",     hint: "Point to your face" },
      { word: "Forehead", motion: "head",     hint: "Touch your forehead" },
      { word: "Shoulders", motion: "shoulder", hint: "Touch your shoulders" },
      { word: "Neck",     motion: "shoulder", hint: "Touch the side of your neck" },
      { word: "Knees",    motion: "knees",    hint: "Bend down and touch your knees" },
      { word: "Kneecap",  motion: "knees",    hint: "Tap your kneecap" },
      { word: "Toes",     motion: "toes",     hint: "Reach down and touch your toes" },
      { word: "Foot",     motion: "toes",     hint: "Look down at your foot" },
    ],
  },
  {
    id: "action-verbs",
    title: "Action Verbs",
    description: "Act out everyday actions with your whole body.",
    emoji: "🏃",
    modelPath: "/models/action-verbs/",
    cards: [
      { word: "Throw", motion: "throw", hint: "Make a throwing gesture" },
      { word: "Clap", motion: "clap", hint: "Clap your hands together" },
      { word: "Wave", motion: "wave", hint: "Wave your hand side to side" },
    ],
  },
];

export function getDeck(id: string): Deck | undefined {
  return DECKS.find((d) => d.id === id);
}
