import { ArrowLeft, MoreVertical, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getConnection,
  markConnectionRead,
  sendMessage
} from "../lib/matchmaking.js";
import { accountTypes, getAccountType } from "../lib/account.js";

export default function ChatPage() {
  const { connectionId } = useParams();
  const navigate = useNavigate();
  const accountType = getAccountType();
  const role = accountType === accountTypes.coach ? "coach" : "player";
  const [connection, setConnection] = useState(() => getConnection(connectionId));
  const [text, setText] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    markConnectionRead(connectionId, role);
    setConnection(getConnection(connectionId));
  }, [connectionId, role]);

  if (!connection) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
          <p className="font-black text-hawk-ink">Connection not found.</p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-4 text-sm font-black text-hawk-green"
          >
            Go back
          </button>
        </section>
      </div>
    );
  }

  function send() {
    if (!text.trim()) return;
    const result = sendMessage(connection.id, role, text);
    setConnection(result.connection);
    setText("");
    if (result.warning) {
      setToast(result.warning);
      window.setTimeout(() => setToast(""), 3200);
    }
  }

  const otherName = role === "player" ? connection.coachName : connection.playerName;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-4xl flex-col px-4 py-4 sm:px-6">
      <header className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            to={role === "player" ? "/player/connections" : "/coach/connections"}
            className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-hawk-green"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-black text-hawk-ink">{otherName}</h1>
            <p className="text-xs font-black text-blue-700">
              {role === "player" ? "Verified Coach" : connection.playerTier}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-500"
          title="Report | Block"
        >
          <MoreVertical size={18} />
        </button>
      </header>

      <section className="mt-4 flex-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="grid gap-3">
          {(connection.messages || []).map((message) => {
            const own = message.senderRole === role;
            const system = message.senderRole === "system";
            if (system) {
              return (
                <p
                  key={message.id}
                  className="mx-auto rounded-full bg-slate-100 px-3 py-1 text-center text-xs font-bold text-slate-500"
                >
                  {formatDate(message.sentAt)} — {message.text}
                </p>
              );
            }
            return (
              <div
                key={message.id}
                className={own ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={[
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm font-semibold",
                    own
                      ? "rounded-br-sm bg-yellow-300 text-hawk-ink"
                      : "rounded-bl-sm bg-slate-100 text-slate-700"
                  ].join(" ")}
                >
                  <p>{message.text}</p>
                  <p className="mt-1 text-right text-[10px] font-black opacity-50">
                    {formatTime(message.sentAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="sticky bottom-0 mt-4 rounded-lg border border-slate-200 bg-white p-3 shadow-soft">
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(event) => setText(event.target.value.slice(0, 500))}
            onKeyDown={(event) => {
              if (event.key === "Enter") send();
            }}
            placeholder="Type a message..."
            className="h-12 min-w-0 flex-1 rounded-lg border border-slate-300 px-4 text-sm font-bold outline-none focus:border-hawk-green"
          />
          <button
            type="button"
            onClick={send}
            className="grid h-12 w-12 place-items-center rounded-lg bg-yellow-300 text-hawk-ink"
          >
            <Send size={19} />
          </button>
        </div>
        <p className="mt-2 text-xs font-semibold text-slate-400">
          {text.length} / 500
        </p>
      </footer>

      {toast ? (
        <div className="fixed bottom-24 right-4 z-50 max-w-sm rounded-lg border border-amber-200 bg-white p-4 text-sm font-black text-amber-800 shadow-soft">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short"
  });
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}
