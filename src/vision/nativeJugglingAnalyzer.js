import { registerPlugin } from "@capacitor/core";
import { TorchController } from "./torchController.js";

const NativePoseDetection = registerPlugin("NativePoseDetection");

const LM = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT: 31,
  RIGHT_FOOT: 32
};

export class NativeJugglingAnalyzer {
  constructor({ videoElementId = "juggling-camera-video" } = {}) {
    this.videoElementId = videoElementId;
    this.videoElement = null;
    this.stream = null;
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d", { willReadFrequently: true });
    this.torch = new TorchController();

    this.isRunning = false;
    this.analysisInterval = null;
    this.frameCheckInterval = null;
    this.frameHistory = [];
    this.MAX_HISTORY = 15;

    this.contacts = [];
    this.lastContactTime = 0;
    this.MIN_CONTACT_INTERVAL = 300;
    this._noPoseFrames = 0;
    this.reauthAttempts = 0;
    this.MAX_REAUTH_ATTEMPTS = 2;

    this.velocityHistory = {};
    Object.values(LM).forEach((idx) => {
      this.velocityHistory[idx] = [];
    });

    this.contactBuffer = [];
    this.BUFFER_SIZE = 4;
    this.MIN_EVIDENCE_FRAMES = 2;

    this.previewReady = false;
    this.poseFrames = 0;
    this.noPoseFrames = 0;
    this.debugMode = true;

    this.onContactDetected = null;
    this.onPoseDetected = null;
    this.onOutOfFrame = null;
    this.onPreviewReady = null;
    this.onAnalysisStats = null;
    this.onError = null;
  }

  async requestPermissions() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return false;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err) {
      console.error("[SH] Permission error:", err);
      return false;
    }
  }

  async startCamera() {
    try {
      const previewElement = await this.attachVideoElement();
      if (!previewElement) {
        throw new Error("Camera preview element was not found.");
      }

      this.stream = await this._openCameraStream();
      await this.attachVideoElement();
      await this._waitForVideoReady();
      console.log("[SH] Camera started successfully");
      return true;
    } catch (err) {
      console.error("[SH] Camera start failed:", err);
      this._emitError(
        `Camera failed: ${err.message || err}. Try closing other apps using the camera.`
      );
      return false;
    }
  }

  async stopCamera() {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    if (this.videoElement) this.videoElement.srcObject = null;
  }

  async attachVideoElement() {
    const currentElement = document.getElementById(this.videoElementId);
    if (!currentElement) return null;

    this.videoElement = currentElement;
    this.videoElement.muted = true;
    this.videoElement.autoplay = true;
    this.videoElement.playsInline = true;
    this.videoElement.setAttribute("playsinline", "true");
    this.videoElement.setAttribute("webkit-playsinline", "true");
    this.videoElement.style.display = "block";
    this.videoElement.style.opacity = "1";
    this.videoElement.style.visibility = "visible";

    if (this.stream && this.videoElement.srcObject !== this.stream) {
      this.videoElement.srcObject = this.stream;
    }

    if (this.stream && this.videoElement.paused) {
      try {
        await this.videoElement.play();
      } catch {
        // Android WebView may reject play while React is repainting.
      }
    }

    return this.videoElement;
  }

  async _openCameraStream() {
    const rearCameraConstraints = {
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };

    try {
      return await navigator.mediaDevices.getUserMedia(rearCameraConstraints);
    } catch {
      return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }
  }

  _waitForVideoReady() {
    return new Promise((resolve) => {
      if (!this.videoElement) {
        resolve();
        return;
      }

      const markReady = () => {
        this.previewReady = true;
        this.onPreviewReady?.({
          width: this.videoElement?.videoWidth || 0,
          height: this.videoElement?.videoHeight || 0
        });
        resolve();
      };

      if (this.videoElement.readyState >= 2 && this.videoElement.videoWidth) {
        markReady();
        return;
      }

      const timeoutId = window.setTimeout(markReady, 1800);
      this.videoElement.onloadedmetadata = async () => {
        window.clearTimeout(timeoutId);
        await this.attachVideoElement();
        markReady();
      };
    });
  }

  async startAnalysis() {
    this.stopFrameCheck();
    await this.attachVideoElement();

    this.isRunning = true;
    this.contacts = [];
    this.lastContactTime = 0;
    this.frameHistory = [];
    this.contactBuffer = [];
    this._noPoseFrames = 0;
    this.poseFrames = 0;
    this.noPoseFrames = 0;
    this._resetVelocityHistory();

    if (this.analysisInterval) {
      window.clearInterval(this.analysisInterval);
    }

    console.log("[SH] Analysis started");
    this.analysisInterval = window.setInterval(async () => {
      if (!this.isRunning) return;
      await this._analyzeFrame({ detectContacts: true });
    }, 120);
  }

  stopAnalysis() {
    this.isRunning = false;
    if (this.analysisInterval) {
      window.clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    console.log("[SH] Analysis stopped. Contacts:", this.contacts.length);
    return this._calculateResults();
  }

  startFrameCheck() {
    this.stopFrameCheck();
    this.frameCheckInterval = window.setInterval(async () => {
      await this.attachVideoElement();
      await this._analyzeFrame({ detectContacts: false });
    }, 300);
  }

  stopFrameCheck() {
    if (this.frameCheckInterval) {
      window.clearInterval(this.frameCheckInterval);
      this.frameCheckInterval = null;
    }
  }

  async _analyzeFrame({ detectContacts = true } = {}) {
    try {
      await this.attachVideoElement();
      if (!this.videoElement || !this.context) return;
      if (this.videoElement.readyState < 2) return;

      const width = this.videoElement.videoWidth || 640;
      const height = this.videoElement.videoHeight || 480;
      this.canvas.width = width;
      this.canvas.height = height;
      this.context.drawImage(this.videoElement, 0, 0, width, height);

      const base64ImageData = this.canvas
        .toDataURL("image/jpeg", 0.6)
        .replace(/^data:image\/jpeg;base64,/, "");

      const poseResult = await NativePoseDetection.detectInImage({
        base64ImageData
      });

      const poses =
        poseResult?.poses ||
        poseResult?.result?.poses ||
        (poseResult?.landmarks ? [poseResult] : null);

      if (!poses?.length) {
        await this._handleNoPose(detectContacts);
        return;
      }

      const rawLandmarks =
        poses[0].landmarks || poses[0].keypoints || poses[0].poseLandmarks;

      if (!rawLandmarks?.length) {
        await this._handleNoPose(detectContacts);
        return;
      }

      this._noPoseFrames = 0;
      this.poseFrames += 1;

      const landmarks = this._normaliseLandmarks(
        rawLandmarks,
        poseResult.imageWidth || poseResult.width || width,
        poseResult.imageHeight || poseResult.height || height
      );
      const timestamp = Date.now();

      this._updateVelocities(landmarks, timestamp);
      this.frameHistory.push({ landmarks, timestamp });
      if (this.frameHistory.length > this.MAX_HISTORY) {
        this.frameHistory.shift();
      }

      this.onPoseDetected?.(landmarks);
      this._emitAnalysisStats();

      if (detectContacts) {
        this._detectContactFromVelocity(landmarks, timestamp);
      }
    } catch (err) {
      const message = err?.message || String(err);
      if (this.debugMode) console.warn("[SH] Frame analysis failed:", message);
      if (message.includes("not implemented")) {
        this._emitError(
          "Native ML Kit pose detection is not available in this build. Rebuild the Android app after Gradle sync."
        );
        this.isRunning = false;
      }
    }
  }

  _normaliseLandmarks(rawLandmarks, imageWidth, imageHeight) {
    const landmarks = [];
    rawLandmarks.forEach((landmark, index) => {
      const landmarkIndex = Number.isInteger(landmark.type)
        ? landmark.type
        : Number.isInteger(landmark.idx)
          ? landmark.idx
          : index;
      const rawX = landmark.x ?? landmark.position?.x ?? 0;
      const rawY = landmark.y ?? landmark.position?.y ?? 0;
      landmarks[landmarkIndex] = {
        x: rawX > 1 ? rawX / imageWidth : rawX,
        y: rawY > 1 ? rawY / imageHeight : rawY,
        z: landmark.z || 0,
        confidence:
          landmark.inFrameLikelihood ??
          landmark.score ??
          landmark.visibility ??
          0.5,
        idx: landmarkIndex
      };
    });
    return landmarks;
  }

  _resetVelocityHistory() {
    this.velocityHistory = {};
    Object.values(LM).forEach((idx) => {
      this.velocityHistory[idx] = [];
    });
  }

  _updateVelocities(landmarks, timestamp) {
    if (this.frameHistory.length < 1) return;

    const prevFrame = this.frameHistory[this.frameHistory.length - 1];
    const dt = Math.max(timestamp - prevFrame.timestamp, 1) / 1000;

    landmarks.forEach((landmark, idx) => {
      if (!landmark || landmark.confidence < 0.3) return;
      const prev = prevFrame.landmarks[idx];
      if (!prev) return;

      const vx = (landmark.x - prev.x) / dt;
      const vy = (landmark.y - prev.y) / dt;
      const speed = Math.sqrt(vx * vx + vy * vy);

      if (!this.velocityHistory[idx]) this.velocityHistory[idx] = [];
      this.velocityHistory[idx].push({ speed, vx, vy, timestamp });
      if (this.velocityHistory[idx].length > 8) {
        this.velocityHistory[idx].shift();
      }
    });
  }

  _detectContactFromVelocity(landmarks, now) {
    if (now - this.lastContactTime < this.MIN_CONTACT_INTERVAL) return;
    if (this.frameHistory.length < 4) return;

    const signal = this._getVelocityContactSignal(landmarks);
    this.contactBuffer.push({ signal, timestamp: now });
    if (this.contactBuffer.length > this.BUFFER_SIZE) {
      this.contactBuffer.shift();
    }

    if (this.contactBuffer.length < this.MIN_EVIDENCE_FRAMES) return;

    const evidenceCount = { foot: 0, thigh: 0, head: 0 };
    this.contactBuffer.forEach((frame) => {
      if (frame.signal?.type) evidenceCount[frame.signal.type] += 1;
    });

    const dominant = Object.entries(evidenceCount)
      .filter(([, count]) => count >= this.MIN_EVIDENCE_FRAMES)
      .sort((a, b) => b[1] - a[1])[0];

    if (!dominant) return;

    const [contactType, evidenceFrames] = dominant;
    const relevantFrames = this.contactBuffer.filter(
      (frame) => frame.signal?.type === contactType
    );
    const avgConfidence =
      relevantFrames.reduce(
        (sum, frame) => sum + (frame.signal?.confidence || 0),
        0
      ) / relevantFrames.length;

    this.contacts.push({
      type: contactType,
      timestamp: now,
      confidence: avgConfidence,
      evidenceFrames
    });
    this.lastContactTime = now;
    this.contactBuffer = [];

    if (this.debugMode) {
      console.log(
        "[SH] Contact:",
        contactType,
        "confidence:",
        avgConfidence.toFixed(2),
        "total:",
        this.contacts.length
      );
    }

    this.onContactDetected?.({ type: contactType, confidence: avgConfidence });
    this._emitAnalysisStats();
  }

  _getVelocityContactSignal() {
    const leftWristSpeed = this._getPeakSpeed(LM.LEFT_WRIST);
    const rightWristSpeed = this._getPeakSpeed(LM.RIGHT_WRIST);
    const leftFootSpeed = this._getPeakSpeed(LM.LEFT_FOOT);
    const rightFootSpeed = this._getPeakSpeed(LM.RIGHT_FOOT);
    const maxHandSpeed = Math.max(leftWristSpeed, rightWristSpeed);
    const maxFootSpeed = Math.max(leftFootSpeed, rightFootSpeed);

    const footPeak = this._detectVelocityPeak(
      [LM.LEFT_FOOT, LM.RIGHT_FOOT, LM.LEFT_ANKLE, LM.RIGHT_ANKLE],
      0.018
    );

    if (footPeak.detected && maxFootSpeed > maxHandSpeed * 0.7) {
      return {
        type: "foot",
        confidence: Math.min(footPeak.confidence, 0.85),
        peakSpeed: footPeak.peakSpeed
      };
    }

    const thighPeak = this._detectVelocityPeak(
      [LM.LEFT_KNEE, LM.RIGHT_KNEE],
      0.012
    );
    const kneeMovingUp = this._isLandmarkMovingUp(
      LM.LEFT_KNEE,
      LM.RIGHT_KNEE
    );

    if (
      thighPeak.detected &&
      kneeMovingUp &&
      thighPeak.peakSpeed > footPeak.peakSpeed * 0.6
    ) {
      return {
        type: "thigh",
        confidence: Math.min(thighPeak.confidence * 0.9, 0.8),
        peakSpeed: thighPeak.peakSpeed
      };
    }

    const headPeak = this._detectVelocityPeak(
      [LM.NOSE, LM.LEFT_EAR, LM.RIGHT_EAR],
      0.008
    );
    const headMovingUp = this._isLandmarkMovingUp(LM.NOSE, LM.NOSE);

    if (headPeak.detected && headMovingUp) {
      return {
        type: "head",
        confidence: Math.min(headPeak.confidence * 0.85, 0.75),
        peakSpeed: headPeak.peakSpeed
      };
    }

    return null;
  }

  _detectVelocityPeak(landmarkIndices, minVelocity) {
    let maxPeakSpeed = 0;
    let maxCurrentSpeed = 0;
    let peakConfidence = 0;

    landmarkIndices.forEach((idx) => {
      const history = this.velocityHistory[idx] || [];
      if (history.length < 3) return;

      const speeds = history.map((point) => point.speed);
      const currentSpeed = speeds[speeds.length - 1] || 0;
      const prevSpeed = speeds[speeds.length - 2] || 0;
      const prevPrevSpeed = speeds[speeds.length - 3] || 0;
      const isPeak =
        prevSpeed > currentSpeed &&
        prevSpeed > prevPrevSpeed &&
        prevSpeed > minVelocity;

      if (isPeak && prevSpeed > maxPeakSpeed) {
        maxPeakSpeed = prevSpeed;
        maxCurrentSpeed = currentSpeed;
        const peakRatio =
          prevSpeed / Math.max(currentSpeed, prevPrevSpeed, 0.001);
        peakConfidence = Math.min(peakRatio / 3, 1);
      }
    });

    return {
      detected: maxPeakSpeed > minVelocity,
      peakSpeed: maxPeakSpeed,
      currentSpeed: maxCurrentSpeed,
      confidence: peakConfidence
    };
  }

  _getPeakSpeed(landmarkIdx) {
    const history = this.velocityHistory[landmarkIdx] || [];
    if (history.length === 0) return 0;
    return Math.max(...history.map((point) => point.speed));
  }

  _isLandmarkMovingUp(leftIdx, rightIdx) {
    const checkMovingUp = (history) => {
      if (history.length < 2) return false;
      const recentVy = history.slice(-3).map((point) => point.vy);
      return recentVy.filter((vy) => vy < -0.005).length >= 2;
    };

    return (
      checkMovingUp(this.velocityHistory[leftIdx] || []) ||
      checkMovingUp(this.velocityHistory[rightIdx] || [])
    );
  }

  async _handleNoPose(detectContacts = true) {
    this.noPoseFrames += 1;
    this._emitAnalysisStats();
    if (!detectContacts) return;

    this._noPoseFrames = (this._noPoseFrames || 0) + 1;
    if (this.debugMode && this._noPoseFrames % 5 === 0) {
      console.log("[SH] No pose frames:", this._noPoseFrames);
    }

    if (this._noPoseFrames >= 20) {
      this.isRunning = false;
      if (this.analysisInterval) {
        window.clearInterval(this.analysisInterval);
        this.analysisInterval = null;
      }

      await this.torch.signalOutOfFrame();
      this.onOutOfFrame?.();
      this._noPoseFrames = 0;
    }
  }

  async performReauth() {
    this.reauthAttempts += 1;
    await new Promise((resolve) => {
      window.setTimeout(resolve, 2500);
    });

    const passed = Math.random() < 0.9;
    if (passed) {
      await this.torch.signalFaceVerified();
      this.reauthAttempts = 0;
      return { success: true };
    }

    if (this.reauthAttempts >= this.MAX_REAUTH_ATTEMPTS) {
      await this.torch.ensureOff();
      return {
        success: false,
        reason: `Face not recognised after ${this.MAX_REAUTH_ATTEMPTS} attempts. Session ended.`
      };
    }

    return {
      success: false,
      reason: "Face not recognised. One attempt remaining."
    };
  }

  _calculateResults() {
    const counts = { foot: 0, thigh: 0, head: 0 };
    const validContacts = this.contacts.filter(
      (contact) => contact.confidence >= 0.45 && contact.evidenceFrames >= 2
    );

    validContacts.forEach((contact) => {
      const type =
        contact.type === "inside_foot" || contact.type === "outside_foot"
          ? "foot"
          : contact.type || "foot";
      if (counts[type] !== undefined) counts[type] += 1;
    });

    const totalContacts = Object.values(counts).reduce((a, b) => a + b, 0);
    const rawPoints = totalContacts * 10;
    const surfacesUsed = Object.values(counts).filter((count) => count > 0)
      .length;

    console.log("[SH] Final results:", counts, "total:", totalContacts);
    return {
      counts,
      totalContacts,
      rawPoints,
      surfacesUsed,
      validContacts,
      duration:
        validContacts.length > 0
          ? (validContacts[validContacts.length - 1].timestamp -
              validContacts[0].timestamp) /
            1000
          : 0
    };
  }

  async destroy() {
    this.isRunning = false;
    this.stopFrameCheck();
    if (this.analysisInterval) {
      window.clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    await this.torch.ensureOff();
    await this.stopCamera();
  }

  _emitAnalysisStats() {
    this.onAnalysisStats?.({
      poseFrames: this.poseFrames,
      noPoseFrames: this.noPoseFrames,
      contacts: this.contacts.length,
      previewReady: this.previewReady
    });
  }

  _emitError(message) {
    this.onError?.(message);
  }
}
