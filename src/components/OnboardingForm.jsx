import {
  Camera,
  CheckCircle2,
  ChevronRight,
  Image as ImageIcon,
  MapPinned
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import {
  accountTypes,
  getAccountType,
  getHomePath,
  setAccountType
} from "../lib/account.js";
import {
  loadPlayerProfile,
  savePlayerProfile
} from "../lib/playerProfile.js";
import { compressImageForStorage } from "../lib/imageCompression.js";

const positions = [
  "Goalkeeper",
  "Centre Back",
  "Full Back",
  "Defensive Midfielder",
  "Central Midfielder",
  "Attacking Midfielder",
  "Winger",
  "Striker"
];

const ageOptions = Array.from({ length: 40 }, (_, index) => index + 6);

export default function OnboardingForm() {
  const accountType = getAccountType();
  const { t } = useTranslation();
  const [form, setForm] = useState(() => {
    const profile = loadPlayerProfile();

    return {
      name: profile.name === "New Player" ? "" : profile.name,
      age: profile.age,
      position: profile.position === "Position pending" ? "" : profile.position,
      city: profile.city === "City pending" ? "" : profile.city,
      photoUrl: profile.photoUrl
    };
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  if (accountType && accountType !== accountTypes.player) {
    return (
      <LockedRoleMessage
        title={t("onboarding.playerSignupUnavailable")}
        body={t("onboarding.playerSignupBlocked")}
        accountType={accountType}
      />
    );
  }

  const completion = useMemo(() => {
    const filled = ["name", "age", "position", "city", "photoUrl"].filter(
      (key) => Boolean(form[key])
    ).length;
    return Math.round((filled / 5) * 100);
  }, [form]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  function handlePhotoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrors((current) => ({ ...current, photoUrl: "" }));
    compressImageForStorage(file)
      .then((photoUrl) => updateField("photoUrl", photoUrl))
      .catch(() =>
        setErrors((current) => ({
          ...current,
          photoUrl: "Could not process this photo. Try taking a new picture."
        }))
      )
      .finally(() => {
        event.target.value = "";
      });
  }

  function validate() {
    const nextErrors = {};
    const ageNumber = Number(form.age);

    if (!form.name.trim()) nextErrors.name = "Add the player's name.";
    if (!ageNumber || ageNumber < 6 || ageNumber > 45) {
      nextErrors.age = "Age should be between 6 and 45.";
    }
    if (!form.position) nextErrors.position = "Choose a primary position.";
    if (!form.city.trim()) nextErrors.city = "Add the player's city.";
    if (!form.photoUrl) nextErrors.photoUrl = "Upload a profile photo.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    try {
      const existingProfile = loadPlayerProfile();
      const player = savePlayerProfile({
        ...existingProfile,
        ...form,
        age: Number(form.age)
      });
      setAccountType(accountTypes.player);

      navigate("/player", {
        state: {
          player
        }
      });
    } catch {
      setErrors((current) => ({
        ...current,
        photoUrl:
          "Profile could not be saved. Retake the photo and try again."
      }));
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]"
    >
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">Player Card</h2>
            <p className="text-sm font-medium text-slate-500">
              {t("onboarding.playerCardSub")}
            </p>
          </div>
          <div className="rounded-md bg-hawk-field px-3 py-2 text-sm font-black text-hawk-green">
            {completion}%
          </div>
        </div>

        <label className="mt-6 block">
          <span className="mb-3 block text-sm font-bold text-slate-700">
            {t("onboarding.profilePhoto")}
          </span>
          <div className="grid aspect-square place-items-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
            {form.photoUrl ? (
              <img
                src={form.photoUrl}
                alt="Player profile preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <div className="grid h-14 w-14 place-items-center rounded-lg bg-white shadow-sm">
                  <Camera size={24} />
                </div>
                <span className="text-sm font-bold">
                  {t("onboarding.uploadPhoto")}
                </span>
              </div>
            )}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-hawk-green px-4 text-sm font-black text-white transition hover:bg-emerald-800">
              <Camera size={17} />
              Take Photo
              <input
                type="file"
                accept="image/*"
                capture="user"
                onChange={handlePhotoUpload}
                className="sr-only"
              />
            </label>
            <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-black text-hawk-green transition hover:bg-hawk-field">
              <ImageIcon size={17} />
              Choose Photo
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="sr-only"
              />
            </label>
          </div>
          {errors.photoUrl ? (
            <p className="mt-2 text-sm font-semibold text-red-600">
              {errors.photoUrl}
            </p>
          ) : null}
        </label>

        <div className="mt-6 grid gap-3 rounded-lg bg-hawk-ink p-4 text-white">
          <div className="flex items-center gap-2 text-sm font-bold text-hawk-lime">
            <CheckCircle2 size={16} />
            {t("onboarding.assessmentReady")}
          </div>
          <p className="text-sm leading-6 text-slate-200">
            {t("onboarding.assessmentReadyBody")}
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <div className="mb-6">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            {t("onboarding.createPlayer")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">
            {t("onboarding.createPlayerBody")}
          </p>
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-900">
            {t("onboarding.rolePermanentPlayer")}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("onboarding.fullName")} error={errors.name}>
            <input
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Aarav Sharma"
              className="h-12 w-full rounded-lg border border-slate-300 px-3 font-semibold text-slate-900 placeholder:text-slate-400"
            />
          </Field>

          <Field label={t("onboarding.age")} error={errors.age}>
            <select
              value={form.age}
              onChange={(event) => updateField("age", event.target.value)}
              className="h-12 w-full rounded-lg border border-slate-300 bg-white px-3 font-semibold text-slate-900"
            >
              <option value="">Select age</option>
              {ageOptions.map((age) => (
                <option key={age} value={age}>
                  {age}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t("onboarding.position")} error={errors.position}>
            <select
              value={form.position}
              onChange={(event) => updateField("position", event.target.value)}
              className="h-12 w-full rounded-lg border border-slate-300 bg-white px-3 font-semibold text-slate-900"
            >
              <option value="">{t("onboarding.selectPosition")}</option>
              {positions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t("onboarding.city")} error={errors.city}>
            <div className="relative">
              <MapPinned
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={form.city}
                onChange={(event) => updateField("city", event.target.value)}
                placeholder="Kolkata"
                className="h-12 w-full rounded-lg border border-slate-300 pl-10 pr-3 font-semibold text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </Field>
        </div>

        <div className="mt-6 grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-3">
          <Metric label={t("onboarding.dailyHabits")} value="0/5" />
          <Metric label={t("onboarding.skillBadges")} value={t("onboarding.starter")} />
          <Metric label={t("onboarding.assessment")} value={t("onboarding.pending")} />
        </div>

        <button
          type="submit"
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-hawk-green px-5 text-sm font-black text-white transition hover:bg-emerald-800 sm:w-auto"
        >
          {t("onboarding.createProfile")}
          <ChevronRight size={18} />
        </button>
      </section>
    </form>
  );
}

function LockedRoleMessage({ title, body, accountType }) {
  const { t } = useTranslation();

  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <p className="text-sm font-black uppercase tracking-wide text-amber-800">
        {t("landing.locked")}
      </p>
      <h2 className="mt-2 text-2xl font-black text-hawk-ink">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-amber-900">
        {body}
      </p>
      <Link
        to={getHomePath(accountType)}
        className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-hawk-green px-4 text-sm font-black text-white transition hover:bg-emerald-800"
      >
        {t("onboarding.returnDashboard")}
      </Link>
    </section>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>
      {children}
      {error ? (
        <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>
      ) : null}
    </label>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-black text-hawk-ink">{value}</p>
    </div>
  );
}
