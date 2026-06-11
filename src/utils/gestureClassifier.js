// Calculate 3D distance between two points
const getDist = (p1, p2) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2));
};

// Calculate 2D distance to ignore unreliable Z-depth from MediaPipe
const getDist2D = (p1, p2) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

// Calculate 3D angle at p2 (p1 -> p2 -> p3)
const getAngle = (p1, p2, p3) => {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y, z: p1.z - p2.z };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y, z: p3.z - p2.z };
  
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.sqrt(v1.x*v1.x + v1.y*v1.y + v1.z*v1.z);
  const mag2 = Math.sqrt(v2.x*v2.x + v2.y*v2.y + v2.z*v2.z);
  
  let cosTheta = dot / (mag1 * mag2);
  cosTheta = Math.max(-1, Math.min(1, cosTheta));
  return Math.acos(cosTheta) * (180 / Math.PI);
};

// Analyze a single finger's state based on true 3D joint flexion
const getFingerState = (landmarks, fingerName) => {
  const joints = {
    'Thumb': [1, 2, 3, 4],
    'Index': [5, 6, 7, 8],
    'Middle': [9, 10, 11, 12],
    'Ring': [13, 14, 15, 16],
    'Pinky': [17, 18, 19, 20]
  }[fingerName];
  
  const pipAngle = getAngle(landmarks[joints[0]], landmarks[joints[1]], landmarks[joints[2]]);
  const dipAngle = getAngle(landmarks[joints[1]], landmarks[joints[2]], landmarks[joints[3]]);
  
  const avgAngle = (pipAngle + dipAngle) / 2;
  
  if (avgAngle > 150) return 'STRAIGHT';
  if (avgAngle > 90) return 'CURVED'; // Widened CURVED range for C
  return 'FOLDED';
};

// Simple motion history tracking for phrases
const wristHistory = [];
const indexHistory = [];
const pinkyHistory = [];

export const classifyGesture = (landmarks) => {
  if (!landmarks || landmarks.length < 21) return [null, 0];

  const thumb = getFingerState(landmarks, 'Thumb');
  const index = getFingerState(landmarks, 'Index');
  const middle = getFingerState(landmarks, 'Middle');
  const ring = getFingerState(landmarks, 'Ring');
  const pinky = getFingerState(landmarks, 'Pinky');

  const palmWidth = getDist(landmarks[5], landmarks[17]);
  const palmLength = getDist(landmarks[0], landmarks[9]); // Wrist to Middle MCP
  const thumbTip = landmarks[4];
  const wrist = landmarks[0];
  
  // Update motion history
  wristHistory.push(wrist);
  if (wristHistory.length > 15) wristHistory.shift();
  indexHistory.push(landmarks[8]);
  if (indexHistory.length > 15) indexHistory.shift();
  pinkyHistory.push(landmarks[20]);
  if (pinkyHistory.length > 15) pinkyHistory.shift();

  let motionY = 0;
  let indexMotionX = 0;
  let indexMotionY = 0;
  let pinkyMotionX = 0;
  let pinkyMotionY = 0;
  if (wristHistory.length === 15) {
      motionY = wristHistory[14].y - wristHistory[0].y; // positive means moving DOWN
      indexMotionX = indexHistory[14].x - indexHistory[0].x;
      indexMotionY = indexHistory[14].y - indexHistory[0].y;
      pinkyMotionX = pinkyHistory[14].x - pinkyHistory[0].x;
      pinkyMotionY = pinkyHistory[14].y - pinkyHistory[0].y;
  }

  const tipDists = {
    'ThumbIndex': getDist(thumbTip, landmarks[8]),
    'ThumbMiddle': getDist(thumbTip, landmarks[12]),
    'IndexMiddle': getDist(landmarks[8], landmarks[12]),
  };

  const thumbDists = [
    { name: 'Index', d: getDist(thumbTip, landmarks[6]) },
    { name: 'Middle', d: getDist(thumbTip, landmarks[10]) },
    { name: 'Ring', d: getDist(thumbTip, landmarks[14]) },
    { name: 'Pinky', d: getDist(thumbTip, landmarks[18]) }
  ];
  thumbDists.sort((a, b) => a.d - b.d);
  const closestPIP = thumbDists[0].name;

  let gesture = null;
  let conf = 0.85;

  // In C, fingertips are arched away from the palm, so 2D distance to wrist is large
  // In a fist, fingertips curl into the palm, so 2D distance to wrist is small (~0.5 palmLength)
  // We use 2D distance because MediaPipe's Z-depth for folded fingers is exaggerated and breaks 3D distance.
  const palmLength2D = getDist2D(landmarks[0], landmarks[9]);
  const indexFar = getDist2D(landmarks[8], wrist) > palmLength2D * 0.85;
  const middleFar = getDist2D(landmarks[12], wrist) > palmLength2D * 0.85;

  // 1. All Fingers Straight (B)
  if (!gesture && index === 'STRAIGHT' && middle === 'STRAIGHT' && ring === 'STRAIGHT' && pinky === 'STRAIGHT') {
    gesture = 'B';
  }

  // 2. Index Straight Only (D, G, L, Q, Z)
  if (!gesture && index === 'STRAIGHT' && middle !== 'STRAIGHT' && ring !== 'STRAIGHT' && pinky !== 'STRAIGHT') {
    if (thumb === 'STRAIGHT' && getDist(landmarks[4], landmarks[8]) > palmWidth * 1.5) {
      gesture = 'L';
    }
    else {
      // Determine orientation of the index finger relative to its base (MCP)
      const isPointingDown = landmarks[8].y > landmarks[5].y;
      const isPointingUp = landmarks[8].y < landmarks[5].y - (palmLength * 0.3);

      if (isPointingDown) {
        gesture = 'Q';
      } 
      else if (!isPointingUp) {
        gesture = 'G'; // Pointing sideways or forward
      } 
      else {
        // Pointing UP
        gesture = 'D';
        // Z requires noticeable motion
        if (Math.abs(indexMotionX) > 0.04 || Math.abs(indexMotionY) > 0.04) gesture = 'Z';
      }
    }
  }

  // 3. Pinky Straight Only (I, J, Y)
  if (!gesture && index !== 'STRAIGHT' && middle !== 'STRAIGHT' && ring !== 'STRAIGHT' && pinky === 'STRAIGHT') {
    if (thumb === 'STRAIGHT' && getDist(landmarks[4], landmarks[5]) > palmWidth * 0.9) {
      gesture = 'Y';
    } else {
      gesture = 'I';
      // J involves motion
      if (Math.abs(pinkyMotionX) > 0.04 || Math.abs(pinkyMotionY) > 0.04) gesture = 'J';
    }
  }

  // 4. Index & Middle Straight (U, V, H, R, K, P)
  if (!gesture && index === 'STRAIGHT' && middle === 'STRAIGHT' && ring !== 'STRAIGHT' && pinky !== 'STRAIGHT') {
    if (tipDists.IndexMiddle > palmWidth * 0.5) {
      if (closestPIP === 'Index' || closestPIP === 'Middle') { 
         if (landmarks[8].y < landmarks[0].y) gesture = 'K';
         else gesture = 'P';
      } else {
         gesture = 'V';
      }
    } else {
      if (Math.abs(landmarks[8].y - landmarks[0].y) < 0.25) {
        gesture = 'H';
      } else {
        if (landmarks[8].x < landmarks[12].x) gesture = 'R'; 
        else gesture = 'U'; 
      }
    }
  }

  // 5. Specific Multi-Finger Straight (F, W)
  if (!gesture && middle === 'STRAIGHT' && ring === 'STRAIGHT' && pinky === 'STRAIGHT' && index !== 'STRAIGHT') {
    if (tipDists.ThumbIndex < palmWidth * 0.8) gesture = 'F'; 
  }
  if (!gesture && index === 'STRAIGHT' && middle === 'STRAIGHT' && ring === 'STRAIGHT' && pinky !== 'STRAIGHT') {
    gesture = 'W';
  }

  // 6. C and O (Fingers NOT straight, but tips are FAR from wrist)
  if (!gesture && index !== 'STRAIGHT' && middle !== 'STRAIGHT' && ring !== 'STRAIGHT' && pinky !== 'STRAIGHT') {
    if (getDist2D(landmarks[8], wrist) > palmLength2D * 1.05 && getDist2D(landmarks[12], wrist) > palmLength2D * 1.05) {
      if (tipDists.ThumbIndex < palmWidth * 0.7) gesture = 'O'; 
      else gesture = 'C';
    }
    // 7. X vs Fists
    else {
      // In X, the index finger is hooked, so its tip is far from the folded middle tip.
      // In fists, all fingertips are bunched tightly together.
      if (getDist(landmarks[8], landmarks[12]) > palmWidth * 0.5) {
        gesture = 'X';
      }
      // 8. Fists (A, S, T, N, M, E)
      else if (thumb === 'STRAIGHT') {
        gesture = 'A'; 
      } 
      else {
        // Calculate normalized thumb projection across the knuckles
        // 0.0 = at Index MCP, 1.0 = at Pinky MCP
        const mcp5 = landmarks[5];
        const mcp17 = landmarks[17];
        const palmVecX = mcp17.x - mcp5.x;
        const palmVecY = mcp17.y - mcp5.y;
        const palmVecMagSq = palmVecX * palmVecX + palmVecY * palmVecY;
        const thumbVecX = thumbTip.x - mcp5.x;
        const thumbVecY = thumbTip.y - mcp5.y;
        const thumbProj = (thumbVecX * palmVecX + thumbVecY * palmVecY) / palmVecMagSq;

        // S wraps high across knuckles (far from wrist)
        if (getDist2D(thumbTip, wrist) > palmLength2D * 0.85) {
           gesture = 'S';
        }
        // E has the thumb across the palm AND index resting on it
        else if (thumbProj > 0.6 && getDist(landmarks[8], thumbTip) < palmWidth * 0.6) {
           gesture = 'E';
        }
        // T: Thumb tucked between Index and Middle (proj ~0.2)
        else if (thumbProj < 0.4) {
           gesture = 'T';
        }
        // N: Thumb tucked between Middle and Ring (proj ~0.5)
        else if (thumbProj < 0.75) {
           gesture = 'N';
        }
        // M: Thumb tucked between Ring and Pinky (proj ~0.8+)
        else {
           gesture = 'M';
        }
      }
    }
  }

  return [gesture, gesture ? conf : 0];
};
