import { CalendarDays, Flame, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { loadPlayerProfile } from "../lib/playerProfile.js";

export default function WeeklyReportPage() {
  const player = loadPlayerProfile();
  const report = player.weeklyReport;

  if (!report) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <section className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-soft">
          <CalendarDays className="mx-auto text-slate-300" size={58} />
          <h1 className="mt-5 text-3xl font-black text-hawk-ink">
            No weekly report yet
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Train this week and SportsHawk will prepare your Monday review.
          </p>
          <Link
            to="/player"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-hawk-green px-5 text-sm font-black text-white"
          >
            Back to Home
          </Link>
        </section>
      </div>
    );
  }

  const sessions = [...(report.sessionsList || [])].sort(
    (a, b) =>
      new Date(b.date || b.completedAt).getTime() -
      new Date(a.date || a.completedAt).getTime()
  );
  const bestScore = Number(report.bestScore) || 0;
  const maxPoints = Math.max(
    1,
    ...(report.dailyPoints || []).map((day) => Number(day.points) || 0)
  );
  const trainedDates = new Set(report.trainedDates || []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
      <section className="mb-6">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-green">
          Weekly Report
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-hawk-ink">
          Your Week In Review
        </h1>
      </section>

      <section className="grid gap-4 sm:grid-cols-4">
        <SummaryStat label="Sessions" value={report.sessions} />
        <SummaryStat label="Points" value={report.pointsEarned} />
        <SummaryStat label="Streak" value={`${report.currentStreak}d`} />
        <SummaryStat label="City rank" value={`#${report.cityRank}`} />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2">
            <Trophy className="text-hawk-clay" size={21} />
            <h2 className="text-xl font-black text-hawk-ink">Sessions</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {sessions.length ? (
              sessions.map((session, index) => {
                const score = getSessionScore(session);
                const isBest = score === bestScore;

                return (
                  <article
                    key={`${session.id || session.drillName}-${index}`}
                    className={[
                      "rounded-lg border p-4",
                      isBest
                        ? "border-yellow-300 bg-yellow-50"
                        : "border-slate-200 bg-white"
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-hawk-ink">
                          {session.drillName || session.drill}
                        </p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                          {formatDate(session.date || session.completedAt)}
                        </p>
                      </div>
                      <p className="text-2xl font-black text-hawk-green">
                        {score}
                      </p>
                    </div>
                    {isBest ? (
                      <p className="mt-3 text-xs font-black text-yellow-700">
                        Best session this week
                      </p>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <p className="rounded-lg bg-slate-50 p-4 text-sm font-bold text-slate-500">
                No sessions recorded in this report.
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-2">
              <Flame className="text-hawk-clay" size={21} fill="currentColor" />
              <h2 className="text-xl font-black text-hawk-ink">
                Streak Calendar
              </h2>
            </div>
            <div className="mt-5 grid grid-cols-7 gap-2">
              {(report.dailyPoints || []).map((day) => {
                const isTrained = trainedDates.has(new Date(day.date).toDateString());
                const isToday =
                  new Date(day.date).toDateString() === new Date().toDateString();

                return (
                  <div key={day.date} className="text-center">
                    <div
                      className={[
                        "mx-auto grid h-9 w-9 place-items-center rounded-md border text-xs font-black",
                        isTrained
                          ? "border-yellow-300 bg-yellow-300 text-hawk-ink"
                          : "border-slate-300 bg-white text-slate-400",
                        isToday ? "animate-pulse ring-2 ring-hawk-clay" : ""
                      ].join(" ")}
                    >
                      {day.label.slice(0, 1)}
                    </div>
                    <p className="mt-1 text-[10px] font-bold text-slate-400">
                      {day.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="text-xl font-black text-hawk-ink">Points Chart</h2>
            <div className="mt-5 flex h-44 items-end gap-3">
              {(report.dailyPoints || []).map((day) => (
                <div key={day.date} className="flex flex-1 flex-col items-center">
                  <div className="flex h-32 w-full items-end rounded-md bg-slate-100">
                    <div
                      className="w-full rounded-md bg-hawk-clay"
                      style={{
                        height: `${Math.max(3, (Number(day.points) / maxPoints) * 100)}%`
                      }}
                    />
                  </div>
                  <p className="mt-2 text-[10px] font-black text-slate-500">
                    {day.label}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function SummaryStat({ label, value }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="font-condensed text-3xl font-black text-hawk-clay">
        {value}
      </p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
    </article>
  );
}

function getSessionScore(session) {
  return (
    Number(session.score) ||
    Number(session.totalPoints) ||
    Number(session.basePoints) ||
    0
  );
}

function formatDate(value) {
  if (!value) return "Pending";

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short"
  }).format(new Date(value));
}
