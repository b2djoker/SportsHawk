import { LockKeyhole, Search, ShieldCheck, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { getAccountType, getHomePath } from "../lib/account.js";

const accountOptions = [
  {
    to: "/onboarding/player",
    titleKey: "landing.playerCard",
    labelKey: "landing.playerCta",
    icon: UserRound,
    bodyKey: "landing.playerSub"
  },
  {
    to: "/onboarding/coach",
    titleKey: "landing.coachCard",
    labelKey: "landing.coachCta",
    icon: Search,
    bodyKey: "landing.coachSub"
  }
];

export default function OnboardingPage() {
  const location = useLocation();
  const accountType = getAccountType();
  const { t } = useTranslation();

  if (accountType) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-10">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
          <div className="grid h-14 w-14 place-items-center rounded-lg bg-hawk-field text-hawk-green">
            <LockKeyhole size={27} />
          </div>
          <p className="mt-6 text-sm font-black uppercase tracking-[0.16em] text-hawk-green">
            {t("landing.locked")}
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-hawk-ink">
            {t("landing.lockedTitle", {
              role: accountType === "player" ? "a Player" : "a Coach"
            })}
          </h1>
          <p className="mt-4 text-base font-medium leading-7 text-slate-600">
            {t("landing.lockedBody")}
          </p>
          <Link
            to={getHomePath(accountType)}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-hawk-green px-4 text-sm font-black text-white transition hover:bg-emerald-800"
          >
            {t("landing.continueDashboard")}
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <section className="mb-8 max-w-3xl">
        {location.state?.resetComplete ? (
          <div className="mb-5 rounded-lg border border-emerald-200 bg-hawk-field p-4 text-sm font-black text-hawk-green">
            {t("landing.resetComplete")}
          </div>
        ) : null}
        <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-green">
          {t("landing.chooseType")}
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-hawk-ink sm:text-5xl">
          {t("landing.title")}
        </h1>
        <p className="mt-4 text-base font-medium leading-7 text-slate-600">
          {t("landing.subtitle")}
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {accountOptions.map((option) => {
          const Icon = option.icon;

          return (
            <Link
              key={option.title}
              to={option.to}
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-hawk-green"
            >
              <div className="grid h-14 w-14 place-items-center rounded-lg bg-hawk-field text-hawk-green">
                <Icon size={27} />
              </div>
              <h2 className="mt-6 text-3xl font-black text-hawk-ink">
                {t(option.titleKey)}
              </h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                {t(option.bodyKey)}
              </p>
              <span className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-hawk-green px-4 text-sm font-black text-white">
                {t(option.labelKey)}
              </span>
            </Link>
          );
        })}
      </section>

      <section className="mt-6 rounded-lg border border-emerald-200 bg-hawk-field p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 text-hawk-green" size={22} />
          <div>
            <p className="text-sm font-black text-hawk-ink">
              {t("landing.roleBoundariesTitle")}
            </p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
              {t("landing.roleBoundariesBody")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
