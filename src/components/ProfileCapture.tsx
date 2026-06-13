import { useEffect, useRef, useState } from "react";

type Props = {
  /** Current photo as a JPEG data-URL, or null if not yet taken. */
  value: string | null;
  /** Called with the captured JPEG data-URL. */
  onCapture: (dataUrl: string) => void;
};

const SIZE = 160; // square output side in px

/**
 * Lobby webcam snapshot. Shows a mirrored live preview and captures a small
 * square JPEG (data-URL) used as the player's battle avatar. Stops the camera
 * on unmount so GameScreen's classifier can claim it.
 */
export default function ProfileCapture({ value, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          await v.play().catch(() => {});
        }
        setReady(true);
      } catch {
        if (!cancelled) setError("Camera access denied.");
      }
    }

    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const takePhoto = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const side = Math.min(v.videoWidth, v.videoHeight);
    const sx = (v.videoWidth - side) / 2;
    const sy = (v.videoHeight - side) / 2;
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Mirror so the snapshot matches the preview the player saw.
    ctx.scale(-1, 1);
    ctx.drawImage(v, sx, sy, side, side, -SIZE, 0, SIZE, SIZE);
    onCapture(canvas.toDataURL("image/jpeg", 0.7));
  };

  if (error) {
    return <p className="mt-6 text-sm text-red-600">{error}</p>;
  }

  // Captured: show the thumbnail + retake.
  if (value) {
    return (
      <div className="mt-6 flex items-center gap-4">
        <img
          src={value}
          alt="Your battle photo"
          className="h-20 w-20 rounded-full object-cover ring-2 ring-neutral-900"
        />
        <div>
          <div className="text-sm font-medium text-neutral-900">Photo ready</div>
          <button
            onClick={() => onCapture("")}
            className="mt-1 text-sm text-neutral-400 hover:text-neutral-900"
          >
            Retake
          </button>
        </div>
      </div>
    );
  }

  // Live preview + capture button.
  return (
    <div className="mt-6">
      <div className="relative h-40 w-40 overflow-hidden rounded-full bg-neutral-900">
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
      </div>
      <button
        onClick={takePhoto}
        disabled={!ready}
        className="mt-4 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white enabled:hover:bg-neutral-700 disabled:opacity-30"
      >
        Take photo
      </button>
    </div>
  );
}
