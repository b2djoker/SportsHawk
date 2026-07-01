import {
  AlertTriangle,
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  Play,
  RotateCcw,
  Send,
  Square
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  loadPlayerProfile,
  getJugglingMastery,
  getJugglingMasteryProgress,
  getCardTitle,
  masteryColors,
  masteryTitles,
  recordDrillScore
} from "../lib/playerProfile.js";
import {
  checkChallengeCompletion,
  incrementCommunityChallenge
} from "../hooks/useDailyChallenge.js";
import { NativeJugglingAnalyzer } from "../vision/nativeJugglingAnalyzer.js";

const PHASE = {
  LOADING: "loading",
  READY: "ready",
  RECORDING: "recording",
  ANALYZING: "analyzing",
  RESULTS: "results",
  ERROR: "error",
  REAUTH: "reauth"
};

const MAX_DURATION = 30;
const MIN_DURATION = 10;

const surfaceConfig = {
  foot: {
    label: "Foot",
    color: "#4fc3f7",
    pointsPerTouch: 10
  },
  thigh: {
    label: "Thigh",
    color: "#81c784",
    pointsPerTouch: 10
  },
  head: {
    label: "Head",
    color: "#f5a623",
    pointsPerTouch: 10
  }
};

const analyzeMessages = [
  "Reading body movement...",
  "Classifying contact surfaces...",
  "Verifying touch events...",
  "Calculating juggle score...",
  "Finalising your result..."
];

export default function JugglingScoringPage() {
  const navigate = useNavigate();
  const analyzerRef = useRef(null);
  const timerRef = useRef(null);
  const elapsedRef = useRef(0);

  const [player, setPlayer] = useState(() => loadPlayerProfile());
  const [phase, setPhase] = useState(PHASE.LOADING);
  const [elapsed, setElapsed] = useState(0);
  const [results, setResults] = useState(null);
  const [liveContact, setLiveContact] = useState(null);
  const [liveContactCount, setLiveContactCount] = useState(0);
  const [analyzeMessage, setAnalyzeMessage] = useState("");
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [bodyHeightRatio, setBodyHeightRatio] = useState(null);
  const [reauthStatus, setReauthStatus] = useState("scanning");
  const [reauthMessage, setReauthMessage] = useState("");
  const [reauthAttempt, setReauthAttempt] = useState(0);
  const [reauthReason, setReauthReason] = useState("initial");
  const [challengeToast, setChallengeToast] = useState("");
  const [rankEvent, setRankEvent] = useState(null);
  const [cameraPreviewReady, setCameraPreviewReady] = useState(false);
  const [analysisStats, setAnalysisStats] = useState({
    poseFrames: 0,
    noPoseFrames: 0,
    contacts: 0,
    previewReady: false
  });
  const [debugData, setDebugData] = useState({
    poseDetected: false,
    landmarkCount: 0,
    lastContactType: null,
    contactCount: 0,
    frameCount: 0,
    mlKitStatus: "initialising"
  });
  const [showDebug, setShowDebug] = useState(true);

  const remainingSeconds = Math.max(MAX_DURATION - elapsed, 0);
  const distanceStatus = getDistanceStatus(bodyHeightRatio);
  const canStartRecording = distanceStatus.state === "good";

  useEffect(() => {
    initializeNativeCamera();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (phase !== PHASE.READY) return undefined;

    const interval = window.setInterval(() => {
      const frameHistory = analyzerRef.current?.frameHistory || [];
      const latestFrame = frameHistory[frameHistory.length - 1];

      setBodyHeightRatio(
        latestFrame ? calculateBodyHeightRatio(latestFrame.landmarks) : null
      );
    }, 500);

    return () => window.clearInterval(interval);
  }, [phase]);

  async function initializeNativeCamera() {
    setPhase(PHASE.LOADING);
    setErrorMessage("");
    setSubmitted(false);
    setCameraPreviewReady(false);
    setAnalysisStats({
      poseFrames: 0,
      noPoseFrames: 0,
      contacts: 0,
      previewReady: false
    });
    setDebugData({
      poseDetected: false,
      landmarkCount: 0,
      lastContactType: null,
      contactCount: 0,
      frameCount: 0,
      mlKitStatus: "initialising"
    });

    try {
      await cleanup();
      const analyzer = new NativeJugglingAnalyzer();
      analyzerRef.current = analyzer;

      analyzer.onContactDetected = (contact) => {
        setLiveContact(contact.type);
        setLiveContactCount((current) => current + 1);
        setDebugData((current) => ({
          ...current,
          lastContactType: contact.type,
          contactCount: current.contactCount + 1
        }));
        window.setTimeout(() => setLiveContact(null), 500);
      };

      analyzer.onPoseDetected = (landmarks) => {
        setDebugData((current) => ({
          ...current,
          poseDetected: true,
          landmarkCount: landmarks.filter(
            (landmark) => landmark?.confidence > 0.3
          ).length,
          frameCount: current.frameCount + 1,
          mlKitStatus: "active"
        }));
      };
      analyzer.onOutOfFrame = handleOutOfFrame;
      analyzer.onPreviewReady = () => {
        setCameraPreviewReady(true);
      };
      analyzer.onAnalysisStats = (stats) => {
        setAnalysisStats(stats);
        if (stats.previewReady) setCameraPreviewReady(true);
      };
      analyzer.onError = (message) => {
        setErrorMessage(message);
        setPhase(PHASE.ERROR);
      };

      const hasPermission = await analyzer.requestPermissions();
      if (!hasPermission) {
        setErrorMessage(
          "Camera permission denied. Enable camera access in Android Settings > Apps > SportsHawk > Permissions."
        );
        setPhase(PHASE.ERROR);
        return;
      }

      const cameraStarted = await analyzer.startCamera();
      if (!cameraStarted) {
        setPhase(PHASE.ERROR);
        return;
      }
      setDebugData((current) => ({
        ...current,
        mlKitStatus: "camera_started"
      }));

      setPhase(PHASE.READY);
      analyzer.startFrameCheck();
    } catch (err) {
      setErrorMessage(`Failed to initialize native camera: ${err.message}`);
      setPhase(PHASE.ERROR);
    }
  }

  async function startRecording() {
    if (!analyzerRef.current || !canStartRecording) return;

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setPhase(PHASE.REAUTH);
    setReauthReason("initial");
    setReauthStatus("scanning");
    setReauthMessage("Verifying identity before recording...");
    setReauthAttempt(1);

    const result = await analyzerRef.current.performReauth();

    if (!result.success) {
      if (analyzerRef.current.reauthAttempts >= 2) {
        setReauthStatus("exhausted");
        setReauthMessage("Identity could not be verified.");
      } else {
        setReauthStatus("failed");
        setReauthMessage(result.reason);
      }
      return;
    }

    setReauthStatus("success");
    setReauthMessage("Identity verified — starting recording...");
    await delay(800);

    setElapsed(0);
    elapsedRef.current = 0;
    setResults(null);
    setSubmitted(false);
    setLiveContact(null);
    setLiveContactCount(0);
    setErrorMessage("");
    setPhase(PHASE.RECORDING);

    await analyzerRef.current.startAnalysis();

    timerRef.current = window.setInterval(() => {
      elapsedRef.current += 1;
      const nextElapsed = elapsedRef.current;
      setElapsed(nextElapsed);

      if (nextElapsed >= MAX_DURATION) {
        stopRecording(false);
      } else if (MAX_DURATION - nextElapsed <= 10) {
        beep(MAX_DURATION - nextElapsed <= 3 ? 1040 : 840);
      }
    }, 1000);
  }

  async function handleOutOfFrame() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setPhase(PHASE.REAUTH);
    setReauthReason("outOfFrame");
    setReauthStatus("scanning");
    setReauthAttempt((current) => current + 1);
    setReauthMessage("Scanning face...");

    const result = await analyzerRef.current.performReauth();

    if (result.success) {
      resetAnalyzerSession();
      setReauthStatus("success");
      setReauthMessage("Identity verified — start a new session.");
      setElapsed(0);
      elapsedRef.current = 0;
      setLiveContactCount(0);

      await delay(1500);
      setPhase(PHASE.READY);
      analyzerRef.current?.startFrameCheck();
      return;
    }

    if (analyzerRef.current.reauthAttempts >= 2) {
      setReauthStatus("exhausted");
      setReauthMessage(result.reason);
      return;
    }

    setReauthStatus("failed");
    setReauthMessage(result.reason);
  }

  async function retryReauth() {
    setReauthStatus("scanning");
    setReauthAttempt(2);
    setReauthMessage("Scanning face...");

    const result = await analyzerRef.current.performReauth();

    if (result.success) {
      resetAnalyzerSession();
      setReauthStatus("success");
      setReauthMessage("Identity verified — start a new session.");
      await delay(1500);
      setElapsed(0);
      elapsedRef.current = 0;
      setLiveContactCount(0);
      setPhase(PHASE.READY);
      analyzerRef.current?.startFrameCheck();
      return;
    }

    setReauthStatus("exhausted");
    setReauthMessage(result.reason);
  }

  async function stopRecording(invalidated = false) {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const rawResults = analyzerRef.current?.stopAnalysis();

    if (invalidated) {
      setPhase(PHASE.READY);
      setElapsed(0);
      elapsedRef.current = 0;
      setErrorMessage("Recording ended because the player left the frame.");
      analyzerRef.current?.startFrameCheck();
      return;
    }

    if (elapsedRef.current < MIN_DURATION) {
      setPhase(PHASE.READY);
      setElapsed(0);
      elapsedRef.current = 0;
      setErrorMessage("Session too short. Record at least 10 seconds.");
      analyzerRef.current?.startFrameCheck();
      return;
    }

    await runAnalysisPhase(rawResults);
  }

  async function runAnalysisPhase(rawResults) {
    setPhase(PHASE.ANALYZING);
    setAnalyzeProgress(0);

    for (let index = 0; index < analyzeMessages.length; index += 1) {
      setAnalyzeMessage(analyzeMessages[index]);
      setAnalyzeProgress(((index + 1) / analyzeMessages.length) * 100);
      await delay(650);
    }

    const streakBonus = Number(player.streakCount || 0) * 5;
    const finalScore = (rawResults?.rawPoints || 0) + streakBonus;

    setResults({
      ...(rawResults || buildEmptyResults()),
      streakBonus,
      finalScore
    });
    setPhase(PHASE.RESULTS);
  }

  async function submitScore() {
    if (!results) return;

    await runPostSubmissionPipeline(player, results);
  }

  async function runPostSubmissionPipeline(profileBefore, sessionResults) {
    const drillResult = {
      drillName: "Juggling",
      drillId: 1,
      category: "ball-mastery",
      basePoints: sessionResults.rawPoints,
      streakBonus: sessionResults.streakBonus,
      surfacesUsed: sessionResults.surfacesUsed,
      totalPoints: sessionResults.finalScore,
      breakdown: Object.entries(surfaceConfig).map(([key, config]) => ({
        surface: config.label,
        touches: sessionResults.counts[key],
        pointsPerTouch: config.pointsPerTouch
      })),
      subscriptionTier: profileBefore.subscriptionTier,
      totalContacts: sessionResults.totalContacts,
      foot: sessionResults.counts.foot,
      thigh: sessionResults.counts.thigh,
      head: sessionResults.counts.head,
      duration: elapsedRef.current,
      scoringEngine: "native-mlkit-pose"
    };
    const profile = recordDrillScore(drillResult);
    incrementCommunityChallenge();
    const latestSession = profile.drillHistory?.[0] || {};
    const completedChallenges = checkChallengeCompletion(profile, latestSession);
    const toastQueue = buildPostSubmissionToastQueue({
      previousProfile: profileBefore,
      profile,
      sessionResults,
      completedChallenges
    });

    setPlayer(profile);
    setSubmitted(true);

    if (profile.lastRankEvent?.type === "rankUp") {
      setRankEvent(profile.lastRankEvent);
      window.setTimeout(() => setRankEvent(null), 2500);
    }

    for (let index = 0; index < toastQueue.length; index += 1) {
      await delay(index === 0 ? 0 : 900);
      setChallengeToast(toastQueue[index]);
    }
    window.setTimeout(() => setChallengeToast(""), 3600);
    await delay(1500);
    navigate("/player");
  }

  async function cleanup() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (analyzerRef.current) {
      await analyzerRef.current.destroy();
      analyzerRef.current = null;
    }
  }

  function resetAnalyzerSession() {
    if (!analyzerRef.current) return;
    analyzerRef.current.contacts = [];
    analyzerRef.current.lastContactTime = 0;
    analyzerRef.current.frameHistory = [];
    analyzerRef.current.contactBuffer = [];
    analyzerRef.current._noPoseFrames = 0;
    analyzerRef.current.reauthAttempts = 0;
  }

  return (
    <div className="min-h-screen bg-hawk-ink text-white">
      {phase === PHASE.REAUTH ? (
        <ReauthScreen
          status={reauthStatus}
          message={reauthMessage}
          attempt={reauthAttempt}
          reason={reauthReason}
          onRetry={retryReauth}
          onBack={() => navigate("/player/drills")}
        />
      ) : null}

      <div
        id="camera-container"
        className="relative min-h-[62vh] overflow-hidden bg-transparent"
        style={{ backgroundColor: "transparent" }}
      >
        <video
          id="juggling-camera-video"
          autoPlay
          muted
          playsInline
          className="absolute inset-0 z-0 h-full w-full bg-black object-cover"
        />
        {showDebug ? (
          <div
            className="absolute left-0 right-0 top-0 z-30 bg-black/70 p-2 font-mono text-[11px]"
            style={{ fontSize: "11px" }}
          >
            <div className="flex flex-wrap gap-2 pr-12">
              <span
                style={{
                  color: debugData.poseDetected ? "#00ff00" : "#ff4444"
                }}
              >
                {debugData.poseDetected ? "✓ POSE" : "✗ NO POSE"}
              </span>
              <span className="text-white/70">
                LMs: {debugData.landmarkCount}/33
              </span>
              <span className="text-white/70">
                Frames: {debugData.frameCount}
              </span>
              <span className="text-yellow-400">
                Contacts: {debugData.contactCount}
              </span>
              {debugData.lastContactType ? (
                <span className="text-green-400">
                  Last: {debugData.lastContactType}
                </span>
              ) : null}
              <span
                style={{
                  color:
                    debugData.mlKitStatus === "active" ? "#00ff00" : "#ff8800"
                }}
              >
                ML: {debugData.mlKitStatus}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowDebug(false)}
              className="absolute right-2 top-1 text-xs text-white/40"
            >
              hide
            </button>
          </div>
        ) : null}
        {!cameraPreviewReady ? (
          <div className="absolute inset-0 z-10 grid place-items-center bg-black p-6 text-center">
            <div>
              <BrainCircuit
                className="mx-auto animate-pulse text-yellow-300"
                size={34}
              />
              <p className="mt-3 text-sm font-black text-white">
                Starting back camera preview...
              </p>
              <p className="mt-2 text-xs font-semibold text-white/50">
                If this stays black, close and reopen the drill after allowing
                camera permission.
              </p>
            </div>
          </div>
        ) : null}
        <div className="absolute left-4 top-4 z-20">
          <Link
            to="/drills"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-black/50 px-3 text-sm font-black text-white backdrop-blur"
          >
            <ArrowLeft size={17} />
            Drills
          </Link>
        </div>

        <div className="absolute right-4 top-4 z-20 rounded-lg bg-yellow-300 px-3 py-2 text-sm font-black text-hawk-ink shadow-sm">
          {phase === PHASE.RECORDING
            ? `${remainingSeconds}s left`
            : "Back camera"}
        </div>

        {phase === PHASE.RECORDING ? (
          <div className="absolute left-4 top-20 z-20 inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-black">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
            REC
          </div>
        ) : null}

        {phase === PHASE.RECORDING && liveContactCount > 0 ? (
          <div className="absolute bottom-4 left-4 z-20 rounded-lg bg-black/60 px-4 py-3 backdrop-blur">
            <span className="text-3xl font-black text-yellow-300">
              {liveContactCount}
            </span>
            <span className="ml-2 text-sm font-bold text-white/70">
              detected touches
            </span>
          </div>
        ) : null}

        {liveContact ? (
          <div
            className="absolute left-1/2 top-1/3 z-30 -translate-x-1/2 rounded-xl bg-black/60 px-5 py-3 text-3xl font-black shadow-xl"
            style={{ color: surfaceConfig[liveContact]?.color }}
          >
            +{surfaceConfig[liveContact]?.pointsPerTouch}
          </div>
        ) : null}

        {phase !== PHASE.RECORDING ? (
          <div className="absolute inset-x-4 bottom-4 z-20 rounded-lg bg-black/55 p-4 text-center shadow-xl backdrop-blur-sm">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-yellow-300">
                Native ML Kit Pose Detection
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-tight">
                Juggling
              </h1>
              <p className="mt-2 text-xs font-semibold leading-5 text-white/75">
                Mount the phone, keep the player and ball visible, then start a
                30 second real camera scoring session.
              </p>
            </div>
          </div>
        ) : null}

        {phase === PHASE.RECORDING && remainingSeconds <= 10 ? (
          <div className="absolute inset-x-4 bottom-4 z-30 rounded-lg bg-red-600/90 px-4 py-3 text-center text-sm font-black">
            Final {remainingSeconds} seconds
          </div>
        ) : null}

      </div>

      <section className="p-4">
        {rankEvent ? <RankUpOverlay event={rankEvent} /> : null}
        {challengeToast ? (
          <div className="fixed inset-x-4 top-20 z-50 mx-auto max-w-md rounded-lg border border-yellow-300 bg-white px-4 py-3 text-sm font-black text-hawk-ink shadow-soft">
            {challengeToast}
          </div>
        ) : null}

        {phase === PHASE.LOADING ? (
          <CenteredPanel
            icon={<BrainCircuit className="animate-pulse" size={30} />}
            title="Loading camera and AI model"
            body="Preparing the native camera preview and pose detector."
          />
        ) : null}

        {phase === PHASE.ERROR ? (
          <CenteredPanel
            icon={<AlertTriangle size={30} />}
            title="Camera setup failed"
            body={errorMessage}
          >
            <button
              type="button"
              onClick={initializeNativeCamera}
              className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-lg bg-hawk-green px-5 text-sm font-black text-white"
            >
              Retry Camera
            </button>
          </CenteredPanel>
        ) : null}

        {phase === PHASE.READY ? (
          <div className="mx-auto max-w-xl">
            {errorMessage ? (
              <div className="mb-4 rounded-lg border border-amber-300/30 bg-amber-300/10 p-3 text-sm font-bold text-amber-200">
                {errorMessage}
              </div>
            ) : null}
            <button
              type="button"
              onClick={startRecording}
              disabled={!canStartRecording}
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-yellow-300 px-5 text-base font-black text-hawk-ink transition active:scale-[0.99] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-500 disabled:text-slate-300 disabled:opacity-40"
            >
              <Play size={20} fill="currentColor" />
              Start Real Scoring
            </button>
            <p className="mt-3 text-center text-xs font-semibold text-white/45">
              {canStartRecording
                ? "30 second session. Minimum 10 seconds required."
                : "Start unlocks when the player is framed at the correct distance."}
            </p>
            <DistanceIndicator status={distanceStatus} />
            <DistanceDiagram />
          </div>
        ) : null}

        {phase === PHASE.RECORDING ? (
          <div className="mx-auto max-w-xl">
            <button
              type="button"
              onClick={() => stopRecording(false)}
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-lg border border-red-400/60 bg-red-500/10 px-5 text-base font-black text-red-200 transition active:scale-[0.99]"
            >
              <Square size={18} fill="currentColor" />
              Stop Recording
            </button>
            <p className="mt-3 text-center text-xs font-semibold text-white/45">
              {analysisStats.poseFrames > 0
                ? "Player in frame. ML Kit is reading movement and contacts."
                : "Finding player pose... keep the full body visible."}
            </p>
          </div>
        ) : null}

        {phase === PHASE.ANALYZING ? (
          <div className="mx-auto max-w-xl rounded-lg bg-white/5 p-5">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-white/10 text-yellow-300">
              <BrainCircuit className="animate-pulse" size={28} />
            </div>
            <h2 className="mt-4 text-center text-2xl font-black">
              Analyzing session
            </h2>
            <p className="mt-2 text-center text-sm font-semibold text-white/65">
              {analyzeMessage}
            </p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-yellow-300 transition-all duration-500"
                style={{ width: `${analyzeProgress}%` }}
              />
            </div>
          </div>
        ) : null}

        {phase === PHASE.RESULTS && results ? (
          <ResultsPanel
            results={results}
            submitted={submitted}
            player={player}
            onSubmit={submitScore}
            onRetry={() => {
              setPhase(PHASE.READY);
              setElapsed(0);
              elapsedRef.current = 0;
              setResults(null);
              setLiveContactCount(0);
              setErrorMessage("");
              analyzerRef.current?.startFrameCheck();
            }}
            onDone={() => navigate("/player")}
          />
        ) : null}
      </section>
    </div>
  );
}

function ResultsPanel({
  results,
  submitted,
  player,
  onSubmit,
  onRetry,
  onDone
}) {
  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <section className="rounded-lg bg-white p-5 text-hawk-ink">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-green">
          Real session result
        </p>
        <div className="mt-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black">{results.finalScore} pts</h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              {results.totalContacts} contacts detected from native pose
              analysis.
            </p>
          </div>
          {submitted ? (
            <CheckCircle2 className="shrink-0 text-hawk-green" size={38} />
          ) : null}
        </div>
      </section>

      <ContactSummaryCard results={results} />

      <MasteryProgressCard player={player} />

      <QualityBadge totalContacts={results.totalContacts} />

      <section className="rounded-lg bg-white/5 p-4 text-center">
        <p className="text-sm font-black text-yellow-200">
          🔥 {player.streakCount || 0} day streak · +{results.streakBonus} pts bonus
        </p>
      </section>

      <p className="text-center text-xs font-semibold text-white/45">
        Combo scoring coming in v2
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={submitted ? onDone : onSubmit}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-yellow-300 px-5 text-sm font-black text-hawk-ink"
        >
          {submitted ? <CheckCircle2 size={18} /> : <Send size={18} />}
          {submitted ? "Back to Home" : "Submit to Leaderboard"}
        </button>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/20 px-5 text-sm font-black text-white"
        >
          <RotateCcw size={18} />
          Practice Again
        </button>
      </div>

      {submitted ? (
        <p className="text-center text-sm font-bold text-yellow-200">
          {player.totalPoints} total points | {player.tierLevel} tier | +
          {player.coinEarnings[0]?.coins ?? 0} coins
        </p>
      ) : null}
    </div>
  );
}

function RankUpOverlay({ event }) {
  const confetti = ["•", "✦", "•", "✦", "•", "✦", "•", "✦"];

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center overflow-hidden bg-hawk-ink/90 p-6 text-center text-white backdrop-blur-sm">
      {confetti.map((piece, index) => (
        <span
          key={`${piece}-${index}`}
          className="absolute animate-bounce text-3xl font-black"
          style={{
            left: `${12 + index * 11}%`,
            top: `${14 + (index % 3) * 18}%`,
            color: event.color,
            animationDelay: `${index * 90}ms`
          }}
        >
          {piece}
        </span>
      ))}
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white p-6 text-hawk-ink shadow-2xl">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-hawk-green">
          Rank Up!
        </p>
        <h2 className="mt-4 text-5xl font-black" style={{ color: event.color }}>
          {event.label}
        </h2>
        <p className="mt-3 text-sm font-semibold text-slate-600">
          You climbed from {event.previousLabel}. Keep the streak alive.
        </p>
      </section>
    </div>
  );
}

function ReauthScreen({ status, message, attempt, reason, onRetry, onBack }) {
  const isOutOfFrame = reason === "outOfFrame";

  return (
    <div className="fixed inset-0 z-[80] flex min-h-screen flex-col items-center justify-center gap-6 bg-hawk-ink/95 p-6 text-white">
      {status === "scanning" ? (
        <>
          <div className="relative h-40 w-40">
            <div className="absolute inset-0 animate-ping rounded-full border-2 border-yellow-300 opacity-30" />
            <div className="absolute inset-0 flex items-center justify-center rounded-full border-4 border-yellow-300">
              <svg viewBox="0 0 80 80" className="h-20 w-20" fill="none">
                <ellipse
                  cx="40"
                  cy="35"
                  rx="22"
                  ry="26"
                  stroke="#f5a623"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
                <circle cx="31" cy="30" r="3" fill="#f5a623" opacity="0.6" />
                <circle cx="49" cy="30" r="3" fill="#f5a623" opacity="0.6" />
                <path
                  d="M 31 44 Q 40 50 49 44"
                  stroke="#f5a623"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.6"
                />
                <line
                  x1="18"
                  y1="35"
                  x2="62"
                  y2="35"
                  stroke="#00e676"
                  strokeWidth="1.5"
                  opacity="0.8"
                >
                  <animate
                    attributeName="y1"
                    values="17;35;53"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="y2"
                    values="17;35;53"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;1;1;0"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </line>
              </svg>
            </div>
            <svg
              className="absolute inset-0 h-full w-full animate-spin"
              style={{ animationDuration: "2s" }}
              viewBox="0 0 160 160"
            >
              <circle
                cx="80"
                cy="80"
                r="74"
                fill="none"
                stroke="#f5a623"
                strokeWidth="3"
                strokeDasharray="60 200"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-black tracking-tight">
              Face Verification
            </h2>
            <p className="mt-2 text-sm font-semibold text-white/50">
              {message || "Hold still — verifying your identity"}
            </p>
            {attempt > 1 ? (
              <p className="mt-2 text-xs font-black text-amber-300">
                Attempt {attempt} of 2
              </p>
            ) : null}
          </div>

          <div className="w-full max-w-md rounded-lg bg-hawk-green p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="shrink-0 text-amber-300" size={26} />
              <div>
                <p className="text-sm font-black">
                  {isOutOfFrame
                    ? "Player left the frame"
                    : "Identity check required"}
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-white/55">
                  {isOutOfFrame
                    ? "The drill has been stopped. Identity must be re-verified before starting a new session. The previous score has been discarded."
                    : "SportsHawk verifies the player before each scored recording so the result belongs to the right profile."}
                </p>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {status === "success" ? (
        <>
          <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-green-400">
            <svg viewBox="0 0 60 60" className="h-16 w-16" fill="none">
              <path
                d="M 12 30 L 25 43 L 48 18"
                stroke="#4ade80"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-green-400">Verified</h2>
            <p className="mt-1 text-sm font-semibold text-white/50">
              {message || "Starting fresh session..."}
            </p>
          </div>
        </>
      ) : null}

      {status === "failed" ? (
        <>
          <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-amber-400">
            <AlertTriangle className="text-amber-300" size={54} />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-amber-300">
              Not Recognised
            </h2>
            <p className="mt-2 px-4 text-sm font-semibold text-white/50">
              {message}
            </p>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="h-14 w-full max-w-md rounded-lg border-2 border-yellow-300 bg-hawk-green px-5 text-base font-black text-yellow-300 transition active:scale-[0.99]"
          >
            Try Again
          </button>
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-semibold text-white/35"
          >
            Cancel — Back to Drills
          </button>
        </>
      ) : null}

      {status === "exhausted" ? (
        <>
          <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-red-500">
            <svg viewBox="0 0 60 60" className="h-16 w-16" fill="none">
              <path
                d="M 15 15 L 45 45 M 45 15 L 15 45"
                stroke="#ef4444"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-red-400">
              Session Ended
            </h2>
            <p className="mt-2 px-4 text-sm font-semibold text-white/50">
              {message}
            </p>
            <p className="mt-3 px-4 text-xs font-semibold leading-5 text-white/30">
              This protects the integrity of your performance data. Return to
              the drill library to start a new session.
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="h-14 w-full max-w-md rounded-lg border border-red-500/50 bg-red-900/30 px-5 text-base font-black text-red-300 transition active:scale-[0.99]"
          >
            Back to Drills
          </button>
        </>
      ) : null}
    </div>
  );
}

function ContactSummaryCard({ results }) {
  const counts = results.counts;
  const totalContacts = results.totalContacts;
  const allFoot = totalContacts > 0 && counts.foot === totalContacts;
  const segments = [
    { key: "foot", label: "Foot", color: "#4fc3f7" },
    { key: "thigh", label: "Thigh", color: "#81c784" },
    { key: "head", label: "Head", color: "#f5a623" }
  ];

  return (
    <section className="rounded-lg bg-hawk-green p-4 text-white">
      <div className="text-center">
        <p className="font-display text-5xl font-black leading-none text-yellow-300">
          {totalContacts}
        </p>
        <p className="mt-1 text-sm font-semibold text-white/60">
          juggles detected
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        {segments.map((segment) => (
          <div key={segment.key}>
            <p className="text-sm font-black" style={{ color: segment.color }}>
              {counts[segment.key]}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-1 flex h-2 overflow-hidden rounded-full bg-white/15">
        {segments.map((segment) => (
          <div
            key={segment.key}
            style={{
              width: `${getSegmentWidth(counts[segment.key], totalContacts)}%`,
              backgroundColor: segment.color
            }}
          />
        ))}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        {segments.map((segment) => (
          <p key={segment.key} className="text-xs font-bold text-white/60">
            {segment.label}
          </p>
        ))}
      </div>

      {allFoot ? (
        <p className="mt-3 text-center text-xs font-bold text-amber-200">
          All foot — try using your thigh too!
        </p>
      ) : null}

      <p className="mt-4 text-center text-xs font-semibold text-white/55">
        Each juggle = 10 pts · Streak bonus = {results.streakBonus} pts
      </p>
    </section>
  );
}

function MasteryProgressCard({ player }) {
  const mastery = getJugglingMastery(player);
  const progress = getJugglingMasteryProgress(player);
  const event = player.lastMasteryEvent;
  const isFreshLevelUp =
    event?.drill === "juggling" && event.level === mastery.level;

  if (isFreshLevelUp) {
    return (
      <section className="rounded-lg border-2 border-yellow-300 bg-white p-4 text-center text-hawk-ink">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-clay">
          Level Up!
        </p>
        <p
          className="mt-2 text-3xl font-black"
          style={{ color: masteryColors[mastery.level] }}
        >
          {masteryTitles[mastery.level]}
        </p>
        <p className="mt-2 text-sm font-bold text-slate-600">
          You are now a Juggling {masteryTitles[mastery.level]}!
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg bg-white p-4 text-hawk-ink">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Juggling Mastery
          </p>
          <p className="mt-2 text-sm font-bold text-slate-600">
            {progress.label}
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-black text-white"
          style={{ backgroundColor: masteryColors[mastery.level] }}
        >
          {mastery.level === 4 ? "MASTER ⭐" : masteryTitles[mastery.level]}
        </span>
      </div>
      {mastery.level < 4 ? (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress.progress}%`,
              backgroundColor: masteryColors[mastery.level]
            }}
          />
        </div>
      ) : null}
    </section>
  );
}

function QualityBadge({ totalContacts }) {
  const badge = getQualityBadge(totalContacts);

  return (
    <div className="flex justify-center">
      <span
        className={[
          "inline-flex rounded-full px-4 py-2 text-sm font-black",
          badge.className
        ].join(" ")}
      >
        {badge.label}
      </span>
    </div>
  );
}

function CenteredPanel({ icon, title, body, children }) {
  return (
    <div className="mx-auto max-w-xl rounded-lg bg-white/5 p-6 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-white/10 text-yellow-300">
        {icon}
      </div>
      <h2 className="mt-4 text-2xl font-black">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-white/65">
        {body}
      </p>
      {children}
    </div>
  );
}

function DistanceIndicator({ status }) {
  return (
    <div className="mt-4 flex justify-center">
      <span
        className={[
          "inline-flex rounded-full px-4 py-2 text-sm font-black",
          status.className
        ].join(" ")}
      >
        {status.label}
      </span>
    </div>
  );
}

function DistanceDiagram() {
  return (
    <div className="mt-4 rounded-lg bg-white/5 p-4">
      <svg
        viewBox="0 0 320 92"
        role="img"
        aria-label="Phone to player distance diagram, 3-5 metres ideal"
        className="h-24 w-full"
      >
        <rect x="24" y="25" width="28" height="48" rx="5" fill="#f5c542" />
        <rect x="31" y="33" width="14" height="24" rx="2" fill="#0f241d" />
        <circle cx="230" cy="26" r="10" fill="#f5c542" />
        <line x1="230" y1="36" x2="230" y2="62" stroke="#f5c542" strokeWidth="5" />
        <line x1="230" y1="44" x2="212" y2="54" stroke="#f5c542" strokeWidth="5" />
        <line x1="230" y1="44" x2="248" y2="54" stroke="#f5c542" strokeWidth="5" />
        <line x1="230" y1="62" x2="214" y2="82" stroke="#f5c542" strokeWidth="5" />
        <line x1="230" y1="62" x2="246" y2="82" stroke="#f5c542" strokeWidth="5" />
        <line x1="68" y1="52" x2="196" y2="52" stroke="#ffffff" strokeWidth="3" />
        <path d="M190 44 L202 52 L190 60" fill="none" stroke="#ffffff" strokeWidth="3" />
        <text x="103" y="42" fill="#ffffff" fontSize="14" fontWeight="700">
          3-5 metres ideal
        </text>
      </svg>
    </div>
  );
}

function calculateBodyHeightRatio(landmarks) {
  const nose = landmarks?.[0];
  const leftFoot = landmarks?.[31];
  const rightFoot = landmarks?.[32];

  if (
    !nose ||
    !leftFoot ||
    !rightFoot ||
    nose.confidence < 0.35 ||
    leftFoot.confidence < 0.3 ||
    rightFoot.confidence < 0.3
  ) {
    return null;
  }

  const avgFootY = (leftFoot.y + rightFoot.y) / 2;
  return Math.abs(nose.y - avgFootY);
}

function getDistanceStatus(ratio) {
  if (ratio === null) {
    return {
      state: "waiting",
      label: "Waiting for camera...",
      className: "bg-white/10 text-white/60"
    };
  }
  if (ratio < 0.35) {
    return {
      state: "tooFar",
      label: "Too far — move closer",
      className: "bg-red-500/20 text-red-200"
    };
  }
  if (ratio < 0.45) {
    return {
      state: "closer",
      label: "A little closer",
      className: "bg-amber-400/20 text-amber-200"
    };
  }
  if (ratio <= 0.82) {
    return {
      state: "good",
      label: "Good position ✓",
      className: "bg-emerald-500/20 text-emerald-200"
    };
  }
  return {
    state: "tooClose",
    label: "Too close — step back",
    className: "bg-amber-400/20 text-amber-200"
  };
}

function getSegmentWidth(count, totalContacts) {
  if (!totalContacts) return 0;
  return (count / totalContacts) * 100;
}

function getQualityBadge(totalContacts) {
  if (totalContacts >= 40) {
    return {
      label: "Elite Juggler 🔥",
      className: "bg-yellow-300 text-hawk-ink"
    };
  }
  if (totalContacts >= 25) {
    return {
      label: "Strong Session ⭐",
      className: "bg-emerald-500/20 text-emerald-200"
    };
  }
  if (totalContacts >= 15) {
    return {
      label: "Good Work 👍",
      className: "bg-sky-400/20 text-sky-200"
    };
  }
  if (totalContacts >= 8) {
    return {
      label: "Keep Training",
      className: "bg-white/10 text-white/65"
    };
  }
  return {
    label: "Try Again",
    className: "bg-white/10 text-white/65"
  };
}

function buildEmptyResults() {
  return {
    counts: {
      foot: 0,
      thigh: 0,
      head: 0
    },
    totalContacts: 0,
    rawPoints: 0,
    surfacesUsed: 0,
    validContacts: [],
    duration: 0
  };
}

function buildPostSubmissionToastQueue({
  previousProfile,
  profile,
  sessionResults,
  completedChallenges
}) {
  const previousTitles = new Set(previousProfile.unlockedCardTitles || []);
  const newTitles = (profile.unlockedCardTitles || [])
    .filter((titleId) => !previousTitles.has(titleId))
    .map((titleId) => getCardTitle(titleId)?.name)
    .filter(Boolean);
  const coinsEarned = profile.coinEarnings?.[0]?.coins ?? 0;
  const queue = [
    `Score submitted! +${sessionResults.finalScore} pts · +${coinsEarned} coins`
  ];

  if ((profile.streakCount || 0) > (previousProfile.streakCount || 0) && profile.streakCount > 1) {
    queue.push(`🔥 ${profile.streakCount} day streak!`);
  }

  if (
    profile.lastStreakFreezeEvent?.type === "success" &&
    profile.lastStreakFreezeEvent.id?.startsWith("freeze-earned")
  ) {
    queue.push(`🛡️ Streak Freeze earned! (${profile.streakFreezes} held)`);
  }

  if (profile.tierLevel !== previousProfile.tierLevel) {
    queue.push(`⬆️ ${profile.tierLevel.toUpperCase()} tier!`);
  }

  if (profile.lastMasteryEvent?.drill === "juggling") {
    queue.push(`🎯 Juggling ${profile.lastMasteryEvent.title} achieved!`);
  }

  if (newTitles.length > 0) {
    queue.push(`🏅 New title: ${newTitles[0]}`);
  }

  if (profile.lastRivalEvent?.rivalName) {
    queue.push(`⚔️ Rival beaten: ${profile.lastRivalEvent.rivalName}!`);
  }

  completedChallenges.forEach((challenge) => {
    queue.push(
      `Challenge complete: ${challenge.title}! Tap to claim ${challenge.reward?.label || "reward"}`
    );
  });

  return queue;
}

function beep(frequency = 840) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.frequency.value = frequency;
  gain.gain.value = 0.08;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  window.setTimeout(() => {
    oscillator.stop();
    context.close();
  }, 140);
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
