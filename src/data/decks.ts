export type Lang = "en" | "zh" | "ja";

// A single vocabulary card. `motion` must exactly match a Teachable Machine
// class name in the deck's exported model (besides the reserved "idle" class).
// `word`/`hint` are the English base; `i18n` holds optional translations.
export type Card = {
  word: string;
  motion: string;
  hint: string;
  i18n?: {
    zh?: { word: string; hint: string };
    ja?: { word: string; hint: string };
  };
};

/** Resolve a card's word + hint for a language, falling back to English. */
export function cardText(card: Card, lang: Lang): { word: string; hint: string } {
  if (lang === "en") return { word: card.word, hint: card.hint };
  const t = card.i18n?.[lang];
  return { word: t?.word ?? card.word, hint: t?.hint ?? card.hint };
}

export type Difficulty = "Easy" | "Medium" | "Hard";

export type Deck = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  difficulty: Difficulty;
  popularity: number;
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
    emoji: "",
    difficulty: "Easy",
    popularity: 1243,
    modelPath: "/models/directions/",
    cards: [
      { word: "Left",    motion: "left",    hint: "Extend your left arm to the left",
        i18n: { zh: { word: "左", hint: "向左伸出你的左臂" }, ja: { word: "左", hint: "左腕を左に伸ばす" } } },
      { word: "West",    motion: "left",    hint: "Extend your left arm — West on a map",
        i18n: { zh: { word: "西", hint: "伸出左臂——地图上的西方" }, ja: { word: "西", hint: "左腕を伸ばす——地図の西" } } },
      { word: "Right",   motion: "right",   hint: "Extend your right arm to the right",
        i18n: { zh: { word: "右", hint: "向右伸出你的右臂" }, ja: { word: "右", hint: "右腕を右に伸ばす" } } },
      { word: "East",    motion: "right",   hint: "Extend your right arm — East on a map",
        i18n: { zh: { word: "东", hint: "伸出右臂——地图上的东方" }, ja: { word: "東", hint: "右腕を伸ばす——地図の東" } } },
      { word: "Up",      motion: "up",      hint: "Raise your arms upward",
        i18n: { zh: { word: "上", hint: "向上举起你的手臂" }, ja: { word: "上", hint: "腕を上に上げる" } } },
      { word: "Above",   motion: "up",      hint: "Raise both arms upward",
        i18n: { zh: { word: "上方", hint: "双臂向上举起" }, ja: { word: "上に", hint: "両腕を上に上げる" } } },
      { word: "North",   motion: "up",      hint: "Point up — North on a compass",
        i18n: { zh: { word: "北", hint: "向上指——指南针上的北方" }, ja: { word: "北", hint: "上を指す——方位の北" } } },
      { word: "Forward", motion: "forward", hint: "Push both arms straight forward",
        i18n: { zh: { word: "前进", hint: "双臂笔直向前推" }, ja: { word: "前", hint: "両腕をまっすぐ前に押し出す" } } },
      { word: "Ahead",   motion: "forward", hint: "Push both arms forward",
        i18n: { zh: { word: "向前", hint: "双臂向前推" }, ja: { word: "前方", hint: "両腕を前に押し出す" } } },
    ],
  },
  {
    id: "body-parts",
    title: "Body Parts",
    description: "Touch your head, shoulders, knees and toes.",
    emoji: "",
    difficulty: "Medium",
    popularity: 867,
    modelPath: "/models/body-parts/",
    cards: [
      { word: "Head",     motion: "head",     hint: "Touch or point to your head",
        i18n: { zh: { word: "头", hint: "触摸或指向你的头" }, ja: { word: "頭", hint: "頭に触れる、または指す" } } },
      { word: "Face",     motion: "head",     hint: "Point to your face",
        i18n: { zh: { word: "脸", hint: "指向你的脸" }, ja: { word: "顔", hint: "顔を指す" } } },
      { word: "Forehead", motion: "head",     hint: "Touch your forehead",
        i18n: { zh: { word: "额头", hint: "触摸你的额头" }, ja: { word: "額", hint: "額に触れる" } } },
      { word: "Shoulders", motion: "shoulder", hint: "Touch your shoulders",
        i18n: { zh: { word: "肩膀", hint: "触摸你的肩膀" }, ja: { word: "肩", hint: "肩に触れる" } } },
      { word: "Neck",     motion: "shoulder", hint: "Touch the side of your neck",
        i18n: { zh: { word: "脖子", hint: "触摸你的脖子侧面" }, ja: { word: "首", hint: "首の横に触れる" } } },
      { word: "Knees",    motion: "knees",    hint: "Bend down and touch your knees",
        i18n: { zh: { word: "膝盖", hint: "弯下身触摸你的膝盖" }, ja: { word: "膝", hint: "かがんで膝に触れる" } } },
      { word: "Kneecap",  motion: "knees",    hint: "Tap your kneecap",
        i18n: { zh: { word: "膝盖骨", hint: "轻拍你的膝盖骨" }, ja: { word: "膝の皿", hint: "膝の皿を軽くたたく" } } },
      { word: "Toes",     motion: "toes",     hint: "Reach down and touch your toes",
        i18n: { zh: { word: "脚趾", hint: "弯下身触摸你的脚趾" }, ja: { word: "つま先", hint: "かがんでつま先に触れる" } } },
      { word: "Foot",     motion: "toes",     hint: "Look down at your foot",
        i18n: { zh: { word: "脚", hint: "低头看你的脚" }, ja: { word: "足", hint: "足を見下ろす" } } },
    ],
  },
  {
    id: "yoga-poses",
    title: "Yoga Poses",
    description: "Hold yoga poses to unlock each card — warrior, mountain, star and more.",
    emoji: "",
    difficulty: "Medium",
    popularity: 634,
    modelPath: "/models/yoga-poses/",
    cards: [
      { word: "Cross",    motion: "t_pose",       hint: "Stretch both arms straight out to the sides",
        i18n: { zh: { word: "十字", hint: "双臂向两侧伸直" }, ja: { word: "十字", hint: "両腕を横に伸ばす" } } },
      { word: "T-Pose",   motion: "t_pose",       hint: "Stand tall, arms out like a T",
        i18n: { zh: { word: "T形", hint: "站立，双臂如T字展开" }, ja: { word: "Tポーズ", hint: "Tの字のように両腕を広げて立つ" } } },
      { word: "Reach",    motion: "hands_up",     hint: "Stretch both arms high above your head",
        i18n: { zh: { word: "伸展", hint: "双臂高举过头" }, ja: { word: "伸ばす", hint: "両腕を頭の上に伸ばす" } } },
      { word: "Mountain", motion: "hands_up",     hint: "Stand tall, arms raised like a mountain peak",
        i18n: { zh: { word: "山", hint: "站直，双臂高举如山峰" }, ja: { word: "山", hint: "両腕を高く上げて山のように立つ" } } },
      { word: "Bow",      motion: "forward_fold", hint: "Fold forward, hands reaching toward the floor",
        i18n: { zh: { word: "鞠躬", hint: "向前弯腰，双手伸向地板" }, ja: { word: "お辞儀", hint: "前に倒れ、手を床に向ける" } } },
      { word: "Fold",     motion: "forward_fold", hint: "Bend forward at the hips, arms hang down",
        i18n: { zh: { word: "折叠", hint: "从臀部向前弯曲，双臂自然下垂" }, ja: { word: "前屈", hint: "腰から前に曲げ、腕を下げる" } } },
      { word: "Star",     motion: "star",         hint: "Stand wide, arms and legs spread like a star",
        i18n: { zh: { word: "星星", hint: "双腿分开，双臂伸展如星形" }, ja: { word: "星", hint: "足を広げ、手足を星のように広げる" } } },
      { word: "Warrior",  motion: "lunge",        hint: "Step one foot forward, arms out wide",
        i18n: { zh: { word: "战士", hint: "一脚向前跨，双臂展开" }, ja: { word: "戦士", hint: "片足を前に出し、両腕を広げる" } } },
      { word: "Lunge",    motion: "lunge",        hint: "Step into a deep forward lunge",
        i18n: { zh: { word: "弓步", hint: "迈入深蹲弓步" }, ja: { word: "ランジ", hint: "大きく前に踏み出す" } } },
    ],
  },
];

export function getDeck(id: string): Deck | undefined {
  return DECKS.find((d) => d.id === id);
}
