import { mockPlayers } from "../data/mockPlayers.js";
import { assignRival, buildRivalProfilePatch } from "../lib/rivals.js";
import { loadPlayerProfile, updatePlayerProfile } from "../lib/playerProfile.js";

export { assignRival } from "../lib/rivals.js";

export function reassignCurrentRival() {
  return updatePlayerProfile((profile) => {
    const rival = assignRival(profile, mockPlayers);

    return {
      ...profile,
      ...buildRivalProfilePatch(rival)
    };
  });
}

export function useRivals() {
  const profile = loadPlayerProfile();
  const rival = mockPlayers.find((player) => player.id === profile.rivalId) || null;

  return {
    rival,
    assignRival,
    reassignCurrentRival
  };
}
