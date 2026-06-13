import { useCallback, useEffect, useRef, useState } from "react";
import { IDLE_CLASS } from "../data/decks";
import type { TMPoseModel, TMPoseKeypoint } from "../types/tmpose";

// PoseNet adjacent joint pairs for the body skeleton.
const SKELETON_PAIRS: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 4],          // face
  [5, 6],                                    // shoulders
  [5, 7], [7, 9],                            // left arm
  [6, 8], [8, 10],                           // right arm
  [5, 11], [6, 12], [11, 12],                // torso
  [11, 13], [13, 15],                        // left leg
  [12, 14], [14, 16],                        // right leg
];

function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  keypoints: TMPoseKeypoint[],
  canvasWidth: number,
  sx: number,
  sy: number,
  side: number,
) {
  const MIN_CONF = 0.2;
  const INPUT_SIDE = 257;

  // Map each keypoint from mirrored input-canvas space to display canvas space.
  // The input canvas is the mirrored square crop; the display canvas is the
  // full mirrored video — so x maps to the same mirrored region.
  const pts = keypoints.map((kp) => ({
    score: kp.score,
    x: (canvasWidth - sx - side) + (kp.position.x / INPUT_SIDE) * side,
    y: sy + (kp.position.y / INPUT_SIDE) * side,
  }));

  ctx.save();
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 3;
  ctx.fillStyle = "#38bdf8";

  for (const [a, b] of SKELETON_PAIRS) {
    const pa = pts[a], pb = pts[b];
    if (pa && pb && pa.score >= MIN_CONF && pb.score >= MIN_CONF) {
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }
  }

  for (const pt of pts) {
    if (pt.score >= MIN_CONF) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

export type Prediction = { topClass: string; probability: number };
export type ClassPrediction = { className: string; probability: number };

type ClassifierStatus = {
  /** Camera + (optionally) model are ready and the prediction loop is running. */
  ready: boolean;
  /** No trained model was found, so predictions are simulated. */
  isMock: boolean;
  /** Latest top prediction this frame. */
  prediction: Prediction;
  /** All class probabilities this frame (for debug UI). */
  allPredictions: ClassPrediction[];
  /** Human-readable problem (e.g. camera denied), or null. */
  error: string | null;
};

const MOCK_SIMULATE_FRAMES = 16; // how long a simulated motion is "held" high

/**
 * Manages the webcam + Teachable Machine pose model and exposes the latest
 * per-frame prediction. If the model files are missing (not trained yet), it
 * falls back to a mock classifier so the whole game loop stays testable.
 *
 * Attach the returned `videoRef`/`canvasRef` to a <video>/<canvas> in the DOM.
 */
export function usePoseClassifier(modelPath: string, showSkeleton = true) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const showSkeletonRef = useRef(showSkeleton);
  showSkeletonRef.current = showSkeleton;

  const [status, setStatus] = useState<ClassifierStatus>({
    ready: false,
    isMock: false,
    prediction: { topClass: IDLE_CLASS, probability: 1 },
    allPredictions: [],
    error: null,
  });

  // Mock control: when set, the loop reports `mockMotionRef` at high confidence
  // for a short window of frames, simulating a detected motion.
  const mockMotionRef = useRef<string>(IDLE_CLASS);
  const mockFramesLeftRef = useRef(0);

  /** In mock mode, simulate the player performing `motion`. No-op for real model. */
  const simulate = useCallback((motion: string) => {
    mockMotionRef.current = motion;
    mockFramesLeftRef.current = MOCK_SIMULATE_FRAMES;
  }, []);

  useEffect(() => {
    let cancelled = false;
    let rafId = 0;
    let stream: MediaStream | null = null;
    // The loaded TM model, or null in mock mode.
    let model: TMPoseModel | null = null;

    async function start() {
      // 1) Camera
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
      } catch {
        if (!cancelled) {
          setStatus((s) => ({
            ...s,
            error: "Camera access denied. Allow the camera and reload.",
          }));
        }
        return;
      }

      const video = videoRef.current;
      if (!video || cancelled) return;
      video.srcObject = stream;
      await video.play().catch(() => {});

      // 2) Model — try the real one, fall back to mock if files are absent.
      // tmPose is loaded globally via the CDN script in index.html.
      let isMock = false;
      try {
        if (!window.tmPose) throw new Error("tmPose not loaded");
        model = await window.tmPose.load(
          modelPath + "model.json",
          modelPath + "metadata.json"
        );
      } catch {
        isMock = true;
      }

      if (cancelled) return;
      setStatus((s) => ({ ...s, ready: true, isMock }));

      // 3) Prediction loop
      const ctx = canvasRef.current?.getContext("2d") ?? null;

      // Offscreen square canvas: TM trains on a SQUARE webcam feed, so we feed
      // estimatePose a center-cropped square to match. Passing the raw non-square
      // video stretches the body and throws off every keypoint.
      const INPUT_SIDE = 257; // matches metadata.json inputResolution
      const inputCanvas = document.createElement("canvas");
      inputCanvas.width = INPUT_SIDE;
      inputCanvas.height = INPUT_SIDE;
      const inputCtx = inputCanvas.getContext("2d");

      // Persists the latest keypoints across async inference gaps so the
      // skeleton is redrawn every display frame rather than only in the brief
      // window between inference completion and the next canvas clear.
      let latestPoseFrame: {
        keypoints: TMPoseKeypoint[];
        sx: number;
        sy: number;
        side: number;
      } | null = null;

      const loop = async () => {
        if (cancelled) return;
        const v = videoRef.current;
        const canvas = canvasRef.current;

        if (v && canvas && ctx && v.videoWidth) {
          canvas.width = v.videoWidth;
          canvas.height = v.videoHeight;
          // Mirror the display so movement feels natural.
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(v, -canvas.width, 0, canvas.width, canvas.height);
          ctx.restore();
          // Draw the most recent skeleton on every display frame.
          if (showSkeletonRef.current && latestPoseFrame) {
            drawSkeleton(
              ctx,
              latestPoseFrame.keypoints,
              canvas.width,
              latestPoseFrame.sx,
              latestPoseFrame.sy,
              latestPoseFrame.side,
            );
          }
        }

        let prediction: Prediction = { topClass: IDLE_CLASS, probability: 1 };
        let allPredictions: ClassPrediction[] = [];

        if (model && v && v.videoWidth && canvas && ctx && inputCtx) {
          try {
            // Center-crop a square of the video into the square input canvas so the
            // inference input matches TM's square training feed. TM trains on a MIRRORED
            // webcam (flip=true), so we mirror the square here too — otherwise left/right
            // come out swapped.
            const side = Math.min(v.videoWidth, v.videoHeight);
            const sx = (v.videoWidth - side) / 2;
            const sy = (v.videoHeight - side) / 2;
            inputCtx.save();
            inputCtx.scale(-1, 1);
            inputCtx.drawImage(v, sx, sy, side, side, -INPUT_SIDE, 0, INPUT_SIDE, INPUT_SIDE);
            inputCtx.restore();

            const { pose, posenetOutput } = await model.estimatePose(inputCanvas);
            const preds: ClassPrediction[] = await model.predict(posenetOutput);
            allPredictions = preds.map((p) => ({ ...p, className: p.className.toLowerCase() }));
            const top = preds.reduce((a, b) =>
              b.probability > a.probability ? b : a
            );
            // Normalise to lowercase so deck motion strings always match
            prediction = { topClass: top.className.toLowerCase(), probability: top.probability };

            if (pose?.keypoints?.length) {
              latestPoseFrame = { keypoints: pose.keypoints, sx, sy, side };
            }
          } catch {
            // transient frame error; keep last prediction shape
          }
        } else {
          // Mock mode — emit full per-class probs too, since the matcher reads
          // allPredictions (not just the top class) to accumulate qualifying frames.
          if (mockFramesLeftRef.current > 0) {
            mockFramesLeftRef.current--;
            prediction = { topClass: mockMotionRef.current, probability: 0.95 };
            allPredictions = [
              { className: mockMotionRef.current, probability: 0.95 },
              { className: IDLE_CLASS, probability: 0.05 },
            ];
          } else {
            prediction = { topClass: IDLE_CLASS, probability: 0.9 };
            allPredictions = [{ className: IDLE_CLASS, probability: 0.9 }];
          }
        }

        // Always publish a fresh frame so the matcher is fed every frame — even
        // when the prediction is held perfectly steady (identical values would
        // otherwise be skipped, freezing progress at a constant high confidence).
        setStatus((s) => ({ ...s, prediction, allPredictions }));

        rafId = requestAnimationFrame(loop);
      };

      rafId = requestAnimationFrame(loop);
    }

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [modelPath]);

  return { videoRef, canvasRef, ...status, simulate };
}
