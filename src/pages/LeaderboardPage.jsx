import {
  ArrowDown,
  ArrowUp,
  Flame,
  MapPin,
  Medal,
  ShieldCheck,
  SlidersHorizontal,
  Trophy
} from "lucide-react";
import { useMemo, useState } from "react";
import { mockPlayers } from "../data/mockPlayers.js";
import { currentSeason } from "../data/seasons.js";
import { accountTypes, getAccountType } from "../lib/account.js";
import {
  buildLeagueTable,
  getCardTheme,
  getCardTitle,
  getLeagueMeta,
  getLeaguePositionStatus,
  getRankDivisionMeta,
  getTierLevel,
  loadPlayerProfile,
  rankDivisions
} from "../lib/playerProfile.js";

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState("weekly");
  const [cityFilter, setCityFilter] = useState("All cities");
  const [positionFilter, setPositionFilter] = useState("All positions");
  const [divisionFilter, setDivisionFilter] = useState("current");
  const currentProfile = loadPlayerProfile();
  const accountType = getAccountType();

  const players = useMemo(() => {
    const currentPlayer = {
      id: "current-user",
      name:
        currentProfile.name === "New Player"
          ? "You"
          : `${currentProfile.name} (You)`,
      weeklyPoints: currentProfile.weeklyPts || 0,
      city: currentProfile.city,
      position: currentProfile.position,
      streakCount: currentProfile.streakCount,
      cardTheme: currentProfile.cardTheme,
      cardTitle: currentProfile.cardTitle,
      cardEmoji: currentProfile.cardEmoji,
      isCurrentUser: true
    };
    const playerPool =
      accountType === accountTypes.player
        ? [...mockPlayers, currentPlayer]
        : mockPlayers;

    return playerPool
      .map((player, index) => ({
        ...player,
        cardTheme:
          player.cardTheme ||
          ["default", "midnight", "fire", "golden"][index % 4],
        cardTitle:
          player.cardTitle ||
          ["grassroots", "iron-feet", null, "consistent"][index % 4],
        cardEmoji: player.cardEmoji || ["⚡", "🎯", "", "🔥"][index % 4],
        isRival: player.id === currentProfile.rivalId,
        tierLevel: getTierLevel(player.weeklyPoints)
      }))
      .sort((a, b) => b.weeklyPoints - a.weeklyPoints)
      .map((player, index) => ({ ...player, rank: index + 1 }));
  }, [accountType, currentProfile]);

  const cities = useMemo(
    () => ["All cities", ...new Set(players.map((player) => player.city))],
    [players]
  );
  const positions = useMemo(
    () => [
      "All positions",
      ...new Set(players.map((player) => player.position))
    ],
    [players]
  );

  const filteredPlayers = players.filter((player) => {
    const cityMatch = cityFilter === "All cities" || player.city === cityFilter;
    const positionMatch =
      positionFilter === "All positions" || player.position === positionFilter;

    return cityMatch && positionMatch;
  });
  const rankedPlayers = useMemo(() => {
    const rankedPool = players.map((player, index) => {
      const presetDivision =
        player.isCurrentUser
          ? currentProfile.rankDivision
          : rankDivisions[(index + 2) % rankDivisions.length].id;

      return {
        ...player,
        rankDivision: presetDivision,
        rankPoints:
          player.isCurrentUser
            ? currentProfile.rankPoints
            : 18 + ((player.weeklyPoints + index * 13) % 82),
        rankChange: player.isCurrentUser
          ? currentProfile.lastRankEvent?.type === "rankDown"
            ? -1
            : currentProfile.lastRankEvent?.type === "rankUp"
              ? 1
              : 0
          : index % 3 === 0
            ? 1
            : index % 4 === 0
              ? -1
              : 0,
        isRival: player.id === currentProfile.rivalId
      };
    });
    const selectedDivision =
      divisionFilter === "current" ? currentProfile.rankDivision : divisionFilter;

    return rankedPool
      .filter((player) => player.rankDivision === selectedDivision)
      .sort((a, b) => b.rankPoints - a.rankPoints)
      .map((player, index) => ({ ...player, divisionRank: index + 1 }));
  }, [players, currentProfile, divisionFilter]);
  const divisionOptions = [
    { value: "current", label: "My division" },
    ...rankDivisions.map((division) => ({
      value: division.id,
      label: division.label
    }))
  ];
  const league = getLeagueMeta(currentProfile.currentLeague);
  const leagueTable = useMemo(
    () => buildLeagueTable(currentProfile, currentProfile.currentLeague),
    [currentProfile]
  );
  const currentLeagueRow =
    leagueTable.find((player) => player.isCurrentUser) ||
    leagueTable[leagueTable.length - 1];
  const leagueStatus = getLeaguePositionStatus(
    currentLeagueRow.leagueRank,
    leagueTable.length,
    league.id
  );
  const daysRemaining = getSeasonDaysRemaining(currentSeason.endDate);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <section className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-green">
            Leaderboard
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-hawk-ink sm:text-5xl">
            Grassroots players on a run.
          </h1>
          <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600">
            Weekly points show form. Ranked divisions show consistency, RP,
            promotions, and demotion risk.
          </p>
        </div>

        <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
          {activeTab === "weekly" ? (
            <>
              <FilterSelect
                label="City"
                value={cityFilter}
                options={cities}
                onChange={setCityFilter}
              />
              <FilterSelect
                label="Position"
                value={positionFilter}
                options={positions}
                onChange={setPositionFilter}
              />
            </>
          ) : activeTab === "ranked" ? (
            <FilterSelect
              label="Division"
              value={divisionFilter}
              options={divisionOptions}
              onChange={setDivisionFilter}
            />
          ) : (
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                Current league
              </p>
              <p className="mt-2 text-lg font-black text-hawk-ink">
                {league.name}
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="mb-4 inline-flex rounded-lg bg-slate-100 p-1">
        {["weekly", "ranked", "leagues"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={[
              "h-10 rounded-md px-5 text-sm font-black capitalize transition",
              activeTab === tab
                ? "bg-white text-hawk-green shadow-sm"
                : "text-slate-500"
            ].join(" ")}
          >
            {tab === "leagues" ? "Leagues" : tab}
          </button>
        ))}
      </div>

      {activeTab === "leagues" ? (
        <LeagueTab
          league={league}
          table={leagueTable}
          currentRow={currentLeagueRow}
          status={leagueStatus}
          daysRemaining={daysRemaining}
        />
      ) : (
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
        {activeTab === "weekly" ? (
          <>
            <div className="grid grid-cols-[64px_1.4fr_0.9fr_0.8fr] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500 md:grid-cols-[72px_1.5fr_1fr_1fr_0.8fr_0.8fr]">
              <span>Rank</span>
              <span>Player</span>
              <span className="hidden md:block">City</span>
              <span className="hidden md:block">Position</span>
              <span>Tier</span>
              <span className="text-right">Week</span>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredPlayers.map((player) => (
                <LeaderboardRow key={player.id} player={player} />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-[64px_1.3fr_0.9fr_0.8fr] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500 md:grid-cols-[72px_1.5fr_1fr_1fr_0.9fr_0.6fr]">
              <span>Rank</span>
              <span>Player</span>
              <span className="hidden md:block">City</span>
              <span>Division</span>
              <span className="text-right">RP</span>
              <span className="text-right">Trend</span>
            </div>
            <div className="divide-y divide-slate-100">
              {rankedPlayers.map((player) => (
                <RankedRow key={player.id} player={player} />
              ))}
            </div>
          </>
        )}
      </section>
      )}
    </div>
  );
}

function LeagueTab({ league, table, currentRow, status, daysRemaining }) {
  return (
    <div className="grid gap-5">
      <section
        className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft"
        style={{ borderLeft: `4px solid ${league.color}` }}
      >
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-hawk-green">
              Current League
            </p>
            <h2 className="mt-2 font-condensed text-3xl font-black text-hawk-ink">
              {league.name}
            </h2>
            <p className="mt-2 text-sm font-bold text-slate-500">
              {currentSeason.name} · {daysRemaining} day
              {daysRemaining === 1 ? "" : "s"} left
            </p>
            <p className="mt-4 text-sm font-black text-hawk-ink">
              You are #{currentRow.leagueRank} of ~{table.length} players
            </p>

            <div className="mt-4 grid gap-2 text-xs font-black sm:grid-cols-3">
              <span className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">
                Top 20% · Promotion zone
              </span>
              <span className="rounded-lg bg-slate-100 px-3 py-2 text-slate-600">
                Middle 60% · Safe
              </span>
              <span className="rounded-lg bg-red-50 px-3 py-2 text-red-700">
                Bottom 20% · Relegation zone
              </span>
            </div>
          </div>

          <LeaguePositionIndicator
            position={currentRow.leagueRank}
            total={table.length}
            status={status}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
        <div className="grid grid-cols-[64px_1.5fr_0.9fr_0.9fr] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500 md:grid-cols-[72px_1.6fr_1fr_0.9fr_1fr]">
          <span>Rank</span>
          <span>Player</span>
          <span className="hidden md:block">City</span>
          <span>Tier</span>
          <span className="text-right">Season</span>
        </div>
        <div className="divide-y divide-slate-100">
          {table.map((player) => (
            <LeagueRow key={player.id} player={player} />
          ))}
        </div>
      </section>

      <LeagueInfoCard />
    </div>
  );
}

function LeaguePositionIndicator({ position, total, status }) {
  const topPct = 20;
  const bottomPct = 20;
  const dotTop = Math.max(4, Math.min(96, ((position - 0.5) / total) * 100));
  const statusText = {
    promotion: "Promotion zone",
    safe: "Safe this season",
    relegation: "Relegation risk"
  }[status];

  return (
    <div className="rounded-lg bg-hawk-field p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">
          Position tracker
        </p>
        <span
          className={[
            "rounded-full px-3 py-1 text-xs font-black",
            status === "promotion"
              ? "bg-emerald-100 text-emerald-700"
              : status === "relegation"
                ? "bg-red-100 text-red-700"
                : "bg-white text-slate-600"
          ].join(" ")}
        >
          {statusText}
        </span>
      </div>
      <div className="relative mt-5 h-64 rounded-full bg-slate-200">
        <div
          className="absolute left-0 right-0 top-0 rounded-t-full bg-emerald-500/25"
          style={{ height: `${topPct}%` }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 rounded-b-full bg-red-500/25"
          style={{ height: `${bottomPct}%` }}
        />
        <div
          className="absolute left-1/2 grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-yellow-300 bg-hawk-ink shadow-lg"
          style={{ top: `${dotTop}%` }}
        />
      </div>
      <div className="mt-3 flex justify-between text-xs font-black text-slate-500">
        <span>#1</span>
        <span>#{total}</span>
      </div>
    </div>
  );
}

function LeagueRow({ player }) {
  const status = getLeaguePositionStatus(
    player.leagueRank,
    player.leagueSize,
    player.leagueId
  );
  const zoneLabel =
    status === "promotion"
      ? "↑ Promotion"
      : status === "relegation"
        ? "↓ Relegation"
        : null;

  return (
    <article
      className={[
        "grid grid-cols-[64px_1.5fr_0.9fr_0.9fr] gap-3 px-4 py-4 md:grid-cols-[72px_1.6fr_1fr_0.9fr_1fr]",
        player.isCurrentUser
          ? "border-l-4 border-l-yellow-300"
          : status === "promotion"
            ? "border-l-4 border-l-emerald-500"
            : status === "relegation"
              ? "border-l-4 border-l-red-500"
              : ""
      ].join(" ")}
    >
      <div className="flex items-center">
        <RankBadge rank={player.leagueRank} />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-black text-hawk-ink sm:text-base">
            {player.name}
          </p>
          {player.isCurrentUser ? (
            <span className="rounded-md bg-hawk-green px-2 py-1 text-xs font-black text-white">
              You
            </span>
          ) : null}
        </div>
        {zoneLabel ? (
          <p
            className={[
              "mt-1 text-xs font-black",
              status === "promotion" ? "text-emerald-700" : "text-red-700"
            ].join(" ")}
          >
            {zoneLabel}
          </p>
        ) : null}
      </div>
      <p className="hidden items-center text-sm font-bold text-slate-600 md:flex">
        {player.city}
      </p>
      <div className="flex items-center">
        <TierBadge tier={player.tierLevel} />
      </div>
      <p className="flex items-center justify-end text-lg font-black text-hawk-green">
        {player.seasonPoints}
      </p>
    </article>
  );
}

function LeagueInfoCard() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-hawk-green">
        How leagues work
      </p>
      <div className="mt-4 grid gap-3 text-sm font-bold text-slate-600 md:grid-cols-2">
        <p>Season ends September 30</p>
        <p>Top 20% of players are promoted next season</p>
        <p>Bottom 20% are relegated</p>
        <p>Top 3 nationally win physical prizes 🏆</p>
      </div>

      <div className="mt-5 rounded-lg bg-hawk-field p-4">
        <p className="text-sm font-black text-hawk-ink">Top 3 prizes</p>
        <div className="mt-3 grid gap-2 text-sm font-bold text-slate-600">
          <p>#1 · ₹2,000 store credit + SportsHawk Elite Kit</p>
          <p>#2 · ₹1,000 store credit + Nivia Football</p>
          <p>#3 · ₹500 store credit</p>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-slate-200 p-4">
        <p className="text-sm font-black text-hawk-ink">
          How to earn season points
        </p>
        <div className="mt-3 grid gap-2 text-sm font-bold text-slate-600 sm:grid-cols-2">
          <p>Drill session: +5 pts</p>
          <p>Daily challenge complete: +10 pts</p>
          <p>Personal best: +15 pts</p>
          <p>Weekly top 10: +25 pts</p>
        </div>
      </div>
    </section>
  );
}

function RankedRow({ player }) {
  const theme = getCardTheme(player.cardTheme);
  const title = getCardTitle(player.cardTitle);

  return (
    <article
      className={[
        "grid grid-cols-[64px_1.3fr_0.9fr_0.8fr] gap-3 px-4 py-4 md:grid-cols-[72px_1.5fr_1fr_1fr_0.9fr_0.6fr]",
        player.isCurrentUser
          ? "border-l-4 border-l-yellow-300"
          : player.isRival
            ? "border-l-4 border-l-hawk-clay"
            : ""
      ].join(" ")}
      style={{ backgroundColor: hexToRgba(theme.background, 0.1) }}
    >
      <div className="flex items-center">
        <RankBadge rank={player.divisionRank} />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-black text-hawk-ink sm:text-base">
            {player.cardEmoji ? `${player.cardEmoji} ` : ""}
            {player.name}
          </p>
          {player.isCurrentUser ? (
            <span className="rounded-md bg-hawk-green px-2 py-1 text-xs font-black text-white">
              You
            </span>
          ) : null}
          {player.isRival ? <RivalPill /> : null}
        </div>
        {title ? (
          <p className="mt-1 text-xs font-black text-hawk-clay">{title.name}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <TierBadge tier={player.tierLevel} />
          <span className="text-xs font-bold text-slate-500 md:hidden">
            {player.city}
          </span>
        </div>
      </div>
      <p className="hidden items-center text-sm font-bold text-slate-600 md:flex">
        {player.city}
      </p>
      <div className="flex items-center">
        <DivisionBadge divisionId={player.rankDivision} />
      </div>
      <p className="flex items-center justify-end text-lg font-black text-hawk-green">
        {player.rankPoints}
      </p>
      <div className="flex items-center justify-end">
        {player.rankChange > 0 ? (
          <ArrowUp className="text-emerald-600" size={18} />
        ) : player.rankChange < 0 ? (
          <ArrowDown className="text-red-600" size={18} />
        ) : (
          <span className="text-sm font-black text-slate-400">—</span>
        )}
      </div>
    </article>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
        <SlidersHorizontal size={14} />
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-hawk-ink"
      >
        {options.map((option) => (
          <option
            key={typeof option === "string" ? option : option.value}
            value={typeof option === "string" ? option : option.value}
          >
            {typeof option === "string" ? option : option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function LeaderboardRow({ player }) {
  const theme = getCardTheme(player.cardTheme);
  const title = getCardTitle(player.cardTitle);

  return (
    <article
      className={[
        "grid grid-cols-[64px_1.4fr_0.9fr_0.8fr] gap-3 px-4 py-4 md:grid-cols-[72px_1.5fr_1fr_1fr_0.8fr_0.8fr]",
        player.isCurrentUser
          ? "border-l-4 border-l-yellow-300"
          : player.isRival
            ? "border-l-4 border-l-hawk-clay"
            : ""
      ].join(" ")}
      style={{ backgroundColor: hexToRgba(theme.background, 0.1) }}
    >
      <div className="flex items-center">
        <RankBadge rank={player.rank} />
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-black text-hawk-ink sm:text-base">
            {player.cardEmoji ? `${player.cardEmoji} ` : ""}
            {player.name}
          </p>
          {player.isCurrentUser ? (
            <span className="rounded-md bg-hawk-green px-2 py-1 text-xs font-black text-white">
              You
            </span>
          ) : null}
          {player.isRival ? <RivalPill /> : null}
        </div>
        {title ? (
          <p className="mt-1 text-xs font-black text-hawk-clay">{title.name}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500 md:hidden">
          <span className="inline-flex items-center gap-1">
            <MapPin size={13} />
            {player.city}
          </span>
          <span>{player.position}</span>
        </div>
        <p className="mt-2 inline-flex items-center gap-1 text-xs font-black text-hawk-clay">
          <Flame size={14} fill="currentColor" />
          {player.streakCount} day streak
        </p>
      </div>

      <p className="hidden items-center text-sm font-bold text-slate-600 md:flex">
        {player.city}
      </p>
      <p className="hidden items-center text-sm font-bold text-slate-600 md:flex">
        {player.position}
      </p>
      <div className="flex items-center">
        <TierBadge tier={player.tierLevel} />
      </div>
      <p className="flex items-center justify-end text-lg font-black text-hawk-green">
        {player.weeklyPoints}
      </p>
    </article>
  );
}

function hexToRgba(hex, alpha) {
  const cleanHex = String(hex || "#ffffff").replace("#", "");
  const value = Number.parseInt(cleanHex, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function RankBadge({ rank }) {
  const topRank = rank <= 3;

  return (
    <div
      className={[
        "grid h-10 w-10 place-items-center rounded-lg text-sm font-black",
        topRank ? "bg-hawk-ink text-hawk-lime" : "bg-slate-100 text-slate-600"
      ].join(" ")}
    >
      {topRank ? <Trophy size={17} /> : rank}
    </div>
  );
}

function TierBadge({ tier }) {
  const tones = {
    Bronze: "bg-orange-100 text-orange-800",
    Silver: "bg-slate-200 text-slate-700",
    Gold: "bg-yellow-100 text-yellow-800",
    Elite: "bg-hawk-ink text-hawk-lime"
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-black ${tones[tier]}`}
    >
      <Medal size={14} />
      {tier}
    </span>
  );
}

function DivisionBadge({ divisionId }) {
  const division = getRankDivisionMeta(divisionId);

  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-black text-white"
      style={{ backgroundColor: division.color }}
    >
      <ShieldCheck size={14} fill="currentColor" />
      {division.label}
    </span>
  );
}

function RivalPill() {
  return (
    <span className="rounded-md bg-red-100 px-2 py-1 text-xs font-black text-red-700">
      RIVAL
    </span>
  );
}

function getSeasonDaysRemaining(endDate) {
  const end = new Date(`${endDate}T23:59:59`);
  const diff = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}
