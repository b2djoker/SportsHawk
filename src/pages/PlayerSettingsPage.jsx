import { CheckCircle2, Lock, ShieldCheck, UsersRound } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  isMinor,
  normalizePlayerMatchmaking,
  withPlayerMatchmaking
} from "../lib/matchmaking.js";
import { hasSubscription, savePlayerProfile } from "../lib/playerProfile.js";

export default function PlayerSettingsPage() {
  const [player, setPlayer] = useState(() => withPlayerMatchmaking());
  const [guardianEmail, setGuardianEmail] = useState(
    player.matchmaking.guardianEmail || ""
  );
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const minor = isMinor(player);
  const visibleToCoaches =
    player.matchmaking.optedIn && hasSubscription(player, "Pro");

  function enableMatchmaking() {
    setError("");
    if (minor && !isValidEmail(guardianEmail)) {
      setError("Enter a valid parent or guardian email before enabling.");
      return;
    }

    save({
      ...player.matchmaking,
      optedIn: true,
      guardianEmail: minor ? guardianEmail : player.matchmaking.guardianEmail
    });
    setToast("Matchmaking enabled! Coaches can now express interest in your profile.");
  }

  function disableMatchmaking() {
    const confirmed = window.confirm(
      "Disabling matchmaking will pause all pending interests. Existing connections are unaffected."
    );
    if (!confirmed) return;
    save({
      ...player.matchmaking,
      optedIn: false
    });
    setToast("Matchmaking disabled. Existing connections remain active.");
  }

  function saveGuardianEmail() {
    if (minor && !isValidEmail(guardianEmail)) {
      setError("Enter a valid parent or guardian email.");
      return;
    }
    save({
      ...player.matchmaking,
      guardianEmail
    });
    setToast("Guardian email updated.");
  }

  function save(matchmaking) {
    const nextPlayer = savePlayerProfile({
      ...player,
      matchmaking: normalizePlayerMatchmaking(matchmaking)
    });
    setPlayer(withPlayerMatchmaking(nextPlayer));
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-10">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-green">
          Settings
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-hawk-ink">
          Player settings
        </h1>
      </section>

      <section className="mt-5 rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black text-hawk-ink">
                Coach Matchmaking
              </h2>
              {player.matchmaking.optedIn ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                  Active
                </span>
              ) : null}
            </div>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
              Allow verified coaches to express interest in your profile. You
              control who you connect with and review every coach before
              accepting.
            </p>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-hawk-field text-hawk-green">
            <UsersRound size={24} />
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <TrustRow icon="🛡️" text="You approve every connection — no unsolicited messages" />
          <TrustRow icon="✅" text="Coaches are AIFF-verified before they can contact you" />
          <TrustRow icon="🔒" text="Your contact details are never shared directly" />
          <TrustRow icon="👨‍👩‍👧" text="Under-18 players require guardian approval" />
        </div>

        {minor ? (
          <label className="mt-5 block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Guardian / Parent email
            </span>
            <input
              value={guardianEmail}
              onChange={(event) => setGuardianEmail(event.target.value)}
              type="email"
              placeholder="guardian@example.com"
              className="mt-2 h-12 w-full rounded-lg border border-slate-300 px-4 text-sm font-bold outline-none focus:border-hawk-green"
            />
            <p className="mt-2 text-xs font-semibold text-slate-500">
              A parent or guardian must approve each coach connection for
              players under 18.
            </p>
          </label>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-black text-red-700">
            {error}
          </p>
        ) : null}

        {!hasSubscription(player, "Pro") ? (
          <Link
            to="/player/subscription"
            className="mt-5 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-black text-amber-900"
          >
            <Lock size={18} />
            Upgrade to Pro to appear in coach matchmaking →
          </Link>
        ) : null}

        {player.matchmaking.optedIn ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={disableMatchmaking}
              className="h-12 rounded-lg border border-slate-300 px-5 text-sm font-black text-slate-600"
            >
              Disable matchmaking
            </button>
            {minor ? (
              <button
                type="button"
                onClick={saveGuardianEmail}
                className="h-12 rounded-lg bg-hawk-green px-5 text-sm font-black text-white"
              >
                Save guardian email
              </button>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            onClick={enableMatchmaking}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-yellow-300 px-5 text-sm font-black text-hawk-ink sm:w-auto"
          >
            <ShieldCheck size={18} />
            Enable Matchmaking
          </button>
        )}

        {visibleToCoaches ? (
          <p className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">
            <CheckCircle2 size={17} />
            Your profile is visible to coaches who match your position and age group
          </p>
        ) : null}

        {toast ? (
          <p className="mt-5 rounded-lg bg-hawk-field p-4 text-sm font-black text-hawk-green">
            {toast}
          </p>
        ) : null}
      </section>
    </div>
  );
}

function TrustRow({ icon, text }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
      <span className="text-xl">{icon}</span>
      <p className="text-sm font-bold leading-5 text-slate-700">{text}</p>
    </div>
  );
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}
