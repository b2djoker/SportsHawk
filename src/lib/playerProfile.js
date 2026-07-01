import { skillNodes } from "../data/skillTree.js";
import { cardBorders, cardThemes, cardTitles } from "../data/cosmetics.js";
import { mockPlayers } from "../data/mockPlayers.js";
import { leagues } from "../data/seasons.js";
import {
  assignRival,
  buildRivalProfilePatch,
  updateRivalAfterScore
} from "./rivals.js";

const STORAGE_KEY = "sportshawk_player_profile";

export const defaultPlayerProfile = {
  name: "New Player",
  age: "",
  position: "Position pending",
  city: "City pending",
  photoUrl: "",
  subscriptionTier: "Free",
  streakCount: 0,
  streak: 0,
  coinBalance: 0,
  coins: 0,
  coinEarnings: [],
  coinSpendHistory: [],
  transactionHistory: [],
  redemptionHistory: [],
  tripodReceived: false,
  totalPoints: 0,
  weeklyPts: 0,
  sessionsCompleted: 0,
  lastWeekStats: null,
  weeklyReport: null,
  weekStartDate: null,
  tierLevel: "Bronze",
  currentLeague: "grassroots-3",
  seasonPoints: 0,
  leagueHistory: [],
  promotionPending: false,
  relegationPending: false,
  rankDivision: "bronze-3",
  rankPoints: 0,
  rankHistory: [],
  lastRankDecayCheck: "",
  lastSessionDate: "",
  lastRankEvent: null,
  bestStreakCount: 0,
  assessmentBooking: null,
  drillHistory: [],
  skillProgress: {},
  lastSkillEvents: [],
  cardTheme: "default",
  cardBadge: null,
  cardBorder: "default",
  cardTitle: null,
  cardEmoji: null,
  unlockedCardTitles: [],
  earlyBirdSessions: 0,
  comebackStarts: 0,
  creationOrder: null,
  seasonLevel: 0,
  streakFreezes: 0,
  streakFreezeUsedDates: [],
  lastStreakCheckDate: null,
  lastStreakFreezeEvent: null,
  rivalId: null,
  rivalName: null,
  rivalCity: null,
  rivalWeeklyPts: null,
  rivalAssignedAt: null,
  rivalsOvercome: 0,
  lastRivalEvent: null,
  lastWeeklyResetDate: null,
  matchmaking: {
    optedIn: false,
    incomingInterests: [],
    acceptedConnections: [],
    declinedCoaches: [],
    guardianEmail: null,
    guardianApproved: {}
  }
};

export const subscriptions = {
  Free: {
    name: "Free",
    price: "₹0/month",
    rank: 0
  },
  Pro: {
    name: "Pro",
    price: "₹149/month",
    rank: 1
  },
  Elite: {
    name: "Elite",
    price: "₹499/month",
    rank: 2
  }
};

export const rankDivisions = [
  { id: "bronze-3", label: "Bronze 3", family: "Bronze", color: "#cd7f32" },
  { id: "bronze-2", label: "Bronze 2", family: "Bronze", color: "#cd7f32" },
  { id: "bronze-1", label: "Bronze 1", family: "Bronze", color: "#cd7f32" },
  { id: "silver-3", label: "Silver 3", family: "Silver", color: "#c0c0c0" },
  { id: "silver-2", label: "Silver 2", family: "Silver", color: "#c0c0c0" },
  { id: "silver-1", label: "Silver 1", family: "Silver", color: "#c0c0c0" },
  { id: "gold-3", label: "Gold 3", family: "Gold", color: "#f5a623" },
  { id: "gold-2", label: "Gold 2", family: "Gold", color: "#f5a623" },
  { id: "gold-1", label: "Gold 1", family: "Gold", color: "#f5a623" },
  { id: "platinum-3", label: "Platinum 3", family: "Platinum", color: "#00b4d8" },
  { id: "platinum-2", label: "Platinum 2", family: "Platinum", color: "#00b4d8" },
  { id: "platinum-1", label: "Platinum 1", family: "Platinum", color: "#00b4d8" },
  { id: "elite", label: "Elite", family: "Elite", color: "#b84fff" }
];

export const masteryTitles = [
  "Novice",
  "Apprentice",
  "Skilled",
  "Expert",
  "Master"
];

export const masteryColors = [
  "#6b7280",
  "#4fc3f7",
  "#81c784",
  "#f5a623",
  "#b84fff"
];

export const defaultDrillMastery = {
  juggling: {
    level: 0,
    sessions: 0,
    bestScore: 0,
    avgContacts: 0,
    recentScores: []
  }
};

export function getTierLevel(totalPoints) {
  if (totalPoints > 7000) return "Elite";
  if (totalPoints >= 3000) return "Gold";
  if (totalPoints >= 1000) return "Silver";
  return "Bronze";
}

export function getCoinMultiplier(subscriptionTier) {
  if (subscriptionTier === "Elite") return 3;
  if (subscriptionTier === "Pro") return 2;
  return 1;
}

function getTierRank(tierLevel) {
  const ranks = {
    Bronze: 0,
    Silver: 1,
    Gold: 2,
    Elite: 3
  };

  return ranks[tierLevel] ?? 0;
}

export function loadPlayerProfile() {
  try {
    const storedProfile = window.localStorage.getItem(STORAGE_KEY);
    if (!storedProfile) return defaultPlayerProfile;

    const parsedProfile = JSON.parse(storedProfile);
    const totalPoints = Number(parsedProfile.totalPoints) || 0;
    const coinBalance =
      Number(parsedProfile.coinBalance ?? parsedProfile.coins) || 0;

    const profile = normalizeCosmetics({
      ...defaultPlayerProfile,
      ...parsedProfile,
      totalPoints,
      weeklyPts: Number(parsedProfile.weeklyPts) || 0,
      sessionsCompleted:
        Number(parsedProfile.sessionsCompleted) ||
        (Array.isArray(parsedProfile.drillHistory)
          ? parsedProfile.drillHistory.length
          : 0),
      lastWeekStats: parsedProfile.lastWeekStats || null,
      weeklyReport: parsedProfile.weeklyReport || null,
      weekStartDate: parsedProfile.weekStartDate || null,
      drillMastery: normalizeDrillMastery(parsedProfile.drillMastery),
      rankDivision: normalizeRankDivision(parsedProfile.rankDivision),
      rankPoints: normalizeRankPoints(parsedProfile.rankPoints),
      rankHistory: Array.isArray(parsedProfile.rankHistory)
        ? parsedProfile.rankHistory
        : [],
      lastRankDecayCheck: parsedProfile.lastRankDecayCheck || "",
      lastSessionDate: parsedProfile.lastSessionDate || "",
      lastRankEvent: parsedProfile.lastRankEvent || null,
      streakCount:
        Number(parsedProfile.streakCount ?? parsedProfile.streak) || 0,
      streak: Number(parsedProfile.streakCount ?? parsedProfile.streak) || 0,
      bestStreakCount: Math.max(
        Number(parsedProfile.bestStreakCount) || 0,
        Number(parsedProfile.streakCount ?? parsedProfile.streak) || 0
      ),
      streakFreezes: normalizeStreakFreezes(parsedProfile.streakFreezes),
      streakFreezeUsedDates: Array.isArray(parsedProfile.streakFreezeUsedDates)
        ? parsedProfile.streakFreezeUsedDates
        : [],
      lastStreakCheckDate: parsedProfile.lastStreakCheckDate || null,
      lastStreakFreezeEvent: parsedProfile.lastStreakFreezeEvent || null,
      rivalId: parsedProfile.rivalId || null,
      rivalName: parsedProfile.rivalName || null,
      rivalCity: parsedProfile.rivalCity || null,
      rivalWeeklyPts:
        parsedProfile.rivalWeeklyPts === null ||
        parsedProfile.rivalWeeklyPts === undefined
          ? null
          : Number(parsedProfile.rivalWeeklyPts) || 0,
      rivalAssignedAt: parsedProfile.rivalAssignedAt || null,
      rivalsOvercome: Number(parsedProfile.rivalsOvercome) || 0,
      lastRivalEvent: parsedProfile.lastRivalEvent || null,
      lastWeeklyResetDate: parsedProfile.lastWeeklyResetDate || null,
      matchmaking: normalizePlayerMatchmaking(parsedProfile.matchmaking),
      coinBalance,
      coins: coinBalance,
      coinEarnings: Array.isArray(parsedProfile.coinEarnings)
        ? parsedProfile.coinEarnings
        : [],
      coinSpendHistory: Array.isArray(parsedProfile.coinSpendHistory)
        ? parsedProfile.coinSpendHistory
        : [],
      transactionHistory: Array.isArray(parsedProfile.transactionHistory)
        ? parsedProfile.transactionHistory
        : [],
      redemptionHistory: Array.isArray(parsedProfile.redemptionHistory)
        ? parsedProfile.redemptionHistory
        : [],
      tripodReceived: Boolean(parsedProfile.tripodReceived),
      subscriptionTier: subscriptions[parsedProfile.subscriptionTier]
        ? parsedProfile.subscriptionTier
        : "Free",
      tierLevel: getTierLevel(totalPoints),
      currentLeague: normalizeLeague(parsedProfile.currentLeague),
      seasonPoints: Number(parsedProfile.seasonPoints) || 0,
      leagueHistory: Array.isArray(parsedProfile.leagueHistory)
        ? parsedProfile.leagueHistory
        : [],
      promotionPending: Boolean(parsedProfile.promotionPending),
      relegationPending: Boolean(parsedProfile.relegationPending),
      assessmentBooking: parsedProfile.assessmentBooking || null,
      drillHistory: Array.isArray(parsedProfile.drillHistory)
        ? parsedProfile.drillHistory
        : [],
      skillProgress: normalizeSkillProgress(parsedProfile.skillProgress || {}),
      lastSkillEvents: Array.isArray(parsedProfile.lastSkillEvents)
        ? parsedProfile.lastSkillEvents
        : []
    });

    return profile;
  } catch {
    return defaultPlayerProfile;
  }
}

export function savePlayerProfile(profile) {
  const totalPoints = Number(profile.totalPoints) || 0;
  const coinBalance = Number(profile.coinBalance ?? profile.coins) || 0;
  const creationOrder = resolveCreationOrder(profile);
  const nextProfile = normalizeCosmetics({
    ...defaultPlayerProfile,
    ...profile,
    creationOrder,
    totalPoints,
    weeklyPts: Number(profile.weeklyPts) || 0,
    sessionsCompleted:
      Number(profile.sessionsCompleted) ||
      (Array.isArray(profile.drillHistory) ? profile.drillHistory.length : 0),
    lastWeekStats: profile.lastWeekStats || null,
    weeklyReport: profile.weeklyReport || null,
    weekStartDate: profile.weekStartDate || null,
    drillMastery: normalizeDrillMastery(profile.drillMastery),
    rankDivision: normalizeRankDivision(profile.rankDivision),
    rankPoints: normalizeRankPoints(profile.rankPoints),
    rankHistory: Array.isArray(profile.rankHistory)
      ? profile.rankHistory
      : [],
    lastRankDecayCheck: profile.lastRankDecayCheck || "",
    lastSessionDate: profile.lastSessionDate || "",
    lastRankEvent: profile.lastRankEvent || null,
    bestStreakCount: Math.max(
      Number(profile.bestStreakCount) || 0,
      Number(profile.streakCount ?? profile.streak) || 0
    ),
    streakCount: Number(profile.streakCount ?? profile.streak) || 0,
    streak: Number(profile.streakCount ?? profile.streak) || 0,
    streakFreezes: normalizeStreakFreezes(profile.streakFreezes),
    streakFreezeUsedDates: Array.isArray(profile.streakFreezeUsedDates)
      ? profile.streakFreezeUsedDates
      : [],
    lastStreakCheckDate: profile.lastStreakCheckDate || null,
    lastStreakFreezeEvent: profile.lastStreakFreezeEvent || null,
    rivalId: profile.rivalId || null,
    rivalName: profile.rivalName || null,
    rivalCity: profile.rivalCity || null,
    rivalWeeklyPts:
      profile.rivalWeeklyPts === null || profile.rivalWeeklyPts === undefined
        ? null
        : Number(profile.rivalWeeklyPts) || 0,
    rivalAssignedAt: profile.rivalAssignedAt || null,
    rivalsOvercome: Number(profile.rivalsOvercome) || 0,
    lastRivalEvent: profile.lastRivalEvent || null,
    lastWeeklyResetDate: profile.lastWeeklyResetDate || null,
    matchmaking: normalizePlayerMatchmaking(profile.matchmaking),
    coinBalance,
    coins: coinBalance,
    coinEarnings: Array.isArray(profile.coinEarnings)
      ? profile.coinEarnings
      : [],
    coinSpendHistory: Array.isArray(profile.coinSpendHistory)
      ? profile.coinSpendHistory
      : [],
    transactionHistory: Array.isArray(profile.transactionHistory)
      ? profile.transactionHistory
      : [],
    redemptionHistory: Array.isArray(profile.redemptionHistory)
      ? profile.redemptionHistory
      : [],
    tripodReceived: Boolean(profile.tripodReceived),
    subscriptionTier: subscriptions[profile.subscriptionTier]
      ? profile.subscriptionTier
      : "Free",
    tierLevel: getTierLevel(totalPoints),
    currentLeague: normalizeLeague(profile.currentLeague),
    seasonPoints: Number(profile.seasonPoints) || 0,
    leagueHistory: Array.isArray(profile.leagueHistory)
      ? profile.leagueHistory
      : [],
    promotionPending: Boolean(profile.promotionPending),
    relegationPending: Boolean(profile.relegationPending),
    assessmentBooking: profile.assessmentBooking || null,
    drillHistory: Array.isArray(profile.drillHistory)
      ? profile.drillHistory
      : [],
    skillProgress: normalizeSkillProgress(profile.skillProgress || {}),
    lastSkillEvents: Array.isArray(profile.lastSkillEvents)
      ? profile.lastSkillEvents
      : []
  });

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
  window.dispatchEvent(new Event("sportshawk-profile-change"));
  return nextProfile;
}

export function hasSubscription(profile, requiredTier) {
  return (
    subscriptions[profile.subscriptionTier]?.rank >=
    subscriptions[requiredTier]?.rank
  );
}

export function setSubscriptionTier(subscriptionTier) {
  return updatePlayerProfile((profile) => ({
    ...profile,
    subscriptionTier
  }));
}

export function updatePlayerProfile(updater) {
  const currentProfile = loadPlayerProfile();
  const nextProfile =
    typeof updater === "function" ? updater(currentProfile) : updater;

  return savePlayerProfile(nextProfile);
}

export function recordDrillScore(drillResult) {
  return updatePlayerProfile((profile) => {
    const nextTotalPoints = profile.totalPoints + drillResult.totalPoints;
    const currentTier = getTierLevel(profile.totalPoints);
    const nextTier = getTierLevel(nextTotalPoints);
    const tierMilestonesCrossed = Math.max(
      getTierRank(nextTier) - getTierRank(currentTier),
      0
    );
    const uploadCoins = 5;
    const streakCoins = 10;
    const milestoneCoins = tierMilestonesCrossed * 50;
    const baseCoins = uploadCoins + streakCoins + milestoneCoins;
    const communityMultiplier = getCommunityChallengeCoinMultiplier();
    const coinMultiplier =
      getCoinMultiplier(profile.subscriptionTier) * communityMultiplier;
    const coinsEarned = baseCoins * coinMultiplier;
    const completedAt = new Date().toISOString();
    const completedDate = new Date(completedAt);
    const normalizedDrill = normalizeName(drillResult.drillName);
    const previousDrillSessions = profile.drillHistory.filter(
      (session) =>
        session.drill === normalizedDrill ||
        normalizeName(session.drillName) === normalizedDrill
    );
    const previousBest = previousDrillSessions.reduce(
      (best, session) =>
        Math.max(
          best,
          Number(session.totalContacts) || Number(session.totalPoints) || 0
        ),
      0
    );
    const currentPerformance =
      Number(drillResult.totalContacts) || Number(drillResult.totalPoints) || 0;
    const nextHistoryItem = {
      ...drillResult,
      id: `${drillResult.drillName}-${Date.now()}`,
      completedAt,
      date: completedAt,
      drill: normalizedDrill,
      isPersonalBest: currentPerformance > previousBest,
      coinsEarned
    };
    const nextCoinEarning = {
      id: `coins-${Date.now()}`,
      type: "Drill upload",
      label: drillResult.drillName,
      coins: coinsEarned,
      completedAt,
      multiplier: coinMultiplier,
      breakdown: {
        upload: uploadCoins,
        streak: streakCoins,
        milestone: milestoneCoins
      }
    };
    const skillUpdate = updateSkillProgressForDrill(
      profile.skillProgress || {},
      drillResult
    );
    const rankDelta = 10 + (nextHistoryItem.isPersonalBest ? 25 : 0);
    const seasonPointsEarned = 5 + (nextHistoryItem.isPersonalBest ? 15 : 0);
    const rankedProfile = applyRankDelta(profile, rankDelta, {
      reason: nextHistoryItem.isPersonalBest
        ? "Drill completed + personal best"
        : "Drill completed",
      drillName: drillResult.drillName
    });
    const nextStreakCount = profile.streakCount + 1;
    const earlyBirdSessions =
      completedDate.getHours() < 8
        ? (Number(profile.earlyBirdSessions) || 0) + 1
        : Number(profile.earlyBirdSessions) || 0;
    const comebackStarts =
      profile.streakCount === 0 && nextStreakCount === 1
        ? (Number(profile.comebackStarts) || 0) + 1
        : Number(profile.comebackStarts) || 0;
    const currentFreezes = normalizeStreakFreezes(profile.streakFreezes);
    const earnsFreeze =
      nextStreakCount > 0 && nextStreakCount % 7 === 0 && currentFreezes < 2;
    const nextStreakFreezes = earnsFreeze
      ? Math.min(currentFreezes + 1, 2)
      : currentFreezes;
    const nextDrillHistory = [nextHistoryItem, ...profile.drillHistory].slice(
      0,
      50
    );
    const masteryResult =
      normalizedDrill === "juggling"
        ? updateDrillMastery(profile, nextHistoryItem)
        : {
            leveledUp: false,
            newLevel: profile.drillMastery?.juggling?.level || 0,
            updatedMastery: normalizeDrillMastery(profile.drillMastery).juggling
          };

    const nextWeeklyPts = (Number(profile.weeklyPts) || 0) + drillResult.totalPoints;
    const baseProfile = {
      ...rankedProfile,
      streakCount: nextStreakCount,
      streak: nextStreakCount,
      bestStreakCount: Math.max(
        Number(profile.bestStreakCount) || 0,
        nextStreakCount
      ),
      streakFreezes: nextStreakFreezes,
      lastStreakFreezeEvent: earnsFreeze
        ? {
            id: `freeze-earned-${completedAt}`,
            type: "success",
            message:
              "🛡️ Streak Freeze earned! You have " +
              nextStreakFreezes +
              " freeze(s) — your streak is protected for " +
              nextStreakFreezes +
              " missed day(s)"
          }
        : profile.lastStreakFreezeEvent || null,
      earlyBirdSessions,
      comebackStarts,
      coinBalance: profile.coinBalance + coinsEarned,
      coins: profile.coinBalance + coinsEarned,
      coinEarnings: [nextCoinEarning, ...profile.coinEarnings].slice(0, 50),
      totalPoints: nextTotalPoints,
      weeklyPts: nextWeeklyPts,
      seasonPoints: (Number(profile.seasonPoints) || 0) + seasonPointsEarned,
      tierLevel: getTierLevel(nextTotalPoints),
      lastSessionDate: completedAt,
      drillHistory: nextDrillHistory,
      drillMastery: {
        ...normalizeDrillMastery(profile.drillMastery),
        juggling: masteryResult.updatedMastery
      },
      lastMasteryEvent: masteryResult.leveledUp
        ? {
            id: `mastery-${completedAt}`,
            drill: "juggling",
            level: masteryResult.newLevel,
            title: masteryTitles[masteryResult.newLevel],
            message: `🎯 Juggling ${masteryTitles[masteryResult.newLevel]}! Your mastery has increased!`
          }
        : null,
      skillProgress: skillUpdate.skillProgress,
      lastSkillEvents: skillUpdate.events,
      sessionsCompleted: (Number(profile.sessionsCompleted) || 0) + 1
    };
    const rivalUpdate = updateRivalAfterScore(baseProfile, nextWeeklyPts);
    const nextProfile = rivalUpdate.profile;

    return refreshUnlockedCardTitles(nextProfile);
  });
}

export function getCardTheme(themeId) {
  return cardThemes.find((theme) => theme.id === themeId) || cardThemes[0];
}

export function getCardBorder(borderId) {
  return cardBorders.find((border) => border.id === borderId) || cardBorders[0];
}

export function getCardTitle(titleId) {
  if (!titleId) return null;
  return cardTitles.find((title) => title.id === titleId) || null;
}

export function isCosmeticUnlocked(item, profile = loadPlayerProfile()) {
  if (!item) return false;
  if (item.free || item.unlockCondition === "default") return true;

  const tierRank = getTierRank(String(profile.tierLevel || "Bronze"));
  const requiredTierRank = item.requiresTier
    ? getTierRank(capitalizeTier(item.requiresTier))
    : null;

  if (requiredTierRank !== null && tierRank < requiredTierRank) return false;
  if (
    item.requiresStreak &&
    Math.max(Number(profile.bestStreakCount) || 0, Number(profile.streakCount) || 0) <
      item.requiresStreak
  ) {
    return false;
  }
  if (
    item.requiresSeasonLevel &&
    (Number(profile.seasonLevel) || 0) < item.requiresSeasonLevel
  ) {
    return false;
  }
  if (cardTitles.some((title) => title.id === item.id)) {
    return (profile.unlockedCardTitles || []).includes(item.id);
  }

  return true;
}

export function getJugglingMastery(profile = loadPlayerProfile()) {
  return normalizeDrillMastery(profile.drillMastery).juggling;
}

export function updateDrillMastery(profile, sessionResult) {
  const mastery = normalizeDrillMastery(profile.drillMastery).juggling;
  const totalContacts = Number(sessionResult.totalContacts) || 0;
  const newSessions = mastery.sessions + 1;
  const newBest = Math.max(mastery.bestScore, totalContacts);
  const recentScores = [...mastery.recentScores.slice(-4), totalContacts];
  const avgContacts =
    recentScores.length > 0
      ? recentScores.reduce((sum, score) => sum + score, 0) /
        recentScores.length
      : 0;
  let newLevel = mastery.level;
  const longestStreak =
    Number(profile.longestStreak) ||
    Number(profile.bestStreakCount) ||
    Number(profile.streakCount) ||
    0;

  if (mastery.level === 0 && newSessions >= 3) newLevel = 1;
  if (mastery.level === 1 && avgContacts >= 15 && recentScores.length >= 3) {
    newLevel = 2;
  }
  if (mastery.level === 2 && totalContacts >= 25) newLevel = 3;
  if (mastery.level === 3 && totalContacts >= 35 && longestStreak >= 14) {
    newLevel = 4;
  }

  return {
    leveledUp: newLevel > mastery.level,
    newLevel,
    updatedMastery: {
      level: newLevel,
      sessions: newSessions,
      bestScore: newBest,
      avgContacts: Math.round(avgContacts * 10) / 10,
      recentScores
    }
  };
}

export function getJugglingMasteryProgress(profile = loadPlayerProfile()) {
  const mastery = getJugglingMastery(profile);
  const longestStreak =
    Number(profile.longestStreak) ||
    Number(profile.bestStreakCount) ||
    Number(profile.streakCount) ||
    0;

  if (mastery.level === 0) {
    return {
      label: `Sessions: ${mastery.sessions} / 3`,
      shortLabel: `${mastery.sessions} sessions`,
      progress: Math.min(100, (mastery.sessions / 3) * 100)
    };
  }
  if (mastery.level === 1) {
    return {
      label: `Avg contacts: ${mastery.avgContacts} / 15 (last 3+ sessions)`,
      shortLabel: `Avg ${mastery.avgContacts} contacts`,
      progress: Math.min(100, (mastery.avgContacts / 15) * 100)
    };
  }
  if (mastery.level === 2) {
    return {
      label: `Best session: ${mastery.bestScore} contacts / 25 needed`,
      shortLabel: `Best: ${mastery.bestScore} contacts`,
      progress: Math.min(100, (mastery.bestScore / 25) * 100)
    };
  }
  if (mastery.level === 3) {
    const contactProgress = Math.min(1, mastery.bestScore / 35);
    const streakProgress = Math.min(1, longestStreak / 14);
    return {
      label: `Best: ${mastery.bestScore}/35 contacts + ${longestStreak}/14 day streak`,
      shortLabel: `Best: ${mastery.bestScore} contacts`,
      progress: Math.min(100, ((contactProgress + streakProgress) / 2) * 100)
    };
  }

  return {
    label: "Master achieved ⭐",
    shortLabel: "MASTER ⭐",
    progress: 100
  };
}

export function getRankDivisionMeta(divisionId) {
  return (
    rankDivisions.find((division) => division.id === divisionId) ||
    rankDivisions[0]
  );
}

export function getNextRankDivision(divisionId) {
  const index = getRankDivisionIndex(divisionId);
  return rankDivisions[Math.min(index + 1, rankDivisions.length - 1)];
}

export function applyRankDelta(profile, delta, detail = {}) {
  let divisionIndex = getRankDivisionIndex(profile.rankDivision);
  let rankPoints = normalizeRankPoints(profile.rankPoints) + delta;
  const events = [];
  const happenedAt = new Date().toISOString();

  while (rankPoints >= 100 && divisionIndex < rankDivisions.length - 1) {
    const previousDivision = rankDivisions[divisionIndex];
    rankPoints -= 100;
    divisionIndex += 1;
    const nextDivision = rankDivisions[divisionIndex];
    events.push({
      type: "rankUp",
      previousDivision: previousDivision.id,
      previousLabel: previousDivision.label,
      division: nextDivision.id,
      label: nextDivision.label,
      color: nextDivision.color,
      reason: detail.reason || "Rank points earned",
      happenedAt
    });
  }

  while (rankPoints < 0 && divisionIndex > 0) {
    const previousDivision = rankDivisions[divisionIndex];
    divisionIndex -= 1;
    const nextDivision = rankDivisions[divisionIndex];
    rankPoints = 75;
    events.push({
      type: "rankDown",
      previousDivision: previousDivision.id,
      previousLabel: previousDivision.label,
      division: nextDivision.id,
      label: nextDivision.label,
      color: nextDivision.color,
      reason: detail.reason || "Rank decay",
      happenedAt
    });
  }

  if (rankPoints < 0) rankPoints = 0;

  const lastRankEvent = events[events.length - 1] || null;

  return {
    ...profile,
    rankDivision: rankDivisions[divisionIndex].id,
    rankPoints,
    lastRankEvent,
    rankHistory: [
      ...events,
      ...(Array.isArray(profile.rankHistory) ? profile.rankHistory : [])
    ].slice(0, 50)
  };
}

export function applyRankDecayOnOpen() {
  return updatePlayerProfile((profile) => {
    const now = new Date();
    const todayKey = now.toDateString();
    if (profile.lastRankDecayCheck === todayKey) return profile;

    const lastSession = profile.lastSessionDate
      ? new Date(profile.lastSessionDate)
      : null;
    const inactiveMoreThanDay =
      !lastSession || now.getTime() - lastSession.getTime() > 24 * 60 * 60 * 1000;

    if (!inactiveMoreThanDay) {
      return {
        ...profile,
        lastRankDecayCheck: todayKey,
        lastRankEvent: null
      };
    }

    const decayedProfile = applyRankDelta(profile, -5, {
      reason: "Daily inactivity decay"
    });

    return {
      ...decayedProfile,
      lastRankDecayCheck: todayKey
    };
  });
}

export function checkAndApplyStreakFreeze(profile = loadPlayerProfile()) {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (profile.lastStreakCheckDate === today) return profile;

  const lastSessionDate = profile.lastSessionDate
    ? new Date(profile.lastSessionDate).toDateString()
    : null;
  const streakCount = Number(profile.streakCount ?? profile.streak) || 0;
  const streakFreezes = normalizeStreakFreezes(profile.streakFreezes);
  let updatedProfile = {
    ...profile,
    lastStreakCheckDate: today,
    streakCount,
    streak: streakCount,
    streakFreezes,
    streakFreezeUsedDates: Array.isArray(profile.streakFreezeUsedDates)
      ? profile.streakFreezeUsedDates
      : []
  };

  if (
    lastSessionDate !== today &&
    lastSessionDate !== yesterday &&
    streakCount > 0
  ) {
    const alreadyUsedToday =
      updatedProfile.streakFreezeUsedDates.includes(yesterday);

    if (streakFreezes > 0 && !alreadyUsedToday) {
      const nextFreezes = streakFreezes - 1;
      updatedProfile = {
        ...updatedProfile,
        streakFreezes: nextFreezes,
        streakFreezeUsedDates: [
          ...updatedProfile.streakFreezeUsedDates,
          yesterday
        ],
        pendingNotification: {
          message:
            "🛡️ Streak Freeze used — your " +
            streakCount +
            "-day streak is protected! You have " +
            nextFreezes +
            " freeze(s) remaining. Train today!",
          type: "warning"
        }
      };
    } else if (streakFreezes === 0) {
      updatedProfile = {
        ...updatedProfile,
        streakCount: 0,
        streak: 0,
        pendingNotification: {
          message:
            "Your " + streakCount + "-day streak ended. Start a new one today!",
          type: "error"
        }
      };
    }
  }

  return updatedProfile;
}

export function checkAndResetWeeklyRival(profile = loadPlayerProfile()) {
  const weekStartKey = getWeekStartKey(new Date());
  if (profile.lastWeeklyResetDate === weekStartKey) return profile;

  const resetProfile = {
    ...profile,
    weeklyPts: 0,
    lastWeeklyResetDate: weekStartKey
  };
  const rival = assignRival(resetProfile);

  return {
    ...resetProfile,
    ...buildRivalProfilePatch(rival)
  };
}

export function checkWeeklyReportTrigger(profile = loadPlayerProfile()) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const thisMonday = getWeekStartDate(today);
  const thisMondayStr = thisMonday.toISOString();

  return (
    dayOfWeek === 1 &&
    profile.weekStartDate !== thisMondayStr &&
    (Number(profile.sessionsCompleted) || 0) > 0
  );
}

export function generateWeeklyReport(profile = loadPlayerProfile()) {
  const lastWeek = profile.lastWeekStats || {};
  const drillHistory = Array.isArray(profile.drillHistory)
    ? profile.drillHistory
    : [];
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeekSessions = drillHistory
    .filter((session) => {
      const sessionDate = session.date || session.completedAt;
      return sessionDate && new Date(sessionDate).getTime() > weekAgo;
    })
    .sort(
      (a, b) =>
        new Date(a.date || a.completedAt).getTime() -
        new Date(b.date || b.completedAt).getTime()
    );
  const bestSession =
    thisWeekSessions.length > 0
      ? thisWeekSessions.reduce((best, session) =>
          getSessionScore(session) > getSessionScore(best || {})
            ? session
            : best
        , null)
      : null;
  const cityRank = computeCityRank(profile);
  const dailyPoints = buildDailyPoints(thisWeekSessions);

  return {
    generatedAt: new Date().toISOString(),
    weekStart: getWeekStartDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).toISOString(),
    weekEnd: new Date(getWeekStartDate(new Date()).getTime() - 1).toISOString(),
    sessions: thisWeekSessions.length,
    pointsEarned: Number(profile.weeklyPts) || 0,
    currentStreak: Number(profile.streakCount ?? profile.streak) || 0,
    bestDrill: bestSession
      ? `${bestSession.drill || bestSession.drillName} — ${
          Number(bestSession.totalContacts) || 0
        } contacts`
      : "No sessions this week",
    bestScore: bestSession ? getSessionScore(bestSession) : 0,
    vsLastWeekSessions: thisWeekSessions.length - (lastWeek.sessions || 0),
    vsLastWeekPoints:
      (Number(profile.weeklyPts) || 0) - (lastWeek.pointsEarned || 0),
    cityRank,
    vsLastWeekRank: (lastWeek.cityRank || 999) - cityRank,
    sessionsList: thisWeekSessions,
    dailyPoints,
    trainedDates: thisWeekSessions.map((session) =>
      new Date(session.date || session.completedAt).toDateString()
    )
  };
}

export function applyWeeklyReportIfNeeded(profile = loadPlayerProfile()) {
  if (!checkWeeklyReportTrigger(profile)) return profile;

  const report = generateWeeklyReport(profile);
  const thisMonday = getWeekStartDate(new Date()).toISOString();

  return savePlayerProfile({
    ...profile,
    weeklyReport: report,
    lastWeekStats: {
      sessions: report.sessions,
      pointsEarned: report.pointsEarned,
      cityRank: report.cityRank,
      generatedAt: report.generatedAt
    },
    weeklyPts: 0,
    weekStartDate: thisMonday
  });
}

export function computeCityRank(profile) {
  const allPlayers = [
    ...mockPlayers,
    {
      id: "current",
      city: profile.city,
      weeklyPts: Number(profile.weeklyPts) || 0
    }
  ];
  const cityPlayers = allPlayers
    .filter((player) => player.city === profile.city)
    .sort(
      (a, b) =>
        (Number(b.weeklyPts ?? b.weeklyPoints) || 0) -
        (Number(a.weeklyPts ?? a.weeklyPoints) || 0)
    );

  return cityPlayers.findIndex((player) => player.id === "current") + 1;
}

export function getLeagueMeta(leagueId) {
  return leagues.find((league) => league.id === leagueId) || leagues[0];
}

export function getNextLeague(leagueId) {
  const index = getLeagueIndex(leagueId);
  return leagues[Math.min(index + 1, leagues.length - 1)];
}

export function getPreviousLeague(leagueId) {
  const index = getLeagueIndex(leagueId);
  return leagues[Math.max(index - 1, 0)];
}

export function buildLeagueTable(profile = loadPlayerProfile(), leagueId = null) {
  const selectedLeagueId = normalizeLeague(leagueId || profile.currentLeague);
  const league = getLeagueMeta(selectedLeagueId);
  const seed = hashString(`${selectedLeagueId}-${profile.city || ""}`);
  const currentPlayer = {
    id: "current-user",
    name: profile.name === "New Player" ? "You" : `${profile.name} (You)`,
    city: profile.city,
    position: profile.position,
    tierLevel: profile.tierLevel,
    seasonPoints: Number(profile.seasonPoints) || 0,
    isCurrentUser: true
  };
  const generatedPlayers = mockPlayers.slice(0, 19).map((player, index) => {
    const basePoints = Math.max(25, 280 - index * 12 - league.tier * 8);
    const variance = (seed + index * 37) % 90;

    return {
      ...player,
      id: `${selectedLeagueId}-${player.id}`,
      tierLevel: getTierLevel(player.weeklyPoints || player.weeklyPts || 0),
      seasonPoints: Math.max(0, basePoints + variance),
      isCurrentUser: false
    };
  });

  return [...generatedPlayers, currentPlayer]
    .sort((a, b) => (Number(b.seasonPoints) || 0) - (Number(a.seasonPoints) || 0))
    .map((player, index) => ({
      ...player,
      leagueRank: index + 1,
      leagueSize: 20,
      leagueId: selectedLeagueId
    }));
}

export function getLeaguePositionStatus(position, totalPlayers = 20, leagueId = "grassroots-3") {
  const league = getLeagueMeta(leagueId);
  const promotionCutoff = league.promotionTop
    ? Math.max(1, Math.ceil(totalPlayers * league.promotionTop))
    : 0;
  const relegationCutoff = league.relegationBottom
    ? totalPlayers - Math.ceil(totalPlayers * league.relegationBottom) + 1
    : totalPlayers + 1;

  if (promotionCutoff && position <= promotionCutoff) return "promotion";
  if (position >= relegationCutoff) return "relegation";
  return "safe";
}

export function simulateSeasonEnd(profile = loadPlayerProfile()) {
  const currentLeague = getLeagueMeta(profile.currentLeague);
  const table = buildLeagueTable(profile, currentLeague.id);
  const currentRow =
    table.find((player) => player.isCurrentUser) || table[table.length - 1];
  const status = getLeaguePositionStatus(
    currentRow.leagueRank,
    table.length,
    currentLeague.id
  );
  const nextLeague =
    status === "promotion"
      ? getNextLeague(currentLeague.id)
      : status === "relegation"
        ? getPreviousLeague(currentLeague.id)
        : currentLeague;
  const event = {
    id: `season-end-${Date.now()}`,
    seasonId: 1,
    completedAt: new Date().toISOString(),
    fromLeague: currentLeague.id,
    toLeague: nextLeague.id,
    status,
    finalRank: currentRow.leagueRank,
    seasonPoints: Number(profile.seasonPoints) || 0
  };

  return savePlayerProfile({
    ...profile,
    currentLeague: nextLeague.id,
    seasonPoints: 0,
    promotionPending: status === "promotion",
    relegationPending: status === "relegation",
    leagueHistory: [event, ...(profile.leagueHistory || [])].slice(0, 20)
  });
}

function normalizeLeague(leagueId) {
  return leagues.some((league) => league.id === leagueId)
    ? leagueId
    : "grassroots-3";
}

function getLeagueIndex(leagueId) {
  return leagues.findIndex((league) => league.id === normalizeLeague(leagueId));
}

function hashString(value) {
  return String(value)
    .split("")
    .reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
}

function normalizeRankDivision(divisionId) {
  return rankDivisions.some((division) => division.id === divisionId)
    ? divisionId
    : "bronze-3";
}

function normalizeRankPoints(points) {
  return Math.max(0, Math.min(99, Number(points) || 0));
}

function normalizeStreakFreezes(value) {
  return Math.max(0, Math.min(2, Number(value) || 0));
}

function normalizePlayerMatchmaking(matchmaking = {}) {
  return {
    optedIn: Boolean(matchmaking.optedIn),
    incomingInterests: Array.isArray(matchmaking.incomingInterests)
      ? matchmaking.incomingInterests
      : [],
    acceptedConnections: Array.isArray(matchmaking.acceptedConnections)
      ? matchmaking.acceptedConnections
      : [],
    declinedCoaches: Array.isArray(matchmaking.declinedCoaches)
      ? matchmaking.declinedCoaches
      : [],
    guardianEmail: matchmaking.guardianEmail || null,
    guardianApproved: matchmaking.guardianApproved || {}
  };
}

function normalizeDrillMastery(drillMastery = {}) {
  const current = drillMastery?.juggling || {};
  const recentScores = Array.isArray(current.recentScores)
    ? current.recentScores.slice(-5).map((score) => Number(score) || 0)
    : [];

  return {
    ...defaultDrillMastery,
    ...drillMastery,
    juggling: {
      ...defaultDrillMastery.juggling,
      ...current,
      level: Math.max(0, Math.min(4, Number(current.level) || 0)),
      sessions: Number(current.sessions) || 0,
      bestScore: Number(current.bestScore) || 0,
      avgContacts: Number(current.avgContacts) || 0,
      recentScores
    }
  };
}

function getWeekStartDate(date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getWeekStartKey(date) {
  const start = getWeekStartDate(date);
  return start.toISOString().slice(0, 10);
}

function getSessionScore(session) {
  return (
    Number(session.score) ||
    Number(session.totalPoints) ||
    Number(session.basePoints) ||
    0
  );
}

function buildDailyPoints(sessions) {
  const today = new Date();
  const weekStart = getWeekStartDate(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    const dayKey = day.toDateString();
    const points = sessions
      .filter((session) => {
        const sessionDate = session.date || session.completedAt;
        return sessionDate && new Date(sessionDate).toDateString() === dayKey;
      })
      .reduce((sum, session) => sum + getSessionScore(session), 0);

    return {
      date: day.toISOString(),
      label: day.toLocaleDateString("en-IN", { weekday: "short" }),
      points
    };
  });
}

function getRankDivisionIndex(divisionId) {
  return Math.max(
    0,
    rankDivisions.findIndex((division) => division.id === divisionId)
  );
}

export function normalizeSkillProgress(progress = {}) {
  const normalized = {};

  skillNodes.forEach((node) => {
    const current = progress[node.id] || {};
    const sessions = Number(current.sessions) || 0;
    normalized[node.id] = {
      sessions,
      masteryLevel: getMasteryLevel(node, sessions),
      unlocked: node.requires.length === 0 ? true : Boolean(current.unlocked)
    };
  });

  return unlockEligibleSkills(normalized).skillProgress;
}

export function getMasteryLevel(node, sessions) {
  const thresholdsReached = node.masteryLevels.filter(
    (threshold) => sessions >= threshold
  ).length;
  return Math.min(thresholdsReached, 4);
}

function updateSkillProgressForDrill(currentProgress, drillResult) {
  const skillProgress = normalizeSkillProgress(currentProgress);
  const events = [];
  const matchingNode = findSkillNodeForDrill(drillResult);

  if (!matchingNode) {
    return {
      skillProgress,
      events
    };
  }

  const current = skillProgress[matchingNode.id] || {
    sessions: 0,
    masteryLevel: 0,
    unlocked: matchingNode.requires.length === 0
  };
  const nextSessions = current.sessions + 1;
  const nextMasteryLevel = getMasteryLevel(matchingNode, nextSessions);
  skillProgress[matchingNode.id] = {
    sessions: nextSessions,
    masteryLevel: nextMasteryLevel,
    unlocked: true
  };

  if (nextMasteryLevel > current.masteryLevel) {
    events.push({
      type: "mastery",
      skillId: matchingNode.id,
      skillName: matchingNode.name,
      masteryTitle: matchingNode.masteryTitles[nextMasteryLevel],
      message: `${matchingNode.name} mastery: ${matchingNode.masteryTitles[nextMasteryLevel]}!`
    });
  }

  const unlockUpdate = unlockEligibleSkills(skillProgress);

  return {
    skillProgress: unlockUpdate.skillProgress,
    events: [...events, ...unlockUpdate.events]
  };
}

function unlockEligibleSkills(progress) {
  const skillProgress = { ...progress };
  const events = [];
  let changed = true;

  while (changed) {
    changed = false;
    skillNodes.forEach((node) => {
      const current = skillProgress[node.id] || {
        sessions: 0,
        masteryLevel: 0,
        unlocked: false
      };

      if (current.unlocked) return;

      const isUnlocked = node.requires.every((requiredId) => {
        const requiredProgress = skillProgress[requiredId];
        return (
          requiredProgress?.unlocked &&
          requiredProgress.masteryLevel >= (node.requiresMasteryLevel || 0)
        );
      });

      if (!isUnlocked) return;

      skillProgress[node.id] = {
        ...current,
        unlocked: true
      };
      events.push({
        type: "unlock",
        skillId: node.id,
        skillName: node.name,
        message: `New skill unlocked: ${node.name}!`
      });
      changed = true;
    });
  }

  return {
    skillProgress,
    events
  };
}

function findSkillNodeForDrill(drillResult) {
  if (drillResult.drillId) {
    return skillNodes.find((node) => node.drillId === drillResult.drillId);
  }

  const drillName = normalizeName(drillResult.drillName);
  return skillNodes.find((node) => {
    const nodeName = normalizeName(node.name);
    return drillName === nodeName || drillName.startsWith(nodeName);
  });
}

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/—.*/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getCommunityChallengeCoinMultiplier() {
  try {
    const state = JSON.parse(window.localStorage.getItem("dailyChallenges") || "{}");
    if (state.date !== new Date().toDateString()) return 1;

    const communityChallenge = (state.challenges || []).find(
      (challenge) => challenge.type === "community"
    );
    if (!communityChallenge) return 1;

    const target = communityChallenge.target || communityChallenge.communityTarget || 50;
    if ((Number(state.communityCount) || 0) < target) return 1;

    return communityChallenge.reward?.coinMultiplier || 2;
  } catch {
    return 1;
  }
}

function normalizeCosmetics(profile) {
  const refreshedProfile = refreshUnlockedCardTitles(profile);
  const cardTheme = cardThemes.some((theme) => theme.id === refreshedProfile.cardTheme)
    ? refreshedProfile.cardTheme
    : "default";
  const cardBorder = cardBorders.some(
    (border) => border.id === refreshedProfile.cardBorder
  )
    ? refreshedProfile.cardBorder
    : "default";
  const unlockedTitles = Array.isArray(refreshedProfile.unlockedCardTitles)
    ? refreshedProfile.unlockedCardTitles
    : [];
  const cardTitle =
    refreshedProfile.cardTitle && unlockedTitles.includes(refreshedProfile.cardTitle)
      ? refreshedProfile.cardTitle
      : null;

  return {
    ...refreshedProfile,
    cardTheme,
    cardBorder,
    cardTitle,
    cardBadge: refreshedProfile.cardBadge || null,
    cardEmoji: refreshedProfile.cardEmoji || null,
    unlockedCardTitles: unlockedTitles,
    earlyBirdSessions: Number(refreshedProfile.earlyBirdSessions) || 0,
    comebackStarts: Number(refreshedProfile.comebackStarts) || 0,
    seasonLevel: Number(refreshedProfile.seasonLevel) || 0,
    creationOrder: refreshedProfile.creationOrder || null
  };
}

function refreshUnlockedCardTitles(profile) {
  const unlocked = new Set(
    Array.isArray(profile.unlockedCardTitles) ? profile.unlockedCardTitles : []
  );
  const drillHistory = Array.isArray(profile.drillHistory)
    ? profile.drillHistory
    : [];
  const lifetimeJugglingContacts = drillHistory
    .filter(
      (session) =>
        session.drill === "juggling" ||
        normalizeName(session.drillName) === "juggling"
    )
    .reduce((sum, session) => sum + (Number(session.totalContacts) || 0), 0);
  const creationOrder = Number(profile.creationOrder) || 0;
  const skillProgress = normalizeSkillProgress(profile.skillProgress || {});

  if (lifetimeJugglingContacts >= 500) unlocked.add("iron-feet");
  if (
    Math.max(Number(profile.bestStreakCount) || 0, Number(profile.streakCount) || 0) >=
    30
  ) {
    unlocked.add("consistent");
  }
  if ((Number(profile.comebackStarts) || 0) >= 3) unlocked.add("comeback-kid");
  if ((Number(profile.earlyBirdSessions) || 0) >= 10) unlocked.add("early-bird");
  if (creationOrder > 0 && creationOrder <= 500) unlocked.add("grassroots");
  if ((Number(profile.seasonLevel) || 0) >= 1) unlocked.add("monsoon-warrior");
  if ((Number(profile.seasonLevel) || 0) >= 10) unlocked.add("season-veteran");
  if ((skillProgress["juggling-basic"]?.masteryLevel || 0) >= 4) {
    unlocked.add("juggling-master");
  }

  return {
    ...profile,
    skillProgress,
    unlockedCardTitles: Array.from(unlocked)
  };
}

function resolveCreationOrder(profile) {
  const currentOrder = Number(profile.creationOrder) || 0;
  const hasRealProfile =
    profile.name && profile.name !== defaultPlayerProfile.name && profile.position;

  if (currentOrder || !hasRealProfile) return currentOrder || null;

  const nextCount = (Number(window.localStorage.getItem("playerCount")) || 0) + 1;
  window.localStorage.setItem("playerCount", String(nextCount));
  return nextCount;
}

function capitalizeTier(tier) {
  const normalized = String(tier || "").toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function unlockAssessmentQualification() {
  return updatePlayerProfile((profile) => {
    const now = Date.now();
    const categories = [
      { drillName: "Juggling — All Surfaces", category: "ball-mastery" },
      { drillName: "Wall Passing — Inside Foot", category: "technical" },
      { drillName: "Cone Weaving — Speed Dribble", category: "dribbling-agility" }
    ];
    const qualifyingHistory = Array.from({ length: 45 }, (_, index) => {
      const category = categories[index % categories.length];

      return {
        id: `assessment-qualifier-${now}-${index}`,
        drillName: category.drillName,
        category: category.category,
        totalPoints: 120 + (index % 5) * 10,
        completedAt: new Date(now - index * 24 * 60 * 60 * 1000).toISOString(),
        coinsEarned: 0,
        assessmentQualifier: true
      };
    });

    return {
      ...profile,
      streakCount: Math.max(profile.streakCount, 14),
      bestStreakCount: Math.max(
        Number(profile.bestStreakCount) || 0,
        profile.streakCount,
        14
      ),
      drillHistory: [...qualifyingHistory, ...profile.drillHistory].slice(0, 50)
    };
  });
}

export function scheduleAssessmentSession({ centerCity, slot }) {
  return updatePlayerProfile((profile) => {
    if (profile.assessmentBooking) return profile;

    return {
      ...profile,
      assessmentBooking: {
        id: `assessment-booking-${Date.now()}`,
        centerCity,
        slot,
        status: "Scheduled",
        bookedAt: new Date().toISOString()
      }
    };
  });
}

export function redeemStoreItem(item) {
  return updatePlayerProfile((profile) => {
    if (profile.coinBalance < item.coinCost) return profile;
    if (item.id === 31 && normalizeStreakFreezes(profile.streakFreezes) >= 2) {
      return {
        ...profile,
        lastStreakFreezeEvent: {
          id: `freeze-max-${Date.now()}`,
          type: "warning",
          message: "You already have the maximum 2 Streak Freezes"
        }
      };
    }

    const redeemedAt = new Date().toISOString();
    const nextBalance = profile.coinBalance - item.coinCost;
    const isStreakFreeze = item.id === 31;
    const nextStreakFreezes = isStreakFreeze
      ? normalizeStreakFreezes(profile.streakFreezes) + 1
      : normalizeStreakFreezes(profile.streakFreezes);
    const transaction = {
      id: `transaction-${Date.now()}`,
      date: redeemedAt,
      action: `Redeemed: ${item.name}`,
      delta: -item.coinCost,
      category: item.category
    };
    const redemption = {
      itemId: item.id,
      itemName: item.name,
      brand: item.brand,
      category: item.category,
      coinCost: item.coinCost,
      redeemedAt,
      status: "processing",
      deliveryType: item.deliveryType
    };

    return {
      ...profile,
      coinBalance: nextBalance,
      coins: nextBalance,
      streakFreezes: nextStreakFreezes,
      lastStreakFreezeEvent: isStreakFreeze
        ? {
            id: `freeze-store-${redeemedAt}`,
            type: "success",
            message:
              "🛡️ Streak Freeze added! You now have " +
              nextStreakFreezes +
              " freeze(s)"
          }
        : profile.lastStreakFreezeEvent || null,
      coinSpendHistory: [transaction, ...profile.coinSpendHistory].slice(0, 50),
      transactionHistory: [transaction, ...profile.transactionHistory].slice(
        0,
        50
      ),
      redemptionHistory: [redemption, ...profile.redemptionHistory].slice(0, 50)
    };
  });
}

export function resetStoreTestingState() {
  return updatePlayerProfile((profile) => ({
    ...profile,
    coinBalance: 500,
    coins: 500,
    redemptionHistory: [],
    transactionHistory: [],
    coinSpendHistory: []
  }));
}
