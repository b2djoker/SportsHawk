import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { loadPlayerProfile } from "../lib/playerProfile.js";

const categoryTones = {
  gear: "bg-hawk-green",
  equipment: "bg-blue-500",
  nutrition: "bg-amber-500",
  "coach-consultation": "bg-yellow-500",
  "mental-performance": "bg-purple-500"
};

const deliveryTones = {
  physical: "bg-blue-50 text-blue-700",
  digital: "bg-emerald-50 text-emerald-700",
  session: "bg-purple-50 text-purple-700"
};

export default function StoreRedemptionsPage() {
  const player = loadPlayerProfile();
  const redemptions = [...player.redemptionHistory].sort(
    (a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime()
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-10">
      <h1 className="text-4xl font-black tracking-tight text-hawk-ink">
        My Redemptions
      </h1>

      {!redemptions.length ? (
        <section className="mt-10 rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <ShoppingBag className="mx-auto text-slate-300" size={64} />
          <h2 className="mt-5 text-2xl font-black text-hawk-ink">
            No redemptions yet
          </h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Earn coins by training daily and redeem them here
          </p>
          <Link
            to="/player/store"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-yellow-300 px-5 text-sm font-black text-hawk-ink"
          >
            Go to Store →
          </Link>
        </section>
      ) : (
        <section className="mt-6 grid gap-3">
          {redemptions.map((redemption) => (
            <article
              key={`${redemption.itemId}-${redemption.redeemedAt}`}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1 h-3 w-3 rounded-full ${categoryTones[redemption.category] || "bg-slate-400"}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div>
                      <h2 className="font-semibold text-hawk-ink">
                        {redemption.itemName}
                      </h2>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {redemption.brand || "SportsHawk"}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-500">
                        {relativeDate(redemption.redeemedAt)}
                      </p>
                    </div>
                    <p className="text-sm font-black text-red-600">
                      -{redemption.coinCost} coins
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-black ${getStatusTone(redemption.status)}`}
                    >
                      {capitalize(redemption.status || "processing")}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-black ${deliveryTones[redemption.deliveryType]}`}
                    >
                      {capitalize(redemption.deliveryType)}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function relativeDate(value) {
  const days = Math.max(
    Math.floor((Date.now() - new Date(value).getTime()) / (24 * 60 * 60 * 1000)),
    0
  );
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getStatusTone(status) {
  if (status === "delivered") return "bg-blue-50 text-blue-700";
  if (status === "confirmed") return "bg-emerald-50 text-emerald-700";
  return "bg-amber-50 text-amber-700";
}
