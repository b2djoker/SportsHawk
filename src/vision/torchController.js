import { registerPlugin } from "@capacitor/core";

const CameraPreview = registerPlugin("CameraPreview");

export class TorchController {
  constructor() {
    this.isBusy = false;
    this.isSupported = true;
  }

  async _blink(count, onDuration = 120, offDuration = 120) {
    if (this.isBusy || !this.isSupported) return;

    this.isBusy = true;

    try {
      for (let index = 0; index < count; index += 1) {
        await this._setTorch(true);
        await this._wait(onDuration);
        await this._setTorch(false);

        if (index < count - 1) {
          await this._wait(offDuration);
        }
      }
    } catch (err) {
      console.warn("Torch not available:", err?.message || err);
      this.isSupported = false;
    } finally {
      this.isBusy = false;
    }
  }

  _wait(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  async _setTorch(enabled) {
    try {
      await CameraPreview.setFlash({ isEnable: enabled });
      return;
    } catch (pluginError) {
      const video = document.getElementById("juggling-camera-video");
      const track = video?.srcObject?.getVideoTracks?.()[0];

      if (!track?.applyConstraints) {
        throw pluginError;
      }

      await track.applyConstraints({
        advanced: [{ torch: enabled }]
      });
    }
  }

  async signalFaceVerified() {
    await this._blink(2, 100, 100);
  }

  async signalOutOfFrame() {
    await this._blink(3, 150, 120);
  }

  async ensureOff() {
    try {
      await this._setTorch(false);
    } catch {
      // Torch support varies by device and plugin availability.
    }
  }
}
