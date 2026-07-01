import {
  BadgeCheck,
  Heart,
  LayoutGrid,
  MessageCircle,
  SlidersHorizontal,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  buildCoachPlayerPool,
  expressInterest,
  loadConnections,
  withCoachMatchmaking
} from "../lib/matchmaking.js";
import { isCoachVerified } from "../lib/account.js";

const defaultFilters = {
  positions: [],
  ageGroups: [],
  city: "All cities",
  tier: "All tiers",
  subscription: "All",
  streakMinimum: 0,
  minScore: 0,
  maxScore: 500
};

export default function CoachMatchmakingPage() {
  const [coach, setCoach] = useState(() => withCoachMatchmaking());
  const [activeTab, setActiveTab] = useState("discover");
  const [gridMode, setGridMode] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [introMessage, setIntroMessage] = useState("");
  const [toast, setToast] = useState("");
  const verified = isCoachVerified(coach);
  const pool = useMemo(() => buildCoachPlayerPool(), []);
  const filteredPlayers = filterPlayers(pool, filters);
  const activePlayer = filteredPlayers[0];
  const connections = loadConnections();
  const used = coach.matchmaking.dailyInterestCount;
  const max = coach.matchmaking.maxDailyInterests;

  function openInterest(player) {
    if (used >= max) {
      setToast("Daily limit reached. Come back tomorrow or upgrade for more interests.");
      return;
    }
    setSelectedPlayer(player);
    setIntroMessage("");
  }

  function sendInterest(message = "") {
    const result = expressInterest({
      player: selectedPlayer,
      message
    });
    setSelectedPlayer(null);
    setIntroMessage("");
    setCoach(withCoachMatchmaking());
    setToast(
      result.ok
        ? "Interest sent! The player will be notified and can choose to connect."
        : "Daily limit reached. Come back tomorrow or upgrade for more interests."
    );
  }

  if (!verified) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-amber-800">
            Verification required
          </p>
          <h1 className="mt-3 text-3xl font-black text-hawk-ink">
            Matchmaking opens after AIFF verification.
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-amber-900">
            SportsHawk only allows verified coaches to express formal interest
            in player profiles.
          </p>
          <Link
            to="/coach"
            className="mt-5 inline-flex h-11 items-center rounded-lg bg-hawk-green px-5 text-sm font-black text-white"
          >
            Back to coach home
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-green">
            Player Matchmaking
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-hawk-ink">
            Express interest in players you want to work with.
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
            Interest is formal and protected. A chat opens only after mutual
            acceptance, with guardian approval for U-18 players.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">
            Interests used today
          </p>
          <p className="mt-2 text-2xl font-black text-hawk-ink">
            {used} / {max}
          </p>
          <div className="mt-3 h-2 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-yellow-300"
              style={{ width: `${Math.min(100, (used / max) * 100)}%` }}
            />
          </div>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg bg-slate-100 p-1">
          {["discover", "connections", "sent"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={[
                "h-10 rounded-md px-4 text-sm font-black capitalize",
                activeTab === tab ? "bg-white text-hawk-green shadow-sm" : "text-slate-500"
              ].join(" ")}
            >
              {tab === "sent" ? "Interests sent" : tab}
            </button>
          ))}
        </div>
        {activeTab === "discover" ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-black text-hawk-green"
            >
              <SlidersHorizontal size={17} />
              {filteredPlayers.length} matches
            </button>
            <button
              type="button"
              onClick={() => setGridMode((value) => !value)}
              className="grid h-10 w-10 place-items-center rounded-lg border border-slate-300 text-hawk-green"
            >
              <LayoutGrid size={17} />
            </button>
          </div>
        ) : null}
      </div>

      {filtersOpen && activeTab === "discover" ? (
        <FilterPanel filters={filters} setFilters={setFilters} pool={pool} />
      ) : null}

      {activeTab === "discover" ? (
        gridMode ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlayers.map((player) => (
              <MatchPlayerCard
                key={player.id}
                player={player}
                onInterest={() => openInterest(player)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-7 flex justify-center">
            {activePlayer ? (
              <MatchPlayerCard
                player={activePlayer}
                large
                onInterest={() => openInterest(activePlayer)}
              />
            ) : (
              <EmptyState text="No players match these criteria." />
            )}
          </div>
        )
      ) : null}

      {activeTab === "connections" ? (
        <ConnectionList connections={connections} role="coach" />
      ) : null}

      {activeTab === "sent" ? (
        <SentInterests interests={coach.matchmaking.expressedInterests} />
      ) : null}

      {selectedPlayer ? (
        <InterestSheet
          message={introMessage}
          setMessage={setIntroMessage}
          onClose={() => setSelectedPlayer(null)}
          onSend={sendInterest}
        />
      ) : null}

      {toast ? (
        <div className="fixed bottom-24 right-4 z-50 max-w-sm rounded-lg border border-emerald-200 bg-white p-4 text-sm font-black text-hawk-green shadow-soft">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function MatchPlayerCard({ player, onInterest, large = false }) {
  return (
    <article
      className={[
        "rounded-xl border border-slate-200 bg-white p-5 shadow-soft",
        large ? "w-[min(88vw,420px)]" : ""
      ].join(" ")}
    >
      <div className="rounded-lg bg-hawk-green p-4 text-white">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black">
            {player.tierLevel}
          </span>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black">
            {player.ageGroup}
          </span>
        </div>
        <p className="mt-6 text-5xl font-black tracking-tight">
          {player.position}
        </p>
        <p className="mt-2 text-sm font-bold text-white/70">{player.city}</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <MiniStat label="Composite" value={player.compositeScore} gold />
        <MiniStat label="Sessions" value={player.sessionsCompleted} />
        <MiniStat label="Streak" value={`${player.streakCount}d`} />
        <MiniStat label="Best streak" value={`${player.bestStreakCount}d`} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {player.subscriptionTier === "Elite" ? (
          <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-purple-700">
            ⭐ Verified performance
          </span>
        ) : null}
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
          Juggling: {player.mastery}
        </span>
      </div>
      <div className="mt-5 flex items-center justify-center gap-5">
        <button
          type="button"
          className="grid h-14 w-14 place-items-center rounded-full border border-slate-300 text-slate-400"
        >
          <X size={24} />
        </button>
        <button
          type="button"
          onClick={onInterest}
          className="grid h-16 w-16 place-items-center rounded-full bg-yellow-300 text-hawk-ink shadow-lg"
        >
          <Heart size={28} fill="currentColor" />
        </button>
      </div>
    </article>
  );
}

function FilterPanel({ filters, setFilters, pool }) {
  const cities = ["All cities", ...new Set(pool.map((player) => player.city))];
  return (
    <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-black text-hawk-ink">Filters</p>
        <button
          type="button"
          onClick={() => setFilters(defaultFilters)}
          className="text-xs font-black text-hawk-green"
        >
          Reset filters
        </button>
      </div>
      <ToggleGroup
        label="Position"
        options={["GK", "DEF", "MID", "FWD"]}
        values={filters.positions}
        onChange={(values) => setFilters({ ...filters, positions: values })}
      />
      <ToggleGroup
        label="Age group"
        options={["U-16", "U-18", "U-21", "Senior"]}
        values={filters.ageGroups}
        onChange={(values) => setFilters({ ...filters, ageGroups: values })}
      />
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <SelectField
          label="City"
          value={filters.city}
          options={cities}
          onChange={(city) => setFilters({ ...filters, city })}
        />
        <SelectField
          label="Tier"
          value={filters.tier}
          options={["All tiers", "Bronze", "Silver", "Gold", "Elite"]}
          onChange={(tier) => setFilters({ ...filters, tier })}
        />
        <SelectField
          label="Subscription"
          value={filters.subscription}
          options={["All", "Pro only", "Elite only"]}
          onChange={(subscription) => setFilters({ ...filters, subscription })}
        />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <SelectField
          label="Streak"
          value={String(filters.streakMinimum)}
          options={["0", "7", "14", "30"]}
          onChange={(value) =>
            setFilters({ ...filters, streakMinimum: Number(value) })
          }
        />
        <NumberField
          label="Min score"
          value={filters.minScore}
          onChange={(minScore) => setFilters({ ...filters, minScore })}
        />
        <NumberField
          label="Max score"
          value={filters.maxScore}
          onChange={(maxScore) => setFilters({ ...filters, maxScore })}
        />
      </div>
    </section>
  );
}

function ToggleGroup({ label, options, values, onChange }) {
  function toggle(option) {
    onChange(
      values.includes(option)
        ? values.filter((value) => value !== option)
        : [...values, option]
    );
  }
  return (
    <div className="mt-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={[
              "rounded-full border px-3 py-1.5 text-xs font-black",
              values.includes(option)
                ? "border-yellow-300 bg-yellow-300 text-hawk-ink"
                : "border-slate-300 text-slate-600"
            ].join(" ")}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function InterestSheet({ message, setMessage, onClose, onSend }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-hawk-ink/60">
      <section className="w-full rounded-t-2xl bg-white p-5 shadow-2xl">
        <div className="mx-auto h-1.5 w-16 rounded-full bg-slate-200" />
        <h2 className="mt-5 text-2xl font-black text-hawk-ink">
          Add an intro message
        </h2>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value.slice(0, 120))}
          placeholder="Hi! I coach at your academy and I think your profile shows real potential..."
          className="mt-4 min-h-32 w-full rounded-lg border border-slate-300 p-3 text-sm font-bold outline-none focus:border-hawk-green"
        />
        <p className="mt-2 text-right text-xs font-black text-slate-500">
          {message.length} / 120
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onSend(message)}
            className="h-12 rounded-lg bg-yellow-300 px-5 text-sm font-black text-hawk-ink"
          >
            Send with message
          </button>
          <button
            type="button"
            onClick={() => onSend("")}
            className="h-12 rounded-lg border border-slate-300 px-5 text-sm font-black text-slate-600"
          >
            Send without message
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 h-10 w-full text-sm font-black text-slate-400"
        >
          Cancel
        </button>
      </section>
    </div>
  );
}

function ConnectionList({ connections, role }) {
  if (!connections.length) return <EmptyState text="No accepted connections yet." />;
  return (
    <div className="mt-5 grid gap-3">
      {connections.map((connection) => (
        <Link
          key={connection.id}
          to={`/${role}/chat/${connection.id}`}
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p className="font-black text-hawk-ink">
            {role === "coach" ? connection.playerName : connection.coachName}
          </p>
          <p className="mt-1 text-sm font-bold text-slate-500">
            Connected {relativeDays(connection.connectedAt)}
          </p>
          <p className="mt-2 text-sm font-black text-hawk-green">Open Chat →</p>
        </Link>
      ))}
    </div>
  );
}

function SentInterests({ interests }) {
  if (!interests.length) return <EmptyState text="No interests sent yet." />;
  return (
    <div className="mt-5 grid gap-3">
      {interests.map((interest) => (
        <article
          key={interest.id}
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p className="font-black text-hawk-ink">Player profile request</p>
          <p className="mt-1 text-sm font-bold text-slate-500">
            {interest.status === "accepted"
              ? "Connected!"
              : interest.status === "declined"
                ? "Not interested"
                : interest.status === "expired"
                  ? "Expired"
                  : `Awaiting response · ${expiryText(interest.expiresAt)}`}
          </p>
        </article>
      ))}
    </div>
  );
}

function MiniStat({ label, value, gold = false }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className={gold ? "text-2xl font-black text-yellow-600" : "text-xl font-black text-hawk-ink"}>
        {value}
      </p>
      <p className="text-xs font-bold text-slate-500">{label}</p>
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label>
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <label>
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        type="number"
        value={value}
        min="0"
        max="500"
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-bold"
      />
    </label>
  );
}

function EmptyState({ text }) {
  return (
    <section className="mt-5 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <Heart className="mx-auto text-yellow-500" size={44} />
      <p className="mt-3 text-sm font-black text-slate-500">{text}</p>
    </section>
  );
}

function filterPlayers(players, filters) {
  return players.filter((player) => {
    if (filters.positions.length && !filters.positions.includes(player.position)) return false;
    if (filters.ageGroups.length && !filters.ageGroups.includes(player.ageGroup)) return false;
    if (filters.city !== "All cities" && player.city !== filters.city) return false;
    if (filters.tier !== "All tiers" && player.tierLevel !== filters.tier) return false;
    if (filters.subscription === "Pro only" && player.subscriptionTier !== "Pro") return false;
    if (filters.subscription === "Elite only" && player.subscriptionTier !== "Elite") return false;
    if (player.streakCount < filters.streakMinimum) return false;
    return player.compositeScore >= filters.minScore && player.compositeScore <= filters.maxScore;
  });
}

function relativeDays(date) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
  return days === 0 ? "today" : `${days} day${days === 1 ? "" : "s"} ago`;
}

function expiryText(expiresAt) {
  const days = Math.max(0, Math.ceil((expiresAt - Date.now()) / 86400000));
  return `expires in ${days} day${days === 1 ? "" : "s"}`;
}
