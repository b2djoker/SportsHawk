import { useEffect, useMemo, useState } from "react";
import { challengeTemplates } from "../data/challengeTemplates.js";
import {
  applyRankDelta,
  loadPlayerProfile,
  updatePlayerProfile
} from "../lib/playerProfile.js";

const DAILY_KEY = "dailyChallenges";
const WEEKLY_KEY = "weeklyChallenges";

export function useDailyChallenge() {
  const [dailyState, setDailyState] = useState(() => getDailyChallengeState());
  const [weeklyState, setWeeklyState] = useState(() => getWeeklyChallengeState());

  useEffect(() => {
    function refresh() {
      setDailyState(getDailyChallengeState());
      setWeeklyState(getWeeklyChallengeState());
    }

    window.addEventListener("sportshawk-challenge-change", refresh);
    window.addEventListener("sportshawk-profile-change", refresh);
    return () => {
      window.removeEventListener("sportshawk-challenge-change", refresh);
      window.removeEventListener("sportshawk-profile-change", refresh);
    };
  }, []);

  const dailyChallenges = useMemo(
    () => hydrateChallenges(dailyState.challenges),
    [dailyState.challenges]
  );
  const weeklyChallenges = useMemo(
    () => hydrateChallenges(weeklyState.challenges),
    [weeklyState.challenges]
  );

  function claimChallenge(challengeId, scope = "daily") {
    const state =
      scope === "weekly" ? getWeeklyChallengeState() : getDailyChallengeState();
    if (!state.completed.includes(challengeId)) return loadPlayerProfile();
    if (state.claimed.includes(challengeId)) return loadPlayerProfile();

    const template = challengeTemplates.find((item) => item.id === challengeId);
    if (!template) return loadPlayerProfile();

    const reward = template.reward || {};
    const claimedAt = new Date().toISOString();
    const updatedProfile = updatePlayerProfile((profile) => {
      const rankedProfile = applyRankDelta(profile, 15, {
        reason: `${scope === "weekly" ? "Weekly" : "Daily"} challenge completed: ${template.title}`
      });
      const nextFreezes = Math.min(
        2,
        (Number(profile.streakFreezes) || 0) + (reward.streakFreeze || 0)
      );
      const nextBalance = profile.coinBalance + (reward.coins || 0);

      return {
        ...rankedProfile,
        coinBalance: nextBalance,
        coins: nextBalance,
        seasonPoints: (Number(profile.seasonPoints) || 0) + 10,
        streakFreezes: nextFreezes,
        challengeHistory: [
          {
            id: `${challengeId}-${Date.now()}`,
            challengeId,
            title: template.title,
            reward,
            claimedAt,
            scope
          },
          ...(profile.challengeHistory || [])
        ].slice(0, 50),
        transactionHistory: [
          {
            id: `challenge-${Date.now()}`,
            date: claimedAt,
            action: `Challenge reward: ${template.title}`,
            delta: reward.coins || 0,
            category: "challenge"
          },
          ...(profile.transactionHistory || [])
        ].slice(0, 50)
      };
    });

    const nextState = {
      ...state,
      claimed: [...state.claimed, challengeId]
    };

    if (scope === "weekly") {
      saveWeeklyChallengeState(nextState);
      setWeeklyState(nextState);
    } else {
      saveDailyChallengeState(nextState);
      setDailyState(nextState);
    }

    dispatchChallengeChange();
    return updatedProfile;
  }

  return {
    dailyState,
    weeklyState,
    dailyChallenges,
    weeklyChallenges,
    claimChallenge,
    expiresIn: getExpiresIn()
  };
}

export function checkChallengeCompletion(
  profile = loadPlayerProfile(),
  sessionResult = {}
) {
  const dailyNew = checkDailyChallenges(profile, sessionResult);
  const weeklyNew = checkWeeklyChallenges(profile, sessionResult);

  return [...dailyNew, ...weeklyNew];
}

export function incrementCommunityChallenge() {
  const state = getDailyChallengeState();
  const communityChallenge = state.challenges.find(
    (challenge) => challenge.type === "community"
  );

  if (!communityChallenge) return state;

  const nextCount = Math.min(
    communityChallenge.target || 50,
    (state.communityCount || 0) + 1 + Math.floor(Math.random() * 4)
  );
  const completed = new Set(state.completed || []);
  if (nextCount >= (communityChallenge.target || 50)) {
    completed.add(communityChallenge.id);
  }

  const nextState = {
    ...state,
    communityCount: nextCount,
    completed: Array.from(completed)
  };

  saveDailyChallengeState(nextState);
  dispatchChallengeChange();
  return nextState;
}

export function isCommunityCoinMultiplierActive() {
  const state = getDailyChallengeState();
  const communityChallenge = state.challenges.find(
    (challenge) => challenge.type === "community"
  );

  return Boolean(
    communityChallenge && (state.communityCount || 0) >= (communityChallenge.target || 50)
  );
}

function getDailyChallengeState() {
  const today = new Date().toDateString();
  const stored = readJson(DAILY_KEY) || {};
  if (stored.date === today) return normalizeDailyState(stored);

  const seed = new Date().getDate() + new Date().getMonth() * 31;
  const rand = (n) => seed % n;
  const allChallenges = challengeTemplates.filter(
    (challenge) => challenge.available === "daily"
  );
  const easy = allChallenges.filter((challenge) => challenge.difficulty === "easy");
  const medium = allChallenges.filter(
    (challenge) => challenge.difficulty === "medium"
  );
  const hard = allChallenges.filter((challenge) =>
    ["hard", "community"].includes(challenge.difficulty)
  );
  const selected = [easy[rand(easy.length)], medium[rand(medium.length)], hard[rand(hard.length)]]
    .filter(Boolean)
    .map((challenge) => ({ ...challenge, expiresAt: getMidnight() }));
  const freshChallenges = {
    date: today,
    challenges: selected,
    completed: [],
    claimed: [],
    communityCount: getInitialCommunityCount(seed)
  };

  saveDailyChallengeState(freshChallenges);
  return freshChallenges;
}

function getWeeklyChallengeState() {
  const weekStart = getWeekStart(new Date()).toISOString().slice(0, 10);
  const stored = readJson(WEEKLY_KEY) || {};
  if (stored.weekStart === weekStart) return normalizeWeeklyState(stored);

  const weeklyPool = challengeTemplates.filter(
    (challenge) => challenge.available === "weekly"
  );
  const seed = hashString(weekStart);
  const freshWeekly = {
    weekStart,
    challenges: [{ ...weeklyPool[seed % weeklyPool.length] }],
    completed: [],
    claimed: []
  };

  saveWeeklyChallengeState(freshWeekly);
  return freshWeekly;
}

function checkDailyChallenges(profile, sessionResult = {}) {
  const state = getDailyChallengeState();
  const today = new Date().toDateString();
  const todaySessions = (profile.drillHistory || []).filter((session) => {
    const sessionDate = session.date || session.completedAt;
    return sessionDate && new Date(sessionDate).toDateString() === today;
  });
  const completed = new Set(state.completed || []);
  const newlyCompleted = [];

  state.challenges.forEach((challenge) => {
    if (completed.has(challenge.id)) return;

    let isComplete = false;
    if (challenge.type === "community") {
      isComplete = (state.communityCount || 0) >= (challenge.target || 50);
    } else if (challenge.checkFn) {
      isComplete = challenge.checkFn(profile, todaySessions, sessionResult);
    }

    if (!isComplete) return;

    completed.add(challenge.id);
    newlyCompleted.push(challenge);
  });

  if (newlyCompleted.length) {
    saveDailyChallengeState({
      ...state,
      completed: Array.from(completed)
    });
    dispatchChallengeChange();
  }

  return newlyCompleted;
}

function checkWeeklyChallenges(profile, sessionResult = {}) {
  const state = getWeeklyChallengeState();
  const weekStart = getWeekStart(new Date());
  const weekSessions = (profile.drillHistory || []).filter((session) => {
    const sessionDate = session.date || session.completedAt;
    return sessionDate && new Date(sessionDate) >= weekStart;
  });
  const completed = new Set(state.completed || []);
  const newlyCompleted = [];

  state.challenges.forEach((challenge) => {
    if (completed.has(challenge.id)) return;
    if (!challenge.checkFn) return;

    const isComplete = challenge.checkFn(profile, weekSessions, sessionResult);
    if (!isComplete) return;

    completed.add(challenge.id);
    newlyCompleted.push(challenge);
  });

  if (newlyCompleted.length) {
    saveWeeklyChallengeState({
      ...state,
      completed: Array.from(completed)
    });
    dispatchChallengeChange();
  }

  return newlyCompleted;
}

function normalizeDailyState(state) {
  return {
    date: state.date,
    challenges: hydrateStoredChallenges(state.challenges || []),
    completed: state.completed || [],
    claimed: state.claimed || [],
    communityCount: Number(state.communityCount) || 0
  };
}

function normalizeWeeklyState(state) {
  return {
    weekStart: state.weekStart,
    challenges: hydrateStoredChallenges(state.challenges || []),
    completed: state.completed || [],
    claimed: state.claimed || []
  };
}

function hydrateStoredChallenges(challenges) {
  return challenges
    .map((challenge) =>
      typeof challenge === "string"
        ? challengeTemplates.find((template) => template.id === challenge)
        : challengeTemplates.find((template) => template.id === challenge.id) ||
          challenge
    )
    .filter(Boolean);
}

function saveDailyChallengeState(state) {
  window.localStorage.setItem(DAILY_KEY, JSON.stringify(normalizeDailyState(state)));
}

function saveWeeklyChallengeState(state) {
  window.localStorage.setItem(WEEKLY_KEY, JSON.stringify(normalizeWeeklyState(state)));
}

function hydrateChallenges(challenges) {
  return hydrateStoredChallenges(challenges);
}

function getMidnight() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

function getInitialCommunityCount(seed) {
  return 35 + (seed % 26);
}

function getExpiresIn() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(23, 59, 59, 999);
  const ms = Math.max(0, midnight.getTime() - now.getTime());
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);

  return {
    hours,
    minutes,
    isUrgent: ms < 2 * 3600000,
    label: `Resets in ${hours}h ${minutes}m`
  };
}

function getWeekStart(date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function hashString(value) {
  return String(value)
    .split("")
    .reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
}

function readJson(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key));
  } catch {
    return null;
  }
}

function dispatchChallengeChange() {
  window.dispatchEvent(new Event("sportshawk-challenge-change"));
}
