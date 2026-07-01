import { LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";

export default function SubscriptionPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-10">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <div className="grid h-14 w-14 place-items-center rounded-lg bg-yellow-100 text-yellow-700">
          <LockKeyhole size={26} />
        </div>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-hawk-ink">
          Upgrade SportsHawk
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          Store rewards marked Pro or Elite are locked to subscription members
          in this investor demo.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-hawk-field p-4">
            <p className="text-2xl font-black text-hawk-ink">Pro</p>
            <p className="mt-1 text-sm font-bold text-slate-600">₹149/mo</p>
          </div>
          <div className="rounded-lg bg-purple-50 p-4">
            <p className="text-2xl font-black text-hawk-ink">Elite</p>
            <p className="mt-1 text-sm font-bold text-slate-600">₹499/mo</p>
          </div>
        </div>
        <Link
          to="/player/store"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-yellow-300 px-5 text-sm font-black text-hawk-ink"
        >
          Back to Store
        </Link>
      </section>
    </div>
  );
}
