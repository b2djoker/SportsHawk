import { mockPlayers } from "../data/mockPlayers.js";
import {
  defaultCoachProfile,
  loadCoachProfile,
  saveCoachProfile
} from "./account.js";
import {
  defaultPlayerProfile,
  getJugglingMastery,
  getTierLevel,
  loadPlayerProfile,
  masteryTitles,
  savePlayerProfile
} from "./playerProfile.js";

const CONNECTIONS_KEY = "sportshawk_matchmaking_connections";
const COACH_PROFILE_KEY = "sportshawk_coach_profile";

export const defaultPlayerMatchmaking = {
  optedIn: false,
  incomingInterests: [],
  acceptedConnections: [],
  declinedCoaches: [],
  guardianEmail: null,
  guardianApproved: {}
};

export const defaultCoachMatchmaking = {
  expressedInterests: [],
  acceptedConnections: [],
  dailyInterestCount: 0,
  lastInterestDate: null,
  maxDailyInterests: 10
};

export const demoCoaches = [
  {
    id: "coach-01",
    name: "Aniket Sharma",
    club: "Bengaluru Youth FC",
    city: "Bengaluru",
    verified: true,
    aiffId: "AIFF-C-2019-04821"
  },
  {
    id: "coach-02",
    name: "Maya D'Souza",
    club: "Mumbai City Grassroots",
    city: "Mumbai",
    verified: true,
    aiffId: "AIFF-B-2021-7824"
  },
  {
    id: "coach-03",
    name: "Rahul Banerjee",
    club: "Kolkata Technical Academy",
    city: "Kolkata",
    verified: true,
    aiffId: "AIFF-D-2020-3927"
  }
];

export function normalizePlayerMatchmaking(matchmaking = {}) {
  return {
    ...defaultPlayerMatchmaking,
    ...matchmaking,
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

export function normalizeCoachMatchmaking(matchmaking = {}) {
  const today = new Date().toDateString();
  const lastInterestDate = matchmaking.lastInterestDate || null;

  return {
    ...defaultCoachMatchmaking,
    ...matchmaking,
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

export function withPlayerMatchmaking(profile = loadPlayerProfile()) {
  return {
    ...defaultPlayerProfile,
    ...profile,
    matchmaking: normalizePlayerMatchmaking(profile.matchmaking)
  };
}

export function withCoachMatchmaking(coach = loadCoachProfile()) {
  return {
    ...defaultCoachProfile,
    ...coach,
    matchmaking: normalizeCoachMatchmaking(coach.matchmaking)
  };
}

export function savePlayerMatchmaking(matchmaking) {
  const profile = withPlayerMatchmaking();
  return savePlayerProfile({
    ...profile,
    matchmaking: normalizePlayerMatchmaking(matchmaking)
  });
}

export function saveCoachMatchmaking(matchmaking) {
  const coach = withCoachMatchmaking();
  return saveCoachProfile({
    ...coach,
    matchmaking: normalizeCoachMatchmaking(matchmaking)
  });
}

export function maskAiffId(aiffId = "") {
  const clean = String(aiffId || "AIFF-0000-0000");
  const last4 = clean.slice(-4);
  return `AIFF-****-${last4}`;
}

export function isMinor(profile) {
  return Number(profile.age) > 0 && Number(profile.age) < 18;
}

export function getAgeGroup(age) {
  const value = Number(age) || 18;
  if (value < 16) return "U-16";
  if (value < 18) return "U-18";
  if (value < 21) return "U-21";
  return "Senior";
}

export function buildCompositeScore(player) {
  const sessions = Number(player.sessionsCompleted) || 0;
  const points = Number(player.totalPoints ?? player.weeklyPoints) || 0;
  const streak = Number(player.streakCount) || 0;
  return Math.min(500, Math.round(points / 25 + sessions * 6 + streak * 8));
}

export function buildCoachPlayerPool(profile = loadPlayerProfile()) {
  const localPlayer = withPlayerMatchmaking(profile);
  const visibleLocalPlayer =
    localPlayer.matchmaking.optedIn &&
    ["Pro", "Elite"].includes(localPlayer.subscriptionTier)
      ? [
          {
            id: "local-player",
            source: "local",
            name: localPlayer.name,
            age: localPlayer.age,
            ageGroup: getAgeGroup(localPlayer.age),
            position: localPlayer.position,
            city: localPlayer.city,
            tierLevel: localPlayer.tierLevel,
            subscriptionTier: localPlayer.subscriptionTier,
            sessionsCompleted: localPlayer.sessionsCompleted,
            streakCount: localPlayer.streakCount,
            bestStreakCount: localPlayer.bestStreakCount,
            compositeScore: buildCompositeScore(localPlayer),
            mastery: masteryTitles[getJugglingMastery(localPlayer).level],
            isMinor: isMinor(localPlayer)
          }
        ]
      : [];

  const mockPool = mockPlayers.map((player, index) => {
    const points = Number(player.weeklyPoints ?? player.weeklyPts) || 0;
    const subscriptionTier = index % 4 === 0 ? "Elite" : "Pro";
    return {
      id: player.id,
      source: "mock",
      name: player.name,
      age: 15 + (index % 8),
      ageGroup: getAgeGroup(15 + (index % 8)),
      position: simplifyPosition(player.position),
      city: player.city,
      tierLevel: getTierLevel(points),
      subscriptionTier,
      sessionsCompleted: 10 + index * 3,
      streakCount: player.streakCount,
      bestStreakCount: Math.max(player.streakCount + 4, 8),
      compositeScore: Math.min(500, Math.round(points / 5)),
      mastery: ["Novice", "Apprentice", "Skilled", "Expert"][index % 4],
      isMinor: 15 + (index % 8) < 18
    };
  });

  return [...visibleLocalPlayer, ...mockPool];
}

export function expressInterest({ player, message = "" }) {
  const coach = withCoachMatchmaking();
  const today = new Date().toDateString();
  const matchmaking = normalizeCoachMatchmaking({
    ...coach.matchmaking,
    lastInterestDate: today
  });

  if (matchmaking.dailyInterestCount >= matchmaking.maxDailyInterests) {
    return { ok: false, reason: "limit" };
  }

  const interest = createInterestObject({
    coach,
    player,
    message
  });
  const nextCoachMatchmaking = {
    ...matchmaking,
    dailyInterestCount: matchmaking.dailyInterestCount + 1,
    lastInterestDate: today,
    expressedInterests: [interest, ...matchmaking.expressedInterests].slice(0, 50)
  };

  saveCoachMatchmaking(nextCoachMatchmaking);

  if (player.source === "local") {
    const profile = withPlayerMatchmaking();
    savePlayerProfile({
      ...profile,
      matchmaking: {
        ...profile.matchmaking,
        incomingInterests: [interest, ...profile.matchmaking.incomingInterests]
      }
    });
  }

  return { ok: true, interest };
}

export function createInterestObject({ coach, player, message = "" }) {
  const expressedAt = new Date().toISOString();
  const playerIsMinor = Boolean(player.isMinor);
  const license = coach.license || "AIFF-C-2019-04821";
  return {
    id: `interest-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    coachId: coach.id || "local-coach",
    coachName: coach.name || "Verified Coach",
    coachClub: coach.organization || "SportsHawk Academy",
    coachCity: coach.city || "City pending",
    coachVerified: coach.verificationStatus === "Approved",
    coachAiffId: maskAiffId(license),
    expressedAt,
    message: String(message || "").slice(0, 120),
    status: playerIsMinor ? "guardian_pending" : "pending",
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    guardianNotified: playerIsMinor
  };
}

export function acceptInterest(interestId) {
  const profile = withPlayerMatchmaking();
  const interest = profile.matchmaking.incomingInterests.find(
    (item) => item.id === interestId
  );
  if (!interest) return null;

  const connection = createConnection(interest, profile);
  const nextIncoming = profile.matchmaking.incomingInterests.map((item) =>
    item.id === interestId ? { ...item, status: "accepted" } : item
  );
  const nextProfile = savePlayerProfile({
    ...profile,
    matchmaking: {
      ...profile.matchmaking,
      incomingInterests: nextIncoming,
      acceptedConnections: [
        connection,
        ...profile.matchmaking.acceptedConnections
      ].slice(0, 50)
    }
  });

  const coach = withCoachMatchmaking();
  saveCoachProfile({
    ...coach,
    matchmaking: {
      ...coach.matchmaking,
      acceptedConnections: [
        connection,
        ...coach.matchmaking.acceptedConnections
      ].slice(0, 50),
      expressedInterests: coach.matchmaking.expressedInterests.map((item) =>
        item.id === interestId ? { ...item, status: "accepted" } : item
      )
    }
  });
  upsertConnection(connection);
  return { connection, profile: nextProfile };
}

export function declineInterest(interestId, guardianApproved = null) {
  const profile = withPlayerMatchmaking();
  const interest = profile.matchmaking.incomingInterests.find(
    (item) => item.id === interestId
  );
  if (!interest) return profile;

  return savePlayerProfile({
    ...profile,
    matchmaking: {
      ...profile.matchmaking,
      incomingInterests: profile.matchmaking.incomingInterests.map((item) =>
        item.id === interestId ? { ...item, status: "declined" } : item
      ),
      declinedCoaches: [
        interest.coachId,
        ...profile.matchmaking.declinedCoaches
      ],
      guardianApproved:
        guardianApproved === null
          ? profile.matchmaking.guardianApproved
          : {
              ...profile.matchmaking.guardianApproved,
              [interest.coachId]: guardianApproved
            }
    }
  });
}

export function setGuardianApproval(interestId, approved) {
  const profile = withPlayerMatchmaking();
  const interest = profile.matchmaking.incomingInterests.find(
    (item) => item.id === interestId
  );
  if (!interest) return profile;

  if (!approved) return declineInterest(interestId, false);

  return savePlayerProfile({
    ...profile,
    matchmaking: {
      ...profile.matchmaking,
      incomingInterests: profile.matchmaking.incomingInterests.map((item) =>
        item.id === interestId ? { ...item, status: "pending" } : item
      ),
      guardianApproved: {
        ...profile.matchmaking.guardianApproved,
        [interest.coachId]: true
      }
    }
  });
}

export function loadConnections() {
  try {
    const connections = JSON.parse(
      window.localStorage.getItem(CONNECTIONS_KEY) || "[]"
    );
    return Array.isArray(connections) ? connections : [];
  } catch {
    return [];
  }
}

export function saveConnections(connections) {
  window.localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(connections));
  window.dispatchEvent(new Event("sportshawk-matchmaking-change"));
  return connections;
}

export function getConnection(connectionId) {
  return loadConnections().find((connection) => connection.id === connectionId);
}

export function sendMessage(connectionId, senderRole, text) {
  const connections = loadConnections();
  const connection = connections.find((item) => item.id === connectionId);
  if (!connection) return { connection: null, warning: "" };

  const { text: filteredText, warning, systemMessage } = filterMessage(text);
  const sentAt = new Date().toISOString();
  const message = {
    id: `msg-${Date.now()}`,
    senderId: senderRole,
    senderRole,
    text: filteredText,
    sentAt,
    read: false
  };
  const messages = [
    ...(connection.messages || []),
    message,
    ...(systemMessage ? [systemMessage] : [])
  ];
  const nextConnection = {
    ...connection,
    messages,
    lastMessageAt: sentAt
  };
  saveConnections(
    connections.map((item) =>
      item.id === connectionId ? nextConnection : item
    )
  );

  return { connection: nextConnection, warning };
}

export function markConnectionRead(connectionId, viewerRole) {
  const connections = loadConnections();
  saveConnections(
    connections.map((connection) =>
      connection.id === connectionId
        ? {
            ...connection,
            messages: (connection.messages || []).map((message) =>
              message.senderRole !== viewerRole ? { ...message, read: true } : message
            )
          }
        : connection
    )
  );
}

export function getUnreadCount(role) {
  return loadConnections().reduce(
    (count, connection) =>
      count +
      (connection.messages || []).filter(
        (message) => message.senderRole !== role && !message.read
      ).length,
    0
  );
}

export function clearMatchmakingData() {
  const profile = withPlayerMatchmaking();
  const coach = withCoachMatchmaking();
  savePlayerProfile({
    ...profile,
    matchmaking: defaultPlayerMatchmaking
  });
  window.localStorage.setItem(
    COACH_PROFILE_KEY,
    JSON.stringify({
      ...coach,
      matchmaking: defaultCoachMatchmaking
    })
  );
  saveConnections([]);
}

export function addDemoInterests() {
  const profile = withPlayerMatchmaking();
  const minor = isMinor(profile);
  const interests = demoCoaches.map((coach, index) =>
    createInterestObject({
      coach: {
        ...coach,
        organization: coach.club,
        verificationStatus: "Approved",
        license: coach.aiffId
      },
      player: { isMinor: minor && index === 2 },
      message:
        index === 0
          ? "Your juggling progress and streak show real potential. Would love to discuss a development plan."
          : ""
    })
  );

  savePlayerProfile({
    ...profile,
    matchmaking: {
      ...profile.matchmaking,
      incomingInterests: [
        ...interests,
        ...profile.matchmaking.incomingInterests
      ].slice(0, 50)
    }
  });
}

function createConnection(interest, profile) {
  const connectedAt = new Date().toISOString();
  return {
    id: `connection-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    coachId: interest.coachId,
    playerId: "local-player",
    coachName: interest.coachName,
    playerName: profile.name || "Player",
    playerCity: profile.city,
    playerPosition: profile.position,
    playerTier: profile.tierLevel,
    connectedAt,
    messages: [
      {
        id: `system-${Date.now()}`,
        senderId: "system",
        senderRole: "system",
        text: "Connection established via SportsHawk",
        sentAt: connectedAt,
        read: true
      },
      {
        id: `system-${Date.now()}-platform`,
        senderId: "system",
        senderRole: "system",
        text: "Remember: keep all agreements on-platform",
        sentAt: connectedAt,
        read: true
      }
    ],
    lastMessageAt: null,
    status: "active"
  };
}

function upsertConnection(connection) {
  const connections = loadConnections();
  saveConnections([
    connection,
    ...connections.filter((item) => item.id !== connection.id)
  ]);
}

function filterMessage(text) {
  let warning = "";
  let filtered = String(text || "").slice(0, 500);
  const phonePattern = /\b[6-9]\d{9}\b/g;
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const platformPattern = /\b(whatsapp|telegram)\b/i;

  if (phonePattern.test(filtered)) {
    filtered = filtered.replace(phonePattern, "[Phone number removed by SportsHawk]");
    warning = "Contact details cannot be shared in chat. All agreements must go through SportsHawk.";
  }

  if (emailPattern.test(filtered)) {
    filtered = filtered.replace(emailPattern, "[Email removed by SportsHawk]");
    warning = "Contact details cannot be shared in chat. All agreements must go through SportsHawk.";
  }

  const systemMessage = platformPattern.test(filtered)
    ? {
        id: `system-review-${Date.now()}`,
        senderId: "system",
        senderRole: "system",
        text: "Please keep communication on-platform during the trial period.",
        sentAt: new Date().toISOString(),
        read: true
      }
    : null;

  return { text: filtered, warning, systemMessage };
}

function simplifyPosition(position = "") {
  const value = String(position).toLowerCase();
  if (value.includes("goal")) return "GK";
  if (value.includes("back") || value.includes("def")) return "DEF";
  if (value.includes("mid")) return "MID";
  return "FWD";
}
