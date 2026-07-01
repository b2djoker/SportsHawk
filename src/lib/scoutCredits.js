const STORAGE_KEY = "sportshawk_scout_credits";
const FREE_MONTHLY_CREDITS = 10;

function getCurrentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

export const creditPackages = [
  {
    id: "credits-10",
    label: "10 coins",
    price: "₹299",
    credits: 10,
    unlimited: false
  },
  {
    id: "credits-50",
    label: "50 coins",
    price: "₹999",
    credits: 50,
    unlimited: false
  },
  {
    id: "unlimited",
    label: "Unlimited",
    price: "₹2,499/month",
    credits: 0,
    unlimited: true
  }
];

export const defaultScoutCredits = {
  monthKey: getCurrentMonthKey(),
  creditsRemaining: FREE_MONTHLY_CREDITS,
  unlockedProfileIds: [],
  interestValidations: {},
  purchaseHistory: [],
  unlimited: false
};

export function loadScoutCredits() {
  try {
    const storedCredits = window.localStorage.getItem(STORAGE_KEY);
    if (!storedCredits) return defaultScoutCredits;

    const parsedCredits = JSON.parse(storedCredits);
    const monthKey = getCurrentMonthKey();

    if (parsedCredits.monthKey !== monthKey && !parsedCredits.unlimited) {
      return saveScoutCredits({
        ...defaultScoutCredits,
        monthKey,
        purchaseHistory: Array.isArray(parsedCredits.purchaseHistory)
          ? parsedCredits.purchaseHistory
          : []
      });
    }

    return {
      ...defaultScoutCredits,
      ...parsedCredits,
      monthKey,
      creditsRemaining: Number(parsedCredits.creditsRemaining) || 0,
      unlockedProfileIds: Array.isArray(parsedCredits.unlockedProfileIds)
        ? parsedCredits.unlockedProfileIds
        : [],
      interestValidations:
        parsedCredits.interestValidations &&
        typeof parsedCredits.interestValidations === "object"
          ? parsedCredits.interestValidations
          : {},
      purchaseHistory: Array.isArray(parsedCredits.purchaseHistory)
        ? parsedCredits.purchaseHistory
        : [],
      unlimited: Boolean(parsedCredits.unlimited)
    };
  } catch {
    return defaultScoutCredits;
  }
}

export function saveScoutCredits(credits) {
  const nextCredits = {
    ...defaultScoutCredits,
    ...credits,
    creditsRemaining: Number(credits.creditsRemaining) || 0,
    unlockedProfileIds: Array.isArray(credits.unlockedProfileIds)
      ? credits.unlockedProfileIds
      : [],
    interestValidations:
      credits.interestValidations && typeof credits.interestValidations === "object"
        ? credits.interestValidations
        : {},
    purchaseHistory: Array.isArray(credits.purchaseHistory)
      ? credits.purchaseHistory
      : [],
    unlimited: Boolean(credits.unlimited)
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCredits));
  return nextCredits;
}

export function unlockScoutProfile(playerId) {
  const credits = loadScoutCredits();

  if (credits.unlockedProfileIds.includes(playerId)) {
    return { credits, unlocked: true, reason: "already-unlocked" };
  }

  if (!credits.unlimited && credits.creditsRemaining <= 0) {
    return { credits, unlocked: false, reason: "no-credits" };
  }

  const nextCredits = saveScoutCredits({
    ...credits,
    creditsRemaining: credits.unlimited
      ? credits.creditsRemaining
      : credits.creditsRemaining - 1,
    unlockedProfileIds: [playerId, ...credits.unlockedProfileIds]
  });

  return { credits: nextCredits, unlocked: true, reason: "unlocked" };
}

export function requestScoutValidation(playerId) {
  const credits = loadScoutCredits();
  const existingValidation = credits.interestValidations[playerId];

  if (existingValidation?.status === "approved") {
    return { credits, status: "approved" };
  }

  const validation = {
    status: "pending",
    requestedAt: new Date().toISOString()
  };
  const nextCredits = saveScoutCredits({
    ...credits,
    interestValidations: {
      ...credits.interestValidations,
      [playerId]: validation
    }
  });

  return { credits: nextCredits, status: validation.status };
}

export function approveScoutValidation(playerId) {
  const credits = loadScoutCredits();
  const existingValidation = credits.interestValidations[playerId] || {};
  const validation = {
    ...existingValidation,
    status: "approved",
    approvedAt: new Date().toISOString()
  };
  const nextCredits = saveScoutCredits({
    ...credits,
    interestValidations: {
      ...credits.interestValidations,
      [playerId]: validation
    }
  });

  return { credits: nextCredits, status: validation.status };
}

export function purchaseScoutCredits(packageId) {
  const selectedPackage = creditPackages.find((item) => item.id === packageId);
  if (!selectedPackage) return loadScoutCredits();

  const credits = loadScoutCredits();
  const purchase = {
    id: `purchase-${Date.now()}`,
    label: selectedPackage.label,
    price: selectedPackage.price,
    completedAt: new Date().toISOString()
  };

  return saveScoutCredits({
    ...credits,
    creditsRemaining: selectedPackage.unlimited
      ? credits.creditsRemaining
      : credits.creditsRemaining + selectedPackage.credits,
    unlimited: credits.unlimited || selectedPackage.unlimited,
    purchaseHistory: [purchase, ...credits.purchaseHistory].slice(0, 20)
  });
}
