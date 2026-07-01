import {
  ArrowRight,
  Check,
  LockKeyhole,
  Play,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { drills } from "../data/drills.js";
import { skillNodes } from "../data/skillTree.js";
import {
  hasSubscription,
  loadPlayerProfile,
  normalizeSkillProgress
} from "../lib/playerProfile.js";

const cellWidth = 170;
const cellHeight = 150;
const nodeRadius = 34;
const offsetX = 56;
const offsetY = 56;

export default function SkillTreePage() {
  const [selectedNode, setSelectedNode] = useState(null);
  const player = loadPlayerProfile();
  const progress = useMemo(
    () => normalizeSkillProgress(player.skillProgress || {}),
    [player.skillProgress]
  );
  const unlockedCount = skillNodes.filter(
    (node) => progress[node.id]?.unlocked
  ).length;
  const activeCount = skillNodes.filter(
    (node) => progress[node.id]?.sessions > 0
  ).length;
  const width = offsetX * 2 + cellWidth * 4;
  const height = offsetY * 2 + cellHeight * 4;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <section className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-green">
            Player Development
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-hawk-ink sm:text-5xl">
            Skill Tree
          </h1>
          <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
            Complete drills to unlock new skills
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-black text-hawk-green shadow-sm">
          {unlockedCount} skills unlocked · {activeCount} active
        </div>
      </section>

      <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="min-w-[760px]">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-[640px] w-full"
            role="img"
            aria-label="SportsHawk skill tree"
          >
            {[1, 2, 3, 4].map((tier) => (
              <g key={tier}>
                <text
                  x={20}
                  y={offsetY + (tier - 1) * cellHeight + 6}
                  fill="#64748b"
                  fontSize="13"
                  fontWeight="800"
                >
                  TIER {tier}
                </text>
                <line
                  x1={80}
                  x2={width - 28}
                  y1={offsetY + (tier - 1) * cellHeight}
                  y2={offsetY + (tier - 1) * cellHeight}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
              </g>
            ))}

            {skillNodes.flatMap((node) =>
              node.requires.map((requiredId) => {
                const parent = skillNodes.find((item) => item.id === requiredId);
                if (!parent) return null;
                const childUnlocked = progress[node.id]?.unlocked;
                const parentPoint = getNodePoint(parent);
                const childPoint = getNodePoint(node);

                return (
                  <line
                    key={`${requiredId}-${node.id}`}
                    x1={parentPoint.x}
                    y1={parentPoint.y + nodeRadius}
                    x2={childPoint.x}
                    y2={childPoint.y - nodeRadius}
                    stroke={childUnlocked ? "#f5c542" : "#94a3b8"}
                    strokeWidth={childUnlocked ? "4" : "2"}
                    strokeDasharray={childUnlocked ? "0" : "8 7"}
                    strokeLinecap="round"
                  />
                );
              })
            )}

            {skillNodes.map((node) => (
              <SkillNode
                key={node.id}
                node={node}
                progress={progress[node.id]}
                onSelect={() => setSelectedNode(node)}
              />
            ))}
          </svg>
        </div>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        <LegendItem color="#f5c542" label="Gold links are unlocked paths" />
        <LegendItem color="#94a3b8" label="Dashed links need prerequisites" />
        <LegendItem color="#0f241d" label="Pulsing rings are in progress" />
      </section>

      {selectedNode ? (
        <SkillNodeSheet
          node={selectedNode}
          progress={progress}
          player={player}
          onClose={() => setSelectedNode(null)}
        />
      ) : null}
    </div>
  );
}

function SkillNode({ node, progress, onSelect }) {
  const point = getNodePoint(node);
  const isUnlocked = progress?.unlocked;
  const masteryLevel = progress?.masteryLevel || 0;
  const isActive = isUnlocked && (progress?.sessions || 0) > 0 && masteryLevel < 4;

  return (
    <g
      role="button"
      tabIndex="0"
      onClick={onSelect}
      className="cursor-pointer"
    >
      {isActive ? (
        <circle
          cx={point.x}
          cy={point.y}
          r={nodeRadius + 8}
          fill="none"
          stroke={node.color}
          strokeWidth="3"
          opacity="0.35"
        >
          <animate
            attributeName="r"
            values={`${nodeRadius + 4};${nodeRadius + 13};${nodeRadius + 4}`}
            dur="1.8s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.45;0.08;0.45"
            dur="1.8s"
            repeatCount="indefinite"
          />
        </circle>
      ) : null}
      <circle
        cx={point.x}
        cy={point.y}
        r={nodeRadius}
        fill={isUnlocked ? node.color : "#334155"}
        stroke={isUnlocked ? "#ffffff" : "#64748b"}
        strokeWidth="4"
      />
      {isUnlocked ? (
        <text
          x={point.x}
          y={point.y + 8}
          fill="#ffffff"
          fontSize="24"
          fontWeight="900"
          textAnchor="middle"
        >
          {masteryLevel >= 4 ? "✓" : masteryLevel}
        </text>
      ) : (
        <g transform={`translate(${point.x - 11} ${point.y - 11})`}>
          <path
            d="M7 10V7a4 4 0 0 1 8 0v3"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <rect
            x="4"
            y="10"
            width="14"
            height="11"
            rx="2"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="2"
          />
        </g>
      )}
      <text
        x={point.x}
        y={point.y + nodeRadius + 28}
        fill="#0f172a"
        fontSize="13"
        fontWeight="900"
        textAnchor="middle"
      >
        {node.name}
      </text>
      <text
        x={point.x}
        y={point.y + nodeRadius + 46}
        fill="#64748b"
        fontSize="11"
        fontWeight="700"
        textAnchor="middle"
      >
        {isUnlocked ? node.masteryTitles[masteryLevel] : "Locked"}
      </text>
    </g>
  );
}

function SkillNodeSheet({ node, progress, player, onClose }) {
  const nodeProgress = progress[node.id] || {};
  const isUnlocked = nodeProgress.unlocked;
  const drill = drills.find((item) => item.id === node.drillId);
  const requiredTier = getRequiredPlan(drill);
  const tierAllowed = !requiredTier || hasSubscription(player, requiredTier);
  const nextThreshold = getNextThreshold(node, nodeProgress.masteryLevel);
  const nextTitle =
    node.masteryTitles[Math.min((nodeProgress.masteryLevel || 0) + 1, 4)];
  const drillPath = node.drillId === 1 ? "/drills/juggling" : `/drills?drill=${node.drillId}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/45 p-3 sm:p-6">
      <section className="mx-auto max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-lg">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="rounded-md bg-hawk-field px-3 py-1 text-xs font-black uppercase tracking-wide text-hawk-green">
              {formatCategory(node.category)}
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-hawk-ink">
              {isUnlocked ? node.name : `Locked — ${node.unlockCondition}`}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600"
            aria-label="Close skill details"
          >
            <X size={19} />
          </button>
        </div>

        {isUnlocked ? (
          <div className="mt-5 grid gap-5">
            <section className="rounded-lg bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-hawk-ink">
                  Current mastery: {node.masteryTitles[nodeProgress.masteryLevel || 0]}
                </p>
                <span
                  className="rounded-md px-2.5 py-1 text-xs font-black text-white"
                  style={{ backgroundColor: node.color }}
                >
                  Level {nodeProgress.masteryLevel || 0}
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${getMasteryPercent(node, nodeProgress)}%`,
                    backgroundColor: node.color
                  }}
                />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-600">
                {nextThreshold
                  ? `Sessions completed: ${nodeProgress.sessions || 0} / ${nextThreshold}`
                  : `Sessions completed: ${nodeProgress.sessions || 0}`}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {nextThreshold ? `Next level: ${nextTitle}` : "Mastery complete"}
              </p>
            </section>

            <section>
              <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">
                Benefits by mastery
              </h3>
              <div className="mt-3 grid gap-2">
                {node.masteryTitles.map((title, index) => (
                  <div
                    key={title}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"
                  >
                    <span
                      className={[
                        "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black",
                        (nodeProgress.masteryLevel || 0) >= index
                          ? "text-white"
                          : "bg-slate-100 text-slate-500"
                      ].join(" ")}
                      style={{
                        backgroundColor:
                          (nodeProgress.masteryLevel || 0) >= index
                            ? node.color
                            : undefined
                      }}
                    >
                      {index}
                    </span>
                    <div>
                      <p className="text-sm font-black text-hawk-ink">{title}</p>
                      <p className="text-xs font-semibold text-slate-500">
                        {getMasteryBenefit(title)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {tierAllowed ? (
              <Link
                to={drillPath}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-hawk-green px-5 text-sm font-black text-white"
              >
                <Play size={17} fill="currentColor" />
                Go to Drill
                <ArrowRight size={17} />
              </Link>
            ) : (
              <Link
                to="/player/subscription"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 text-sm font-black text-white"
              >
                <LockKeyhole size={17} />
                {requiredTier} required — upgrade to continue
              </Link>
            )}
          </div>
        ) : (
          <LockedSkillDetails node={node} progress={progress} />
        )}
      </section>
    </div>
  );
}

function LockedSkillDetails({ node, progress }) {
  return (
    <div className="mt-5 grid gap-5">
      <section className="rounded-lg bg-amber-50 p-4">
        <p className="text-sm font-black text-amber-900">How to unlock</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-amber-900">
          {node.unlockCondition}
        </p>
      </section>

      <div className="grid gap-3">
        {node.requires.map((requiredId, index) => {
          const requiredNode = skillNodes.find((item) => item.id === requiredId);
          const requiredProgress = progress[requiredId] || {};
          const requiredLevel = node.requiresMasteryLevel || 0;
          const threshold = requiredNode?.masteryLevels[requiredLevel - 1] || 0;

          return (
            <section
              key={requiredId}
              className="rounded-lg border border-slate-200 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-hawk-ink">
                    Step {index + 1}: {requiredNode?.name}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Need {requiredNode?.masteryTitles[requiredLevel]} level ·{" "}
                    {requiredProgress.sessions || 0}/{threshold || "ready"} sessions
                  </p>
                </div>
                {(requiredProgress.masteryLevel || 0) >= requiredLevel ? (
                  <Check className="text-hawk-green" size={22} />
                ) : (
                  <LockKeyhole className="text-slate-400" size={20} />
                )}
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-yellow-300"
                  style={{
                    width: `${Math.min(
                      100,
                      ((requiredProgress.sessions || 0) / Math.max(threshold, 1)) * 100
                    )}%`
                  }}
                />
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm font-bold text-slate-600">
      <span
        className="h-3 w-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </div>
  );
}

function getNodePoint(node) {
  return {
    x: offsetX + node.position.x * cellWidth,
    y: offsetY + node.position.y * cellHeight
  };
}

function getNextThreshold(node, masteryLevel = 0) {
  return node.masteryLevels[masteryLevel] || null;
}

function getMasteryPercent(node, progress) {
  const masteryLevel = progress.masteryLevel || 0;
  const nextThreshold = getNextThreshold(node, masteryLevel);
  if (!nextThreshold) return 100;
  return Math.min(100, ((progress.sessions || 0) / nextThreshold) * 100);
}

function getRequiredPlan(drill) {
  const tier = String(drill?.tierRequired || "free").toLowerCase();
  if (tier === "elite") return "Elite";
  if (tier === "pro") return "Pro";
  return null;
}

function formatCategory(category) {
  return String(category || "")
    .split("-")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

function getMasteryBenefit(title) {
  const benefits = {
    Novice: "Builds the first repeatable habit.",
    Apprentice: "Unlocks connected Tier 2 skills.",
    Skilled: "Opens advanced development paths.",
    Expert: "Qualifies for elite combinations.",
    Master: "Signals standout consistency to scouts."
  };

  return benefits[title] || "Improves your player profile.";
}
