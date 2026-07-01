import { Flame, Medal, TimerReset } from "lucide-react";
import { useTranslation } from "react-i18next";
import OnboardingForm from "../components/OnboardingForm.jsx";

const highlights = [
  { labelKey: "onboarding.dailyStreaks", icon: Flame },
  { labelKey: "onboarding.verifiedTests", icon: TimerReset },
  { labelKey: "onboarding.coachBadges", icon: Medal }
];

export default function PlayerOnboardingPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <section className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-green">
            {t("onboarding.playerTitle")}
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-hawk-ink sm:text-5xl">
            {t("onboarding.playerHeading")}
          </h1>
          <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600">
            {t("onboarding.playerBody")}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {highlights.map((highlight) => {
            const Icon = highlight.icon;
            return (
              <div
                key={highlight.labelKey}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <Icon className="text-hawk-clay" size={22} />
                <p className="mt-3 text-sm font-black leading-5">
                  {t(highlight.labelKey)}
                </p>
              </div>
            );
          })}
        </div>
      </section>
      <OnboardingForm />
    </div>
  );
}
