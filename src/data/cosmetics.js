export const cardThemes = [
  {
    id: "default",
    name: "Classic Green",
    background: "#1a3a2a",
    unlockCondition: "default",
    free: true
  },
  {
    id: "midnight",
    name: "Midnight Blue",
    background: "#0a1628",
    unlockCondition: "Reach Silver tier",
    requiresTier: "silver"
  },
  {
    id: "fire",
    name: "Fire",
    background: "#2a0a00",
    unlockCondition: "Achieve 30-day streak",
    requiresStreak: 30
  },
  {
    id: "golden",
    name: "Golden",
    background: "#2a1a00",
    unlockCondition: "Reach Gold tier",
    requiresTier: "gold"
  },
  {
    id: "elite-dark",
    name: "Elite Dark",
    background: "#1a0a2a",
    unlockCondition: "Reach Elite tier",
    requiresTier: "elite"
  },
  {
    id: "season1",
    name: "Monsoon Cup",
    background: "#001a2a",
    unlockCondition: "Complete Season 1",
    requiresSeasonLevel: 30
  }
];

export const cardBorders = [
  { id: "default", name: "None", style: "none", free: true },
  {
    id: "gold-solid",
    name: "Gold",
    style: "2px solid #f5a623",
    requiresTier: "gold"
  },
  {
    id: "elite-glow",
    name: "Elite Glow",
    style: "2px solid #b84fff",
    cssGlow: "0 0 8px #b84fff",
    requiresTier: "elite"
  },
  {
    id: "fire-animated",
    name: "Fire Border",
    style: "animated-fire-border",
    requiresStreak: 30
  },
  {
    id: "season1-border",
    name: "Season 1 Champion",
    style: "2px solid #00b4d8",
    requiresSeasonLevel: 30
  }
];

export const cardTitles = [
  {
    id: "iron-feet",
    name: "Iron Feet",
    unlockCondition: "500 lifetime juggling contacts"
  },
  {
    id: "consistent",
    name: "Consistent",
    unlockCondition: "30-day streak achieved"
  },
  {
    id: "comeback-kid",
    name: "Comeback Kid",
    unlockCondition: "Resume streak 3+ times"
  },
  {
    id: "early-bird",
    name: "Early Bird",
    unlockCondition: "10 sessions before 8am"
  },
  {
    id: "grassroots",
    name: "Grassroots",
    unlockCondition: "Among first 500 SportsHawk players"
  },
  {
    id: "monsoon-warrior",
    name: "Monsoon Warrior",
    unlockCondition: "Season 1 Level 1 reward"
  },
  {
    id: "season-veteran",
    name: "Season Veteran",
    unlockCondition: "Season 1 Level 10 reward"
  },
  {
    id: "juggling-master",
    name: "Juggling Master",
    unlockCondition: "Reach Master in Juggling skill"
  },
  {
    id: "unbeaten",
    name: "Unbeaten",
    unlockCondition: "Hold city #1 rank for 7 days"
  }
];
