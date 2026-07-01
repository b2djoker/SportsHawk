import {
  CheckCircle2,
  Coins,
  Mail,
  Package,
  ShoppingBag,
  Truck,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { storeItems } from "../data/storeItems.js";
import {
  loadPlayerProfile,
  redeemStoreItem,
  subscriptions
} from "../lib/playerProfile.js";

const filters = [
  { id: "all", label: "All" },
  { id: "gear", label: "Gear" },
  { id: "equipment", label: "Equipment" },
  { id: "nutrition", label: "Nutrition" },
  { id: "coach-consultation", label: "Coaching" },
  { id: "mental-performance", label: "Mental Performance" }
];

const categoryLabels = {
  gear: "Gear",
  equipment: "Equipment",
  nutrition: "Nutrition",
  "coach-consultation": "Coaching",
  "mental-performance": "Mental"
};

const deliveryTones = {
  physical: "bg-blue-50 text-blue-700",
  digital: "bg-emerald-50 text-emerald-700",
  session: "bg-purple-50 text-purple-700"
};

const languages = [
  "Hindi",
  "English",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Bengali"
];

const storeImageMap = {
  apparel: "/store/apparel.svg",
  ball: "/store/ball.svg",
  equipment: "/store/equipment.svg",
  tripod: "/store/tripod.svg",
  nutrition: "/store/nutrition.svg",
  session: "/store/session.svg"
};

export default function StorePage() {
  const navigate = useNavigate();
  const [player, setPlayer] = useState(() => loadPlayerProfile());
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const [dismissedNudge, setDismissedNudge] = useState(false);
  const [toast, setToast] = useState(null);
  const playerPosition = getPositionCode(player.position);
  const visibleItems = useMemo(
    () =>
      storeItems.filter(
        (item) =>
          isPositionMatch(item, playerPosition) &&
          (activeFilter === "all" || item.category === activeFilter)
      ),
    [activeFilter, playerPosition]
  );
  const featuredItems = storeItems.filter(
    (item) => item.featured && isPositionMatch(item, playerPosition)
  );
  const cheapestItem = visibleItems.reduce(
    (cheapest, item) =>
      !cheapest || item.coinCost < cheapest.coinCost ? item : cheapest,
    null
  );
  const coinShortfall = cheapestItem
    ? Math.max(cheapestItem.coinCost - player.coinBalance, 0)
    : 0;

  function openItem(item) {
    if (isTierLocked(item, player.subscriptionTier)) {
      navigate("/player/subscription");
      return;
    }
    setSelectedItem(item);
  }

  function handleRedeemed(nextProfile) {
    setPlayer(nextProfile);
    if (nextProfile.lastStreakFreezeEvent?.message) {
      setToast(nextProfile.lastStreakFreezeEvent.message);
      window.setTimeout(() => setToast(null), 3200);
      return;
    }
    if (nextProfile.coinBalance === 0) {
      setToast("You're out of coins — train daily to earn more! 🔥");
      window.setTimeout(() => setToast(null), 3200);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-base font-black tracking-wide text-hawk-ink">
            SportsHawk
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-hawk-ink">
            SportsHawk Store
          </h1>
          <p className="mt-2 text-base font-semibold text-slate-600">
            Redeem your training coins for real rewards
          </p>
        </div>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <Link
            to="/player/store/redemptions"
            className="grid h-11 w-11 place-items-center rounded-lg border border-slate-200 bg-white text-hawk-green shadow-sm"
            aria-label="View my redemptions"
          >
            <Package size={20} />
          </Link>
          <div className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-black text-yellow-600 shadow-sm">
            <Coins size={18} />
            {player.coinBalance} coins
          </div>
        </div>
      </header>

      <section className="mt-7">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-600">
          Featured
        </p>
        <div className="-mx-4 mt-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
          <div className="flex min-w-max gap-3">
            {featuredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openItem(item)}
                className="relative h-52 w-[200px] overflow-hidden rounded-lg p-4 text-left text-white shadow-sm"
                style={{ backgroundColor: item.imageColor }}
              >
                <img
                  src={getStoreImage(item)}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative z-10">
                <span className="rounded-full bg-black/25 px-2.5 py-1 text-xs font-black">
                  {categoryLabels[item.category]}
                </span>
                <p className="mt-16 text-lg font-black leading-5">
                  {item.name}
                </p>
                <p className="mt-3 inline-flex items-center gap-1 text-sm font-black text-yellow-300">
                  <Coins size={14} />
                  {item.coinCost} coins
                </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="-mx-4 mt-5 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
        <div className="flex min-w-max gap-2">
          {filters.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => {
                  setActiveFilter(filter.id);
                  setDismissedNudge(false);
                }}
                className={[
                  "h-10 rounded-full border px-4 text-sm font-black transition",
                  isActive
                    ? "border-yellow-300 bg-yellow-300 text-hawk-ink"
                    : "border-yellow-600 bg-white text-yellow-700 hover:bg-yellow-50"
                ].join(" ")}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </section>

      {coinShortfall > 0 && !dismissedNudge ? (
        <section className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-900">
            You need {coinShortfall} more coins for the lowest-priced item here.{" "}
            <Link to="/drills" className="font-black text-hawk-green">
              Train today to earn coins →
            </Link>
          </p>
          <button
            type="button"
            onClick={() => setDismissedNudge(true)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white text-amber-700"
            aria-label="Dismiss coin nudge"
          >
            <X size={16} />
          </button>
        </section>
      ) : null}

      <section className="mt-5 grid gap-4 md:grid-cols-2">
        {visibleItems.map((item) => (
          <StoreItemCard
            key={item.id}
            item={item}
            player={player}
            onOpen={() => openItem(item)}
          />
        ))}
      </section>

      {selectedItem ? (
        <ItemDetailModal
          item={selectedItem}
          player={player}
          onClose={() => setSelectedItem(null)}
          onRedeemed={handleRedeemed}
        />
      ) : null}

      {toast ? (
        <div className="fixed bottom-5 right-5 z-[70] rounded-lg border border-amber-200 bg-white p-4 text-sm font-black text-amber-900 shadow-soft">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function StoreItemCard({ item, player, onOpen }) {
  const locked = isTierLocked(item, player.subscriptionTier);
  const soldOut = item.stock === "sold-out";
  const tripodClaimed = item.id === 13 && player.tripodReceived;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={[
        "overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft",
        locked ? "opacity-60" : ""
      ].join(" ")}
    >
      <div
        className="relative h-[120px] overflow-hidden p-3"
        style={{ backgroundColor: item.imageColor }}
      >
        <img
          src={getStoreImage(item)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-black/10" />
        <span className="relative z-10 rounded-full bg-black/30 px-2.5 py-1 text-xs font-black text-white">
          {categoryLabels[item.category]}
        </span>
        <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-2">
          {item.stock === "limited" ? (
            <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-black text-amber-800">
              LIMITED
            </span>
          ) : null}
          {locked ? (
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-yellow-700">
              <ShoppingBag size={16} />
            </span>
          ) : null}
          {tripodClaimed ? (
            <span className="rounded-md bg-white px-2 py-1 text-xs font-black text-hawk-green">
              Gifted to first 100 signups
            </span>
          ) : null}
        </div>
        {soldOut ? (
          <div className="absolute inset-0 grid place-items-center bg-slate-900/55">
            <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
              SOLD OUT
            </span>
          </div>
        ) : null}
      </div>
      <div className="p-4">
        <h2 className="text-sm font-semibold text-hawk-ink">{item.name}</h2>
        <p className="mt-1 text-xs font-bold text-slate-500">{item.brand}</p>
        <p
          className="mt-2 text-sm font-medium leading-5 text-slate-600"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}
        >
          {item.description}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="inline-flex items-center gap-1 text-sm font-black text-yellow-600">
            <Coins size={14} />
            {item.coinCost} coins
          </p>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-black ${deliveryTones[item.deliveryType]}`}
          >
            {capitalize(item.deliveryType)}
          </span>
        </div>
        <div className="mt-4">
          {locked ? (
            <p
              className={[
                "text-center text-sm font-black",
                item.tierRequired === "elite"
                  ? "text-[#8a2fd1]"
                  : "text-yellow-700"
              ].join(" ")}
            >
              {item.tierRequired === "elite"
                ? "Elite required — ₹499/mo"
                : "Pro required — ₹149/mo"}
            </p>
          ) : tripodClaimed ? (
            <p className="rounded-lg bg-slate-100 py-3 text-center text-sm font-black text-slate-500">
              Already Claimed ✓
            </p>
          ) : soldOut ? (
            <p className="rounded-lg bg-slate-100 py-3 text-center text-sm font-black text-slate-500">
              Out of Stock
            </p>
          ) : (
            <span className="block rounded-lg bg-yellow-300 py-3 text-center text-sm font-black text-hawk-ink">
              Redeem
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function ItemDetailModal({ item, player, onClose, onRedeemed }) {
  const navigate = useNavigate();
  const [step, setStep] = useState("detail");
  const [address, setAddress] = useState(player.city || "");
  const [language, setLanguage] = useState("English");
  const [currentPlayer, setCurrentPlayer] = useState(player);
  const locked = isTierLocked(item, currentPlayer.subscriptionTier);
  const soldOut = item.stock === "sold-out";
  const tripodClaimed = item.id === 13 && currentPlayer.tripodReceived;
  const streakFreezeMaxed = item.id === 31 && currentPlayer.streakFreezes >= 2;
  const remaining = currentPlayer.coinBalance - item.coinCost;
  const insufficient = remaining < 0;
  const isValid =
    !locked &&
    !soldOut &&
    !tripodClaimed &&
    !insufficient &&
    (item.deliveryType !== "physical" || address.trim().length > 0);

  function confirmRedemption() {
    if (item.deliveryType === "physical" && !address.trim()) return;
    setStep("processing");
    window.setTimeout(() => {
      const nextProfile = redeemStoreItem(item);
      setCurrentPlayer(nextProfile);
      onRedeemed(nextProfile);
      if (streakFreezeMaxed) {
        setStep("detail");
        return;
      }
      setStep("success");
    }, 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/55 px-3 sm:px-6">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close store item"
      />
      <section className="relative mx-auto max-h-[92vh] w-full max-w-2xl overflow-auto rounded-t-2xl bg-white p-5 shadow-soft">
        <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-300" />

        {step === "detail" ? (
          <>
            <ItemModalBody item={item} player={currentPlayer} />
            <BalanceRows
              balance={currentPlayer.coinBalance}
              cost={item.coinCost}
              remaining={remaining}
            />
            <button
              type="button"
              disabled={locked || soldOut || tripodClaimed || insufficient}
              onClick={() => setStep("confirm")}
              title={insufficient ? "Not enough coins" : undefined}
              className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-lg bg-yellow-300 px-5 text-sm font-black text-hawk-ink transition hover:bg-yellow-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              {locked
                ? item.tierRequired === "elite"
                  ? "Elite required — ₹499/mo"
                  : "Pro required — ₹149/mo"
                : soldOut
                  ? "Out of Stock"
                  : tripodClaimed
                    ? "Already Claimed ✓"
                    : insufficient
                      ? "Not enough coins"
                      : "Redeem Now"}
            </button>
            {streakFreezeMaxed ? (
              <p className="mt-2 text-center text-xs font-bold text-amber-700">
                You already have the maximum 2 Streak Freezes.
              </p>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="mt-3 h-11 w-full rounded-lg border border-slate-300 text-sm font-black text-slate-600"
            >
              Close
            </button>
          </>
        ) : null}

        {step === "confirm" ? (
          <>
            <h2 className="text-3xl font-black text-hawk-ink">
              Confirm Redemption
            </h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
              {item.name} · {item.coinCost} coins. This will deduct{" "}
              {item.coinCost} coins from your balance. Your remaining balance
              will be {remaining} coins.
            </p>
            {item.deliveryType === "physical" ? (
              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Delivery address
                </span>
                <textarea
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Enter your full delivery address"
                  className="min-h-28 w-full rounded-lg border border-slate-300 p-3 text-sm font-semibold text-slate-900"
                />
              </label>
            ) : (
              <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                Session details will be sent to: {player.email || "your account"}
              </p>
            )}
            {item.deliveryType === "session" ||
            item.category === "mental-performance" ||
            item.category === "coach-consultation" ? (
              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Preferred language
                </span>
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold"
                >
                  {languages.map((itemLanguage) => (
                    <option key={itemLanguage}>{itemLanguage}</option>
                  ))}
                </select>
              </label>
            ) : null}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={!isValid}
                onClick={confirmRedemption}
                className="h-12 rounded-lg bg-yellow-300 text-sm font-black text-hawk-ink disabled:bg-slate-200 disabled:text-slate-500"
              >
                Confirm & Redeem
              </button>
              <button
                type="button"
                onClick={() => setStep("detail")}
                className="h-12 rounded-lg border border-slate-300 text-sm font-black text-slate-600"
              >
                Cancel
              </button>
            </div>
          </>
        ) : null}

        {step === "processing" ? (
          <div className="grid min-h-80 place-items-center text-center">
            <div>
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-hawk-green" />
              <p className="mt-5 text-lg font-black text-hawk-ink">
                Processing your redemption...
              </p>
            </div>
          </div>
        ) : null}

        {step === "success" ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto text-hawk-green" size={64} />
            <h2 className="mt-4 text-4xl font-black text-hawk-green">
              Redeemed!
            </h2>
            <p className="mt-2 text-lg font-black text-hawk-ink">
              {item.name}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              Your coins have been deducted.
            </p>
            <p className="mt-4 rounded-lg bg-hawk-field p-4 text-2xl font-black text-hawk-ink">
              {currentPlayer.coinBalance} coins
            </p>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
              {item.deliveryType === "physical"
                ? "We'll send a delivery confirmation to your account."
                : "Our team will reach out within 48 hours to schedule."}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={onClose}
                className="h-12 rounded-lg bg-yellow-300 text-sm font-black text-hawk-ink"
              >
                Continue Shopping
              </button>
              <button
                type="button"
                onClick={() => navigate("/player/store/redemptions")}
                className="h-12 rounded-lg border border-slate-300 text-sm font-black text-slate-600"
              >
                View My Redemptions
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function ItemModalBody({ item, player }) {
  const DeliveryIcon = item.deliveryType === "physical" ? Truck : Mail;

  return (
    <>
      <span className="rounded-full bg-hawk-field px-3 py-1 text-xs font-black text-hawk-green">
        {categoryLabels[item.category]}
      </span>
      <h2 className="mt-4 text-3xl font-black text-hawk-ink">{item.name}</h2>
      <p className="mt-1 text-sm font-bold text-slate-500">{item.brand}</p>
      <div
        className="mt-5 h-[180px] overflow-hidden rounded-lg"
        style={{ backgroundColor: item.imageColor }}
      >
        <img
          src={getStoreImage(item)}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
      <p className="mt-5 text-sm font-semibold leading-6 text-slate-600">
        {item.description}
      </p>
      <div className="mt-5 rounded-lg bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <DeliveryIcon className="mt-0.5 text-hawk-green" size={20} />
          <div>
            <p className="text-sm font-black text-hawk-ink">
              {item.deliveryNote}
            </p>
            <p className="mt-1 text-xs font-black uppercase tracking-wide text-yellow-700">
              {item.deliveryType === "physical"
                ? "Delivery address collected after redemption"
                : "Team follow-up within 48 hours"}
            </p>
          </div>
        </div>
      </div>
      {item.deliveryType === "session" ? (
        <p className="mt-4 rounded-lg bg-purple-50 p-4 text-sm font-semibold leading-6 text-purple-800">
          After redemption, our team will contact you within 48 hours to
          schedule your session via Google Meet or Zoom.
        </p>
      ) : null}
      {item.deliveryType === "physical" ? (
        <p className="mt-4 rounded-lg bg-blue-50 p-4 text-sm font-semibold leading-6 text-blue-800">
          Your registered city: {player.city || "City pending"}. Delivery
          address will be collected after redemption.
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {item.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600"
          >
            {tag}
          </span>
        ))}
      </div>
    </>
  );
}

function BalanceRows({ balance, cost, remaining }) {
  return (
    <div className="mt-5 grid gap-2 rounded-lg border border-slate-200 p-4 text-sm font-bold text-slate-600">
      <div className="flex justify-between">
        <span>Current balance</span>
        <span>{balance} coins</span>
      </div>
      <div className="flex justify-between">
        <span>Item cost</span>
        <span>{cost} coins</span>
      </div>
      <div className="flex justify-between">
        <span>Remaining after purchase</span>
        <span className={remaining < 0 ? "text-red-600" : "text-hawk-green"}>
          {remaining < 0 ? "Insufficient coins" : `${remaining} coins`}
        </span>
      </div>
    </div>
  );
}

function isTierLocked(item, subscriptionTier) {
  return getTierRank(subscriptionTier) < getTierRank(item.tierRequired);
}

function getTierRank(tier) {
  const normalizedTier = String(tier || "free").toLowerCase();
  const tierName =
    normalizedTier === "pro"
      ? "Pro"
      : normalizedTier === "elite"
        ? "Elite"
        : "Free";

  return subscriptions[tierName]?.rank ?? 0;
}

function getPositionCode(position) {
  const normalizedPosition = String(position || "").toLowerCase();
  if (normalizedPosition.includes("goalkeeper")) return "GK";
  if (
    normalizedPosition.includes("centre back") ||
    normalizedPosition.includes("center back") ||
    normalizedPosition.includes("full back")
  ) {
    return "DEF";
  }
  if (normalizedPosition.includes("striker") || normalizedPosition.includes("winger")) {
    return "FWD";
  }
  if (normalizedPosition.includes("midfielder")) return "MID";
  return "MID";
}

function isPositionMatch(item, playerPosition) {
  return !item.positions || item.positions.includes(playerPosition);
}

function getStoreImage(item) {
  if (item.image) return item.image;
  if (item.tags?.includes("apparel")) return storeImageMap.apparel;
  if (item.tags?.includes("ball")) return storeImageMap.ball;
  if (item.tags?.includes("tripod")) return storeImageMap.tripod;
  if (item.category === "nutrition") return storeImageMap.nutrition;
  if (
    item.category === "coach-consultation" ||
    item.category === "mental-performance"
  ) {
    return storeImageMap.session;
  }
  return storeImageMap.equipment;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
