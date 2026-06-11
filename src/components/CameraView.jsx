import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, AlertTriangle, Loader2 } from 'lucide-react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { classifyGesture } from '../utils/gestureClassifier';

const CLASSES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Hello', 'Thank_You', 'I_Love_You', 'Yes', 'No', 'Good', 'Bad', 'Stop'];

const CameraView = ({ model, onPrediction }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Initializing MediaPipe...');
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState(null);
  const landmarkerRef = useRef(null);
  const requestRef = useRef(null);
  const predictionHistory = useRef([]);
  const SMOOTHING_WINDOW = 5; // frames

  // Initialize MediaPipe Hand Landmarker
  useEffect(() => {
    async function initMediaPipe() {
      try {
        setLoadingStatus('Loading local vision tasks WASM...');
        const vision = await FilesetResolver.forVisionTasks(
          '/mediapipe'
        );
        
        setLoadingStatus('Loading local Hand Landmarker model...');
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/mediapipe/hand_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 1
        });
        
        landmarkerRef.current = landmarker;
        setLoading(false);
        startCamera();
      } catch (err) {
        console.error('Failed to initialize MediaPipe:', err);
        setError('Could not initialize MediaPipe Hand Tracker. Please check connection or reload.');
        setLoading(false);
      }
    }
    initMediaPipe();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', () => {
          setCameraActive(true);
        });
      }
    } catch (err) {
      console.error('Error starting camera:', err);
      setError('Webcam access denied or unavailable. Please enable permissions.');
    }
  };

  const stopCamera = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Run the detection loop when camera is active
  useEffect(() => {
    if (!cameraActive || !landmarkerRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const landmarker = landmarkerRef.current;

    const detectFrame = async () => {
      if (video.readyState >= 2) {
        const timestamp = performance.now();
        const results = landmarker.detectForVideo(video, timestamp);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0]; // First detected hand
          
          // Draw the hand mesh
          drawHand(ctx, landmarks);

          // Run angle-based gesture classification
          runClassification(landmarks);
        } else {
          predictionHistory.current = [];
          onPrediction(null, 0);
        }
      }
      requestRef.current = requestAnimationFrame(detectFrame);
    };

    requestRef.current = requestAnimationFrame(detectFrame);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [cameraActive, model, onPrediction]);

  // Classify landmarks using angle-based geometric rules
  const runClassification = (landmarks) => {
    try {
      // 1. Get raw prediction using robust 3D joint-angle mathematics
      const [rawLabel, rawConf] = classifyGesture(landmarks);

      // 2. Sliding-window majority vote for temporal stability
      predictionHistory.current.push({ pred: rawLabel, conf: rawConf });
      if (predictionHistory.current.length > SMOOTHING_WINDOW) {
        predictionHistory.current.shift();
      }

      const counts = {};
      let majorityPred = rawLabel;
      let maxCount = 0;
      predictionHistory.current.forEach(item => {
        if (!item.pred) return;
        counts[item.pred] = (counts[item.pred] || 0) + 1;
        if (counts[item.pred] > maxCount) {
          maxCount = counts[item.pred];
          majorityPred = item.pred;
        }
      });

      // Need majority in the window
      const required = Math.ceil(SMOOTHING_WINDOW / 2);
      if (maxCount >= required && majorityPred) {
        const matchingFrames = predictionHistory.current.filter(f => f.pred === majorityPred);
        const avgConf = matchingFrames.reduce((s, f) => s + f.conf, 0) / matchingFrames.length;
        onPrediction(majorityPred, avgConf);
      } else {
        onPrediction(null, 0);
      }
    } catch (err) {
      console.error('Classification error:', err);
    }
  };

  // Draw MediaPipe Hand landmarks and connectors on canvas
  const drawHand = (ctx, landmarks) => {
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index
      [0, 9], [9, 10], [10, 11], [11, 12], // Middle
      [0, 13], [13, 14], [14, 15], [15, 16], // Ring
      [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
      [5, 9], [9, 13], [13, 17] // Palm
    ];

    // Draw lines
    ctx.lineWidth = 3.5;
    connections.forEach(([i, j]) => {
      const pt1 = landmarks[i];
      const pt2 = landmarks[j];
      
      ctx.beginPath();
      ctx.moveTo(pt1.x * 640, pt1.y * 480);
      ctx.lineTo(pt2.x * 640, pt2.y * 480);
      ctx.strokeStyle = '#00f2fe';
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 8;
      ctx.stroke();
    });

    // Draw keypoints
    ctx.shadowBlur = 0; // reset
    landmarks.forEach((pt, idx) => {
      ctx.beginPath();
      ctx.arc(pt.x * 640, pt.y * 480, idx === 0 ? 8 : 4.5, 0, 2 * Math.PI);
      
      let color = '#00f2fe';
      if (idx === 0) color = '#ffe83f'; // wrist
      else if (idx <= 4) color = '#39ff14'; // thumb
      
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    });
  };

  return (
    <div className="camera-container-wrapper">
        {loading && (
          <div className="camera-loading-overlay d-flex flex-column align-items-center justify-content-center">
            <Loader2 size={40} className="animate-spin text-primary" />
            <p className="mt-2 loading-status-text">{loadingStatus}</p>
          </div>
        )}

        {error && (
          <div className="camera-error-overlay d-flex flex-column align-items-center justify-content-center">
            <AlertTriangle size={36} className="text-danger" />
            <p className="error-text mt-2">{error}</p>
            <button className="btn btn-primary mt-2" onClick={startCamera}>Retry Camera</button>
          </div>
        )}

        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <span className={`status-dot ${cameraActive ? 'active' : ''}`} />
            <span className="camera-status-label">
              {cameraActive ? 'WEBSTREAM ACTIVE (60 FPS)' : 'CAMERA INACTIVE'}
            </span>
            {cameraActive ? (
              <button className="btn btn-danger" onClick={stopCamera}>
                <CameraOff size={12} /> Turn Off
              </button>
            ) : (
              !loading && (
                <button className="btn btn-success" onClick={startCamera}>
                  <Camera size={12} /> Turn On
                </button>
              )
            )}
          </div>

          <div className="video-viewport">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="webcam-video"
              width={640}
              height={480}
            />
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="landmarks-canvas"
            />
          </div>
        </div>
    </div>
  );
};

export default CameraView;
