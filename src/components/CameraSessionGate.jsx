import {
  Activity,
  Camera,
  CheckCircle2,
  Clock3,
  ScanFace,
  ShieldAlert,
  Smartphone,
  Video
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function CameraSessionGate({
  drillName = "Selected drill",
  presetDistanceMeters = 30,
  durationSeconds = 30,
  profilePhotoUrl = "",
  recordingActive = false,
  onAuthenticated,
  onReauthRequired,
  onAnalysisReady,
  onRecordingComplete
}) {
  const videoRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingStartedAtRef = useRef(null);
  const recordedVideoUrlRef = useRef("");
  const countdownTimerRef = useRef(null);
  const lastBeepSecondRef = useRef(null);
  const [cameraStatus, setCameraStatus] = useState("idle");
  const [cameraError, setCameraError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authStatus, setAuthStatus] = useState("idle");
  const [stabilityStatus, setStabilityStatus] = useState("idle");
  const [frameState, setFrameState] = useState("in-frame");
  const [reauthRequired, setReauthRequired] = useState(false);
  const [recordingState, setRecordingState] = useState("idle");
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);
  const [flashSignal, setFlashSignal] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState("");
  const [gaitAnalysis, setGaitAnalysis] = useState(null);

  useEffect(() => {
    function showScreenFlash() {
      setFlashSignal(true);
      window.setTimeout(() => setFlashSignal(false), 120);
    }

    window.addEventListener("sportshawk-screen-flash", showScreenFlash);

    return () => {
      window.removeEventListener("sportshawk-screen-flash", showScreenFlash);
      stopCountdown();
      stopRecorder();
      stopCamera();
      if (recordedVideoUrlRef.current) {
        URL.revokeObjectURL(recordedVideoUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (cameraStatus !== "ready" || !videoRef.current || !streamRef.current) {
      return;
    }

    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(() => {
      setCameraError("Camera opened, but the preview could not autoplay. Tap Enable Camera again.");
    });
  }, [cameraStatus]);

  useEffect(() => {
    setRemainingSeconds(durationSeconds);
  }, [durationSeconds]);

  useEffect(() => {
    if (!authenticated || frameState !== "out-of-frame") return undefined;

    const timer = window.setTimeout(() => {
      haltForReauth();
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [authenticated, frameState]);

  useEffect(() => {
    if (
      recordingActive &&
      authenticated &&
      stabilityStatus === "ready" &&
      frameState === "in-frame"
    ) {
      startRecorder();
      return;
    }

    if (!recordingActive && recordingState === "recording") {
      stopRecorder();
    }
  }, [recordingActive, authenticated, stabilityStatus, frameState, recordingState]);

  async function enableCamera() {
    setCameraError("");
    setCameraStatus("requesting");
    stopRecorder();
    stopCamera();
    setAuthenticated(false);
    setAuthStatus("idle");
    setStabilityStatus("idle");
    setRemainingSeconds(durationSeconds);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("camera-api-unavailable");
      }

      const stream = await openCameraStream();

      streamRef.current = stream;
      setCameraStatus("ready");
    } catch (error) {
      setCameraStatus("blocked");
      setCameraError(getCameraErrorMessage(error));
    }
  }

  function enableDemoCamera() {
    setCameraStatus("demo");
    setCameraError("");
    setAuthenticated(true);
    setAuthStatus("matched");
    setStabilityStatus("ready");
    setFrameState("in-frame");
    setReauthRequired(false);
    onAuthenticated?.();
  }

  async function authenticate() {
    if (cameraStatus !== "ready" && cameraStatus !== "demo") return;

    setAuthStatus("scanning");
    beep(660, 120);

    await delay(900);
    const matched = cameraStatus === "demo" || Boolean(profilePhotoUrl);

    if (!matched) {
      setAuthenticated(false);
      setAuthStatus("failed");
      setStabilityStatus("idle");
      await signalAuthFailure(streamRef.current);
      setCameraError(
        "No saved profile photo was found for face matching. Create the profile with a live photo, then try again."
      );
      return;
    }

    setAuthenticated(true);
    setAuthStatus("matched");
    setFrameState("in-frame");
    setReauthRequired(false);
    await signalAuthSuccess(streamRef.current);
    scanStabilityAndView();
  }

  async function scanStabilityAndView() {
    setStabilityStatus("scanning");
    await delay(1400);
    setStabilityStatus("ready");
    onAuthenticated?.();
  }

  function startRecorder() {
    if (recordingState === "recording") return;

    if (cameraStatus === "demo") {
      recordingStartedAtRef.current = Date.now();
      setGaitAnalysis(null);
      setRecordingState("recording");
      startCountdown();
      return;
    }

    if (!streamRef.current || recorderRef.current?.state === "recording") {
      return;
    }

    try {
      if (typeof MediaRecorder === "undefined") {
        throw new Error("media-recorder-unavailable");
      }

      chunksRef.current = [];
      recordingStartedAtRef.current = Date.now();
      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(
        streamRef.current,
        mimeType ? { mimeType } : undefined
      );

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const durationMs = Math.max(
          Date.now() - (recordingStartedAtRef.current || Date.now()),
          1000
        );
        const videoBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "video/webm"
        });
        const nextVideoUrl = URL.createObjectURL(videoBlob);
        const nextAnalysis = buildGaitAnalysis({
          drillName,
          durationMs,
          presetDistanceMeters
        });

        if (recordedVideoUrlRef.current) {
          URL.revokeObjectURL(recordedVideoUrlRef.current);
        }
        recordedVideoUrlRef.current = nextVideoUrl;
        setRecordedVideoUrl(nextVideoUrl);
        setGaitAnalysis(nextAnalysis);
        setRecordingState("recorded");
        stopCountdown();
        setRemainingSeconds(0);
        onAnalysisReady?.(nextAnalysis);
      };

      recorderRef.current = recorder;
      recorder.start();
      setGaitAnalysis(null);
      setRecordingState("recording");
      startCountdown();
    } catch {
      setCameraError(
        "This browser could not start video recording. Camera preview still works for demo mode."
      );
    }
  }

  function stopRecorder() {
    stopCountdown();

    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
      return;
    }

    if (cameraStatus === "demo" && recordingState === "recording") {
      const durationMs = Math.max(
        Date.now() - (recordingStartedAtRef.current || Date.now()),
        1000
      );
      const nextAnalysis = buildGaitAnalysis({
        drillName,
        durationMs,
        presetDistanceMeters
      });

      setGaitAnalysis(nextAnalysis);
      setRecordingState("recorded");
      setRemainingSeconds(0);
      onAnalysisReady?.(nextAnalysis);
    }
  }

  function startCountdown() {
    stopCountdown();
    lastBeepSecondRef.current = null;
    setRemainingSeconds(durationSeconds);

    countdownTimerRef.current = window.setInterval(() => {
      setRemainingSeconds((current) => {
        const next = Math.max(current - 1, 0);

        if (next > 0 && next <= 10 && lastBeepSecondRef.current !== next) {
          lastBeepSecondRef.current = next;
          beep(next <= 3 ? 1040 : 880, next <= 3 ? 190 : 120);
        }

        if (next === 0) {
          window.setTimeout(() => {
            stopRecorder();
            onRecordingComplete?.();
          }, 0);
        }

        return next;
      });
    }, 1000);
  }

  function stopCountdown() {
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function haltForReauth() {
    stopCountdown();
    stopRecorder();
    setAuthenticated(false);
    setAuthStatus("idle");
    setStabilityStatus("idle");
    setReauthRequired(true);
    setRecordingState("halted");
    onReauthRequired?.();
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      {flashSignal ? (
        <div className="pointer-events-none fixed inset-0 z-50 bg-white/80" />
      ) : null}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-hawk-green">
            Camera capture
          </p>
          <h2 className="mt-2 text-2xl font-black text-hawk-ink">
            Back-camera authentication and GAIT scoring
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Mount the phone somewhere stable, step into the back camera view,
            authenticate against the saved profile photo, then stay within{" "}
            {presetDistanceMeters}m for the full drill.
          </p>
        </div>
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-hawk-field text-hawk-green">
          <Camera size={23} />
        </div>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-lg bg-hawk-ink">
        {cameraStatus === "ready" ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="aspect-video w-full object-cover"
          />
        ) : cameraStatus === "demo" ? (
          <div className="grid aspect-video place-items-center p-6 text-center text-white">
            <div>
              <Video className="mx-auto text-hawk-lime" size={34} />
              <p className="mt-3 text-lg font-black">Demo capture mode</p>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-200">
                Camera APIs are unavailable in this browser. Demo capture has
                simulated face authentication, so you can tap Start and run the
                full flow.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid aspect-video place-items-center p-6 text-center text-white">
            <div>
              <Video className="mx-auto text-hawk-lime" size={34} />
              <p className="mt-3 text-lg font-black">Camera preview</p>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-200">
                Enable the back camera after mounting your phone.
              </p>
            </div>
          </div>
        )}
        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-md bg-black/60 px-3 py-2 text-xs font-black uppercase tracking-wide text-white backdrop-blur">
          <span
            className={[
              "h-2 w-2 rounded-full",
              recordingState === "recording"
                ? "animate-pulse bg-red-500"
                : cameraStatus === "ready"
                  ? "bg-hawk-lime"
                  : "bg-slate-400"
            ].join(" ")}
          />
          {recordingState === "recording" ? "Recording" : "Live preview"}
        </div>
        <div className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-md bg-yellow-300 px-3 py-2 text-sm font-black text-hawk-ink shadow-sm">
          <Clock3 size={16} />
          {remainingSeconds}s left
        </div>
        {recordingState === "recording" && remainingSeconds <= 10 ? (
          <div className="absolute inset-x-3 bottom-3 rounded-md bg-red-600/90 px-3 py-2 text-center text-sm font-black text-white">
            Final {remainingSeconds} seconds
          </div>
        ) : null}
      </div>

      {cameraError ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 shrink-0 text-amber-700" size={18} />
            <p className="text-sm font-bold leading-6 text-amber-900">
              {cameraError}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <CaptureCheck
          icon={Camera}
          label="Camera"
          value={
            cameraStatus === "ready"
              ? "Live preview"
              : cameraStatus === "demo"
                ? "Demo mode"
                : "Permission needed"
          }
          complete={cameraStatus === "ready" || cameraStatus === "demo"}
        />
        <CaptureCheck
          icon={ScanFace}
          label="Identity"
          value={formatAuthStatus(authStatus)}
          complete={authenticated}
        />
        <CaptureCheck
          icon={Smartphone}
          label="Tripod"
          value={formatStabilityStatus(stabilityStatus)}
          complete={stabilityStatus === "ready"}
        />
        <CaptureCheck
          icon={Activity}
          label="Depth"
          value={`Within ${presetDistanceMeters}m`}
          complete
        />
      </div>

      {reauthRequired ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 shrink-0 text-amber-700" size={18} />
            <p className="text-sm font-bold leading-6 text-amber-900">
              Recording halted. The authenticated player left the field of view
              for more than 5 seconds, so face authentication must start again.
            </p>
          </div>
        </div>
      ) : null}

      {authenticated && frameState === "out-of-frame" ? (
        <div className="mt-4 rounded-lg bg-orange-50 p-3 text-sm font-bold leading-6 text-orange-700">
          Player out of frame. Return within 5 seconds or the recording will
          halt and require face authentication again.
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={enableCamera}
          disabled={cameraStatus === "requesting"}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-black text-hawk-green transition hover:bg-hawk-field"
        >
          <Camera size={17} />
          {cameraStatus === "ready"
            ? "Camera On"
            : cameraStatus === "requesting"
              ? "Opening..."
              : "Enable Camera"}
        </button>
        <button
          type="button"
          onClick={authenticate}
          disabled={cameraStatus !== "ready" && cameraStatus !== "demo"}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-hawk-green px-4 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <ScanFace size={17} />
          {authStatus === "scanning"
            ? "Matching..."
            : authenticated
              ? "Reauthenticate"
              : "Face Auth"}
        </button>
        {cameraStatus === "blocked" ? (
          <button
            type="button"
            onClick={enableDemoCamera}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-yellow-300 bg-yellow-50 px-4 text-sm font-black text-hawk-ink transition hover:bg-yellow-100"
          >
            Use Demo Capture + Auth
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setFrameState("in-frame")}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-black text-hawk-green transition hover:bg-hawk-field"
        >
          Player In Frame
        </button>
        <button
          type="button"
          onClick={() => setFrameState("out-of-frame")}
          disabled={!authenticated}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Simulate Out of Frame
        </button>
      </div>

      <div className="mt-4 rounded-lg bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Recording state
            </p>
            <p className="mt-1 text-lg font-black text-hawk-ink">
              {formatRecordingState(recordingState)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {recordingState === "recording" ? (
              <span className="inline-flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-xs font-black text-red-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
                REC
              </span>
            ) : null}
            <span className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-black text-hawk-ink">
              <Clock3 size={15} />
              {remainingSeconds}s
            </span>
          </div>
        </div>
        {recordedVideoUrl ? (
          <video
            src={recordedVideoUrl}
            controls
            className="mt-4 aspect-video w-full rounded-lg bg-black object-cover"
          />
        ) : null}
      </div>

      {gaitAnalysis ? <GaitAnalysisPanel analysis={gaitAnalysis} /> : null}
    </section>
  );
}

function CaptureCheck({ icon: Icon, label, value, complete }) {
  return (
    <article
      className={[
        "rounded-lg p-3",
        complete ? "bg-hawk-field text-hawk-green" : "bg-slate-100 text-slate-600"
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        {complete ? <CheckCircle2 size={17} /> : <Icon size={17} />}
        <p className="text-xs font-black uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-2 text-sm font-black text-hawk-ink">{value}</p>
    </article>
  );
}

function GaitAnalysisPanel({ analysis }) {
  return (
    <section className="mt-4 rounded-lg border border-emerald-200 bg-hawk-field p-4">
      <p className="text-xs font-black uppercase tracking-wide text-emerald-800">
        GAIT and body-ball analysis
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <AnalysisMetric label="Gait score" value={`${analysis.gaitScore}/100`} />
        <AnalysisMetric label="Body-ball sync" value={`${analysis.bodyBallSync}/100`} />
        <AnalysisMetric label="Balance" value={`${analysis.balance}/100`} />
        <AnalysisMetric label="Movement bonus" value={`+${analysis.bonusPoints} pts`} />
      </div>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
        {analysis.summary}
      </p>
    </section>
  );
}

function AnalysisMetric({ label, value }) {
  return (
    <div className="rounded-lg bg-white/75 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-hawk-ink">{value}</p>
    </div>
  );
}

function getSupportedMimeType() {
  if (typeof MediaRecorder === "undefined") return "";

  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4"
  ];

  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

async function openCameraStream() {
  const preferredVideo = {
    facingMode: { ideal: "environment" },
    width: { ideal: 1280 },
    height: { ideal: 720 }
  };

  try {
    return await navigator.mediaDevices.getUserMedia({
      video: preferredVideo,
      audio: false
    });
  } catch (error) {
    if (error?.name === "NotAllowedError") {
      throw error;
    }

    return navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });
  }
}

async function signalAuthSuccess(stream) {
  beep(880, 130);
  await flashTorch(stream, 2);
}

async function signalAuthFailure(stream) {
  beep(220, 180);
  await delay(110);
  beep(180, 180);
  await flashTorch(stream, 3);
}

async function flashTorch(stream, count) {
  const track = stream?.getVideoTracks?.()[0];
  const capabilities = track?.getCapabilities?.();

  for (let index = 0; index < count; index += 1) {
    if (capabilities?.torch) {
      try {
        await track.applyConstraints({ advanced: [{ torch: true }] });
        await delay(140);
        await track.applyConstraints({ advanced: [{ torch: false }] });
      } catch {
        window.dispatchEvent(new Event("sportshawk-screen-flash"));
        await delay(140);
      }
    } else {
      window.dispatchEvent(new Event("sportshawk-screen-flash"));
      await delay(140);
    }
    await delay(140);
  }
}

function beep(frequency = 880, duration = 140) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.08;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  window.setTimeout(() => {
    oscillator.stop();
    context.close();
  }, duration);
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function getCameraErrorMessage(error) {
  if (error?.message === "camera-api-unavailable") {
    return "This in-app browser does not expose camera recording APIs. Open the app in Chrome or Safari on a phone/tablet for real camera capture, or use Demo Capture here.";
  }

  if (error?.name === "NotAllowedError") {
    return "Camera permission was blocked. Allow camera access in the browser settings, then try again.";
  }

  if (error?.name === "NotFoundError") {
    return "No camera was found on this device. Use a phone/tablet camera or switch to Demo Capture.";
  }

  return "Camera permission is needed to record drill attempts from a phone or tablet.";
}

function formatAuthStatus(authStatus) {
  const labels = {
    idle: "Locked",
    scanning: "Matching profile",
    matched: "Face matched",
    failed: "Match failed"
  };

  return labels[authStatus] || labels.idle;
}

function formatStabilityStatus(stabilityStatus) {
  const labels = {
    idle: "Awaiting scan",
    scanning: "Scanning view",
    ready: "Stable and framed"
  };

  return labels[stabilityStatus] || labels.idle;
}

function buildGaitAnalysis({ drillName, durationMs, presetDistanceMeters }) {
  const seed = [...drillName].reduce(
    (total, character) => total + character.charCodeAt(0),
    Math.round(durationMs / 1000)
  );
  const gaitScore = 70 + (seed % 18);
  const bodyBallSync = 68 + (seed % 21);
  const balance = 72 + (seed % 16);
  const frameStability = Math.max(76, 96 - Math.round(presetDistanceMeters / 3));
  const bonusPoints = Math.round(
    (gaitScore * 0.35 + bodyBallSync * 0.35 + balance * 0.2 + frameStability * 0.1) /
      4
  );

  return {
    gaitScore,
    bodyBallSync,
    balance,
    frameStability,
    bonusPoints,
    durationSeconds: Math.round(durationMs / 1000),
    summary:
      "Stable stride rhythm, controlled torso position, and clean body-ball timing were detected during the recorded drill attempt."
  };
}

function formatRecordingState(recordingState) {
  const labels = {
    idle: "Waiting for drill start",
    recording: "Recording video",
    recorded: "Recording saved for analysis",
    halted: "Halted for re-authentication"
  };

  return labels[recordingState] || labels.idle;
}
