import { useState } from "react";
import { Link } from "react-router-dom";
import {
  getLeagueMeta,
  loadPlayerProfile,
  resetStoreTestingState,
  simulateSeasonEnd
} from "../lib/playerProfile.js";
import {
  addDemoInterests,
  clearMatchmakingData
} from "../lib/matchmaking.js";

const sportshawkStorageKeys = [
  "sportshawk_account_type",
  "sportshawk_coach_profile",
  "sportshawk_player_profile",
  "sportshawk_scout_credits",
  "sportshawk_matchmaking_connections"
];

export default function ResetPage() {
  const [toast, setToast] = useState("");
  const [seasonResult, setSeasonResult] = useState(null);

  function resetApp() {
    sportshawkStorageKeys.forEach((key) => {
      window.localStorage.removeItem(key);
    });
    window.dispatchEvent(new Event("sportshawk-account-change"));
    window.dispatchEvent(new Event("sportshawk-profile-change"));
    setToast("SportsHawk has been reset.");
  }

  function resetRedemptions() {
    resetStoreTestingState();
    setToast("Redemption history cleared. 500 coins added for testing.");
  }

  function simulateSeasonEndDemo() {
    const before = loadPlayerProfile();
    const updatedProfile = simulateSeasonEnd(before);
    const latestEvent = updatedProfile.leagueHistory?.[0];
    const nextLeague = getLeagueMeta(updatedProfile.currentLeague);

    setSeasonResult({
      status: latestEvent?.status || "safe",
      leagueName: nextLeague.name,
      rank: latestEvent?.finalRank || 20
    });
    setToast("Season 1 ended. Season 2 begins July 1.");
  }

  function clearMatchmaking() {
    clearMatchmakingData();
    setToast("Matchmaking data cleared");
  }

  function addDemoCoachInterests() {
    addDemoInterests();
    setToast("3 demo interests added — check Matchmaking");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-green">
          Reset tools
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-hawk-ink">
          SportsHawk demo reset
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          Use these controls for investor demo testing.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={resetApp}
            className="h-12 rounded-lg bg-hawk-green px-5 text-sm font-black text-white"
          >
            Reset Full App
          </button>
          <button
            type="button"
            onClick={resetRedemptions}
            className="h-12 rounded-lg bg-yellow-300 px-5 text-sm font-black text-hawk-ink"
          >
            Reset Redemption History
          </button>
          <button
            type="button"
            onClick={simulateSeasonEndDemo}
            className="h-12 rounded-lg bg-hawk-ink px-5 text-sm font-black text-hawk-lime sm:col-span-2"
          >
            Simulate Season End
          </button>
          <button
            type="button"
            onClick={clearMatchmaking}
            className="h-12 rounded-lg border border-slate-300 px-5 text-sm font-black text-hawk-green"
          >
            Clear All Matchmaking Data
          </button>
          <button
            type="button"
            onClick={addDemoCoachInterests}
            className="h-12 rounded-lg bg-blue-600 px-5 text-sm font-black text-white"
          >
            Add 3 Demo Coach Interests
          </button>
        </div>

        {toast ? (
          <p className="mt-5 rounded-lg bg-hawk-field p-4 text-sm font-black text-hawk-green">
            {toast}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/onboarding"
            className="text-sm font-black text-hawk-green"
          >
            Go to signup
          </Link>
          <Link
            to="/player/store"
            className="text-sm font-black text-hawk-green"
          >
            Go to store
          </Link>
        </div>
      </section>

      {seasonResult ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-hawk-ink/70 p-4">
          <section className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-green">
              Season End Demo
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-hawk-ink">
              {seasonResult.status === "promotion"
                ? "🎉 You've been promoted"
                : seasonResult.status === "relegation"
                  ? "Relegated this season"
                  : "Holding steady"}
            </h2>
            <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
              {seasonResult.status === "promotion"
                ? `You move to ${seasonResult.leagueName} for Season 2. Come back when Season 2 begins.`
                : seasonResult.status === "relegation"
                  ? `You move to ${seasonResult.leagueName}. Season 2 is a fresh start — train harder.`
                  : `You finished #${seasonResult.rank} and remain in ${seasonResult.leagueName}.`}
            </p>
            <button
              type="button"
              onClick={() => setSeasonResult(null)}
              className="mt-5 h-11 w-full rounded-lg bg-hawk-green px-5 text-sm font-black text-white"
            >
              Got it
            </button>
          </section>
        </div>
      ) : null}
    </div>
  );
}
