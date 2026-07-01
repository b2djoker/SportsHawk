import {
  Check,
  LockKeyhole,
  Medal,
  Share2,
  Sparkles
} from "lucide-react";
import { useMemo, useState } from "react";
import { cardBorders, cardThemes, cardTitles } from "../data/cosmetics.js";
import {
  getCardBorder,
  getCardTheme,
  getCardTitle,
  isCosmeticUnlocked,
  loadPlayerProfile,
  savePlayerProfile
} from "../lib/playerProfile.js";

const emojiOptions = [
  { id: null, name: "None", emoji: "" },
  { id: "bolt", name: "Bolt", emoji: "⚡" },
  { id: "target", name: "Target", emoji: "🎯" },
  { id: "fire", name: "Fire", emoji: "🔥" },
  { id: "medal", name: "Medal", emoji: "🏅" },
  { id: "shield", name: "Shield", emoji: "🛡️" },
  { id: "star", name: "Star", emoji: "⭐" }
];

const tabs = ["Themes", "Borders", "Titles", "Emoji"];

export default function CardCustomizePage() {
  const [profile, setProfile] = useState(() => loadPlayerProfile());
  const [draft, setDraft] = useState(() => ({
    cardTheme: profile.cardTheme,
    cardBorder: profile.cardBorder,
    cardTitle: profile.cardTitle,
    cardEmoji: profile.cardEmoji
  }));
  const [activeTab, setActiveTab] = useState("Themes");
  const [toast, setToast] = useState("");
  const selectedTheme = getCardTheme(draft.cardTheme);
  const selectedBorder = getCardBorder(draft.cardBorder);
  const selectedTitle = getCardTitle(draft.cardTitle);
  const selectedEmoji =
    emojiOptions.find((item) => item.emoji === draft.cardEmoji)?.emoji || "";
  const isDirty = useMemo(
    () =>
      draft.cardTheme !== profile.cardTheme ||
      draft.cardBorder !== profile.cardBorder ||
      draft.cardTitle !== profile.cardTitle ||
      draft.cardEmoji !== profile.cardEmoji,
    [draft, profile]
  );

  function saveChanges() {
    const nextProfile = savePlayerProfile({
      ...profile,
      ...draft
    });
    setProfile(nextProfile);
    setDraft({
      cardTheme: nextProfile.cardTheme,
      cardBorder: nextProfile.cardBorder,
      cardTitle: nextProfile.cardTitle,
      cardEmoji: nextProfile.cardEmoji
    });
    setToast("Card updated!");
    window.setTimeout(() => setToast(""), 2400);
  }

  async function shareCard() {
    const file = await buildCardImage({
      profile,
      theme: selectedTheme,
      border: selectedBorder,
      title: selectedTitle,
      emoji: selectedEmoji
    });

    if (
      navigator.canShare &&
      navigator.canShare({ files: [file] }) &&
      navigator.share
    ) {
      await navigator.share({
        title: "My SportsHawk player card",
        text: "My SportsHawk player card",
        files: [file]
      });
      return;
    }

    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sportshawk-player-card.png";
    link.click();
    URL.revokeObjectURL(url);
    setToast("Card image downloaded");
    window.setTimeout(() => setToast(""), 2400);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
      <section className="mb-6">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-green">
          Customize
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-hawk-ink sm:text-5xl">
          Your Player Card
        </h1>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <PlayerCardPreview
            profile={profile}
            theme={selectedTheme}
            border={selectedBorder}
            title={selectedTitle}
            emoji={selectedEmoji}
          />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={shareCard}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-hawk-green px-4 text-sm font-black text-white transition hover:bg-emerald-800"
            >
              <Share2 size={17} />
              Share Card
            </button>
            <button
              type="button"
              onClick={saveChanges}
              disabled={!isDirty}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-hawk-clay px-4 text-sm font-black text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Check size={17} />
              Save Changes
            </button>
          </div>
          {toast ? (
            <p className="mt-3 rounded-lg bg-hawk-field px-3 py-2 text-sm font-black text-hawk-green">
              {toast}
            </p>
          ) : null}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <div className="-mx-4 overflow-x-auto px-4 pb-2">
            <div className="flex min-w-max gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={[
                    "h-10 rounded-lg px-4 text-sm font-black transition",
                    activeTab === tab
                      ? "bg-hawk-clay text-white"
                      : "border border-hawk-clay text-hawk-clay"
                  ].join(" ")}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            {activeTab === "Themes" ? (
              <OptionGrid>
                {cardThemes.map((theme) => (
                  <ThemeOption
                    key={theme.id}
                    item={theme}
                    selected={draft.cardTheme === theme.id}
                    unlocked={isCosmeticUnlocked(theme, profile)}
                    onSelect={() => setDraft((current) => ({ ...current, cardTheme: theme.id }))}
                  />
                ))}
              </OptionGrid>
            ) : null}

            {activeTab === "Borders" ? (
              <OptionGrid>
                {cardBorders.map((border) => (
                  <BorderOption
                    key={border.id}
                    item={border}
                    selected={draft.cardBorder === border.id}
                    unlocked={isCosmeticUnlocked(border, profile)}
                    onSelect={() =>
                      setDraft((current) => ({ ...current, cardBorder: border.id }))
                    }
                  />
                ))}
              </OptionGrid>
            ) : null}

            {activeTab === "Titles" ? (
              <OptionGrid>
                {[{ id: null, name: "No Title", unlockCondition: "default", free: true }, ...cardTitles].map((title) => (
                  <TitleOption
                    key={title.id || "none"}
                    item={title}
                    selected={draft.cardTitle === title.id}
                    unlocked={!title.id || isCosmeticUnlocked(title, profile)}
                    onSelect={() =>
                      setDraft((current) => ({ ...current, cardTitle: title.id }))
                    }
                  />
                ))}
              </OptionGrid>
            ) : null}

            {activeTab === "Emoji" ? (
              <OptionGrid>
                {emojiOptions.map((option) => (
                  <button
                    key={option.id || "none"}
                    type="button"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        cardEmoji: option.emoji || null
                      }))
                    }
                    className={[
                      "rounded-lg border p-4 text-left transition",
                      draft.cardEmoji === option.emoji ||
                      (!draft.cardEmoji && !option.emoji)
                        ? "border-hawk-clay bg-amber-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    ].join(" ")}
                  >
                    <p className="text-3xl">{option.emoji || "—"}</p>
                    <p className="mt-3 text-sm font-black text-hawk-ink">
                      {option.name}
                    </p>
                  </button>
                ))}
              </OptionGrid>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function PlayerCardPreview({ profile, theme, border, title, emoji }) {
  return (
    <div
      className="relative flex h-[180px] overflow-hidden rounded-lg p-5 text-white"
      style={{
        background: `linear-gradient(135deg, ${theme.background}, #07120d)`,
        border: border.style === "animated-fire-border" ? "2px solid #ff7a18" : border.style,
        boxShadow:
          border.style === "animated-fire-border"
            ? "0 0 10px #ff7a18"
            : border.cssGlow || "none"
      }}
    >
      <div className="absolute right-4 top-4 text-4xl opacity-80">{emoji}</div>
      <div className="flex items-center gap-4">
        <div className="h-24 w-24 overflow-hidden rounded-lg border-2 border-white/30 bg-white/10">
          {profile.photoUrl ? (
            <img
              src={profile.photoUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center text-3xl font-black">
              SH
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/60">
            SportsHawk Player
          </p>
          <h2 className="mt-2 truncate text-3xl font-black leading-none">
            {profile.name}
          </h2>
          {title ? (
            <p className="mt-2 inline-flex rounded-md bg-white/15 px-2 py-1 text-xs font-black">
              {title.name}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-white/80">
            <span>{profile.position}</span>
            <span>·</span>
            <span>{profile.city}</span>
            <span>·</span>
            <span>{profile.tierLevel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function OptionGrid({ children }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function ThemeOption({ item, selected, unlocked, onSelect }) {
  return (
    <button
      type="button"
      onClick={unlocked ? onSelect : undefined}
      className={[
        "rounded-lg border p-3 text-left transition",
        selected ? "border-hawk-clay bg-amber-50" : "border-slate-200 bg-white",
        unlocked ? "hover:bg-slate-50" : "cursor-not-allowed opacity-55"
      ].join(" ")}
    >
      <div
        className="h-16 rounded-md"
        style={{ background: `linear-gradient(135deg, ${item.background}, #07120d)` }}
      />
      <OptionText item={item} unlocked={unlocked} />
    </button>
  );
}

function BorderOption({ item, selected, unlocked, onSelect }) {
  return (
    <button
      type="button"
      onClick={unlocked ? onSelect : undefined}
      className={[
        "rounded-lg border p-3 text-left transition",
        selected ? "border-hawk-clay bg-amber-50" : "border-slate-200 bg-white",
        unlocked ? "hover:bg-slate-50" : "cursor-not-allowed opacity-55"
      ].join(" ")}
    >
      <div
        className="grid h-16 place-items-center rounded-md bg-slate-100 text-xs font-black text-slate-500"
        style={{
          border: item.style === "animated-fire-border" ? "2px solid #ff7a18" : item.style,
          boxShadow:
            item.style === "animated-fire-border"
              ? "0 0 8px #ff7a18"
              : item.cssGlow || "none"
        }}
      >
        Border
      </div>
      <OptionText item={item} unlocked={unlocked} />
    </button>
  );
}

function TitleOption({ item, selected, unlocked, onSelect }) {
  return (
    <button
      type="button"
      onClick={unlocked ? onSelect : undefined}
      className={[
        "rounded-lg border p-4 text-left transition",
        selected ? "border-hawk-clay bg-amber-50" : "border-slate-200 bg-white",
        unlocked ? "hover:bg-slate-50" : "cursor-not-allowed opacity-55"
      ].join(" ")}
    >
      <p className="inline-flex items-center gap-2 text-sm font-black text-hawk-ink">
        {unlocked ? <Medal size={16} /> : <LockKeyhole size={16} />}
        {item.name}
      </p>
      <p className="mt-2 text-xs font-bold text-slate-500">
        {unlocked ? "Unlocked" : item.unlockCondition}
      </p>
    </button>
  );
}

function OptionText({ item, unlocked }) {
  return (
    <div className="mt-3">
      <p className="flex items-center gap-2 text-sm font-black text-hawk-ink">
        {unlocked ? <Sparkles size={15} /> : <LockKeyhole size={15} />}
        {item.name}
      </p>
      <p className="mt-1 text-xs font-bold text-slate-500">
        {unlocked ? "Unlocked" : item.unlockCondition}
      </p>
    </div>
  );
}

async function buildCardImage({ profile, theme, border, title, emoji }) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, theme.background);
  gradient.addColorStop(1, "#07120d");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 630);

  if (border.style !== "none") {
    ctx.strokeStyle = border.style === "animated-fire-border" ? "#ff7a18" : "#f5a623";
    ctx.lineWidth = 10;
    ctx.strokeRect(18, 18, 1164, 594);
  }

  ctx.fillStyle = "rgba(255,255,255,0.12)";
  roundRect(ctx, 72, 126, 230, 230, 24);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 88px Arial";
  ctx.fillText("SH", 126, 270);

  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "900 28px Arial";
  ctx.fillText("SPORTSHAWK PLAYER", 350, 150);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 78px Arial";
  ctx.fillText(profile.name || "SportsHawk Player", 350, 245);

  if (title?.name) {
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    roundRect(ctx, 350, 275, 280, 58, 14);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 30px Arial";
    ctx.fillText(title.name, 375, 314);
  }

  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "900 34px Arial";
  ctx.fillText(
    `${profile.position}  ·  ${profile.city}  ·  ${profile.tierLevel}`,
    350,
    410
  );

  if (emoji) {
    ctx.font = "72px Arial";
    ctx.fillText(emoji, 1030, 135);
  }

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  return new File([blob], "sportshawk-player-card.png", { type: "image/png" });
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
