import {
  Coins,
  History,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { getCoinMultiplier, loadPlayerProfile } from "../lib/playerProfile.js";

export default function WalletPage() {
  const player = loadPlayerProfile();
  const multiplier = getCoinMultiplier(player.subscriptionTier);
  const recentEarnings = player.coinEarnings.slice(0, 8);
  const spendHistory = player.coinSpendHistory.slice(0, 8);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <section className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-green">
            Coins wallet
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-hawk-ink sm:text-5xl">
            Reward the daily work.
          </h1>
          <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600">
            Coins are earned from drill uploads, streak days, and tier
            milestones, with subscription multipliers applied automatically.
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="rounded-lg border border-slate-200 bg-hawk-ink p-6 text-white shadow-soft">
          <div className="grid h-14 w-14 place-items-center rounded-lg bg-hawk-lime text-hawk-ink">
            <Coins size={28} />
          </div>
          <p className="mt-6 text-sm font-black uppercase tracking-[0.16em] text-hawk-lime">
            Available balance
          </p>
          <h2 className="mt-3 text-5xl font-black tracking-tight">
            {player.coinBalance}
          </h2>
          <p className="mt-2 text-sm font-bold text-slate-300">
            SportsHawk coins
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <WalletStat label="Plan" value={player.subscriptionTier} />
            <WalletStat label="Multiplier" value={`${multiplier}x`} />
          </div>
        </aside>

        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            icon={TrendingUp}
            label="Drill upload"
            value={`${5 * multiplier} coins`}
            detail="Base 5 coins"
          />
          <SummaryCard
            icon={Sparkles}
            label="Streak day"
            value={`${10 * multiplier} coins`}
            detail="Base 10 coins"
          />
          <SummaryCard
            icon={Coins}
            label="Tier milestone"
            value={`${50 * multiplier} coins`}
            detail="Base 50 coins"
          />
          <SummaryCard
            icon={ShieldCheck}
            label="7-day streak milestone"
            value="Streak Freeze ×1"
            detail="Max 2 held"
            accent="gold"
          />
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Ledger
          title="Recent earnings"
          icon={History}
          emptyText="Complete a drill to start earning coins."
          items={recentEarnings}
          renderItem={(item) => (
            <LedgerRow
              key={item.id}
              title={item.label}
              meta={`${item.type} · ${item.multiplier}x multiplier`}
              date={item.completedAt}
              amount={`+${item.coins}`}
              positive
            />
          )}
        />

        <Ledger
          title="Spend history"
          icon={ShoppingBag}
          emptyText="No coin spends yet."
          items={spendHistory}
          renderItem={(item) => (
            <LedgerRow
              key={item.id}
              title={item.label}
              meta={item.type}
              date={item.completedAt}
              amount={`-${item.coins}`}
            />
          )}
        />
      </section>
    </div>
  );
}

function WalletStat({ label, value }) {
  return (
    <div className="rounded-lg bg-white/10 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-300">
        {label}
      </p>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, detail, accent = "green" }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={[
          "grid h-11 w-11 place-items-center rounded-lg",
          accent === "gold"
            ? "bg-amber-50 text-hawk-clay"
            : "bg-hawk-field text-hawk-green"
        ].join(" ")}
      >
        <Icon size={21} />
      </div>
      <p className="mt-5 text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-hawk-ink">{value}</p>
      <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        {detail}
      </p>
    </article>
  );
}

function Ledger({ title, icon: Icon, emptyText, items, renderItem }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-center gap-2">
        <Icon className="text-hawk-green" size={20} />
        <h2 className="text-xl font-black text-hawk-ink">{title}</h2>
      </div>

      <div className="mt-5 grid gap-3">
        {items.length ? (
          items.map(renderItem)
        ) : (
          <p className="rounded-lg bg-slate-50 p-4 text-sm font-bold text-slate-500">
            {emptyText}
          </p>
        )}
      </div>
    </section>
  );
}

function LedgerRow({ title, meta, date, amount, positive = false }) {
  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <p className="font-black text-hawk-ink">{title}</p>
        <p className="mt-1 text-sm font-semibold text-slate-500">{meta}</p>
        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">
          {formatDate(date)}
        </p>
      </div>
      <p
        className={[
          "text-2xl font-black",
          positive ? "text-hawk-green" : "text-hawk-clay"
        ].join(" ")}
      >
        {amount}
      </p>
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
