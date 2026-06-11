import React, { useState, useEffect } from 'react';
import { Target, ArrowRight } from 'lucide-react';

const CLASSES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

const PracticeView = ({ currentPrediction, confidence }) => {
  const [targetSign, setTargetSign] = useState('A');
  const [matchProgress, setMatchProgress] = useState(0);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [history, setHistory] = useState([]);

  // Detect match and handle completion
  useEffect(() => {
    if (isCompleted) return;
    const isMatch = currentPrediction === targetSign && confidence > 0.75;
    if (isMatch) {
      // Immediate completion
      setIsCompleted(true);
      setScore((s) => s + 100);
      setStreak((st) => st + 1);
      // Add to history (most recent first, limit to 5 entries)
      setHistory((prev) => {
        const newEntry = {
          sign: targetSign,
          timestamp: new Date().toLocaleTimeString(),
          id: Date.now(),
        };
        return [newEntry, ...prev].slice(0, 5);
      });
      triggerSpeech(`Correct! You signed ${targetSign.replace(/_/g, ' ')}`);
      setMatchProgress(100);
    } else {
      // Update progress gradually
      setMatchProgress((prev) => Math.max(0, prev - 8));
    }
  }, [currentPrediction, confidence, targetSign, isCompleted]);

  const triggerSpeech = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.1;
      window.speechSynthesis.speak(utter);
    }
  };

  const nextSign = () => {
    const nextIdx = (CLASSES.indexOf(targetSign) + 1) % CLASSES.length;
    setTargetSign(CLASSES[nextIdx]);
    setMatchProgress(0);
    setIsCompleted(false);
  };

  const skipSign = () => {
    setStreak(0);
    nextSign();
  };

  const resetPractice = () => {
    setScore(0);
    setStreak(0);
    setMatchProgress(0);
    setIsCompleted(false);
    setHistory([]);
  };

  return (
    <div className="container py-3">
      <div className="card mx-auto" style={{ maxWidth: '800px' }}>
        <div className="card-header d-flex align-items-center bg-primary text-white">
          <Target size={18} className="me-2" />
          <h5 className="mb-0">Practice Mode</h5>
        </div>
        <div className="card-body">
          <div className="mb-4 text-center">
            <h6 className="text-muted">Target Sign</h6>
            <h2 className="display-4">{targetSign.replace(/_/g, ' ')}</h2>
          </div>

          <div className="mb-3">
            <div className="d-flex justify-content-between">
              <span className="fw-bold">Progress</span>
              <span>{Math.round(matchProgress)}%</span>
            </div>
            <div className="progress" style={{ height: '1.5rem' }}>
              <div
                className={`progress-bar ${isCompleted ? 'bg-success' : 'bg-info'}`}
                role="progressbar"
                style={{ width: `${matchProgress}%` }}
                aria-valuenow={matchProgress}
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>
          </div>

          <div className="mb-3 d-flex justify-content-between align-items-center">
            <span className="fw-bold">Score</span>
            <span>{score}</span>
          </div>
          <div className="mb-3 d-flex justify-content-between align-items-center">
            <span className="fw-bold">Streak</span>
            <span>{streak}</span>
          </div>

          <div className="d-flex justify-content-end gap-2">
            {isCompleted ? (
              <button className="btn btn-success" onClick={nextSign}>
                Next Sign <ArrowRight size={16} className="ms-1" />
              </button>
            ) : (
              <>
                <button className="btn btn-warning" onClick={skipSign}>Skip</button>
                <button className="btn btn-danger" onClick={resetPractice}>Reset</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* History */}
      <div className="mt-4 mx-auto" style={{ maxWidth: '800px' }}>
        <h5>Session Log</h5>
        {history.length === 0 ? (
          <p className="text-muted">No signs completed yet.</p>
        ) : (
          <ul className="list-group">
            {history.map((item) => (
              <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                <span>{item.sign.replace('_', ' ')}</span>
                <small className="text-muted">{item.timestamp}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PracticeView;
