import {
  BadgeCheck,
  Clock3,
  CreditCard,
  Heart,
  Search,
  ShieldAlert,
  ShieldCheck,
  UsersRound
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { isCoachVerified, loadCoachProfile } from "../lib/account.js";
import { withCoachMatchmaking } from "../lib/matchmaking.js";
import { loadScoutCredits } from "../lib/scoutCredits.js";

export default function CoachDashboardPage() {
  const location = useLocation();
  const coach = withCoachMatchmaking(loadCoachProfile());
  const credits = loadScoutCredits();
  const verified = isCoachVerified(coach);
  const pendingResponses = coach.matchmaking.expressedInterests.filter(
    (interest) => interest.status === "accepted"
  ).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      {location.state?.roleBlock ? (
        <RoleBlockNotice notice={location.state.roleBlock} />
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="grid h-14 w-14 place-items-center rounded-lg bg-hawk-field text-hawk-green">
            <UsersRound size={28} />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-black text-hawk-ink">
              {coach.name || "Coach"}
            </h1>
            {verified ? <VerifiedBadge /> : null}
          </div>
          <p className="mt-2 text-sm font-bold text-slate-500">
            {coach.role} | {coach.city || "City pending"}
          </p>
          <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
            {coach.organization || "Organization pending"}
          </p>
          <Link
            to="/onboarding/coach"
            className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg border border-slate-300 text-sm font-black text-hawk-green transition hover:bg-hawk-field"
          >
            Edit coach profile
          </Link>
        </aside>

        <div className="grid gap-5">
          {!verified ? (
            <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-amber-700">
                  <Clock3 size={21} />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-amber-800">
                    {coach.verificationStatus || "Pending Verification"}
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-hawk-ink">
                    Limited access until verified
                  </h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-amber-900">
                    SportsHawk is reviewing your AIFF Coaching License ID and
                    certificate photo. You can view the coach workspace, but
                    verified coach badges and full trust signals appear only
                    after approval.
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-green">
              Coach home
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">
              Scout protected player profiles.
            </h2>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600">
              Coach accounts use a separate scouting workspace. They do not
              upload drill scores and do not appear on player leaderboards.
            </p>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <CoachStat
              icon={Search}
              label="Scout dashboard"
              value="Available"
            />
            <CoachStat
              icon={CreditCard}
              label="Profile coins"
              value={credits.unlimited ? "Unlimited" : credits.creditsRemaining}
            />
            <CoachStat
              icon={ShieldCheck}
              label="Verification"
              value={verified ? "Approved" : "Pending"}
            />
          </section>

          <Link
            to="/scout"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-hawk-green px-5 text-sm font-black text-white transition hover:bg-emerald-800 sm:w-auto"
          >
            Open scout dashboard
          </Link>
          <Link
            to="/coach/matchmaking"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-yellow-300 px-5 text-sm font-black text-hawk-ink transition hover:bg-yellow-200 sm:w-auto"
          >
            <Heart size={18} fill="currentColor" />
            Matchmaking
            {pendingResponses ? (
              <span className="rounded-full bg-hawk-ink px-2 py-0.5 text-xs text-white">
                {pendingResponses}
              </span>
            ) : null}
          </Link>
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

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">
      <BadgeCheck size={15} fill="currentColor" />
      Verified
    </span>
  );
}

function CoachStat({ icon: Icon, label, value }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid h-11 w-11 place-items-center rounded-lg bg-hawk-field text-hawk-green">
        <Icon size={21} />
      </div>
      <p className="mt-5 text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-hawk-ink">{value}</p>
    </article>
  );
}
