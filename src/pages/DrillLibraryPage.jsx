import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  CircleDot,
  Clock3,
  LockKeyhole,
  Play,
  Send,
  Sparkles,
  Square,
  Trophy
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import CameraSessionGate from "../components/CameraSessionGate.jsx";
import { drills } from "../data/drills.js";
import {
  loadPlayerProfile,
  getJugglingMastery,
  getJugglingMasteryProgress,
  masteryColors,
  masteryTitles,
  recordDrillScore,
  subscriptions
} from "../lib/playerProfile.js";

const categoryFilters = [
  { id: "all" },
  { id: "ball-mastery" },
  { id: "technical" },
  { id: "dribbling-agility" },
  { id: "skill-moves" },
  { id: "passing-combinations" },
  { id: "finishing" },
  { id: "fitness-sc" },
  { id: "goalkeeper" },
  { id: "elite-combinations" }
];

const drillImageMap = {
  "ball-mastery": "/drills/ball-mastery.svg",
  technical: "/drills/technical.svg",
  "dribbling-agility": "/drills/dribbling.svg",
  "skill-moves": "/drills/skill-moves.svg",
  "passing-combinations": "/drills/technical.svg",
  finishing: "/drills/finishing.svg",
  "fitness-sc": "/drills/fitness.svg",
  goalkeeper: "/drills/goalkeeper.svg",
  "elite-combinations": "/drills/elite.svg"
};

const recordableDrillResults = {
  2: {
    detectedMetric: "Alternating toe taps",
    count: 82,
    quality: "Fast rhythm with clean ball contact",
    consistency: "94%",
    basePoints: 123
  },
  3: {
    detectedMetric: "Inside-outside roll reps",
    count: 46,
    quality: "Controlled lateral rolls with both feet",
    consistency: "89%",
    basePoints: 96
  }
};

export default function DrillLibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const player = loadPlayerProfile();
  const playerPosition = getPositionCode(player.position);
  const activeCategory = searchParams.get("category") || "all";
  const selectedDrillId = Number(searchParams.get("drill"));
  const selectedDrill = drills.find((drill) => drill.id === selectedDrillId);
  const visibleCategories = categoryFilters.filter(
    (category) => category.id !== "goalkeeper" || playerPosition === "GK"
  );
  const normalizedCategory =
    activeCategory === "goalkeeper" && playerPosition !== "GK"
      ? "all"
      : activeCategory;
  const positionMatchedDrills = drills.filter(
    (drill) => isPositionMatch(drill, playerPosition) && isWithinCameraDepth(drill)
  );
  const categoryMatchedDrills = positionMatchedDrills.filter(
    (drill) =>
      normalizedCategory === "all" || drill.category === normalizedCategory
  );
  const featuredDrill = categoryMatchedDrills.find((drill) => drill.featured);
  const groupedDrills = groupByCategory(
    categoryMatchedDrills.filter((drill) => !drill.featured)
  );

  if (selectedDrill && isRecordableDrill(selectedDrill)) {
    return (
      <RecordableDrillScreen
        drill={selectedDrill}
        onBack={() => setSearchParams({ category: normalizedCategory })}
        t={t}
      />
    );
  }

  if (selectedDrill && selectedDrill.id !== 1) {
    return (
      <ComingSoonScreen
        drill={selectedDrill}
        onBack={() => setSearchParams({ category: normalizedCategory })}
        t={t}
      />
    );
  }

  function setCategory(category) {
    setSearchParams(category === "all" ? {} : { category });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <section className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-green">
            {t("drills.eyebrow")}
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-hawk-ink sm:text-5xl">
            {t("drills.heading")}
          </h1>
          <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600">
            {t("drills.subtitle")}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-black text-hawk-green">
            <Trophy size={18} />
            {t("drills.totalPoints", {
              points: sumPoints(positionMatchedDrills)
            })}
          </div>
        </div>
      </section>

      <section className="-mx-4 mb-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
        <div className="flex min-w-max gap-2">
          {visibleCategories.map((category) => {
            const isActive = normalizedCategory === category.id;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setCategory(category.id)}
                className={[
                  "h-10 rounded-full border px-4 text-sm font-black transition",
                  isActive
                    ? "border-yellow-300 bg-yellow-300 text-hawk-ink"
                    : "border-hawk-green bg-white text-hawk-green hover:bg-hawk-field"
                ].join(" ")}
              >
                {t(`drills.categories.${category.id}`)}
              </button>
            );
          })}
        </div>
      </section>

      <p className="mb-5 text-sm font-black text-slate-500">
        {t("drills.showing", { count: categoryMatchedDrills.length })}
      </p>

      {featuredDrill ? (
        <section className="mb-6">
          <DrillCard drill={featuredDrill} player={player} featured t={t} />
        </section>
      ) : null}

      <div className="grid gap-8">
        {Object.entries(groupedDrills).map(([category, categoryDrills]) => (
          <section key={category}>
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <h2 className="text-2xl font-black text-hawk-ink">
                {t(`drills.categories.${category}`)}
              </h2>
              <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-600">
                {t("drills.categoryCount", { count: categoryDrills.length })}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {categoryDrills.map((drill) => (
                <DrillCard key={drill.id} drill={drill} player={player} t={t} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function RecordableDrillScreen({ drill, onBack, t }) {
  const player = loadPlayerProfile();
  const [status, setStatus] = useState("ready");
  const [captureReady, setCaptureReady] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [savedProfile, setSavedProfile] = useState(null);
  const [gaitAnalysis, setGaitAnalysis] = useState(null);
  const result = recordableDrillResults[drill.id];
  const score = useMemo(
    () => ({
      ...result,
      totalPoints: Math.min(
        drill.maxPts,
        Math.round(result.basePoints * (Number.parseInt(result.consistency, 10) / 100)) +
          (gaitAnalysis?.bonusPoints ?? 0)
      )
    }),
    [drill.maxPts, gaitAnalysis, result]
  );

  function startDrill() {
    if (!captureReady) return;

    setSubmitted(false);
    setSavedProfile(null);
    setGaitAnalysis(null);
    setStatus("recording");
  }

  function stopDrill() {
    setStatus("analyzing");
    window.setTimeout(() => setStatus("results"), 1400);
  }

  function requireReauthentication() {
    setCaptureReady(false);
    setStatus("ready");
  }

  function submitScore() {
    const profile = recordDrillScore({
      drillName: drill.name,
      category: drill.category,
      basePoints: score.basePoints,
      totalPoints: score.totalPoints,
      scoringMethod: drill.scoringMethod,
      detectedMetric: score.detectedMetric,
      detectedCount: score.count,
      consistency: score.consistency,
      gaitBonusPoints: gaitAnalysis?.bonusPoints ?? 0
    });

    setSavedProfile(profile);
    setSubmitted(true);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-black text-hawk-green hover:text-emerald-800"
      >
        <ArrowLeft size={17} />
        {t("drills.libraryBack")}
      </button>

      <div className="mt-6">
        <CameraSessionGate
          drillName={drill.name}
          presetDistanceMeters={getPresetDistanceMeters(drill)}
          durationSeconds={getDurationSeconds(drill)}
          profilePhotoUrl={player.photoUrl}
          recordingActive={status === "recording"}
          onAuthenticated={() => setCaptureReady(true)}
          onReauthRequired={requireReauthentication}
          onAnalysisReady={setGaitAnalysis}
          onRecordingComplete={stopDrill}
        />
      </div>

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-green">
                {t("drills.recordable")}
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-hawk-ink">
                {drill.name}
              </h1>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-hawk-field text-hawk-green">
              <CircleDot size={24} />
            </div>
          </div>

          <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
            {drill.description}
          </p>

          <div className="mt-5 h-44 overflow-hidden rounded-lg bg-hawk-field">
            <img
              src={getDrillImage(drill)}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>

          <div className="mt-6 grid min-h-[280px] place-items-center rounded-lg bg-hawk-ink p-6 text-center text-white">
            {status === "ready" ? (
              <SessionPrompt
                title={
                  captureReady
                    ? t("drills.readyToRecord")
                    : t("drills.faceUnlockRequired")
                }
                body={
                  captureReady
                    ? t("drills.readyBody")
                    : t("drills.faceUnlockBody")
                }
              />
            ) : null}

            {status === "recording" ? (
              <div>
                <div className="mx-auto mb-5 h-4 w-4 animate-pulse rounded-full bg-red-500" />
                  <SessionPrompt
                  title={t("drills.recordingMovement")}
                  body="Use the live preview above to keep the player framed. The timer is shown on the camera feed."
                />
              </div>
            ) : null}

            {status === "analyzing" ? (
              <div className="w-full max-w-sm">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-lg bg-white/10 text-hawk-lime">
                  <BrainCircuit className="animate-pulse" size={30} />
                </div>
                <h2 className="mt-5 text-2xl font-black">
                  {t("drills.analyzing")}
                </h2>
                <p className="mt-3 text-sm font-medium leading-6 text-slate-200">
                  {t("drills.analyzingBody")}
                </p>
                <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-2/3 animate-pulse rounded-full bg-hawk-lime" />
                </div>
              </div>
            ) : null}

            {status === "results" ? (
              <div>
                <Sparkles className="mx-auto text-hawk-lime" size={34} />
                <h2 className="mt-4 text-3xl font-black">
                  {t("drills.pointsEarned", { points: score.totalPoints })}
                </h2>
                <p className="mt-3 text-sm font-medium text-slate-200">
                  {t("drills.repsDetected", {
                    count: score.count,
                    consistency: score.consistency
                  })}
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={startDrill}
              disabled={!captureReady || status === "recording" || status === "analyzing"}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-hawk-green px-5 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Play size={18} fill="currentColor" />
              {t("drills.start")}
            </button>
            <button
              type="button"
              onClick={stopDrill}
              disabled={status !== "recording"}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-hawk-clay px-5 text-sm font-black text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Square size={17} fill="currentColor" />
              {t("drills.stop")}
            </button>
          </div>
        </div>

        <div className="grid gap-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-green">
                  {t("drills.assessmentBreakdown")}
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight">
                  {t("drills.repScoring")}
                </h2>
              </div>
              <Trophy className="text-hawk-clay" size={28} />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <DrillMeta label={score.detectedMetric} value={status === "results" ? score.count : "--"} />
              <DrillMeta label={t("drills.controlQuality")} value={status === "results" ? score.quality : "--"} />
              <DrillMeta label={t("drills.totalEarned")} value={status === "results" ? `${score.totalPoints} XP` : "--"} />
              <DrillMeta label="GAIT bonus" value={status === "results" ? `+${gaitAnalysis?.bonusPoints ?? 0} XP` : "--"} />
            </div>

            <button
              type="button"
              disabled={status !== "results" || submitted}
              onClick={submitScore}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-hawk-green px-5 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitted ? <CheckCircle2 size={18} /> : <Send size={18} />}
              {submitted ? t("drills.submitted") : t("drills.submitLeaderboard")}
            </button>
            {savedProfile ? (
              <p className="mt-3 text-center text-sm font-bold text-hawk-green">
                {savedProfile.totalPoints} total points |{" "}
                {savedProfile.tierLevel} tier | +
                {savedProfile.coinEarnings[0]?.coins ?? 0} coins
              </p>
            ) : null}
          </section>
        </div>
      </section>
    </div>
  );
}

function DrillCard({ drill, player, featured = false, t }) {
  const isLocked = isTierLocked(drill, player.subscriptionTier);
  const isJuggling = drill.id === 1;
  const jugglingMastery = isJuggling ? getJugglingMastery(player) : null;
  const masteryProgress = isJuggling ? getJugglingMasteryProgress(player) : null;
  const cardClass = [
    "relative overflow-hidden rounded-lg border bg-white p-5 shadow-sm transition",
    drill.tierRequired === "elite"
      ? "border-l-4 border-l-[#b84fff] border-slate-200"
      : featured
        ? "border-yellow-300"
        : "border-slate-200",
    !isLocked ? "hover:-translate-y-0.5 hover:shadow-soft" : ""
  ].join(" ");
  const action = getAction(drill, isLocked, isJuggling);

  return (
    <article className={cardClass}>
      {featured ? (
        <div className="absolute right-4 top-4 rounded-md bg-yellow-300 px-3 py-1 text-xs font-black uppercase tracking-wide text-hawk-ink">
          {t("drills.featuredToday")}
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-hawk-field">
          <img
            src={getDrillImage(drill)}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-600">
            {t(`drills.difficulty.${drill.difficulty}`)}
          </span>
          {drill.comboEligible ? (
            <span className="rounded-md bg-purple-50 px-2.5 py-1 text-xs font-black text-[#8a2fd1]">
              {t("drills.combo")}
            </span>
          ) : null}
        </div>
      </div>

      <h3 className="mt-5 text-2xl font-black tracking-tight text-hawk-ink">
        {drill.name}
      </h3>
      {isJuggling ? (
        <div className="mt-2">
          <span
            className="inline-flex rounded-full px-2.5 py-1 text-xs font-black text-white"
            style={{
              backgroundColor: masteryColors[jugglingMastery.level]
            }}
          >
            {jugglingMastery.level === 4
              ? "MASTER ⭐"
              : masteryTitles[jugglingMastery.level]}
          </span>
          {jugglingMastery.level < 4 ? (
            <p className="mt-2 text-xs font-bold text-slate-500">
              {masteryProgress.shortLabel}
            </p>
          ) : null}
        </div>
      ) : null}
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
        {drill.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {drill.equipment.map((item) => (
          <span
            key={item}
            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600"
          >
            {item}
          </span>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-200 pt-4">
        <DrillMeta label={t("drills.maxPoints")} value={`${drill.maxPts} XP`} />
        <DrillMeta label={t("drills.duration")} value={drill.duration} />
      </div>

      <div className="mt-5">
        {isLocked ? (
          <div className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-orange-50 px-4 py-3 text-sm font-black text-orange-700">
            <LockKeyhole size={17} />
            {t(`drills.locked.${drill.tierRequired}`)}
          </div>
        ) : action.to ? (
          <Link
            to={action.to}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-hawk-green px-4 text-sm font-black text-white transition hover:bg-emerald-800"
          >
            <Play size={17} fill="currentColor" />
            {t("drills.startDrill")}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-hawk-green px-4 text-sm font-black text-white transition hover:bg-emerald-800"
          >
            <Play size={17} fill="currentColor" />
            {t("drills.startDrill")}
          </button>
        )}
      </div>
    </article>
  );
}

function ComingSoonScreen({ drill, onBack, t }) {
  const isExcluded = !isWithinCameraDepth(drill);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-10">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-black text-hawk-green hover:text-emerald-800"
      >
        <ArrowLeft size={17} />
        {t("drills.libraryBack")}
      </button>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <div className="grid h-14 w-14 place-items-center rounded-lg bg-hawk-field text-hawk-green">
          <Clock3 size={26} />
        </div>
        <p className="mt-6 text-sm font-black uppercase tracking-[0.16em] text-hawk-green">
          {t("drills.comingSoon")}
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-hawk-ink">
          {drill.name}
        </h1>
        <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-600">
          {drill.description}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {drill.equipment.map((item) => (
            <span
              key={item}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600"
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      <div className="mt-5 h-52 overflow-hidden rounded-lg bg-hawk-field">
        <img
          src={getDrillImage(drill)}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>

      {isExcluded ? (
        <section className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-black text-amber-900">
            {t("drills.captureUnavailable")}
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-amber-900">
            {t("drills.depthRule")}
          </p>
        </section>
      ) : (
        <div className="mt-5 grid gap-5">
          <CameraSessionGate
            drillName={drill.name}
            presetDistanceMeters={getPresetDistanceMeters(drill)}
            durationSeconds={getDurationSeconds(drill)}
            profilePhotoUrl={loadPlayerProfile().photoUrl}
          />
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-black text-hawk-ink">
              {t("drills.scoringSoon")}
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              {t("drills.scoringSoonBody")}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

function DrillMeta({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-base font-black text-hawk-ink">{value}</p>
    </div>
  );
}

function SessionPrompt({ title, body }) {
  return (
    <div className="max-w-sm">
      <h2 className="text-2xl font-black">{title}</h2>
      <p className="mt-3 text-sm font-medium leading-6 text-slate-200">
        {body}
      </p>
    </div>
  );
}

function getAction(drill, isLocked, isJuggling) {
  if (isLocked) return {};
  if (isJuggling) return { to: "/drills/juggling" };

  return { to: `/drills?drill=${drill.id}` };
}

function isRecordableDrill(drill) {
  return Boolean(recordableDrillResults[drill.id]);
}

function getDrillImage(drill) {
  return drillImageMap[drill.category] || drillImageMap["ball-mastery"];
}

function isTierLocked(drill, subscriptionTier) {
  return getTierRank(subscriptionTier) < getTierRank(drill.tierRequired);
}

function getTierRank(tier) {
  const normalizedTier = String(tier || "free").toLowerCase();
  const tierName =
    normalizedTier === "pro"
      ? "Pro"
      : normalizedTier === "elite"
        ? "Elite"
        : "Free";

  return subscriptions[tierName]?.rank ?? 0;
}

function getPositionCode(position) {
  const normalizedPosition = String(position || "").toLowerCase();
  if (normalizedPosition.includes("goalkeeper")) return "GK";
  if (
    normalizedPosition.includes("centre back") ||
    normalizedPosition.includes("center back") ||
    normalizedPosition.includes("full back")
  ) {
    return "DEF";
  }
  if (normalizedPosition.includes("striker") || normalizedPosition.includes("winger")) {
    return "FWD";
  }
  if (normalizedPosition.includes("midfielder")) return "MID";

  return "MID";
}

function isPositionMatch(drill, playerPosition) {
  return drill.positions.includes("all") || drill.positions.includes(playerPosition);
}

function isWithinCameraDepth(drill) {
  return !drill.excludedForCameraDepth;
}

function getPresetDistanceMeters(drill) {
  if (drill.category === "finishing") return 25;
  if (drill.category === "passing-combinations" || drill.equipment.includes("wall")) {
    return 20;
  }
  if (drill.category === "fitness-sc") return 15;
  if (drill.category === "goalkeeper") return 18;
  return 12;
}

function getDurationSeconds(drill) {
  const duration = String(drill.duration || "");
  const secondsMatch = duration.match(/(\d+)\s*s/i);
  const minutesMatch = duration.match(/(\d+)\s*mins?/i);

  if (secondsMatch) return Number(secondsMatch[1]);
  if (minutesMatch) return Number(minutesMatch[1]) * 60;
  return 30;
}

function groupByCategory(categoryDrills) {
  return categoryDrills.reduce((groups, drill) => {
    return {
      ...groups,
      [drill.category]: [...(groups[drill.category] || []), drill]
    };
  }, {});
}

function sumPoints(categoryDrills) {
  return categoryDrills.reduce((total, drill) => total + drill.maxPts, 0);
}
