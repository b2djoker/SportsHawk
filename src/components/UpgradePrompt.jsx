import { LockKeyhole, Sparkles } from "lucide-react";
import { subscriptions } from "../lib/playerProfile.js";

export default function UpgradePrompt({
  requiredTier = "Pro",
  feature,
  body,
  onUpgrade,
  onClose
}) {
  const plan = subscriptions[requiredTier];

  return (
    <section className="rounded-lg border border-hawk-green/30 bg-white p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-hawk-field text-hawk-green">
          <LockKeyhole size={21} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wide text-hawk-green">
            {plan.name} feature
          </p>
          <h3 className="mt-1 text-xl font-black text-hawk-ink">{feature}</h3>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
            {body ||
              `Upgrade to ${plan.name} at ${plan.price} to unlock this feature.`}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => onUpgrade?.(requiredTier)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-hawk-green px-4 text-sm font-black text-white transition hover:bg-emerald-800"
        >
          <Sparkles size={17} />
          Upgrade to {plan.name} · {plan.price}
        </button>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            Maybe later
          </button>
        ) : null}
      </div>
    </section>
  );
}
