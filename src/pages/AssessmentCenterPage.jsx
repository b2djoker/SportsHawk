import {
  CalendarDays,
  CheckCircle2,
  Layers3,
  LockKeyhole,
  MapPinned,
  ShieldCheck,
  Target
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { drills } from "../data/drills.js";
import {
  loadPlayerProfile,
  scheduleAssessmentSession,
  unlockAssessmentQualification
} from "../lib/playerProfile.js";

const qualificationWindowDays = 90;
const requiredSessions = 45;
const requiredCategories = 3;
const requiredStreakDays = 14;

const centers = [
  { city: "Mumbai", top: "58%", left: "30%" },
  { city: "Delhi", top: "25%", left: "43%" },
  { city: "Bengaluru", top: "77%", left: "43%" },
  { city: "Kolkata", top: "48%", left: "72%" },
  { city: "Bhubaneswar", top: "58%", left: "64%" }
];

const assessmentSlots = [
  "Saturday, 9:00 AM",
  "Saturday, 4:00 PM",
  "Sunday, 8:00 AM",
  "Sunday, 5:00 PM"
];

export default function AssessmentCenterPage() {
  const { t } = useTranslation();
  const [player, setPlayer] = useState(() => loadPlayerProfile());
  const [preferredCenter, setPreferredCenter] = useState(
    () => centers.find((center) => center.city === loadPlayerProfile().city)?.city || centers[0].city
  );
  const [preferredSlot, setPreferredSlot] = useState(assessmentSlots[0]);
  const qualifyingHistory = getQualifyingHistory(player.drillHistory);
  const completedCategories = new Set(
    qualifyingHistory.map((drill) => getDrillCategoryLabel(drill, t))
  );
  const sessionsCompleted = qualifyingHistory.length;
  const categoriesCompleted = completedCategories.size;
  const streakDays = Math.max(player.streakCount, player.bestStreakCount || 0);
  const criteria = [
    {
      label: t("assessment.criteria.sessions"),
      description: t("assessment.criteria.sessionsDescription"),
      value: sessionsCompleted,
      target: requiredSessions,
      icon: Target,
      complete: sessionsCompleted >= requiredSessions,
      helper: t("assessment.criteria.sessionsOf", {
        current: sessionsCompleted,
        target: requiredSessions
      })
    },
    {
      label: t("assessment.criteria.categories"),
      description: t("assessment.criteria.categoriesDescription"),
      value: categoriesCompleted,
      target: requiredCategories,
      icon: Layers3,
      complete: categoriesCompleted >= requiredCategories,
      helper: t("assessment.criteria.categoriesOf", {
        current: categoriesCompleted,
        target: requiredCategories
      })
    },
    {
      label: t("assessment.criteria.streak"),
      description: t("assessment.criteria.streakDescription"),
      value: streakDays,
      target: requiredStreakDays,
      icon: CalendarDays,
      complete: streakDays >= requiredStreakDays,
      helper: t("assessment.criteria.streakOf", {
        current: streakDays,
        target: requiredStreakDays
      })
    }
  ];
  const completedCriteria = criteria.filter((item) => item.complete).length;
  const isUnlocked = criteria.every((item) => item.complete);
  const assessmentBooking = player.assessmentBooking;

  function bookAssessmentSession() {
    setPlayer(
      scheduleAssessmentSession({
        centerCity: preferredCenter,
        slot: preferredSlot
      })
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <section className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-green">
            {t("assessment.eyebrow")}
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-hawk-ink sm:text-5xl">
            {t("assessment.heading")}
          </h1>
          <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600">
            {t("assessment.subtitle")}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-black text-hawk-green">
            <MapPinned size={18} />
            {t("assessment.centersLive")}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-hawk-ink">
                {t("assessment.mapTitle")}
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {t("assessment.mapSubtitle")}
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-hawk-field">
            <img
              src="/maps/india-assessment-map.svg"
              alt={t("assessment.mapAlt")}
              className="h-full min-h-[430px] w-full object-cover"
            />
          </div>
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div
            className={[
              "grid h-14 w-14 place-items-center rounded-lg",
              isUnlocked
                ? "bg-hawk-field text-hawk-green"
                : "bg-slate-100 text-slate-600"
            ].join(" ")}
          >
            {isUnlocked ? <CheckCircle2 size={28} /> : <LockKeyhole size={26} />}
          </div>

          <h2 className="mt-5 text-3xl font-black tracking-tight text-hawk-ink">
            {isUnlocked ? t("assessment.unlocked") : t("assessment.qualification")}
          </h2>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
            {isUnlocked
              ? t("assessment.unlockedBody")
              : t("assessment.progressBody", {
                  name: player.name,
                  completed: completedCriteria
                })}
          </p>

          <div className="mt-6 rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              {t("assessment.window")}
            </p>
            <p className="mt-2 text-lg font-black text-hawk-ink">
              {t("assessment.lastDays", { days: qualificationWindowDays })}
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              {t("assessment.windowNote")}
            </p>
          </div>

          <div className="mt-5 grid gap-3">
            {criteria.map((criterion) => (
              <CriterionTracker key={criterion.label} criterion={criterion} />
            ))}
          </div>

          {categoriesCompleted ? (
            <div className="mt-5 rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                {t("assessment.categoriesCounted")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[...completedCategories].map((category) => (
                  <span
                    key={category}
                    className="rounded-md bg-hawk-field px-2.5 py-1 text-xs font-black text-hawk-green"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {isUnlocked ? (
            <AssessmentScheduler
              booking={assessmentBooking}
              preferredCenter={preferredCenter}
              preferredSlot={preferredSlot}
              onCenterChange={setPreferredCenter}
              onSlotChange={setPreferredSlot}
              onSchedule={bookAssessmentSession}
              t={t}
            />
          ) : (
            <div className="mt-6 grid gap-3">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                  {t("assessment.nextRequirement")}
                </p>
                <p className="mt-2 text-lg font-black text-hawk-ink">
                  {getNextRequirement(criteria, t)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPlayer(unlockAssessmentQualification())}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-hawk-green bg-white px-5 text-sm font-black text-hawk-green transition hover:bg-hawk-field"
              >
                <CheckCircle2 size={18} />
                {t("assessment.unlockQualification")}
              </button>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

function AssessmentScheduler({
  booking,
  preferredCenter,
  preferredSlot,
  onCenterChange,
  onSlotChange,
  onSchedule,
  t
}) {
  if (booking) {
    return (
      <section className="mt-6 rounded-lg border border-emerald-200 bg-hawk-field p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-hawk-green text-white">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-sm font-black text-hawk-ink">
              {t("assessment.schedule.bookedTitle")}
            </p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
              {booking.centerCity} Assessment Center · {booking.slot}
            </p>
            <p className="mt-2 text-xs font-black uppercase tracking-wide text-hawk-green">
              {t("assessment.schedule.bookedStatus")}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {t("assessment.schedule.title")}
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        {t("assessment.schedule.body")}
      </p>

      <div className="mt-4 grid gap-3">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            {t("assessment.schedule.center")}
          </span>
          <select
            value={preferredCenter}
            onChange={(event) => onCenterChange(event.target.value)}
            className="h-12 w-full rounded-lg border border-slate-300 bg-white px-3 font-semibold text-slate-900"
          >
            {centers.map((center) => (
              <option key={center.city} value={center.city}>
                {center.city}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            {t("assessment.schedule.slot")}
          </span>
          <select
            value={preferredSlot}
            onChange={(event) => onSlotChange(event.target.value)}
            className="h-12 w-full rounded-lg border border-slate-300 bg-white px-3 font-semibold text-slate-900"
          >
            {assessmentSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="button"
        onClick={onSchedule}
        className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-hawk-green px-5 text-sm font-black text-white transition hover:bg-emerald-800"
      >
        <CalendarDays size={18} />
        {t("assessment.schedule.button")}
      </button>
    </section>
  );
}

function CriterionTracker({ criterion }) {
  const { t } = useTranslation();
  const Icon = criterion.icon;
  const progress = Math.min(
    Math.round((criterion.value / criterion.target) * 100),
    100
  );

  return (
    <article
      className={[
        "rounded-lg border p-4",
        criterion.complete
          ? "border-emerald-200 bg-hawk-field"
          : "border-slate-200 bg-white"
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "grid h-11 w-11 shrink-0 place-items-center rounded-lg",
            criterion.complete
              ? "bg-hawk-green text-white"
              : "bg-slate-100 text-slate-600"
          ].join(" ")}
        >
          {criterion.complete ? <ShieldCheck size={21} /> : <Icon size={21} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-black text-hawk-ink">{criterion.label}</h3>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                {criterion.description}
              </p>
            </div>
            <span
              className={[
                "rounded-md px-2.5 py-1 text-xs font-black",
                criterion.complete
                  ? "bg-white text-hawk-green"
                  : "bg-slate-100 text-slate-600"
              ].join(" ")}
            >
              {criterion.complete ? t("assessment.complete") : criterion.helper}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className={[
                "h-full rounded-full transition-all",
                criterion.complete ? "bg-hawk-green" : "bg-hawk-clay"
              ].join(" ")}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function getQualifyingHistory(drillHistory) {
  const cutoff = Date.now() - qualificationWindowDays * 24 * 60 * 60 * 1000;

  return drillHistory.filter((drill) => {
    if (!drill.completedAt) return true;
    return new Date(drill.completedAt).getTime() >= cutoff;
  });
}

function getDrillCategoryLabel(historyItem, t) {
  if (historyItem.category) {
    return t(`assessment.categories.${historyItem.category}`);
  }

  const matchedDrill = drills.find(
    (drill) =>
      drill.name === historyItem.drillName ||
      drill.name.startsWith(historyItem.drillName) ||
      historyItem.drillName?.startsWith(drill.name)
  );

  return matchedDrill
    ? t(`assessment.categories.${matchedDrill.category}`)
    : t("assessment.categories.other");
}

function getNextRequirement(criteria, t) {
  const nextCriterion = criteria.find((criterion) => !criterion.complete);

  if (!nextCriterion) return t("assessment.allCriteriaComplete");
  return nextCriterion.helper;
}
