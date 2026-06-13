// Minimal typing for the Teachable Machine pose library loaded via CDN
// (see index.html). We only declare the bits we actually use.

export type TMPosePrediction = { className: string; probability: number };
export type TMPoseKeypoint = { position: { x: number; y: number }; score: number };
export type TMPose = { keypoints: TMPoseKeypoint[]; score: number };

export interface TMPoseModel {
  estimatePose(
    input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
    flipHorizontal?: boolean
  ): Promise<{ pose: TMPose; posenetOutput: Float32Array }>;
  predict(posenetOutput: Float32Array): Promise<TMPosePrediction[]>;
  getTotalClasses(): number;
}

declare global {
  interface Window {
    tmPose?: {
      load(modelURL: string, metadataURL: string): Promise<TMPoseModel>;
      drawKeypoints(keypoints: TMPoseKeypoint[], minConfidence: number, ctx: CanvasRenderingContext2D, scale?: number): void;
      drawSkeleton(keypoints: TMPoseKeypoint[], minConfidence: number, ctx: CanvasRenderingContext2D, scale?: number): void;
    };
  }
}
