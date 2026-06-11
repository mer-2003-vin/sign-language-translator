import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BookOpen, Info } from 'lucide-react';

const CLASSES_METADATA = {
  'A': { name: 'Letter A', type: 'Alphabet', desc: 'Fist with the thumb resting against the outer side of the index finger.', tips: 'Keep fingers tightly curled, thumb upright against the side.' },
  'B': { name: 'Letter B', type: 'Alphabet', desc: 'Flat hand with all four fingers extended together and thumb folded across the palm.', tips: 'Keep fingers straight, touch thumb to palm base.' },
  'C': { name: 'Letter C', type: 'Alphabet', desc: 'Curved hand forming a "C" shape, thumb and fingers curved towards each other.', tips: 'Curve both fingers and thumb, view from the side for maximum shape clarity.' },
  'D': { name: 'Letter D', type: 'Alphabet', desc: 'Index finger points straight up; thumb, middle, ring, and pinky fingers touch at tips forming a loop.', tips: 'Ensure only the index finger is fully upright.' },
  'E': { name: 'Letter E', type: 'Alphabet', desc: 'Fingers curled tight against palm, thumb tucked against the index finger.', tips: 'Make a tight claw with all fingers.' },
  'F': { name: 'Letter F', type: 'Alphabet', desc: 'Tips of thumb and index finger touch, remaining three fingers extended and spread.', tips: 'Like the "OK" sign. Keep the middle, ring, and pinky separated and straight.' },
  'G': { name: 'Letter G', type: 'Alphabet', desc: 'Index and thumb extended horizontally parallel to each other, like holding a small object.', tips: 'Point sideways, keep thumb and index parallel.' },
  'H': { name: 'Letter H', type: 'Alphabet', desc: 'Index and middle fingers extended together horizontally, thumb tucked.', tips: 'Like the letter U, but pointing sideways.' },
  'I': { name: 'Letter I', type: 'Alphabet', desc: 'Pinky finger extended straight up, other fingers curled into fist, thumb folded over.', tips: 'Ensure only the pinky points up, other fingers flat.' },
  'J': { name: 'Letter J', type: 'Alphabet', desc: 'Pinky finger extended and traces a "J" shape in the air.', tips: 'Start with I, then scoop down and up like a fishhook.' },
  'K': { name: 'Letter K', type: 'Alphabet', desc: 'Index and middle fingers extended in a V shape, thumb resting against middle finger.', tips: 'Like a V, but push your thumb up between index and middle.' },
  'L': { name: 'Letter L', type: 'Alphabet', desc: 'Index finger pointing straight up, thumb pointing straight out to the side forming an "L".', tips: 'Keep index and thumb at a sharp 90-degree angle.' },
  'M': { name: 'Letter M', type: 'Alphabet', desc: 'Fist closed, thumb tucked under the first three fingers.', tips: 'Tuck thumb all the way across to your ring finger.' },
  'N': { name: 'Letter N', type: 'Alphabet', desc: 'Fist closed, thumb tucked under the first two fingers.', tips: 'Tuck thumb between middle and ring fingers.' },
  'O': { name: 'Letter O', type: 'Alphabet', desc: 'Fingers curved inward, tips touching thumb tip to form an "O".', tips: 'Make a complete circle with all fingers touching the thumb.' },
  'P': { name: 'Letter P', type: 'Alphabet', desc: 'Like K, but pointing downwards.', tips: 'Drop your wrist so the V-shape points down.' },
  'Q': { name: 'Letter Q', type: 'Alphabet', desc: 'Like G, but pointing downwards.', tips: 'Drop your wrist so index and thumb point down.' },
  'R': { name: 'Letter R', type: 'Alphabet', desc: 'Index and middle fingers extended and crossed, thumb tucked.', tips: 'Cross middle finger over index finger tightly.' },
  'S': { name: 'Letter S', type: 'Alphabet', desc: 'Fist closed tightly with thumb resting across the front of the fingers.', tips: 'Wrap thumb over the front of the fist, not the side.' },
  'T': { name: 'Letter T', type: 'Alphabet', desc: 'Fist closed, thumb tucked under the index finger only.', tips: 'Push thumb up between index and middle fingers.' },
  'U': { name: 'Letter U', type: 'Alphabet', desc: 'Index and middle fingers extended and pressed tightly together, thumb tucked.', tips: 'Keep fingers tight together pointing straight up.' },
  'V': { name: 'Letter V', type: 'Alphabet', desc: 'Index and middle fingers extended and spread apart in a "V" shape, others curled.', tips: 'Keep index and middle fingers straight and spread wide.' },
  'W': { name: 'Letter W', type: 'Alphabet', desc: 'Index, middle, and ring fingers extended and spread, thumb and pinky touch.', tips: 'Form a "W" shape with three fingers upright.' },
  'X': { name: 'Letter X', type: 'Alphabet', desc: 'Index finger hooked like a hook, thumb tucked.', tips: 'Bend the index finger tightly halfway down.' },
  'Y': { name: 'Letter Y', type: 'Alphabet', desc: 'Thumb and pinky finger fully extended, middle three fingers curled into the palm.', tips: 'Spread the thumb and pinky as far apart as comfortable.' },
  'Z': { name: 'Letter Z', type: 'Alphabet', desc: 'Index finger extended, tracing a "Z" in the air.', tips: 'Draw a zigzag with your pointer finger.' }
};

// Hand landmarks generator helper for visualization
function getTemplateLandmarks(signName) {
  const landmarks = Array(21).fill(0).map(() => [0, 0, 0]);
  landmarks[0] = [0.0, 0.5, 0.0];      // Wrist base adjusted for center
  landmarks[1] = [-0.15, 0.4, 0.0];   // Thumb MCP
  landmarks[5] = [-0.08, 0.2, 0.0];   // Index MCP
  landmarks[9] = [-0.02, 0.18, 0.0];   // Middle MCP
  landmarks[13] = [0.03, 0.19, 0.0];   // Ring MCP
  landmarks[17] = [0.08, 0.22, 0.0];   // Pinky MCP

  function extendFinger(mcpIdx) {
    const offsetX = (mcpIdx - 9) * 0.005;
    landmarks[mcpIdx + 1] = [landmarks[mcpIdx][0] + offsetX, landmarks[mcpIdx][1] - 0.08, -0.01];
    landmarks[mcpIdx + 2] = [landmarks[mcpIdx + 1][0] + offsetX, landmarks[mcpIdx + 1][1] - 0.07, -0.02];
    landmarks[mcpIdx + 3] = [landmarks[mcpIdx + 2][0] + offsetX, landmarks[mcpIdx + 2][1] - 0.06, -0.03];
  }

  function foldFinger(mcpIdx) {
    landmarks[mcpIdx + 1] = [landmarks[mcpIdx][0], landmarks[mcpIdx][1] + 0.04, 0.04];
    landmarks[mcpIdx + 2] = [landmarks[mcpIdx][0], landmarks[mcpIdx][1] + 0.06, 0.06];
    landmarks[mcpIdx + 3] = [landmarks[mcpIdx][0], landmarks[mcpIdx][1] + 0.04, 0.05];
  }

  if (signName === 'A') {
    [5, 9, 13, 17].forEach(foldFinger);
    landmarks[2] = [-0.20, 0.35, 0.02];
    landmarks[3] = [-0.22, 0.28, 0.01];
    landmarks[4] = [-0.20, 0.24, -0.01];
  } else if (signName === 'B') {
    [5, 9, 13, 17].forEach(extendFinger);
    landmarks[2] = [-0.08, 0.38, 0.02];
    landmarks[3] = [-0.04, 0.34, 0.03];
    landmarks[4] = [-0.02, 0.31, 0.03];
  } else if (signName === 'C') {
    [5, 9, 13, 17].forEach(idx => {
      landmarks[idx + 1] = [landmarks[idx][0] - 0.03, landmarks[idx][1] - 0.06, 0.05];
      landmarks[idx + 2] = [landmarks[idx][0] - 0.08, landmarks[idx][1] - 0.08, 0.08];
      landmarks[idx + 3] = [landmarks[idx][0] - 0.12, landmarks[idx][1] - 0.06, 0.06];
    });
    landmarks[2] = [-0.18, 0.38, 0.03];
    landmarks[3] = [-0.16, 0.32, 0.05];
    landmarks[4] = [-0.10, 0.28, 0.04];
  } else if (signName === 'D') {
    extendFinger(5);
    [9, 13, 17].forEach(foldFinger);
    landmarks[2] = [-0.10, 0.38, 0.02];
    landmarks[3] = [-0.05, 0.35, 0.02];
    landmarks[4] = [-0.02, 0.34, 0.01];
  } else if (signName === 'L') {
    extendFinger(5);
    [9, 13, 17].forEach(foldFinger);
    landmarks[2] = [-0.22, 0.38, 0.0];
    landmarks[3] = [-0.28, 0.36, -0.01];
    landmarks[4] = [-0.32, 0.36, -0.02];
  } else if (signName === 'Y') {
    extendFinger(17);
    [5, 9, 13].forEach(foldFinger);
    landmarks[2] = [-0.22, 0.38, 0.0];
    landmarks[3] = [-0.28, 0.36, -0.01];
    landmarks[4] = [-0.32, 0.36, -0.02];
  } else if (signName === 'I') {
    extendFinger(17);
    [5, 9, 13].forEach(foldFinger);
    landmarks[2] = [-0.10, 0.38, 0.02];
    landmarks[3] = [-0.08, 0.36, 0.03];
    landmarks[4] = [-0.06, 0.35, 0.03];
  } else if (signName === 'V') {
    extendFinger(5);
    extendFinger(9);
    landmarks[8][0] -= 0.03;
    landmarks[12][0] += 0.03;
    [13, 17].forEach(foldFinger);
    landmarks[2] = [-0.10, 0.38, 0.02];
    landmarks[3] = [-0.08, 0.36, 0.03];
    landmarks[4] = [-0.06, 0.35, 0.03];
  } else if (signName === 'W') {
    [5, 9, 13].forEach(extendFinger);
    foldFinger(17);
    landmarks[2] = [-0.10, 0.38, 0.02];
    landmarks[3] = [-0.08, 0.36, 0.03];
    landmarks[4] = [-0.06, 0.35, 0.03];
  } else if (signName === 'F') {
    [9, 13, 17].forEach(extendFinger);
    landmarks[2] = [-0.12, 0.38, 0.02];
    landmarks[3] = [-0.09, 0.33, 0.03];
    landmarks[4] = [-0.06, 0.30, 0.03];
    landmarks[6] = [-0.08, 0.32, 0.02];
    landmarks[7] = [-0.07, 0.30, 0.03];
    landmarks[8] = [-0.06, 0.30, 0.03];
  } else if (signName === 'I_Love_You') {
    extendFinger(5);
    extendFinger(17);
    foldFinger(9);
    foldFinger(13);
    landmarks[2] = [-0.22, 0.38, 0.0];
    landmarks[3] = [-0.28, 0.36, -0.01];
    landmarks[4] = [-0.32, 0.36, -0.02];
  } else if (signName === 'Hello') {
    [5, 9, 13, 17].forEach(extendFinger);
    for (let i = 0; i < 21; i++) {
      landmarks[i][0] += (landmarks[i][1] - 0.5) * 0.25;
    }
    landmarks[2] = [-0.14, 0.38, 0.0];
    landmarks[3] = [-0.18, 0.34, 0.0];
    landmarks[4] = [-0.20, 0.32, 0.0];
  } else if (signName === 'Thank_You') {
    [5, 9, 13, 17].forEach(idx => {
      landmarks[idx + 1] = [landmarks[idx][0], landmarks[idx][1] - 0.07, 0.01];
      landmarks[idx + 2] = [landmarks[idx][0], landmarks[idx][1] - 0.13, 0.03];
      landmarks[idx + 3] = [landmarks[idx][0], landmarks[idx][1] - 0.17, 0.05];
    });
    landmarks[2] = [-0.10, 0.38, 0.02];
    landmarks[3] = [-0.08, 0.35, 0.03];
    landmarks[4] = [-0.06, 0.33, 0.03];
  } else if (signName === 'Yes') {
    [5, 9, 13, 17].forEach(foldFinger);
    landmarks[2] = [-0.08, 0.38, 0.03];
    landmarks[3] = [-0.04, 0.36, 0.04];
    landmarks[4] = [-0.02, 0.36, 0.03];
  } else if (signName === 'No') {
    [13, 17].forEach(foldFinger);
    [5, 9].forEach(idx => {
      landmarks[idx + 1] = [landmarks[idx][0], landmarks[idx][1] - 0.05, 0.04];
      landmarks[idx + 2] = [landmarks[idx][0], landmarks[idx][1] - 0.08, 0.06];
      landmarks[idx + 3] = [landmarks[idx][0], landmarks[idx][1] - 0.10, 0.05];
    });
    landmarks[2] = [-0.08, 0.38, 0.02];
    landmarks[3] = [-0.04, 0.36, 0.03];
    landmarks[4] = [-0.03, 0.35, 0.03];
  }

  // Translate Y to center the hand in visual box (0.5 becomes 0.0 relative to canvas center)
  // Let's normalize around centroid
  let sumX = 0, sumY = 0, sumZ = 0;
  landmarks.forEach(pt => {
    sumX += pt[0];
    sumY += pt[1];
    sumZ += pt[2];
  });
  const avgX = sumX / 21;
  const avgY = sumY / 21;
  const avgZ = sumZ / 21;

  return landmarks.map(pt => [pt[0] - avgX, pt[1] - avgY, pt[2] - avgZ]);
}

const DictionaryView = () => {
  const [selectedSign, setSelectedSign] = useState('A');

  // Mapping of sign names to asset files
  const SIGN_IMAGES = {
    A: '/assets/signs/sign_a_1781067394061.png',
    B: '/assets/signs/sign_b_1781067413910.png',
    C: '/assets/signs/sign_c_1781067446682.png',
    D: '/assets/signs/sign_d_1781067654456.png',
    E: '/assets/signs/sign_e.png',
    F: '/assets/signs/sign_f_1781067724172.png',
    G: '/assets/signs/sign_g.png',
    H: '/assets/signs/sign_h.png',
    I: '/assets/signs/sign_i.svg',
    J: '/assets/signs/sign_j.png',
    K: '/assets/signs/sign_k.png',
    L: '/assets/signs/sign_l.svg',
    M: '/assets/signs/sign_m.png',
    N: '/assets/signs/sign_n.png',
    O: '/assets/signs/sign_o.png',
    P: '/assets/signs/sign_p.png',
    Q: '/assets/signs/sign_q.png',
    R: '/assets/signs/sign_r.png',
    S: '/assets/signs/sign_s.png',
    T: '/assets/signs/sign_t.png',
    U: '/assets/signs/sign_u.png',
    V: '/assets/signs/sign_v.svg',
    W: '/assets/signs/sign_w.svg',
    X: '/assets/signs/sign_x.png',
    Y: '/assets/signs/sign_y.svg',
    Z: '/assets/signs/sign_z.png'
  };

  // Helper to get image URL for a sign
  const getImageUrl = (sign) => SIGN_IMAGES[sign];

  const metadata = CLASSES_METADATA[selectedSign];

  return (
    <div className="container-fluid py-4">
      <div className="row">
        {/* Sidebar with sign list */}
        <div className="col-md-3 border-end">
          <h4 className="d-flex align-items-center mb-3">
            <BookOpen size={20} className="me-2" /> Sign Glossary
          </h4>
          <div className="list-group overflow-auto" style={{ maxHeight: '70vh' }}>
            {Object.keys(CLASSES_METADATA).map((key) => {
              const active = selectedSign === key;
              return (
                <button
                  key={key}
                  type="button"
                  className={`list-group-item list-group-item-action ${active ? 'active' : ''}`}
                  onClick={() => setSelectedSign(key)}
                >
                  <strong>{key.replace(/_/g, ' ')}</strong>
                  <span className="badge bg-secondary ms-2">{CLASSES_METADATA[key].type}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <div className="col-md-9">
          <div className="mb-4">
            <h3>{metadata.name}</h3>
            <span className="badge bg-info text-dark me-2">{metadata.type}</span>
          </div>
          <div className="row g-4">
            <div className="col-lg-6">
              <img
                src={getImageUrl(selectedSign)}
                alt={`${metadata.name} sign`}
                className="img-fluid rounded shadow"
                style={{
                  maxHeight: '320px',
                  objectFit: 'contain',
                  filter: (selectedSign === 'D' || selectedSign === 'F') ? 'grayscale(100%)' : 'none'
                }}
              />
            </div>
            <div className="col-lg-6">
              <div className="card mb-3">
                <div className="card-header d-flex align-items-center">
                  <Info size={18} className="me-2" /> Description
                </div>
                <div className="card-body">
                  <p className="card-text">{metadata.desc}</p>
                </div>
              </div>
              <div className="card">
                <div className="card-header d-flex align-items-center bg-primary text-white">
                  <Info size={18} className="me-2" /> Execution Tips
                </div>
                <div className="card-body">
                  <p className="card-text">{metadata.tips}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DictionaryView;
