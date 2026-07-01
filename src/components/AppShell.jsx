import {
  Activity,
  Coins,
  GitBranch,
  Heart,
  MapPinned,
  MapPin,
  MessageCircle,
  RotateCcw,
  Search,
  ShoppingBag,
  ShieldCheck,
  Trophy
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import LanguageSwitcher from "./LanguageSwitcher.jsx";
import { accountTypes, getAccountType, getHomePath } from "../lib/account.js";
import {
  applyRankDecayOnOpen,
  applyWeeklyReportIfNeeded,
  checkAndApplyStreakFreeze,
  checkAndResetWeeklyRival,
  getRankDivisionMeta,
  loadPlayerProfile,
  savePlayerProfile
} from "../lib/playerProfile.js";
import {
  getUnreadCount,
  withPlayerMatchmaking
} from "../lib/matchmaking.js";

const sportshawkStorageKeys = [
  "sportshawk_account_type",
  "sportshawk_coach_profile",
  "sportshawk_player_profile",
  "sportshawk_scout_credits"
];

const playerNavItems = [
  { to: "/player", labelKey: "nav.home", icon: Activity },
  { to: "/player/skill-tree", label: "Skills", icon: GitBranch },
  { to: "/leaderboard", labelKey: "nav.leaderboard", icon: Trophy },
  { to: "/player/store", labelKey: "nav.store", icon: ShoppingBag, badge: true },
  { to: "/wallet", labelKey: "nav.wallet", icon: Coins },
  { to: "/assessment", labelKey: "nav.assessment", icon: MapPinned }
];

const coachNavItems = [
  { to: "/coach", labelKey: "nav.coach", icon: Activity },
  { to: "/coach/matchmaking", label: "Matchmaking", icon: Heart },
  { to: "/scout", labelKey: "nav.scout", icon: Search }
];

const guestNavItems = [
  { to: "/onboarding", labelKey: "nav.signup", icon: ShieldCheck }
];

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [profileVersion, setProfileVersion] = useState(0);
  const [resetToast, setResetToast] = useState("");
  const [appToast, setAppToast] = useState(null);
  const [rankOverlay, setRankOverlay] = useState(null);
  const [rivalOverlay, setRivalOverlay] = useState(null);
  const accountType = getAccountType();
  const playerProfile =
    accountType === accountTypes.player ? loadPlayerProfile() : null;
  const hasPendingRedemptions = playerProfile?.redemptionHistory?.some(
    (redemption) => redemption.status === "processing"
  );
  const unreadMessages =
    accountType === accountTypes.coach
      ? getUnreadCount("coach")
      : accountType === accountTypes.player
        ? getUnreadCount("player")
        : 0;
  const navItems =
    accountType === accountTypes.player
      ? playerNavItems
      : accountType === accountTypes.coach
        ? coachNavItems
        : guestNavItems;
  const homePath = getHomePath(accountType);
  const messagesPath =
    accountType === accountTypes.coach
      ? "/coach/connections"
      : accountType === accountTypes.player
        ? "/player/connections"
        : null;

  useEffect(() => {
    function refreshProfile() {
      setProfileVersion((version) => version + 1);
    }

    window.addEventListener("sportshawk-profile-change", refreshProfile);
    return () =>
      window.removeEventListener("sportshawk-profile-change", refreshProfile);
  }, []);

  useEffect(() => {
    if (!resetToast) return undefined;

    const timeoutId = window.setTimeout(() => setResetToast(""), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [resetToast]);

  useEffect(() => {
    if (accountType !== accountTypes.player) return undefined;

    let profile = applyRankDecayOnOpen();
    profile = applyWeeklyReportIfNeeded(profile);
    const weeklyCheckedProfile = checkAndResetWeeklyRival(profile);
    if (weeklyCheckedProfile !== profile) {
      profile = savePlayerProfile(weeklyCheckedProfile);
    }
    const checkedProfile = checkAndApplyStreakFreeze(profile);
    if (checkedProfile !== profile) {
      const pendingNotification = checkedProfile.pendingNotification;
      const nextProfile = { ...checkedProfile };
      delete nextProfile.pendingNotification;
      profile = savePlayerProfile(nextProfile);

      if (pendingNotification) {
        setAppToast(pendingNotification);
      }
    }

    if (profile.lastRankEvent?.type === "rankDown") {
      setRankOverlay(profile.lastRankEvent);
      const timeoutId = window.setTimeout(() => setRankOverlay(null), 2500);
      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [accountType]);

  useEffect(() => {
    if (accountType !== accountTypes.player) return;
    if (location.pathname.startsWith("/drills")) return;

    const profile = loadPlayerProfile();
    if (!profile.lastStreakFreezeEvent) return;

    setAppToast({
      message: profile.lastStreakFreezeEvent.message,
      type: profile.lastStreakFreezeEvent.type || "success"
    });
    savePlayerProfile({
      ...profile,
      lastStreakFreezeEvent: null
    });
  }, [accountType, profileVersion, location.pathname]);

  useEffect(() => {
    if (accountType !== accountTypes.player) return undefined;
    const profile = withPlayerMatchmaking(loadPlayerProfile());
    const pendingInterests = profile.matchmaking.incomingInterests.filter(
      (interest) =>
        interest.status === "pending" ||
        interest.status === "guardian_pending"
    );
    if (!pendingInterests.length) return undefined;

    setAppToast({
      message: `💌 ${pendingInterests.length} coach(es) want to connect with you`,
      type: "success"
    });

    const expiringSoon = pendingInterests.filter(
      (interest) => interest.expiresAt - Date.now() < 24 * 60 * 60 * 1000
    );
    if (!expiringSoon.length) return undefined;

    const timeoutId = window.setTimeout(() => {
      setAppToast({
        message: `⏰ ${expiringSoon.length} interest(s) expire in less than 24 hours`,
        type: "warning"
      });
    }, 3000);
    return () => window.clearTimeout(timeoutId);
  }, [accountType]);

  useEffect(() => {
    if (accountType !== accountTypes.player) return;
    if (location.pathname.startsWith("/drills")) return;

    const profile = loadPlayerProfile();
    if (!profile.lastRivalEvent) return;

    setRivalOverlay(profile.lastRivalEvent);
    setAppToast({
      message: `🔥 You overtook ${profile.lastRivalEvent.rivalName}! New rival assigned.`,
      type: "success"
    });
    savePlayerProfile({
      ...profile,
      lastRivalEvent: null
    });
    const timeoutId = window.setTimeout(() => setRivalOverlay(null), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [accountType, profileVersion, location.pathname]);

  useEffect(() => {
    if (!appToast) return undefined;

    const timeoutId = window.setTimeout(() => setAppToast(null), 3800);
    return () => window.clearTimeout(timeoutId);
  }, [appToast]);

  function resetApp() {
    sportshawkStorageKeys.forEach((key) => {
      window.localStorage.removeItem(key);
    });
    window.dispatchEvent(new Event("sportshawk-account-change"));
    window.dispatchEvent(new Event("sportshawk-profile-change"));
    setResetToast(t("reset.toast"));
    navigate("/onboarding", {
      replace: true,
      state: { resetComplete: true }
    });
  }

  void profileVersion;

  return (
    <div className="min-h-screen bg-[#f7faf7] text-hawk-ink">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <NavLink to={homePath} className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-hawk-green text-white sm:h-10 sm:w-10">
              <MapPin size={20} strokeWidth={2.4} />
            </div>
            <div className="min-w-0">
              <p className="text-base font-black leading-5 tracking-wide">
                {t("app.name")}
              </p>
              <p className="max-w-[210px] truncate text-xs font-semibold text-slate-500 sm:max-w-none">
                {accountType === accountTypes.coach
                  ? t("app.coachWorkspace")
                  : t("app.playerDevelopment")}
              </p>
            </div>
          </NavLink>
          <div className="flex items-center gap-2">
            {messagesPath ? (
              <NavLink
                to={messagesPath}
                aria-label="Messages"
                title="Messages"
                className={({ isActive }) =>
                  [
                    "relative grid h-10 w-10 place-items-center rounded-lg border text-hawk-green transition",
                    isActive
                      ? "border-yellow-300 bg-yellow-50 text-yellow-600"
                      : "border-slate-200 bg-white hover:bg-hawk-field"
                  ].join(" ")
                }
              >
                <MessageCircle size={19} />
                {unreadMessages > 0 ? (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                ) : null}
              </NavLink>
            ) : null}
            <LanguageSwitcher />
            <nav className="hidden items-center gap-1 rounded-lg bg-slate-100 p-1 md:flex">
              {navItems.map((item) => (
                <NavItem
                  key={item.to}
                  item={item}
                  hasPendingRedemptions={hasPendingRedemptions}
                  unreadMessages={unreadMessages}
                  mode="desktop"
                />
              ))}
            </nav>
          </div>
        </div>
      </header>
      <main className="pb-24 md:pb-0">
        <Outlet />
      </main>
      <div className="fixed right-2 top-1/2 z-50 flex -translate-y-1/2 flex-col items-end gap-2 sm:right-3">
        {resetToast ? (
          <div className="max-w-[220px] rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-hawk-green shadow-soft">
            {resetToast}
          </div>
        ) : null}
        <button
          type="button"
          onClick={resetApp}
          aria-label={t("reset.quick")}
          title={t("reset.quick")}
          className="group inline-flex h-11 items-center justify-center gap-2 rounded-l-full border border-amber-200 bg-white px-3 text-sm font-black text-hawk-clay shadow-soft transition hover:bg-amber-50 sm:h-12 sm:px-4"
        >
          <RotateCcw size={18} />
          <span className="hidden sm:inline">{t("reset.short")}</span>
        </button>
      </div>
      {appToast ? (
        <div
          className={[
            "fixed bottom-24 right-4 z-[65] max-w-sm rounded-lg border bg-white p-4 text-sm font-black shadow-soft md:bottom-5",
            appToast.type === "error"
              ? "border-red-200 text-red-700"
              : appToast.type === "warning"
                ? "border-amber-200 text-amber-800"
                : "border-emerald-200 text-hawk-green"
          ].join(" ")}
        >
          {appToast.message}
        </div>
      ) : null}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        <div
          className={[
            "mx-auto grid max-w-lg gap-1",
            navItems.length > 4 ? "grid-cols-6" : "grid-cols-3"
          ].join(" ")}
        >
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              item={item}
              hasPendingRedemptions={hasPendingRedemptions}
              unreadMessages={unreadMessages}
              mode="mobile"
            />
          ))}
        </div>
      </nav>
      {rankOverlay ? <RankOverlay event={rankOverlay} /> : null}
      {rivalOverlay ? <RivalOverlay event={rivalOverlay} /> : null}
    </div>
  );
}

function RankOverlay({ event }) {
  const division = getRankDivisionMeta(event.division);

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-red-950/75 p-6 text-center text-white backdrop-blur-sm">
      <section className="w-full max-w-md rounded-lg border border-red-400/30 bg-hawk-ink p-6 shadow-2xl">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">
          Rank Dropped
        </p>
        <h2 className="mt-4 text-4xl font-black" style={{ color: division.color }}>
          {event.previousLabel} → {event.label}
        </h2>
        <p className="mt-3 text-sm font-semibold text-white/65">
          Train daily to climb back.
        </p>
      </section>
    </div>
  );
}

function RivalOverlay({ event }) {
  return (
    <div className="fixed inset-0 z-[75] flex flex-col items-center justify-center gap-4 bg-hawk-ink/95 p-6 text-center text-white">
      <div className="text-6xl">⚔️</div>
      <h2 className="text-4xl font-black text-hawk-clay">Rival Beaten!</h2>
      <p className="max-w-sm text-lg font-semibold">
        You overtook {event.rivalName} from {event.rivalCity}
      </p>
      <p className="text-sm font-bold text-white/50">
        New rival being assigned...
      </p>
    </div>
  );
}

function NavItem({ item, hasPendingRedemptions, unreadMessages, mode }) {
  const Icon = item.icon;
  const isMobile = mode === "mobile";
  const { t } = useTranslation();

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        [
          "relative flex items-center justify-center font-bold transition",
          isMobile
            ? "min-h-14 flex-col gap-1 rounded-lg px-1 text-[10px] leading-none"
            : "h-10 gap-2 rounded-md px-3 text-sm",
          isActive
            ? "bg-yellow-50 text-yellow-600 md:bg-white md:shadow-sm"
            : "text-slate-600 hover:text-hawk-ink"
        ].join(" ")
      }
    >
      <span className="relative inline-flex">
        <Icon size={isMobile ? 19 : 17} />
        {item.badge && hasPendingRedemptions ? (
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-white" />
        ) : null}
        {item.messageBadge && unreadMessages > 0 ? (
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
        ) : null}
      </span>
      <span className="max-w-full truncate">{item.label || t(item.labelKey)}</span>
    </NavLink>
  );
}
