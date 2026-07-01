import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { accountTypes, getAccountType } from "../lib/account.js";
import { loadConnections } from "../lib/matchmaking.js";

export default function ConnectionsPage() {
  const role = getAccountType() === accountTypes.coach ? "coach" : "player";
  const connections = [...loadConnections()].sort(
    (a, b) =>
      new Date(b.lastMessageAt || b.connectedAt).getTime() -
      new Date(a.lastMessageAt || a.connectedAt).getTime()
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-10">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-green">
          Messages
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-hawk-ink">
          Your SportsHawk connections
        </h1>
      </section>

      {!connections.length ? (
        <section className="mt-5 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <MessageCircle className="mx-auto text-hawk-green" size={54} />
          <p className="mt-4 text-sm font-black text-slate-500">
            No active conversations yet.
          </p>
        </section>
      ) : (
        <section className="mt-5 grid gap-3">
          {connections.map((connection) => {
            const otherName =
              role === "coach" ? connection.playerName : connection.coachName;
            const lastMessage = [...(connection.messages || [])]
              .reverse()
              .find((message) => message.senderRole !== "system");
            const unread = (connection.messages || []).some(
              (message) => message.senderRole !== role && !message.read
            );

            return (
              <Link
                key={connection.id}
                to={`/${role}/chat/${connection.id}`}
                className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="grid h-12 w-12 place-items-center rounded-full bg-hawk-green text-sm font-black text-white">
                  {initials(otherName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-hawk-ink">{otherName}</p>
                  <p className="mt-1 truncate text-sm font-bold text-slate-500">
                    {lastMessage?.text || "Connection established via SportsHawk"}
                  </p>
                </div>
                {unread ? (
                  <span className="h-3 w-3 rounded-full bg-red-500" />
                ) : null}
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}

function initials(name = "") {
  return String(name)
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
