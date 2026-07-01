import {
  BriefcaseBusiness,
  Camera,
  ChevronRight,
  IdCard,
  MapPinned,
  ShieldCheck
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import {
  accountTypes,
  getAccountType,
  getHomePath,
  loadCoachProfile,
  saveCoachProfile
} from "../lib/account.js";
import { compressImageForStorage } from "../lib/imageCompression.js";

export default function CoachOnboardingPage() {
  const accountType = getAccountType();
  const { t } = useTranslation();
  const [form, setForm] = useState(() => loadCoachProfile());
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  if (accountType && accountType !== accountTypes.coach) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-sm font-black uppercase tracking-wide text-amber-800">
            {t("landing.locked")}
          </p>
          <h1 className="mt-2 text-3xl font-black text-hawk-ink">
            {t("onboarding.coachSignupUnavailable")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-amber-900">
            {t("onboarding.coachSignupBlocked")}
          </p>
          <Link
            to={getHomePath(accountType)}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-hawk-green px-4 text-sm font-black text-white transition hover:bg-emerald-800"
          >
            {t("onboarding.returnDashboard")}
          </Link>
        </section>
      </div>
    );
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  function handleCertificateUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrors((current) => ({ ...current, certificatePhotoUrl: "" }));
    compressImageForStorage(file, { maxSize: 1200, quality: 0.76 })
      .then((photoUrl) => updateField("certificatePhotoUrl", photoUrl))
      .catch(() =>
        setErrors((current) => ({
          ...current,
          certificatePhotoUrl:
            "Could not process this certificate photo. Try taking a clearer picture."
        }))
      )
      .finally(() => {
        event.target.value = "";
      });
  }

  function validate() {
    const nextErrors = {};

    if (!form.name.trim()) nextErrors.name = "Add your name.";
    if (!form.organization.trim()) {
      nextErrors.organization = "Add your club, academy, or scouting group.";
    }
    if (!form.city.trim()) nextErrors.city = "Add your city.";
    if (!form.role.trim()) nextErrors.role = "Choose your role.";
    if (!form.license.trim()) {
      nextErrors.license = "Enter your AIFF Coaching License ID.";
    }
    if (!form.certificatePhotoUrl) {
      nextErrors.certificatePhotoUrl = "Upload your certificate photo.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    saveCoachProfile({
      ...form,
      verificationStatus: "Pending Verification"
    });
    navigate("/coach");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <section className="mb-8 max-w-3xl">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-green">
          {t("onboarding.coachTitle")}
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-hawk-ink sm:text-5xl">
          {t("onboarding.coachHeading")}
        </h1>
        <p className="mt-4 text-base font-medium leading-7 text-slate-600">
          {t("onboarding.coachBody")}
        </p>
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-900">
          {t("onboarding.coachPermanent")}
        </p>
      </section>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]"
      >
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="grid h-14 w-14 place-items-center rounded-lg bg-hawk-field text-hawk-green">
            <BriefcaseBusiness size={28} />
          </div>
          <h2 className="mt-5 text-2xl font-black text-hawk-ink">
            {t("onboarding.coachAccount")}
          </h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            {t("onboarding.coachAccountBody")}
          </p>
          <div className="mt-6 rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-sm font-black text-hawk-ink">
              <IdCard size={17} />
              {t("onboarding.coachVerification")}
            </div>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              {t("onboarding.coachVerificationBody")}
            </p>
          </div>
          <div className="mt-6 rounded-lg bg-hawk-ink p-4 text-white">
            <div className="flex items-center gap-2 text-sm font-bold text-hawk-lime">
              <ShieldCheck size={16} />
              {t("onboarding.protectedScouting")}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              {t("onboarding.protectedScoutingBody")}
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("onboarding.fullName")} error={errors.name}>
              <input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Priya Menon"
                className="h-12 w-full rounded-lg border border-slate-300 px-3 font-semibold text-slate-900 placeholder:text-slate-400"
              />
            </Field>

            <Field label={t("onboarding.role")} error={errors.role}>
              <select
                value={form.role}
                onChange={(event) => updateField("role", event.target.value)}
                className="h-12 w-full rounded-lg border border-slate-300 bg-white px-3 font-semibold text-slate-900"
              >
                <option>Coach</option>
                <option>Scout</option>
                <option>Academy Director</option>
                <option>Club Recruitment</option>
              </select>
            </Field>

            <Field label={t("onboarding.clubOrganization")} error={errors.organization}>
              <input
                value={form.organization}
                onChange={(event) =>
                  updateField("organization", event.target.value)
                }
                placeholder="Kolkata Youth FC"
                className="h-12 w-full rounded-lg border border-slate-300 px-3 font-semibold text-slate-900 placeholder:text-slate-400"
              />
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
                  placeholder="Mumbai"
                  className="h-12 w-full rounded-lg border border-slate-300 pl-10 pr-3 font-semibold text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </Field>

            <Field label={t("onboarding.aiffLicense")} error={errors.license}>
              <input
                value={form.license}
                onChange={(event) => updateField("license", event.target.value)}
                placeholder="AIFF-C-2026-0148"
                className="h-12 w-full rounded-lg border border-slate-300 px-3 font-semibold text-slate-900 placeholder:text-slate-400"
              />
            </Field>

            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                {t("onboarding.certificatePhoto")}
              </span>
              <div className="grid min-h-52 place-items-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
                {form.certificatePhotoUrl ? (
                  <img
                    src={form.certificatePhotoUrl}
                    alt="AIFF certificate preview"
                    className="h-full max-h-64 w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-slate-500">
                    <div className="grid h-14 w-14 place-items-center rounded-lg bg-white shadow-sm">
                      <Camera size={24} />
                    </div>
                    <span className="text-sm font-bold">
                      {t("onboarding.uploadCertificate")}
                    </span>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCertificateUpload}
                className="mt-3 block w-full cursor-pointer rounded-lg border border-slate-200 bg-white text-sm text-slate-600 file:mr-4 file:border-0 file:bg-hawk-green file:px-4 file:py-3 file:text-sm file:font-black file:text-white"
              />
              {errors.certificatePhotoUrl ? (
                <p className="mt-2 text-sm font-semibold text-red-600">
                  {errors.certificatePhotoUrl}
                </p>
              ) : null}
            </label>
          </div>

          <button
            type="submit"
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-hawk-green px-5 text-sm font-black text-white transition hover:bg-emerald-800 sm:w-auto"
          >
            {t("onboarding.createCoach")}
            <ChevronRight size={18} />
          </button>
        </section>
      </form>
    </div>
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
