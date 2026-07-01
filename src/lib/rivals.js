import { mockPlayers } from "../data/mockPlayers.js";

export function assignRival(profile, players = mockPlayers) {
  const sessionsCompleted =
    Number(profile.sessionsCompleted) || (profile.drillHistory || []).length;
  if (sessionsCompleted === 0) return null;

  const playerPts = Number(profile.weeklyPts ?? profile.totalPoints) || 0;
  const candidates = players.filter((player) => {
    const rivalPts = Number(player.weeklyPts ?? player.weeklyPoints) || 0;
    const ptsDiff = rivalPts - playerPts;
    return ptsDiff > 0 && ptsDiff <= 300 && player.id !== profile.rivalId;
  });

  if (candidates.length === 0) {
    const below = players.filter((player) => {
      const rivalPts = Number(player.weeklyPts ?? player.weeklyPoints) || 0;
      const ptsDiff = playerPts - rivalPts;
      return ptsDiff >= 0 && ptsDiff <= 100 && player.id !== profile.rivalId;
    });

    return below.length > 0
      ? below[Math.floor(Math.random() * below.length)]
      : null;
  }

  candidates.sort(
    (a, b) =>
      (Number(a.weeklyPts ?? a.weeklyPoints) || 0) -
      playerPts -
      ((Number(b.weeklyPts ?? b.weeklyPoints) || 0) - playerPts)
  );

  return candidates[0];
}

export function buildRivalProfilePatch(rival) {
  return {
    rivalId: rival?.id || null,
    rivalName: rival?.name || null,
    rivalCity: rival?.city || null,
    rivalWeeklyPts: rival ? Number(rival.weeklyPts ?? rival.weeklyPoints) || 0 : null,
    rivalAssignedAt: rival ? new Date().toISOString() : null
  };
}

export function updateRivalAfterScore(profile, newWeeklyPts, players = mockPlayers) {
  const currentRivalPts = Number(profile.rivalWeeklyPts);
  const needsFirstRival = !profile.rivalId;
  const rivalOvertaken =
    profile.rivalId && Number.isFinite(currentRivalPts) && newWeeklyPts > currentRivalPts;

  if (!needsFirstRival && !rivalOvertaken) {
    return {
      profile,
      event: null
    };
  }

  const newRival = assignRival({ ...profile, weeklyPts: newWeeklyPts }, players);
  const nextProfile = {
    ...profile,
    ...buildRivalProfilePatch(newRival)
  };

  if (!rivalOvertaken) {
    return {
      profile: nextProfile,
      event: null
    };
  }

  return {
    profile: {
      ...nextProfile,
      rivalsOvercome: (Number(profile.rivalsOvercome) || 0) + 1,
      lastRivalEvent: {
        id: `rival-${Date.now()}`,
        rivalName: profile.rivalName,
        rivalCity: profile.rivalCity,
        newRivalName: newRival?.name || null,
        happenedAt: new Date().toISOString()
      }
    },
    event: {
      rivalName: profile.rivalName,
      rivalCity: profile.rivalCity,
      newRivalName: newRival?.name || null
    }
  };
}
