import {
  Bell,
  CreditCard,
  LockKeyhole,
  MessageCircle,
  MapPin,
  Medal,
  Send,
  Search,
  ShieldCheck,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  getCardTheme,
  getCardTitle,
  getTierLevel,
  masteryColors,
  masteryTitles
} from "../lib/playerProfile.js";
import {
  approveScoutValidation,
  creditPackages,
  loadScoutCredits,
  purchaseScoutCredits,
  requestScoutValidation,
  unlockScoutProfile
} from "../lib/scoutCredits.js";

const scoutPlayers = [
  {
    id: "scout-01",
    name: "Rohan Das",
    age: 16,
    amateurContract: false,
    position: "Winger",
    city: "Kolkata",
    totalPoints: 5480,
    streakCount: 14,
    sprint: "5.2s",
    agility: "8.6",
    endurance: "Good",
    drillHistory: [
      { drillName: "Juggling", totalPoints: 220, completedAt: "2026-05-21" },
      { drillName: "Cone Weaving", totalPoints: 180, completedAt: "2026-05-20" },
      { drillName: "Wall Passing", totalPoints: 160, completedAt: "2026-05-19" }
    ]
  },
  {
    id: "scout-02",
    name: "Kabir Mehta",
    age: 19,
    amateurContract: true,
    position: "Striker",
    city: "Mumbai",
    totalPoints: 7420,
    streakCount: 12,
    sprint: "5.0s",
    agility: "8.9",
    endurance: "Excellent",
    drillHistory: [
      { drillName: "Cruyff Turn", totalPoints: 260, completedAt: "2026-05-22" },
      { drillName: "Wall Passing", totalPoints: 210, completedAt: "2026-05-21" }
    ]
  },
  {
    id: "scout-03",
    name: "Ishaan Verma",
    age: 15,
    amateurContract: false,
    position: "Attacking Midfielder",
    city: "Delhi",
    totalPoints: 3120,
    streakCount: 9,
    sprint: "5.4s",
    agility: "8.4",
    endurance: "Good",
    drillHistory: [
      { drillName: "Toe Taps", totalPoints: 140, completedAt: "2026-05-22" },
      { drillName: "Juggling", totalPoints: 190, completedAt: "2026-05-21" }
    ]
  },
  {
    id: "scout-04",
    name: "Arjun Nair",
    age: 18,
    amateurContract: false,
    position: "Full Back",
    city: "Kochi",
    totalPoints: 2860,
    streakCount: 6,
    sprint: "5.1s",
    agility: "8.1",
    endurance: "Excellent",
    drillHistory: [
      { drillName: "Cone Weaving", totalPoints: 175, completedAt: "2026-05-20" },
      { drillName: "Toe Taps", totalPoints: 115, completedAt: "2026-05-19" }
    ]
  },
  {
    id: "scout-05",
    name: "Samarjit Singh",
    age: 17,
    amateurContract: true,
    position: "Centre Back",
    city: "Chandigarh",
    totalPoints: 1680,
    streakCount: 5,
    sprint: "5.7s",
    agility: "7.8",
    endurance: "Strong",
    drillHistory: [
      { drillName: "Wall Passing", totalPoints: 150, completedAt: "2026-05-22" },
      { drillName: "Juggling", totalPoints: 120, completedAt: "2026-05-18" }
    ]
  },
  {
    id: "scout-06",
    name: "Vivaan Rao",
    age: 14,
    amateurContract: false,
    position: "Central Midfielder",
    city: "Bengaluru",
    totalPoints: 940,
    streakCount: 4,
    sprint: "5.9s",
    agility: "7.9",
    endurance: "Developing",
    drillHistory: [
      { drillName: "Toe Taps", totalPoints: 90, completedAt: "2026-05-21" }
    ]
  },
  {
    id: "scout-07",
    name: "Neil Fernandes",
    age: 20,
    amateurContract: false,
    position: "Winger",
    city: "Goa",
    totalPoints: 4210,
    streakCount: 10,
    sprint: "4.9s",
    agility: "9.1",
    endurance: "Good",
    drillHistory: [
      { drillName: "Cruyff Turn", totalPoints: 240, completedAt: "2026-05-22" },
      { drillName: "Cone Weaving", totalPoints: 210, completedAt: "2026-05-21" }
    ]
  },
  {
    id: "scout-08",
    name: "Advik Sen",
    age: 13,
    amateurContract: false,
    position: "Goalkeeper",
    city: "Kolkata",
    totalPoints: 760,
    streakCount: 3,
    sprint: "6.1s",
    agility: "7.6",
    endurance: "Developing",
    drillHistory: [
      { drillName: "Wall Passing", totalPoints: 105, completedAt: "2026-05-20" }
    ]
  }
];

export default function ScoutDashboardPage() {
  const [criteriaQuery, setCriteriaQuery] = useState("");
  const [ageGroup, setAgeGroup] = useState("All ages");
  const [position, setPosition] = useState("All positions");
  const [city, setCity] = useState("All cities");
  const [tier, setTier] = useState("All tiers");
  const [scoreRange, setScoreRange] = useState("All scores");
  const [streakLength, setStreakLength] = useState("All streaks");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [credits, setCredits] = useState(() => loadScoutCredits());
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [toast, setToast] = useState(null);

  const players = useMemo(() => {
    return scoutPlayers.map((player) => ({
      ...player,
      age: Number(player.age),
      tierLevel: getTierLevel(player.totalPoints),
      drillMastery: {
        juggling: {
          level: Math.min(4, Math.floor(getCompositeScore(player) / 22)),
          sessions: player.drillHistory.length,
          bestScore: Math.max(
            0,
            ...player.drillHistory.map((drill) => Number(drill.totalContacts) || 0)
          )
        }
      },
      compositeScore: getCompositeScore(player),
      ageGroup: getAgeGroup(player.age),
      isProtected: Number(player.age) < 18 || Boolean(player.amateurContract),
      cardTheme: ["default", "midnight", "fire", "golden", "elite-dark"][
        Number(player.id.slice(-2)) % 5
      ],
      cardTitle: ["grassroots", "iron-feet", null, "consistent", "juggling-master"][
        Number(player.id.slice(-2)) % 5
      ],
      cardEmoji: ["⚡", "🎯", "", "🔥", "⭐"][Number(player.id.slice(-2)) % 5]
    }));
  }, []);

  const filteredPlayers = players.filter((player) => {
    const normalizedQuery = criteriaQuery.trim().toLowerCase();
    const criteriaText = getObjectiveCriteriaText(player);
    const criteriaMatch =
      !normalizedQuery || criteriaText.includes(normalizedQuery);
    const ageMatch =
      ageGroup === "All ages" ||
      (ageGroup === "U-14" && player.age <= 14) ||
      (ageGroup === "U-18" && player.age > 14 && player.age < 18) ||
      (ageGroup === "18+" && player.age >= 18);
    const positionMatch =
      position === "All positions" || player.position === position;
    const cityMatch = city === "All cities" || player.city === city;
    const tierMatch = tier === "All tiers" || player.tierLevel === tier;
    const scoreMatch =
      scoreRange === "All scores" ||
      (scoreRange === "80+" && player.compositeScore >= 80) ||
      (scoreRange === "60-79" &&
        player.compositeScore >= 60 &&
        player.compositeScore <= 79) ||
      (scoreRange === "Under 60" && player.compositeScore < 60);
    const streakMatch =
      streakLength === "All streaks" ||
      (streakLength === "14+ days" && player.streakCount >= 14) ||
      (streakLength === "7-13 days" &&
        player.streakCount >= 7 &&
        player.streakCount <= 13) ||
      (streakLength === "Under 7 days" && player.streakCount < 7);

    return (
      criteriaMatch &&
      ageMatch &&
      positionMatch &&
      cityMatch &&
      tierMatch &&
      scoreMatch &&
      streakMatch
    );
  });

  const positions = ["All positions", ...new Set(players.map((p) => p.position))];
  const cities = ["All cities", ...new Set(players.map((p) => p.city))];

  function handleUnlock(player) {
    if (credits.unlockedProfileIds.includes(player.id) || credits.unlimited) {
      setSelectedPlayer(player);
      return;
    }

    const result = unlockScoutProfile(player.id);
    setCredits(result.credits);

    if (result.unlocked) {
      setSelectedPlayer(player);
      return;
    }

    setShowPurchaseModal(true);
  }

  function handlePurchase(packageId) {
    setCredits(purchaseScoutCredits(packageId));
    setShowPurchaseModal(false);
  }

  function handleContactRequest(player) {
    const isMinor = player.age < 18;
    const message = isMinor
      ? "Guardian notification simulated. Contact request will stay inside SportsHawk messaging."
      : "Contact request sent through SportsHawk internal messaging.";

    setToast({
      title: isMinor ? "Guardian notified" : "Request sent",
      body: message
    });
    window.setTimeout(() => setToast(null), 3200);
  }

  function handleValidationRequest(player) {
    const result = requestScoutValidation(player.id);
    setCredits(result.credits);
    setToast({
      title: "Interest sent for validation",
      body:
        "SportsHawk will review the coach intent first. Player identity and demographics remain masked until the team approves the request."
    });
    window.setTimeout(() => setToast(null), 3800);
  }

  function handleValidationApproval(player) {
    const result = approveScoutValidation(player.id);
    setCredits(result.credits);
    setToast({
      title: "SportsHawk validation approved",
      body:
        "Demo approval complete. Identity and demographic details are now visible for this profile."
    });
    window.setTimeout(() => setToast(null), 3600);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <section className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-green">
            Scout dashboard
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-hawk-ink sm:text-5xl">
            Discover verified training signals.
          </h1>
          <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600">
            Filter grassroots players by position, age group, city, tier,
            score range, and streak length before opening a full development
            profile.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-black text-hawk-green">
              <Search size={18} />
              {filteredPlayers.length} players visible
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPurchaseModal(true)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:bg-slate-50"
          >
            <div className="flex items-center gap-2 text-sm font-black text-hawk-ink">
              <CreditCard size={18} />
              {credits.unlimited
                ? "Unlimited previews"
                : `${credits.creditsRemaining} coins remaining`}
            </div>
            <p className="mt-1 text-xs font-bold text-slate-500">
              10 free profile unlock coins reset monthly
            </p>
          </button>
        </div>
      </section>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Privacy first previews
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              Cards are anonymized until a coach or scout spends one profile
              coin to unlock performance detail. Player identity and
              demographics remain masked until SportsHawk validates genuine
              interest.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-md bg-hawk-field px-3 py-2 text-sm font-black text-hawk-green">
            <ShieldCheck size={16} />
            Identity protected
          </span>
        </div>
      </section>

      <section className="mb-5 rounded-lg border border-emerald-200 bg-hawk-field p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 text-hawk-green" size={22} />
          <div>
            <p className="text-sm font-black text-hawk-ink">
              U-18 and amateur-contract protection is active.
            </p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
              Protected players can be contacted only through SportsHawk
              internal messaging. Direct contact details are never shown.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label className="block">
          <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
            Search objective criteria
          </span>
          <div className="flex h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3">
            <Search size={17} className="shrink-0 text-slate-400" />
            <input
              type="search"
              value={criteriaQuery}
              onChange={(event) => setCriteriaQuery(event.target.value)}
              placeholder="Try Winger, U-18, Kolkata, Gold, 80+, or 14+ days"
              className="min-w-0 flex-1 bg-transparent text-sm font-bold text-hawk-ink outline-none placeholder:text-slate-400"
            />
          </div>
        </label>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <FilterSelect
            label="Age group"
            value={ageGroup}
            options={["All ages", "U-14", "U-18", "18+"]}
            onChange={setAgeGroup}
          />
          <FilterSelect
            label="Position"
            value={position}
            options={positions}
            onChange={setPosition}
          />
          <FilterSelect
            label="City"
            value={city}
            options={cities}
            onChange={setCity}
          />
          <FilterSelect
            label="Tier"
            value={tier}
            options={["All tiers", "Bronze", "Silver", "Gold", "Elite"]}
            onChange={setTier}
          />
          <FilterSelect
            label="Score range"
            value={scoreRange}
            options={["All scores", "80+", "60-79", "Under 60"]}
            onChange={setScoreRange}
          />
          <FilterSelect
            label="Streak length"
            value={streakLength}
            options={["All streaks", "14+ days", "7-13 days", "Under 7 days"]}
            onChange={setStreakLength}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredPlayers.map((player) => (
          <PlayerScoutCard
            key={player.id}
            player={player}
            credits={credits}
            onUnlock={() => handleUnlock(player)}
          />
        ))}
      </section>

      {selectedPlayer ? (
          <PlayerModal
            player={selectedPlayer}
            credits={credits}
            onClose={() => setSelectedPlayer(null)}
            onContactRequest={handleContactRequest}
            onValidationRequest={handleValidationRequest}
            onValidationApproval={handleValidationApproval}
          />
      ) : null}
      {showPurchaseModal ? (
        <PurchaseCreditsModal
          onClose={() => setShowPurchaseModal(false)}
          onPurchase={handlePurchase}
        />
      ) : null}
      {toast ? <Toast toast={toast} onClose={() => setToast(null)} /> : null}
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-hawk-ink"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function PlayerScoutCard({ player, credits, onUnlock }) {
  const isUnlocked =
    credits.unlimited || credits.unlockedProfileIds.includes(player.id);
  const validationStatus = credits.interestValidations[player.id]?.status;
  const isValidated = validationStatus === "approved";
  const theme = getCardTheme(player.cardTheme);
  const title = getCardTitle(player.cardTitle);

  return (
    <article
      className="rounded-lg border border-slate-200 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft"
      style={{
        background: `linear-gradient(135deg, ${hexToRgba(theme.background, 0.14)}, #ffffff 55%)`
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-hawk-ink">
            {player.cardEmoji ? `${player.cardEmoji} ` : ""}
            {isValidated ? player.name : `Player ${player.id.slice(-2)}`}
          </h2>
          {title ? (
            <p className="mt-1 text-xs font-black text-hawk-clay">{title.name}</p>
          ) : null}
          <p className="mt-1 text-sm font-bold text-slate-500">
            {player.ageGroup} | {player.position}
          </p>
        </div>
        <TierBadge tier={player.tierLevel} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {player.isProtected ? <ProtectionBadge player={player} /> : null}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <MiniStat label="Score" value={player.compositeScore} />
        <MiniStat label="Streak" value={`${player.streakCount}d`} />
        <MiniStat label="Drills" value={player.drillHistory.length} />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-1 text-sm font-bold text-slate-600">
          <MapPin size={15} />
          {isValidated ? player.city : "City masked"}
        </p>
        <button
          type="button"
          onClick={onUnlock}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-hawk-green px-3 text-sm font-black text-white transition hover:bg-emerald-800"
        >
          {isUnlocked ? (
            <>
              <Search size={16} />
              {isValidated ? "View Profile" : "View Protected Profile"}
            </>
          ) : (
            <>
              <LockKeyhole size={16} />
              Unlock · 1 coin
            </>
          )}
        </button>
      </div>
    </article>
  );
}

function PlayerModal({
  player,
  credits,
  onClose,
  onContactRequest,
  onValidationRequest,
  onValidationApproval
}) {
  const validationStatus = credits.interestValidations[player.id]?.status;
  const isValidated = validationStatus === "approved";
  const isPendingValidation = validationStatus === "pending";
  const displayName = isValidated ? player.name : `Player ${player.id.slice(-2)}`;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4 py-6">
      <section className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg bg-white shadow-soft">
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black text-hawk-ink">
                {displayName}
              </h2>
              <TierBadge tier={player.tierLevel} />
              {player.isProtected ? <ProtectionBadge player={player} /> : null}
            </div>
            <p className="mt-2 text-sm font-bold text-slate-500">
              {isValidated
                ? `${player.age} | ${player.position} | ${player.city}`
                : `${player.ageGroup} | ${player.position} | Demographics masked`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            aria-label="Close player details"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-5 p-5">
          <div className="grid gap-3 sm:grid-cols-4">
            <FullStat label="Total points" value={player.totalPoints} />
            <FullStat label="Streak" value={`${player.streakCount} days`} />
            <FullStat label="Sprint" value={player.sprint} />
            <FullStat label="Agility" value={player.agility} />
          </div>

          {isValidated ? <ScoutMasteryBadges player={player} /> : null}

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-amber-800">
                  Identity validation
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-amber-900">
                  {isValidated
                    ? "SportsHawk has validated this coach interest. Name and demographic details can be shared inside the protected workflow."
                    : "Name, exact age, city, photo, and contact details stay masked until the SportsHawk team confirms the coach interest is genuine."}
                </p>
              </div>
              <ShieldCheck className="shrink-0 text-amber-700" size={24} />
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => onValidationRequest(player)}
                disabled={isPendingValidation || isValidated}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-hawk-green px-4 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Send size={17} />
                {isValidated
                  ? "Interest validated"
                  : isPendingValidation
                    ? "Validation pending"
                    : "Request SportsHawk validation"}
              </button>
              {!isValidated ? (
                <button
                  type="button"
                  onClick={() => onValidationApproval(player)}
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-amber-300 bg-white px-4 text-sm font-black text-amber-800 transition hover:bg-amber-100"
                >
                  Simulate team approval
                </button>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg bg-hawk-field p-4">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-800">
              Physical assessment
            </p>
            <p className="mt-2 text-lg font-black text-hawk-ink">
              Endurance: {player.endurance}
            </p>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-hawk-field p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-emerald-800">
                  Contact protection
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  Direct phone, email, and guardian details are hidden. Contact
                  requests are routed through SportsHawk internal messaging.
                  Demographic details are released only after SportsHawk
                  validates genuine interest.
                </p>
              </div>
              <ShieldCheck className="shrink-0 text-hawk-green" size={24} />
            </div>
            <button
              type="button"
              onClick={() => onContactRequest(player)}
              disabled={!isValidated}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-hawk-green px-4 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
            >
              <MessageCircle size={17} />
              {isValidated
                ? "Request contact via SportsHawk"
                : "Validate interest before contact"}
            </button>
          </div>

          <section>
            <h3 className="text-lg font-black text-hawk-ink">Drill history</h3>
            <div className="mt-3 grid gap-3">
              {player.drillHistory.length ? (
                player.drillHistory.map((drill, index) => (
                  <div
                    key={`${drill.drillName}-${drill.completedAt}-${index}`}
                    className="grid gap-2 rounded-lg border border-slate-200 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                  >
                    <p className="font-black text-hawk-ink">
                      {drill.drillName}
                    </p>
                    <p className="text-sm font-bold text-slate-500">
                      {formatDate(drill.completedAt)}
                    </p>
                    <p className="text-lg font-black text-hawk-green">
                      {drill.totalPoints} pts
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-slate-200 p-4 text-sm font-bold text-slate-500">
                  No drill history yet.
                </p>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function PurchaseCreditsModal({ onClose, onPurchase }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4 py-6">
      <section className="w-full max-w-2xl rounded-lg bg-white shadow-soft">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <h2 className="text-2xl font-black text-hawk-ink">
              Purchase profile coins
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Each unlocked profile costs one coin. Free accounts receive 10
              profile unlock coins per month.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            aria-label="Close purchase credits"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-3">
          {creditPackages.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onPurchase(item.id)}
              className="rounded-lg border border-slate-200 p-4 text-left transition hover:border-hawk-green hover:bg-hawk-field"
            >
              <p className="text-lg font-black text-hawk-ink">{item.label}</p>
              <p className="mt-2 text-2xl font-black text-hawk-green">
                {item.price}
              </p>
              <p className="mt-3 text-sm font-semibold text-slate-500">
                {item.unlimited
                  ? "Unlimited profile unlocks while active."
                  : `${item.credits} additional profile unlocks.`}
              </p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-hawk-ink">{value}</p>
    </div>
  );
}

function FullStat({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-black text-hawk-ink">{value}</p>
    </div>
  );
}

function TierBadge({ tier }) {
  const tones = {
    Bronze: "bg-orange-100 text-orange-800",
    Silver: "bg-slate-200 text-slate-700",
    Gold: "bg-yellow-100 text-yellow-800",
    Elite: "bg-hawk-ink text-hawk-lime"
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-black ${tones[tier]}`}
    >
      <Medal size={14} />
      {tier}
    </span>
  );
}

function ProtectionBadge({ player }) {
  const label =
    player.age < 18 && player.amateurContract
      ? "U-18 + amateur protected"
      : player.age < 18
        ? "U-18 protected"
        : "Amateur protected";

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2.5 py-1 text-xs font-black text-red-700">
      <ShieldCheck size={13} />
      {label}
    </span>
  );
}

function ScoutMasteryBadges({ player }) {
  const level = player.drillMastery?.juggling?.level || 0;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        Drill mastery
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <span
          className="rounded-full px-3 py-1 text-sm font-black text-white"
          style={{ backgroundColor: masteryColors[level] }}
        >
          Juggling: {masteryTitles[level]}
        </span>
      </div>
    </section>
  );
}

function Toast({ toast, onClose }) {
  return (
    <div className="fixed bottom-5 right-5 z-[60] w-[min(92vw,380px)] rounded-lg border border-emerald-200 bg-white p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-hawk-field text-hawk-green">
          <Bell size={19} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-black text-hawk-ink">{toast.title}</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
            {toast.body}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-md bg-slate-100 text-slate-600 transition hover:bg-slate-200"
          aria-label="Dismiss notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "Pending";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function getAgeGroup(age) {
  const numericAge = Number(age);
  if (numericAge <= 14) return "U-14";
  if (numericAge < 18) return "U-18";
  return "18+";
}

function getCompositeScore(player) {
  const pointsScore = Math.min(Math.round(player.totalPoints / 80), 70);
  const streakScore = Math.min(player.streakCount * 2, 20);
  const historyScore = Math.min(player.drillHistory.length * 3, 10);

  return Math.min(pointsScore + streakScore + historyScore, 99);
}

function getScoreRange(score) {
  if (score >= 80) return "80+";
  if (score >= 60) return "60-79";
  return "Under 60";
}

function getStreakRange(streakCount) {
  if (streakCount >= 14) return "14+ days";
  if (streakCount >= 7) return "7-13 days";
  return "Under 7 days";
}

function getObjectiveCriteriaText(player) {
  return [
    player.position,
    player.ageGroup,
    player.city,
    player.tierLevel,
    getScoreRange(player.compositeScore),
    `${player.compositeScore}`,
    getStreakRange(player.streakCount),
    `${player.streakCount} days`
  ]
    .join(" ")
    .toLowerCase();
}

function hexToRgba(hex, alpha) {
  const cleanHex = String(hex || "#ffffff").replace("#", "");
  const value = Number.parseInt(cleanHex, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
