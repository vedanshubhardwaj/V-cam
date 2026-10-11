import {
  FilesetResolver,
  FaceLandmarker,
  HandLandmarker,
} from '@mediapipe/tasks-vision';
import {
  DetectedFace,
  DetectedHand,
  ExpressionScores,
  ExpressionType,
  VisionDetectionResult,
} from '../types/vision';

export class VisionEngine {
  private faceLandmarker: FaceLandmarker | null = null;
  private handLandmarker: HandLandmarker | null = null;
  private isInitializing: boolean = false;
  private isReady: boolean = false;
  private initError: string | null = null;

  // Smoothing states (EMA)
  private smoothedExpressions: ExpressionScores = {
    Happy: 0.05,
    Neutral: 0.85,
    Sad: 0.05,
    Surprised: 0.05,
  };

  // Hysteresis buffers for hand gestures per hand index
  private gestureHistory: Map<number, { isFistCount: number; isPalmCount: number; currentGesture: 'closed_fist' | 'open_palm' | 'pinch' | 'unknown' }> = new Map();

  // Velocity tracking per hand index
  private prevHandPositions: Map<number, { x: number; y: number; time: number }> = new Map();

  public async initialize(onProgress?: (status: string) => void): Promise<boolean> {
    if (this.isReady) return true;
    if (this.isInitializing) return false;

    this.isInitializing = true;
    this.initError = null;

    try {
      onProgress?.('Loading MediaPipe Vision WASM core...');

      // Version matching installed package
      const wasmUrls = [
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
      ];

      let vision: any = null;
      for (const wasmUrl of wasmUrls) {
        try {
          vision = await FilesetResolver.forVisionTasks(wasmUrl);
          if (vision) break;
        } catch (e) {
          console.warn(`Failed loading WASM from ${wasmUrl}, trying fallback...`, e);
        }
      }

      if (!vision) {
        throw new Error('Unable to initialize MediaPipe Vision WASM runtime.');
      }

      onProgress?.('Loading Neural Face Expression Model...');
      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: false,
      });

      onProgress?.('Loading Hand Landmark & Gesture Tracker...');
      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.isReady = true;
      this.isInitializing = false;
      onProgress?.('Vision Neural Models Ready');
      return true;
    } catch (err: any) {
      console.error('VisionEngine initialization failed:', err);
      this.initError = err?.message || 'Failed to initialize vision models';
      this.isInitializing = false;
      return false;
    }
  }

  public getStatus() {
    return {
      isReady: this.isReady,
      isInitializing: this.isInitializing,
      error: this.initError,
    };
  }

  public processVideoFrame(
    video: HTMLVideoElement,
    timestamp: number,
    canvasWidth: number,
    canvasHeight: number,
    isMirrored: boolean = true
  ): VisionDetectionResult {
    if (!this.isReady || !video || video.readyState < 2) {
      return { face: null, hands: [], timestamp };
    }

    let detectedFace: DetectedFace | null = null;
    const detectedHands: DetectedHand[] = [];

    // 1. Process Face Landmarker
    if (this.faceLandmarker) {
      try {
        const faceResult = this.faceLandmarker.detectForVideo(video, timestamp);
        if (faceResult && faceResult.faceLandmarks && faceResult.faceLandmarks.length > 0) {
          const landmarks = faceResult.faceLandmarks[0];

          // Compute Bounding Box
          let minX = 1,
            maxX = 0,
            minY = 1,
            maxY = 0;
          for (const pt of landmarks) {
            if (pt.x < minX) minX = pt.x;
            if (pt.x > maxX) maxX = pt.x;
            if (pt.y < minY) minY = pt.y;
            if (pt.y > maxY) maxY = pt.y;
          }

          // Add padding
          const padX = (maxX - minX) * 0.12;
          const padY = (maxY - minY) * 0.15;
          minX = Math.max(0, minX - padX);
          maxX = Math.min(1, maxX + padX);
          minY = Math.max(0, minY - padY);
          maxY = Math.min(1, maxY + padY);

          // Handle mirror coordinate conversion
          let boxX = minX;
          const boxWidth = maxX - minX;
          if (isMirrored) {
            boxX = 1 - maxX;
          }

          // Extract Blendshapes for expression estimation
          let smileScore = 0;
          let surprisedScore = 0;
          let sadScore = 0;

          if (faceResult.faceBlendshapes && faceResult.faceBlendshapes.length > 0) {
            const categories = faceResult.faceBlendshapes[0].categories;
            const blendMap: Record<string, number> = {};
            for (const cat of categories) {
              blendMap[cat.categoryName] = cat.score;
            }

            // Happy: smile blendshapes
            const smileLeft = blendMap['mouthSmileLeft'] || 0;
            const smileRight = blendMap['mouthSmileRight'] || 0;
            smileScore = (smileLeft + smileRight) / 2;

            // Surprised: jawOpen, browInnerUp, eyeWide
            const jawOpen = blendMap['jawOpen'] || 0;
            const browInnerUp = blendMap['browInnerUp'] || 0;
            const eyeWideLeft = blendMap['eyeWideLeft'] || 0;
            const eyeWideRight = blendMap['eyeWideRight'] || 0;
            const eyeWide = (eyeWideLeft + eyeWideRight) / 2;
            surprisedScore = Math.max(
              jawOpen * 0.75 + browInnerUp * 0.35,
              jawOpen * 0.85,
              browInnerUp * 0.7 + eyeWide * 0.3
            );

            // Sad: browDown, mouthFrown, mouthPress
            const browDownLeft = blendMap['browDownLeft'] || 0;
            const browDownRight = blendMap['browDownRight'] || 0;
            const browDown = (browDownLeft + browDownRight) / 2;
            const frownLeft = blendMap['mouthFrownLeft'] || 0;
            const frownRight = blendMap['mouthFrownRight'] || 0;
            const mouthFrown = (frownLeft + frownRight) / 2;
            const mouthPress = ((blendMap['mouthPressLeft'] || 0) + (blendMap['mouthPressRight'] || 0)) / 2;
            sadScore = Math.max(
              mouthFrown * 0.8 + browDown * 0.3,
              browDown * 0.7 + mouthPress * 0.3
            );
          }

          // Calculate raw expression scores
          const rawHappy = Math.min(1, smileScore * 1.5);
          const rawSurprised = Math.min(1, surprisedScore * 1.4);
          const rawSad = Math.min(1, sadScore * 1.6);
          const rawNeutral = Math.max(
            0.1,
            1.0 - (rawHappy * 1.3 + rawSurprised * 1.2 + rawSad * 1.3)
          );

          // Normalize
          const totalRaw = rawHappy + rawSurprised + rawSad + rawNeutral || 1;
          const normHappy = rawHappy / totalRaw;
          const normSurprised = rawSurprised / totalRaw;
          const normSad = rawSad / totalRaw;
          const normNeutral = rawNeutral / totalRaw;

          // Smooth with EMA filter (alpha = 0.25)
          const alpha = 0.25;
          this.smoothedExpressions.Happy =
            this.smoothedExpressions.Happy * (1 - alpha) + normHappy * alpha;
          this.smoothedExpressions.Surprised =
            this.smoothedExpressions.Surprised * (1 - alpha) + normSurprised * alpha;
          this.smoothedExpressions.Sad =
            this.smoothedExpressions.Sad * (1 - alpha) + normSad * alpha;
          this.smoothedExpressions.Neutral =
            this.smoothedExpressions.Neutral * (1 - alpha) + normNeutral * alpha;

          // Determine dominant expression
          const expressions = this.smoothedExpressions;
          let dominant: ExpressionType = 'Neutral';
          let maxVal = expressions.Neutral;

          if (expressions.Happy > maxVal) {
            maxVal = expressions.Happy;
            dominant = 'Happy';
          }
          if (expressions.Surprised > maxVal) {
            maxVal = expressions.Surprised;
            dominant = 'Surprised';
          }
          if (expressions.Sad > maxVal) {
            maxVal = expressions.Sad;
            dominant = 'Sad';
          }

          detectedFace = {
            boundingBox: {
              x: boxX * canvasWidth,
              y: minY * canvasHeight,
              width: boxWidth * canvasWidth,
              height: (maxY - minY) * canvasHeight,
            },
            dominantExpression: dominant,
            confidence: Math.round(maxVal * 100),
            expressions: {
              Happy: Math.round(expressions.Happy * 100),
              Neutral: Math.round(expressions.Neutral * 100),
              Sad: Math.round(expressions.Sad * 100),
              Surprised: Math.round(expressions.Surprised * 100),
            },
          };
        }
      } catch (e) {
        console.warn('Face detection pass error:', e);
      }
    }

    // 2. Process Hand Landmarker
    if (this.handLandmarker) {
      try {
        const handResult = this.handLandmarker.detectForVideo(video, timestamp);
        if (handResult && handResult.landmarks && handResult.landmarks.length > 0) {
          for (let i = 0; i < handResult.landmarks.length; i++) {
            const rawLandmarks = handResult.landmarks[i];
            const handednessStr =
              handResult.handedness && handResult.handedness[i] && handResult.handedness[i][0]
                ? (handResult.handedness[i][0].categoryName as 'Left' | 'Right')
                : i === 0
                ? 'Right'
                : 'Left';

            // Coordinates in pixel space (handling mirror mode)
            const pts = rawLandmarks.map((pt) => ({
              x: (isMirrored ? 1 - pt.x : pt.x) * canvasWidth,
              y: pt.y * canvasHeight,
              z: pt.z,
            }));

            // Key landmark indices:
            // 0: Wrist
            // 5: Index MCP, 6: Index PIP, 8: Index TIP
            // 9: Middle MCP, 10: Middle PIP, 12: Middle TIP
            // 13: Ring MCP, 14: Ring PIP, 16: Ring TIP
            // 17: Pinky MCP, 18: Pinky PIP, 20: Pinky TIP
            // 2: Thumb MCP, 4: Thumb TIP
            const wrist = pts[0];
            const middleMcp = pts[9];

            const palmDist = Math.hypot(wrist.x - middleMcp.x, wrist.y - middleMcp.y) || 50;

            // Compute curl for Index (5, 6, 8)
            const indexTipDist = Math.hypot(pts[8].x - wrist.x, pts[8].y - wrist.y);
            const indexPipDist = Math.hypot(pts[6].x - wrist.x, pts[6].y - wrist.y);
            const indexCurl = Math.max(0, Math.min(1, 1 - (indexTipDist - indexPipDist * 0.5) / (indexPipDist * 0.9)));

            // Compute curl for Middle (9, 10, 12)
            const middleTipDist = Math.hypot(pts[12].x - wrist.x, pts[12].y - wrist.y);
            const middlePipDist = Math.hypot(pts[10].x - wrist.x, pts[10].y - wrist.y);
            const middleCurl = Math.max(0, Math.min(1, 1 - (middleTipDist - middlePipDist * 0.5) / (middlePipDist * 0.9)));

            // Compute curl for Ring (13, 14, 16)
            const ringTipDist = Math.hypot(pts[16].x - wrist.x, pts[16].y - wrist.y);
            const ringPipDist = Math.hypot(pts[14].x - wrist.x, pts[14].y - wrist.y);
            const ringCurl = Math.max(0, Math.min(1, 1 - (ringTipDist - ringPipDist * 0.5) / (ringPipDist * 0.9)));

            // Compute curl for Pinky (17, 18, 20)
            const pinkyTipDist = Math.hypot(pts[20].x - wrist.x, pts[20].y - wrist.y);
            const pinkyPipDist = Math.hypot(pts[18].x - wrist.x, pts[18].y - wrist.y);
            const pinkyCurl = Math.max(0, Math.min(1, 1 - (pinkyTipDist - pinkyPipDist * 0.5) / (pinkyPipDist * 0.9)));

            // Compute Thumb fold (Tip 4 relative to Pinky MCP 17 or Middle MCP 9)
            const thumbTip = pts[4];
            const thumbToMiddle = Math.hypot(thumbTip.x - middleMcp.x, thumbTip.y - middleMcp.y);
            const thumbCurl = Math.max(0, Math.min(1, 1 - (thumbToMiddle / (palmDist * 1.1))));

            // Determine if closed fist: all 4 main fingers curled + thumb
            const curledFingersCount = [indexCurl > 0.65, middleCurl > 0.65, ringCurl > 0.65, pinkyCurl > 0.65].filter(Boolean).length;
            const extendedFingersCount = [indexCurl < 0.4, middleCurl < 0.4, ringCurl < 0.4, pinkyCurl < 0.4].filter(Boolean).length;
            const isRawFist = curledFingersCount >= 3 && (thumbCurl > 0.45 || curledFingersCount === 4);

            // Pinch calculation (thumb tip 4 to index tip 8)
            const pinchDist = Math.hypot(pts[4].x - pts[8].x, pts[4].y - pts[8].y);
            const isPinching = pinchDist < palmDist * 0.35 && !isRawFist;

            const isRawOpenPalm = extendedFingersCount >= 3 && thumbCurl < 0.55 && !isPinching;

            // Hysteresis smoothing
            let history = this.gestureHistory.get(i);
            if (!history) {
              history = { isFistCount: 0, isPalmCount: 0, currentGesture: 'unknown' };
              this.gestureHistory.set(i, history);
            }

            if (isRawFist) {
              history.isFistCount++;
              history.isPalmCount = 0;
              if (history.isFistCount >= 2) {
                history.currentGesture = 'closed_fist';
              }
            } else if (isPinching) {
              history.isFistCount = 0;
              history.isPalmCount = 0;
              history.currentGesture = 'pinch';
            } else if (isRawOpenPalm) {
              history.isPalmCount++;
              history.isFistCount = 0;
              if (history.isPalmCount >= 2) {
                history.currentGesture = 'open_palm';
              }
            } else {
              history.isFistCount = Math.max(0, history.isFistCount - 1);
              history.isPalmCount = Math.max(0, history.isPalmCount - 1);
            }

            // Fist center: centroid of knuckles (MCP joints) + wrist
            const fistCenterX = (wrist.x + pts[5].x + pts[9].x + pts[13].x + pts[17].x) / 5;
            const fistCenterY = (wrist.y + pts[5].y + pts[9].y + pts[13].y + pts[17].y) / 5;

            // Palm center: average between wrist and middle MCP
            const palmCenterX = (wrist.x + middleMcp.x) / 2;
            const palmCenterY = (wrist.y + middleMcp.y) / 2;

            // Hand scale / radius for fire bounding
            const handRadius = Math.max(28, palmDist * 0.85);

            // Velocity & Punch calculation
            const prev = this.prevHandPositions.get(i);
            let vx = 0;
            let vy = 0;
            let speed = 0;
            const now = timestamp || performance.now();

            if (prev) {
              const dt = Math.max(8, now - prev.time);
              vx = ((fistCenterX - prev.x) / dt) * 1000;
              vy = ((fistCenterY - prev.y) / dt) * 1000;
              speed = Math.hypot(vx, vy);
            }
            this.prevHandPositions.set(i, { x: fistCenterX, y: fistCenterY, time: now });

            const isPunching = history.currentGesture === 'closed_fist' && speed > 550;

            detectedHands.push({
              handedness: handednessStr,
              gesture: history.currentGesture,
              isFist: history.currentGesture === 'closed_fist',
              isOpenPalm: history.currentGesture === 'open_palm',
              pinchDistance: Math.round(pinchDist),
              isPinching,
              fistCenter: { x: fistCenterX, y: fistCenterY },
              palmCenter: { x: palmCenterX, y: palmCenterY },
              radius: handRadius,
              fingerCurls: {
                thumb: Number(thumbCurl.toFixed(2)),
                index: Number(indexCurl.toFixed(2)),
                middle: Number(middleCurl.toFixed(2)),
                ring: Number(ringCurl.toFixed(2)),
                pinky: Number(pinkyCurl.toFixed(2)),
              },
              landmarks: pts,
              velocity: {
                vx: Math.round(vx),
                vy: Math.round(vy),
                speed: Math.round(speed),
              },
              isPunching,
            });
          }
        }
      } catch (e) {
        console.warn('Hand detection pass error:', e);
      }
    }

    return {
      face: detectedFace,
      hands: detectedHands,
      timestamp,
    };
  }

  public dispose() {
    try {
      this.faceLandmarker?.close();
      this.handLandmarker?.close();
    } catch {
      // Ignore
    }
    this.faceLandmarker = null;
    this.handLandmarker = null;
    this.isReady = false;
    this.gestureHistory.clear();
  }
}

export const visionEngine = new VisionEngine();
