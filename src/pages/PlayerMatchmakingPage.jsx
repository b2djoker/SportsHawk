import {
  BadgeCheck,
  CheckCircle2,
  Heart,
  MessageCircle,
  X
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  acceptInterest,
  declineInterest,
  isMinor,
  loadConnections,
  setGuardianApproval,
  withPlayerMatchmaking
} from "../lib/matchmaking.js";

export default function PlayerMatchmakingPage() {
  const navigate = useNavigate();
  const [player, setPlayer] = useState(() => withPlayerMatchmaking());
  const [activeTab, setActiveTab] = useState("incoming");
  const [toast, setToast] = useState("");
  const [successConnection, setSuccessConnection] = useState(null);
  const minor = isMinor(player);
  const activeInterests = player.matchmaking.incomingInterests.filter(
    (interest) => !["accepted", "declined", "expired"].includes(interest.status)
  );
  const connections = loadConnections();

  function refresh(message = "") {
    setPlayer(withPlayerMatchmaking());
    if (message) {
      setToast(message);
      window.setTimeout(() => setToast(""), 2600);
    }
  }

  function approveGuardian(interestId) {
    setGuardianApproval(interestId, true);
    refresh("Guardian approved this connection");
  }

  function declineGuardian(interestId) {
    setGuardianApproval(interestId, false);
    refresh("Guardian declined this connection");
  }

  function accept(interest) {
    const confirmed = window.confirm(
      `Connect with ${interest.coachName} from ${interest.coachClub}? Your contact details are never shared.`
    );
    if (!confirmed) return;
    const result = acceptInterest(interest.id);
    if (result?.connection) {
      setSuccessConnection(result.connection);
      refresh();
    }
  }

  function decline(interest) {
    declineInterest(interest.id);
    refresh("Declined — this coach won't appear again");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-green">
          Matchmaking
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-hawk-ink">
          Coach connection requests
        </h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
          Accept only coaches you want to speak with. Chat stays inside
          SportsHawk and direct contact details are filtered.
        </p>
      </section>

      <div className="mt-5 inline-flex rounded-lg bg-slate-100 p-1">
        {["incoming", "connections"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={[
              "h-10 rounded-md px-4 text-sm font-black capitalize",
              activeTab === tab ? "bg-white text-hawk-green shadow-sm" : "text-slate-500"
            ].join(" ")}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "incoming" ? (
        <section className="mt-5 grid gap-4">
          {!activeInterests.length ? (
            <EmptyIncoming optedIn={player.matchmaking.optedIn} />
          ) : (
            activeInterests.map((interest) => {
              const guardianValue =
                player.matchmaking.guardianApproved?.[interest.coachId];
              const waitingGuardian =
                minor &&
                interest.status === "guardian_pending" &&
                guardianValue === undefined;
              const guardianDeclined = guardianValue === false;
              const buttonsEnabled = !waitingGuardian && !guardianDeclined;

              return (
                <article
                  key={interest.id}
                  className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-black text-hawk-ink">
                          {interest.coachName}
                        </h2>
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                          <BadgeCheck size={14} fill="currentColor" />
                          Verified AIFF Coach
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-bold text-slate-500">
                        {interest.coachClub} · {interest.coachCity}
                      </p>
                      <p className="mt-2 text-xs font-black text-slate-500">
                        AIFF License: {interest.coachAiffId}
                      </p>
                    </div>
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-black text-amber-800">
                      {expiryText(interest.expiresAt)}
                    </p>
                  </div>

                  <div className="mt-5 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                    {interest.message ? (
                      <p className="text-sm font-bold leading-6 text-hawk-ink">
                        “{interest.message}”
                      </p>
                    ) : (
                      <p className="text-sm font-semibold italic text-slate-500">
                        This coach expressed interest in your profile.
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                      Your score: {Math.min(500, Math.round((player.totalPoints || 0) / 25))}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                      Seeking: {player.position} players
                    </span>
                  </div>

                  {waitingGuardian ? (
                    <>
                      <div className="mt-4 rounded-lg bg-amber-50 p-4 text-sm font-bold text-amber-900">
                        👨‍👩‍👧 Waiting for guardian approval. A notification was sent to{" "}
                        {player.matchmaking.guardianEmail || "your guardian"}.
                      </div>
                      <div className="mt-3 rounded-lg border border-dashed border-slate-300 p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                          Guardian demo
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-600">
                          In production, guardian receives an email and approves
                          via a secure link.
                        </p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => approveGuardian(interest.id)}
                            className="h-11 rounded-lg bg-emerald-600 text-sm font-black text-white"
                          >
                            Simulate Guardian Approval ✓
                          </button>
                          <button
                            type="button"
                            onClick={() => declineGuardian(interest.id)}
                            className="h-11 rounded-lg bg-red-600 text-sm font-black text-white"
                          >
                            Simulate Guardian Decline ✗
                          </button>
                        </div>
                      </div>
                    </>
                  ) : guardianValue === true ? (
                    <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-black text-emerald-700">
                      Guardian approved ✓
                    </p>
                  ) : guardianDeclined ? (
                    <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-black text-red-700">
                      Guardian declined this connection
                    </p>
                  ) : null}

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={!buttonsEnabled}
                      onClick={() => accept(interest)}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-black text-white disabled:opacity-40"
                    >
                      <CheckCircle2 size={18} />
                      Accept
                    </button>
                    <button
                      type="button"
                      disabled={!buttonsEnabled}
                      onClick={() => decline(interest)}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 text-sm font-black text-slate-600 disabled:opacity-40"
                    >
                      <X size={18} />
                      Decline
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>
      ) : (
        <Connections connections={connections} />
      )}

      {successConnection ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-hawk-ink/70 p-4">
          <section className="w-full max-w-md rounded-xl bg-white p-6 text-center shadow-2xl">
            <CheckCircle2 className="mx-auto text-emerald-600" size={64} />
            <h2 className="mt-4 text-3xl font-black text-hawk-ink">
              Connected with {successConnection.coachName}!
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              A chat has opened — say hello 👋
            </p>
            <button
              type="button"
              onClick={() => navigate(`/player/chat/${successConnection.id}`)}
              className="mt-5 h-12 w-full rounded-lg bg-yellow-300 text-sm font-black text-hawk-ink"
            >
              Open Chat →
            </button>
          </section>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-24 right-4 z-50 rounded-lg border border-emerald-200 bg-white p-4 text-sm font-black text-hawk-green shadow-soft">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function EmptyIncoming({ optedIn }) {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <Heart className="mx-auto text-yellow-500" size={64} />
      <h2 className="mt-4 text-2xl font-black text-hawk-ink">
        No coach interests yet
      </h2>
      <p className="mt-2 text-sm font-semibold text-slate-500">
        Keep training to build your profile. Coaches discover players through
        performance data.
      </p>
      {!optedIn ? (
        <Link
          to="/player/settings"
          className="mt-5 inline-flex h-11 items-center rounded-lg bg-yellow-300 px-5 text-sm font-black text-hawk-ink"
        >
          Enable matchmaking in settings →
        </Link>
      ) : null}
    </section>
  );
}

function Connections({ connections }) {
  if (!connections.length) {
    return (
      <section className="mt-5 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
        <MessageCircle className="mx-auto text-hawk-green" size={48} />
        <p className="mt-3 text-sm font-black text-slate-500">
          No active coach connections yet.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-5 grid gap-3">
      {connections.map((connection) => (
        <Link
          key={connection.id}
          to={`/player/chat/${connection.id}`}
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p className="font-black text-hawk-ink">{connection.coachName}</p>
          <p className="mt-1 text-sm font-bold text-slate-500">
            Connected {relativeDays(connection.connectedAt)}
          </p>
          <p className="mt-2 text-sm font-black text-hawk-green">Open Chat →</p>
        </Link>
      ))}
    </section>
  );
}

function relativeDays(date) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
  return days === 0 ? "today" : `${days} day${days === 1 ? "" : "s"} ago`;
}

function expiryText(expiresAt) {
  const days = Math.max(0, Math.ceil((expiresAt - Date.now()) / 86400000));
  return days < 3 ? `Expires in ${days} days` : `Expires in ${days} days`;
}
