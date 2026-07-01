const ACCOUNT_TYPE_KEY = "sportshawk_account_type";
const COACH_PROFILE_KEY = "sportshawk_coach_profile";

export const accountTypes = {
  player: "player",
  coach: "coach"
};

export const defaultCoachProfile = {
  name: "",
  organization: "",
  city: "",
  role: "Coach",
  license: "",
  certificatePhotoUrl: "",
  verificationStatus: "Not Started",
  matchmaking: {
    expressedInterests: [],
    acceptedConnections: [],
    dailyInterestCount: 0,
    lastInterestDate: null,
    maxDailyInterests: 10
  }
};

export function isCoachVerified(coachProfile) {
  return coachProfile.verificationStatus === "Approved";
}

export function getAccountType() {
  try {
    const accountType = window.localStorage.getItem(ACCOUNT_TYPE_KEY);
    return Object.values(accountTypes).includes(accountType)
      ? accountType
      : null;
  } catch {
    return null;
  }
}

export function setAccountType(accountType) {
  if (!Object.values(accountTypes).includes(accountType)) return null;

  const existingAccountType = getAccountType();
  if (existingAccountType && existingAccountType !== accountType) {
    return existingAccountType;
  }

  window.localStorage.setItem(ACCOUNT_TYPE_KEY, accountType);
  window.dispatchEvent(new Event("sportshawk-account-change"));
  return accountType;
}

export function canSetAccountType(accountType) {
  const existingAccountType = getAccountType();

  return !existingAccountType || existingAccountType === accountType;
}

export function getHomePath(accountType = getAccountType()) {
  if (accountType === accountTypes.player) return "/player";
  if (accountType === accountTypes.coach) return "/coach";
  return "/onboarding";
}

export function loadCoachProfile() {
  try {
    const storedProfile = window.localStorage.getItem(COACH_PROFILE_KEY);
    if (!storedProfile) return defaultCoachProfile;
    const parsedProfile = JSON.parse(storedProfile);

    return {
      ...defaultCoachProfile,
      ...parsedProfile,
      matchmaking: normalizeCoachMatchmaking(parsedProfile.matchmaking)
    };
  } catch {
    return defaultCoachProfile;
  }
}

export function saveCoachProfile(profile) {
  const existingAccountType = getAccountType();
  if (existingAccountType && existingAccountType !== accountTypes.coach) {
    return loadCoachProfile();
  }

  const nextProfile = {
    ...defaultCoachProfile,
    ...profile,
    matchmaking: normalizeCoachMatchmaking(profile.matchmaking),
    verificationStatus: profile.verificationStatus || "Pending Verification"
  };

  window.localStorage.setItem(COACH_PROFILE_KEY, JSON.stringify(nextProfile));
  setAccountType(accountTypes.coach);
  return nextProfile;
}

function normalizeCoachMatchmaking(matchmaking = {}) {
  const today = new Date().toDateString();
  const lastInterestDate = matchmaking.lastInterestDate || null;

  return {
    expressedInterests: Array.isArray(matchmaking.expressedInterests)
      ? matchmaking.expressedInterests
      : [],
    acceptedConnections: Array.isArray(matchmaking.acceptedConnections)
      ? matchmaking.acceptedConnections
      : [],
    dailyInterestCount:
      lastInterestDate === today ? Number(matchmaking.dailyInterestCount) || 0 : 0,
    lastInterestDate,
    maxDailyInterests: Number(matchmaking.maxDailyInterests) || 10
  };
}
