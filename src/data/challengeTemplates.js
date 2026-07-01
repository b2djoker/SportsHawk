function getMidnight() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

export const challengeTemplates = [
  {
    id: "pb-juggling",
    title: "Beat Your Best",
    description: "Set a new personal best in juggling today",
    difficulty: "hard",
    reward: { coins: 80, label: "+80 coins" },
    expiresAt: getMidnight(),
    type: "personalBest",
    drill: "juggling",
    available: "daily",
    checkFn: (profile, todaySessions, sessionResult = {}) =>
      sessionResult.isPersonalBest === true ||
      todaySessions.some(
        (session) => session.drill === "juggling" && session.isPersonalBest
      )
  },
  {
    id: "juggle-15",
    title: "15 Juggles",
    description: "Record 15+ juggling contacts in one session",
    difficulty: "medium",
    reward: { coins: 50, label: "+50 coins" },
    expiresAt: getMidnight(),
    type: "target",
    drill: "juggling",
    target: 15,
    available: "daily",
    checkFn: (profile, todaySessions) =>
      todaySessions.some(
        (session) => session.drill === "juggling" && session.totalContacts >= 15
      )
  },
  {
    id: "juggle-20",
    title: "20 Juggles",
    description: "Record 20+ juggling contacts",
    difficulty: "medium",
    reward: { coins: 70, label: "+70 coins" },
    expiresAt: getMidnight(),
    type: "target",
    drill: "juggling",
    target: 20,
    available: "daily",
    checkFn: (profile, todaySessions) =>
      todaySessions.some(
        (session) => session.drill === "juggling" && session.totalContacts >= 20
      )
  },
  {
    id: "juggle-25",
    title: "Elite Juggler",
    description: "Record 25+ juggling contacts — top 10% territory",
    difficulty: "hard",
    reward: {
      coins: 100,
      streakFreeze: 1,
      label: "+100 coins + Streak Freeze"
    },
    expiresAt: getMidnight(),
    type: "target",
    drill: "juggling",
    target: 25,
    available: "daily",
    checkFn: (profile, todaySessions) =>
      todaySessions.some(
        (session) => session.drill === "juggling" && session.totalContacts >= 25
      )
  },
  {
    id: "any-session",
    title: "Just Show Up",
    description: "Complete any drill session today",
    difficulty: "easy",
    reward: { coins: 30, label: "+30 coins" },
    expiresAt: getMidnight(),
    type: "volume",
    target: 1,
    available: "daily",
    checkFn: (profile, todaySessions) => todaySessions.length >= 1
  },
  {
    id: "two-sessions",
    title: "Double Training",
    description: "Complete 2 drill sessions today",
    difficulty: "medium",
    reward: { coins: 60, label: "+60 coins" },
    expiresAt: getMidnight(),
    type: "volume",
    target: 2,
    available: "daily",
    checkFn: (profile, todaySessions) => todaySessions.length >= 2
  },
  {
    id: "keep-streak",
    title: "Streak Day",
    description: "Train today to keep your streak alive",
    difficulty: "easy",
    reward: { coins: 40, label: "+40 coins" },
    expiresAt: getMidnight(),
    type: "streak",
    available: "daily",
    checkFn: (profile) => Number(profile.streakCount ?? profile.streak) > 0
  },
  {
    id: "community-50",
    title: "Community Day 🌍",
    description: "If 50 players train today, everyone gets 2x coins",
    difficulty: "community",
    reward: { coinMultiplier: 2.0, label: "2x coins all day" },
    expiresAt: getMidnight(),
    type: "community",
    target: 50,
    communityTarget: 50,
    available: "daily"
  },
  {
    id: "weekly-5sessions",
    title: "Complete 5 sessions this week",
    description: "Train five times between Monday and Sunday",
    difficulty: "weekly",
    reward: { coins: 180, label: "+180 coins" },
    type: "weekly",
    available: "weekly",
    checkFn: (profile, weekSessions) => weekSessions.length >= 5
  },
  {
    id: "weekly-pb",
    title: "Set a personal best this week",
    description: "Beat your best score in any drill this week",
    difficulty: "weekly",
    reward: { coins: 150, label: "+150 coins" },
    type: "weekly",
    available: "weekly",
    checkFn: (profile, weekSessions) =>
      weekSessions.some((session) => session.isPersonalBest)
  },
  {
    id: "weekly-5day-streak",
    title: "Train 5 days in a row this week",
    description: "Build a five-day streak before Monday reset",
    difficulty: "weekly",
    reward: { coins: 200, label: "+200 coins" },
    type: "weekly",
    available: "weekly",
    checkFn: (profile) => Number(profile.streakCount ?? profile.streak) >= 5
  }
];
