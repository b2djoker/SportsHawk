import {
  Coins,
  CheckCircle2,
  ChevronDown,
  Flame,
  Footprints,
  GitBranch,
  Heart,
  Ruler,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Watch,
  Zap
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import UpgradePrompt from "../components/UpgradePrompt.jsx";
import { skillNodes } from "../data/skillTree.js";
import { useDailyChallenge } from "../hooks/useDailyChallenge.js";
import {
  defaultPlayerProfile,
  getJugglingMastery,
  getNextRankDivision,
  getRankDivisionMeta,
  hasSubscription,
  loadPlayerProfile,
  masteryColors,
  masteryTitles,
  normalizeSkillProgress,
  setSubscriptionTier,
  subscriptions
} from "../lib/playerProfile.js";
import { withPlayerMatchmaking } from "../lib/matchmaking.js";

export default function PlayerDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [player, setPlayer] = useState(() => ({
    ...defaultPlayerProfile,
    ...withPlayerMatchmaking(loadPlayerProfile()),
    ...location.state?.player
  }));
  const [lockedFeature, setLockedFeature] = useState(null);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [selectedRival, setSelectedRival] = useState(false);
  const [challengeToast, setChallengeToast] = useState("");
  const [dismissedWeeklyReport, setDismissedWeeklyReport] = useState(() =>
    window.localStorage.getItem("dismissedWeeklyReport") || ""
  );
  const latestDrill = player.drillHistory[0];
  const {
    dailyState,
    weeklyState,
    dailyChallenges,
    weeklyChallenges,
    claimChallenge,
    expiresIn
  } = useDailyChallenge();
  const hasPro = hasSubscription(player, "Pro");
  const rankDivision = getRankDivisionMeta(player.rankDivision);
  const jugglingMastery = getJugglingMastery(player);
  const nextRankDivision = getNextRankDivision(player.rankDivision);
  const skillProgress = normalizeSkillProgress(player.skillProgress || {});
  const unlockedSkills = skillNodes.filter(
    (node) => skillProgress[node.id]?.unlocked
  );
  const recentSkillNodes = getRecentSkillNodes(player, skillProgress);
  const weeklyReportVisible =
    shouldShowWeeklyReport(player.weeklyReport) &&
    dismissedWeeklyReport !== getReportDismissKey(player.weeklyReport);
  const subscriptionPreviews = [
    {
      tier: "Pro",
      icon: Zap,
      accent: "green",
      multiplier: "2x",
      summary: t("home.subscriptionUpsell.proSummary"),
      features: [
        t("home.subscriptionUpsell.proFitness"),
        t("home.subscriptionUpsell.proWearables"),
        t("home.subscriptionUpsell.proCoins"),
        t("home.subscriptionUpsell.proQueue")
      ]
    },
    {
      tier: "Elite",
      icon: Sparkles,
      accent: "purple",
      multiplier: "3x",
      summary: t("home.subscriptionUpsell.eliteSummary"),
      features: [
        t("home.subscriptionUpsell.eliteCombo"),
        t("home.subscriptionUpsell.eliteSkill"),
        t("home.subscriptionUpsell.eliteCoins"),
        t("home.subscriptionUpsell.elitePriority")
      ]
    }
  ];
  const pendingMatchmakingInterests = player.matchmaking.incomingInterests.filter(
    (interest) =>
      interest.status === "pending" ||
      interest.status === "guardian_pending"
  );

  function changePlan(subscriptionTier) {
    setPlayer(setSubscriptionTier(subscriptionTier));
    setLockedFeature(null);
  }

  function openChallenge(challenge, scope = "daily") {
    const state = scope === "weekly" ? weeklyState : dailyState;
    const isCompleted = state.completed.includes(challenge.id);
    const isClaimed = state.claimed.includes(challenge.id);

    if (isClaimed) {
      setChallengeToast("Already claimed today");
      window.setTimeout(() => setChallengeToast(""), 2200);
      return;
    }

    if (isCompleted) {
      setSelectedChallenge({ challenge, scope });
      return;
    }

    navigate(challenge.drill === "juggling" ? "/drills/juggling" : "/drills");
  }

  function dismissWeeklyReport() {
    const dismissKey = getReportDismissKey(player.weeklyReport);
    window.localStorage.setItem("dismissedWeeklyReport", dismissKey);
    setDismissedWeeklyReport(dismissKey);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      {location.state?.roleBlock ? (
        <RoleBlockNotice notice={location.state.roleBlock} />
      ) : null}

      {weeklyReportVisible ? (
        <WeeklyReportCard
          report={player.weeklyReport}
          city={player.city}
          onDismiss={dismissWeeklyReport}
        />
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="aspect-square overflow-hidden rounded-lg bg-hawk-field">
            {player.photoUrl ? (
              <img
                src={player.photoUrl}
                alt={`${player.name} profile`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center text-6xl font-black text-hawk-green">
                SH
              </div>
            )}
          </div>
          <h1 className="mt-5 text-2xl font-black">{player.name}</h1>
          <p className="mt-1 font-bold text-slate-500">
            {player.position} {player.age ? `| Age ${player.age}` : ""}
          </p>
          <p className="mt-3 text-sm font-semibold text-slate-600">
            {player.city}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <ProfilePill label={t("home.tier")} value={player.tierLevel} />
            <ProfilePill label={t("home.points")} value={`${player.totalPoints} XP`} />
            <ProfilePill label={t("home.coins")} value={player.coinBalance} />
            <ProfilePill label={t("home.plan")} value={player.subscriptionTier} />
          </div>
          <div className="mt-4 rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {t("home.subscription")}
            </p>
            <p className="mt-1 text-base font-black text-hawk-ink">
              {player.subscriptionTier} ·{" "}
              {subscriptions[player.subscriptionTier].price}
            </p>
          </div>
          <Link
            to="/onboarding/player"
            className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg border border-slate-300 text-sm font-black text-hawk-green transition hover:bg-hawk-field"
          >
            {t("home.editProfile")}
          </Link>
          <Link
            to="/player/card"
            className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-hawk-green text-sm font-black text-white transition hover:bg-emerald-800"
          >
            <Sparkles size={17} />
            Customize Card
          </Link>
          <Link
            to="/player/settings"
            className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 text-sm font-black text-hawk-green transition hover:bg-hawk-field"
          >
            <Settings size={17} />
            Player Settings
          </Link>
          <div className="mt-4 rounded-lg bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Connections
                </p>
                <p className="mt-1 text-sm font-black text-hawk-ink">
                  {player.matchmaking.optedIn
                    ? `${player.matchmaking.acceptedConnections.length} coach connections`
                    : "Matchmaking disabled"}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {player.matchmaking.optedIn
                    ? `${pendingMatchmakingInterests.length} pending interests`
                    : "Enable in settings →"}
                </p>
              </div>
              <span
                className={[
                  "rounded-full px-2.5 py-1 text-xs font-black",
                  player.matchmaking.optedIn
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-500"
                ].join(" ")}
              >
                {player.matchmaking.optedIn ? "Active" : "Off"}
              </span>
            </div>
          </div>
        </aside>

        <div className="grid gap-5">
          {pendingMatchmakingInterests.length ? (
            <Link
              to="/player/matchmaking"
              className="rounded-lg border border-slate-200 border-l-4 border-l-yellow-300 bg-white p-5 shadow-soft"
            >
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-yellow-50 text-yellow-600">
                  <Heart size={22} fill="currentColor" />
                </div>
                <div>
                  <p className="text-lg font-black text-hawk-ink">
                    {pendingMatchmakingInterests.length} coach(es) want to connect with you
                  </p>
                  <p className="mt-1 text-sm font-black text-hawk-green">
                    Review requests →
                  </p>
                </div>
              </div>
            </Link>
          ) : null}

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-green">
                  {t("home.subscription")}
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  {t("home.subscriptionUpsell.heading")}
                </h2>
                <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                  {t("home.subscriptionUpsell.body")}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm font-black text-hawk-ink">
                {t("home.subscriptionUpsell.currentPlan", {
                  plan: player.subscriptionTier
                })}
              </div>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {subscriptionPreviews.map((preview) => (
                <SubscriptionPreviewCard
                  key={preview.tier}
                  preview={preview}
                  currentTier={player.subscriptionTier}
                  onUpgrade={changePlan}
                  t={t}
                />
              ))}
            </div>
          </section>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-green">
              {t("home.developmentSnapshot")}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">
              {player.streakCount > 0
                ? t("home.momentum")
                : t("home.ready")}
            </h2>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600">
              {latestDrill
                ? t("home.lastDrill", {
                    drill: latestDrill.drillName,
                    points: latestDrill.totalPoints
                  })
              : t("home.nextLayer")}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
              <span
                className="rounded-full px-2.5 py-1 text-xs font-black text-white"
                style={{ backgroundColor: masteryColors[jugglingMastery.level] }}
              >
                {masteryTitles[jugglingMastery.level]}
              </span>
              <span className="text-sm font-black text-hawk-ink">
                Juggling {masteryTitles[jugglingMastery.level]} ·{" "}
                {jugglingMastery.sessions} sessions
              </span>
            </div>
          </div>

          <Link
            to="/player/skill-tree"
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-green">
                  Skill Tree
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  Build your next unlock
                </h2>
              </div>
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-hawk-field text-hawk-green">
                <GitBranch size={21} />
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3">
              {recentSkillNodes.map((node) => {
                const nodeProgress = skillProgress[node.id] || {};
                return (
                  <div
                    key={node.id}
                    className="grid h-11 w-11 place-items-center rounded-full border-4 border-white text-sm font-black text-white shadow-sm"
                    style={{ backgroundColor: node.color }}
                    title={node.name}
                  >
                    {(nodeProgress.masteryLevel || 0) >= 4
                      ? "✓"
                      : nodeProgress.masteryLevel || 0}
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-sm font-black text-hawk-green">
              {unlockedSkills.length} skills unlocked · View Tree →
            </p>
          </Link>

          {player.rivalId ? (
            <RivalCard
              player={player}
              onOpen={() => setSelectedRival(true)}
            />
          ) : null}

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-green">
                  Today&apos;s Challenges
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  Earn extra coins today
                </h2>
              </div>
                <p
                  className={[
                    "text-xs font-black",
                  expiresIn.isUrgent ? "text-red-600" : "text-slate-500"
                ].join(" ")}
              >
                {expiresIn.label}
              </p>
            </div>
            <div className="-mx-5 mt-5 overflow-x-auto px-5 pb-2">
              <div className="flex min-w-max gap-3">
                {dailyChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    state={dailyState}
                    onOpen={() => openChallenge(challenge, "daily")}
                  />
                ))}
              </div>
            </div>
            {weeklyChallenges[0] ? (
              <WeeklyChallengeCard
                challenge={weeklyChallenges[0]}
                state={weeklyState}
                onOpen={() => openChallenge(weeklyChallenges[0], "weekly")}
              />
            ) : null}
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <RankStatusCard
              division={rankDivision}
              nextDivision={nextRankDivision}
              rankPoints={player.rankPoints}
              trend={player.lastRankEvent?.type}
            />
            <StreakStatusCard
              title={t("home.habitStreak")}
              streakCount={player.streakCount}
              freezes={player.streakFreezes}
            />
            <StatusCard
              icon={Footprints}
              title={t("home.ballMastery")}
              value={player.tierLevel}
              tone="green"
            />
            <StatusCard
              icon={Ruler}
              title={t("home.physicalTesting")}
              value={t("home.notBooked")}
              tone="ink"
            />
            <StatusCard
              icon={Coins}
              title={t("home.coinBalance")}
              value={player.coinBalance}
              tone="lime"
            />
            <StatusActionCard
              icon={Watch}
              title={t("home.wearableMetrics")}
              value={hasPro ? t("home.synced") : t("home.locked")}
              tone={hasPro ? "green" : "ink"}
              locked={!hasPro}
              onClick={() =>
                !hasPro &&
                setLockedFeature({
                  requiredTier: "Pro",
                  feature: t("home.wearableMetrics"),
                  body: "Heart rate, load, and recovery tracking are included with Pro at ₹149/month."
                })
              }
            />
          </div>

          {lockedFeature ? (
            <UpgradePrompt
              {...lockedFeature}
              onUpgrade={changePlan}
              onClose={() => setLockedFeature(null)}
            />
          ) : null}
          {selectedChallenge ? (
            <ChallengeModal
              challenge={selectedChallenge.challenge}
              state={
                selectedChallenge.scope === "weekly" ? weeklyState : dailyState
              }
              scope={selectedChallenge.scope}
              onClose={() => setSelectedChallenge(null)}
              onClaim={() => {
                const updatedProfile = claimChallenge(
                  selectedChallenge.challenge.id,
                  selectedChallenge.scope
                );
                setPlayer(updatedProfile);
                setChallengeToast(
                  `Claimed! ${selectedChallenge.challenge.reward.label}`
                );
                window.setTimeout(() => setChallengeToast(""), 2600);
                setSelectedChallenge(null);
              }}
            />
          ) : null}
          {selectedRival ? (
            <RivalModal player={player} onClose={() => setSelectedRival(false)} />
          ) : null}
          {challengeToast ? (
            <div className="fixed bottom-24 right-4 z-[65] rounded-lg border border-amber-200 bg-white p-4 text-sm font-black text-amber-900 shadow-soft">
              {challengeToast}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function RoleBlockNotice({ notice }) {
  return (
    <section className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-amber-700">
          <ShieldAlert size={20} />
        </div>
        <div>
          <p className="text-sm font-black text-amber-900">{notice.title}</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-amber-900">
            {notice.body}
          </p>
        </div>
      </div>
    </section>
  );
}

function SubscriptionPreviewCard({ preview, currentTier, onUpgrade, t }) {
  const Icon = preview.icon;
  const plan = subscriptions[preview.tier];
  const isCurrent = currentTier === preview.tier;
  const isIncluded =
    subscriptions[currentTier]?.rank >= subscriptions[preview.tier]?.rank;
  const tones = {
    green: {
      border: "border-hawk-green/30",
      panel: "bg-hawk-field text-hawk-green",
      badge: "bg-hawk-green text-white",
      button: "bg-hawk-green text-white hover:bg-emerald-800"
    },
    purple: {
      border: "border-[#b84fff]/30",
      panel: "bg-purple-50 text-[#8a2fd1]",
      badge: "bg-[#b84fff] text-white",
      button: "bg-[#b84fff] text-white hover:bg-[#9738dd]"
    }
  }[preview.accent];

  return (
    <article className={`rounded-lg border ${tones.border} p-4`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${tones.panel}`}>
            <Icon size={21} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-2xl font-black text-hawk-ink">
                {plan.name}
              </h3>
              {isCurrent ? (
                <span className="rounded-md bg-yellow-300 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-hawk-ink">
                  {t("home.subscriptionUpsell.current")}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm font-bold text-slate-500">
              {plan.price}
            </p>
          </div>
        </div>
        <span className={`rounded-md px-2.5 py-1 text-xs font-black ${tones.badge}`}>
          {preview.multiplier} {t("home.subscriptionUpsell.coins")}
        </span>
      </div>

      <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
        {preview.summary}
      </p>
      <div className="mt-4 grid gap-2">
        {preview.features.map((feature) => (
          <div key={feature} className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 shrink-0 text-hawk-green" size={16} />
            <span className="text-sm font-semibold leading-5 text-slate-700">
              {feature}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={isCurrent}
        onClick={() => onUpgrade(preview.tier)}
        className={[
          "mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg px-4 text-sm font-black transition disabled:cursor-default",
          isCurrent
            ? "bg-slate-100 text-slate-500"
            : isIncluded
              ? "border border-slate-300 bg-white text-hawk-green hover:bg-hawk-field"
              : tones.button
        ].join(" ")}
      >
        {isCurrent
          ? t("home.subscriptionUpsell.active")
          : isIncluded
            ? t("home.subscriptionUpsell.included")
            : t("home.subscriptionUpsell.upgrade", { plan: plan.name })}
      </button>
    </article>
  );
}

function WeeklyReportCard({ report, city, onDismiss }) {
  const dateRange = formatReportRange(report);

  return (
    <section className="mb-6 rounded-lg border border-slate-200 border-t-4 border-t-hawk-clay bg-hawk-ink p-5 text-white shadow-soft">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-clay">
            Your Week In Review
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">
            {dateRange}
          </h2>
        </div>
        <div className="flex gap-2">
          <Link
            to="/player/weekly-report"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-yellow-300 px-4 text-sm font-black text-hawk-ink"
          >
            View Full Report
          </Link>
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-white/15 px-4 text-sm font-black text-white/70"
          >
            ✓ Got it
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <ReportStat
          label="Sessions"
          value={report.sessions}
          change={report.vsLastWeekSessions}
        />
        <ReportStat
          label="Points earned"
          value={report.pointsEarned}
          change={report.vsLastWeekPoints}
        />
        <ReportStat label="Streak" value={report.currentStreak} suffix="d" />
        <ReportStat label="Best drill" value={report.bestScore || 0} />
      </div>

      <div className="mt-5 rounded-lg bg-white/8 p-4">
        <p className="text-lg font-black text-hawk-clay">
          City rank: #{report.cityRank} in {city}
        </p>
        <p
          className={[
            "mt-1 text-sm font-bold",
            report.vsLastWeekRank > 0
              ? "text-emerald-300"
              : report.vsLastWeekRank < 0
                ? "text-red-300"
                : "text-white/50"
          ].join(" ")}
        >
          {report.vsLastWeekRank > 0
            ? `▲ up ${report.vsLastWeekRank} places from last week`
            : report.vsLastWeekRank < 0
              ? `▼ down ${Math.abs(report.vsLastWeekRank)} places`
              : "Holding steady"}
        </p>
      </div>
    </section>
  );
}

function ReportStat({ label, value, change = 0, suffix = "" }) {
  return (
    <div className="rounded-lg bg-white/8 p-4">
      <p className="font-condensed text-2xl font-black text-hawk-clay">
        {value}
        {suffix}
      </p>
      <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-white/45">
        {label}
      </p>
      <p
        className={[
          "mt-2 text-xs font-black",
          change > 0
            ? "text-emerald-300"
            : change < 0
              ? "text-red-300"
              : "text-white/35"
        ].join(" ")}
      >
        {change > 0
          ? `▲ +${change}`
          : change < 0
            ? `▼ ${change}`
            : "same as last week"}
      </p>
    </div>
  );
}

function RivalCard({ player, onOpen }) {
  const playerPts = Number(player.weeklyPts ?? player.totalPoints) || 0;
  const rivalPts = Number(player.rivalWeeklyPts) || 0;
  const gap = rivalPts - playerPts;
  const maxPts = Math.max(playerPts, rivalPts, 1);
  const initials = String(player.rivalName || "R")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <button
      type="button"
      onClick={onOpen}
      className="rounded-lg border border-slate-200 border-l-4 border-l-hawk-clay bg-hawk-ink p-5 text-left text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-clay">
        Your Rival
      </p>
      <div className="mt-4 flex items-center gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-hawk-clay text-lg font-black text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-black">{player.rivalName}</p>
          <p className="mt-1 text-xs font-bold text-white/50">
            {player.rivalCity}
          </p>
          <span className="mt-2 inline-flex rounded-md bg-white/10 px-2 py-1 text-xs font-black text-hawk-lime">
            {player.tierLevel}
          </span>
        </div>
        <div className="text-right">
          <p className="font-condensed text-2xl font-black text-hawk-clay">
            {rivalPts}
          </p>
          {gap > 0 ? (
            <p className="inline-flex items-center justify-end gap-1 text-xs font-black text-red-300">
              <ChevronDown size={14} />
              {gap} pts ahead
            </p>
          ) : (
            <p className="text-xs font-black text-emerald-300">
              You&apos;re winning! 🔥
            </p>
          )}
        </div>
      </div>
      <div className="mt-5">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-wide text-white/45">
          <span>You</span>
          <span>Rival</span>
        </div>
        <div className="mt-2 grid h-2 grid-cols-2 gap-1 overflow-hidden rounded-full bg-white/10">
          <div className="overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-yellow-300"
              style={{ width: `${(playerPts / maxPts) * 100}%` }}
            />
          </div>
          <div className="overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-red-400"
              style={{ width: `${(rivalPts / maxPts) * 100}%` }}
            />
          </div>
        </div>
        {gap <= 0 ? (
          <p className="mt-3 text-xs font-black text-hawk-clay">
            Find a new rival →
          </p>
        ) : null}
      </div>
    </button>
  );
}

function RivalModal({ player, onClose }) {
  const playerPts = Number(player.weeklyPts ?? player.totalPoints) || 0;
  const rivalPts = Number(player.rivalWeeklyPts) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/45 p-4">
      <section className="mx-auto w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-clay">
              Rival Stats
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-hawk-ink">
              {player.rivalName}
            </h2>
            <p className="mt-1 text-sm font-bold text-slate-500">
              {player.rivalCity} · Public weekly profile
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600"
          >
            ×
          </button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <ProfilePill label="Rival week" value={`${rivalPts} pts`} />
          <ProfilePill label="Your week" value={`${playerPts} pts`} />
          <ProfilePill
            label="Rivals beaten"
            value={Number(player.rivalsOvercome) || 0}
          />
        </div>
        <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
          Overtake this player&apos;s weekly score to trigger a Rival Beaten
          celebration and get assigned a fresh target.
        </p>
      </section>
    </div>
  );
}

function StatusActionCard({
  icon: Icon,
  title,
  value,
  tone,
  locked = false,
  onClick
}) {
  const { t } = useTranslation();
  const tones = {
    green: "bg-hawk-field text-hawk-green",
    ink: "bg-slate-100 text-hawk-ink"
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:shadow-soft"
    >
      <div
        className={`grid h-11 w-11 place-items-center rounded-lg ${tones[tone]}`}
      >
        <Icon size={21} />
      </div>
      <p className="mt-5 text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-black text-hawk-ink">{value}</p>
      {locked ? (
        <p className="mt-3 text-xs font-black uppercase tracking-wide text-hawk-clay">
          {t("home.proRequired")}
        </p>
      ) : null}
    </button>
  );
}

function RankStatusCard({ division, nextDivision, rankPoints, trend }) {
  const isTopDivision = division.id === nextDivision.id;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div
          className="grid h-12 w-12 place-items-center rounded-lg text-white"
          style={{ backgroundColor: division.color }}
        >
          <ShieldCheck size={23} fill="currentColor" />
        </div>
        <span
          className={[
            "rounded-md px-2 py-1 text-xs font-black",
            trend === "rankUp"
              ? "bg-emerald-100 text-emerald-700"
              : trend === "rankDown"
                ? "bg-red-100 text-red-700"
                : "bg-slate-100 text-slate-500"
          ].join(" ")}
        >
          {trend === "rankUp" ? "↗" : trend === "rankDown" ? "↘" : "→"}
        </span>
      </div>
      <p className="mt-5 text-sm font-bold text-slate-500">Ranked Division</p>
      <p className="mt-1 text-2xl font-black text-hawk-ink">
        {division.label}
      </p>
      <p className="mt-2 text-xs font-black text-slate-500">
        {isTopDivision
          ? `${rankPoints} RP · Top division`
          : `${rankPoints} / 100 RP to ${nextDivision.label}`}
      </p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, Number(rankPoints) || 0)}%`,
            backgroundColor: division.color
          }}
        />
      </div>
    </article>
  );
}

function ChallengeCard({ challenge, state, onOpen }) {
  const isCompleted = state.completed.includes(challenge.id);
  const isClaimed = state.claimed.includes(challenge.id);
  const isCommunity = challenge.type === "community";
  const target = challenge.target || challenge.communityTarget || 50;
  const communityCount = Math.min(target, state.communityCount || 0);
  const difficultyTone = {
    easy: "bg-emerald-100 text-emerald-800",
    medium: "bg-amber-100 text-amber-800",
    hard: "bg-red-100 text-red-800",
    community: "bg-blue-100 text-blue-800"
  }[challenge.difficulty || "easy"];

  return (
    <button
      type="button"
      onClick={onOpen}
      className={[
        "h-52 w-40 shrink-0 rounded-lg border p-4 text-left transition hover:-translate-y-0.5",
        isClaimed
          ? "border-slate-200 bg-slate-100 text-slate-500"
          : isCompleted
            ? "animate-pulse border-yellow-300 bg-yellow-50 text-hawk-ink"
            : "border-hawk-green bg-hawk-green text-white"
      ].join(" ")}
    >
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${difficultyTone}`}
      >
        {challenge.difficulty}
      </span>
      <h3 className="mt-3 text-base font-black tracking-tight">
        {challenge.title}
      </h3>
      <p
        className={[
          "mt-2 line-clamp-2 text-[11px] font-semibold leading-4",
          isCompleted || isClaimed ? "text-slate-600" : "text-white/70"
        ].join(" ")}
      >
        {challenge.description}
      </p>

      {isCommunity ? (
        <div className="mt-4">
          <div className="flex justify-between text-xs font-black">
            <span>{communityCount} / {target}</span>
            <span>today</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/30">
            <div
              className="h-full rounded-full bg-yellow-300"
              style={{ width: `${(communityCount / target) * 100}%` }}
            />
          </div>
          {communityCount >= target ? (
            <p className="mt-2 text-[10px] font-black text-blue-700">
              🌍 UNLOCKED — 2x coins active!
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="mt-4 inline-flex items-center gap-1 text-xs font-black text-yellow-300">
        <Coins size={13} />
        {challenge.reward?.label}
      </p>

      <p className="mt-4 text-xs font-black">
        {isClaimed ? "Claimed ✓" : isCompleted ? "CLAIM →" : "Start challenge"}
      </p>
    </button>
  );
}

function WeeklyChallengeCard({ challenge, state, onOpen }) {
  const isCompleted = state.completed.includes(challenge.id);
  const isClaimed = state.claimed.includes(challenge.id);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={[
        "mt-4 w-full rounded-lg border p-4 text-left transition hover:-translate-y-0.5",
        isClaimed
          ? "border-slate-200 bg-slate-100"
          : isCompleted
            ? "border-yellow-300 bg-yellow-50"
            : "border-slate-200 bg-white"
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="rounded-full bg-hawk-ink px-2.5 py-1 text-[10px] font-black uppercase text-hawk-lime">
            This Week
          </span>
          <h3 className="mt-3 text-xl font-black text-hawk-ink">
            {challenge.title}
          </h3>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            {challenge.description}
          </p>
        </div>
        <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-black text-slate-500">
          Resets Monday
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-1 text-sm font-black text-yellow-600">
          <Coins size={15} />
          {challenge.reward?.label}
        </p>
        <p className="text-sm font-black text-hawk-green">
          {isClaimed ? "Claimed ✓" : isCompleted ? "CLAIM →" : "In progress"}
        </p>
      </div>
    </button>
  );
}

function ChallengeModal({ challenge, state, scope, onClose, onClaim }) {
  const isCompleted = state.completed.includes(challenge.id);
  const isClaimed = state.claimed.includes(challenge.id);
  const drillPath = challenge.drill === "juggling" ? "/drills/juggling" : "/drills";

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4">
      <section className="mx-auto w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-green">
              {scope === "weekly" ? "Weekly Challenge" : "Daily Challenge"}
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">
              {challenge.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600"
          >
            ×
          </button>
        </div>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          {challenge.description}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {challenge.reward?.coins ? (
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-black text-hawk-ink">
              🪙 {challenge.reward.coins} coins
            </span>
          ) : null}
          {challenge.reward?.streakFreeze ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-black text-amber-800">
              Streak Freeze ×{challenge.reward.streakFreeze}
            </span>
          ) : null}
          {challenge.reward?.coinMultiplier ? (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-black text-blue-800">
              {challenge.reward.label}
            </span>
          ) : null}
        </div>

        {isClaimed ? (
          <p className="mt-5 rounded-lg bg-yellow-50 p-4 text-sm font-black text-hawk-ink">
            Already claimed today.
          </p>
        ) : isCompleted ? (
          <button
            type="button"
            onClick={onClaim}
            className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-lg bg-yellow-300 px-5 text-sm font-black text-hawk-ink"
          >
            Claim Reward
          </button>
        ) : (
          <Link
            to={drillPath}
            className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-lg bg-hawk-green px-5 text-sm font-black text-white"
          >
            Go to Drill →
          </Link>
        )}
      </section>
    </div>
  );
}

function ProfilePill({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-base font-black text-hawk-ink">{value}</p>
    </div>
  );
}

function StreakStatusCard({ title, streakCount, freezes }) {
  const freezeCount = Math.max(0, Math.min(2, Number(freezes) || 0));

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid h-11 w-11 place-items-center rounded-lg bg-orange-50 text-hawk-clay">
        <Flame size={21} fill="currentColor" />
      </div>
      <p className="mt-5 text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-black text-hawk-ink">
        {streakCount} day{streakCount === 1 ? "" : "s"}
      </p>
      {freezeCount > 0 ? (
        <div
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2"
          title={`Streak Freeze × ${freezeCount} — protects your streak if you miss a day`}
        >
          {Array.from({ length: 2 }, (_, index) => (
            <ShieldCheck
              key={index}
              size={17}
              className={
                index < freezeCount ? "text-hawk-clay" : "text-amber-200"
              }
              fill={index < freezeCount ? "currentColor" : "none"}
            />
          ))}
          <span className="text-xs font-black text-amber-800">
            Freeze × {freezeCount}
          </span>
        </div>
      ) : null}
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-1/4 rounded-full bg-hawk-green" />
      </div>
    </article>
  );
}

function StatusCard({ icon: Icon, title, value, tone }) {
  const tones = {
    green: "bg-hawk-field text-hawk-green",
    clay: "bg-orange-50 text-hawk-clay",
    ink: "bg-slate-100 text-hawk-ink",
    lime: "bg-lime-100 text-emerald-800"
  };

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`grid h-11 w-11 place-items-center rounded-lg ${tones[tone]}`}
      >
        <Icon size={21} />
      </div>
      <p className="mt-5 text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-black text-hawk-ink">{value}</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-1/4 rounded-full bg-hawk-green" />
      </div>
    </article>
  );
}

function getRecentSkillNodes(player, skillProgress) {
  const activeSkillIds = new Set();

  player.drillHistory.forEach((historyItem) => {
    const drillName = normalizeHistoryName(historyItem.drillName);
    const matchingNode = skillNodes.find((node) => {
      const nodeName = normalizeHistoryName(node.name);
      return drillName === nodeName || drillName.startsWith(nodeName);
    });
    if (matchingNode) activeSkillIds.add(matchingNode.id);
  });

  const activeNodes = skillNodes.filter((node) => activeSkillIds.has(node.id));
  const fallbackNodes = skillNodes.filter(
    (node) => skillProgress[node.id]?.unlocked && !activeSkillIds.has(node.id)
  );

  return [...activeNodes, ...fallbackNodes].slice(0, 3);
}

function normalizeHistoryName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/—.*/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function shouldShowWeeklyReport(report) {
  if (!report?.generatedAt) return false;

  const generated = new Date(report.generatedAt);
  const thisMonday = getWeekStart(new Date());
  return generated >= thisMonday;
}

function getReportDismissKey(report) {
  if (!report?.generatedAt) return "";
  return new Date(report.generatedAt).toISOString().slice(0, 10);
}

function formatReportRange(report) {
  const start = report?.weekStart ? new Date(report.weekStart) : getWeekStart(new Date());
  const end = report?.weekEnd
    ? new Date(report.weekEnd)
    : new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  const formatter = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short"
  });

  return `${formatter.format(start)} — ${formatter.format(end)}`;
}

function getWeekStart(date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}
