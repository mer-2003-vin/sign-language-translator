import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  Camera,
  BookOpen,
  Target,
  Volume2,
  VolumeX,
  Trash2,
  ShieldAlert,
  Cpu,
  Sparkles,
} from "lucide-react";
import CameraView from "./components/CameraView";
import PracticeView from "./components/PracticeView";
import DictionaryView from "./components/DictionaryView";

function App() {
  const [activeTab, setActiveTab] = useState("live");

  const [prediction, setPrediction] = useState(null);
  const [confidence, setConfidence] = useState(0);

  const [history, setHistory] = useState([]);
  const [phrase, setPhrase] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const lastLoggedSign = useRef("");
  const consecutiveFrames = useRef(0);



  const handlePrediction = (pred, conf) => {
    setPrediction(pred);
    setConfidence(conf);
    if (!pred || conf < 0.65) {
      consecutiveFrames.current = 0;
      return;
    }
    if (pred === lastLoggedSign.current) {
      consecutiveFrames.current += 1;
      if (consecutiveFrames.current === 15) {
        setHistory((prev) => {
          if (prev.length && prev[prev.length - 1].word === pred) return prev;
          const newItem = {
            word: pred.replace(/_/g, " "),
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            id: Date.now(),
          };
          return [...prev, newItem];
        });
      }
    } else {
      lastLoggedSign.current = pred;
      consecutiveFrames.current = 1;
    }
  };

  const lastHistoryLength = useRef(0);

  useEffect(() => {
    if (history.length === 0) {
      lastHistoryLength.current = 0;
      return;
    }
    
    // Only process if a new sign was successfully added to the history array
    if (history.length > lastHistoryLength.current) {
      const newSign = history[history.length - 1];
      if (!isMuted) speakWord(newSign.word);
      setPhrase((prev) => prev + newSign.word.replace(/_/g, ""));
    }
    lastHistoryLength.current = history.length;
  }, [history]);

  const speakWord = (word) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(word);
      utter.rate = 1.0;
      window.speechSynthesis.speak(utter);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    setPhrase("");
    lastLoggedSign.current = "";
    consecutiveFrames.current = 0;
  };

  const readSentence = () => {
    if (phrase) speakWord(phrase);
  };

  const handlePhraseKeyDown = (e) => {
    const allowedKeys = ["Backspace", " ", "ArrowLeft", "ArrowRight", "Delete"];
    if (!allowedKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="container-fluid py-3">
      {/* Header */}
      <nav className="navbar navbar-dark bg-dark mb-4">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">
            <Cpu className="me-2" /> SIGN<span className="text-info">GLIDE</span>
          </a>
          <span className="navbar-text text-light">Real‑time Sign Language Translation Engine</span>
        </div>
      </nav>

      <div className="mb-3">
      </div>

      <div className="row">
        {/* Camera column */}
        <div className="col-lg-5 mb-4">
          <CameraView onPrediction={handlePrediction} />
          <div className="card mt-3">
            <div className="card-body">
              <h5 className="card-title">Current Recognition</h5>
              <p className="card-text">
                {prediction ? prediction.replace(/_/g, " ") : "Waiting for Hand…"}
                {prediction && (
                  <span className="badge bg-primary ms-2">{Math.round(confidence * 100)}% match</span>
                )}
              </p>
            </div>
          </div>
        </div>
        {/* Tabs column */}
        <div className="col-lg-7">
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button className={`nav-link ${activeTab === "live" ? "active" : ""}`} onClick={() => setActiveTab("live")}>
                <Camera size={16} className="me-1" /> Live Translation
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === "practice" ? "active" : ""}`} onClick={() => setActiveTab("practice")}>
                <Target size={16} className="me-1" /> Practice Lab
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === "dictionary" ? "active" : ""}`} onClick={() => setActiveTab("dictionary")}>
                <BookOpen size={16} className="me-1" /> Dictionary
              </button>
            </li>
          </ul>

          {activeTab === "live" && (
            <div>
              <div className="d-flex justify-content-end mb-2">
                <button className="btn btn-outline-secondary me-2" onClick={() => setIsMuted(!isMuted)} title={isMuted ? "Unmute" : "Mute"}>
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                {history.length > 0 && (
                  <button className="btn btn-danger" onClick={clearHistory} title="Clear Log">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <div className="card mb-3">
                <div className="card-header">Translation Log</div>
                <ul className="list-group list-group-flush" style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {history.length === 0 ? (
                    <li className="list-group-item text-muted">No gestures logged yet.</li>
                  ) : (
                    history.map((item) => (
                      <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                        <span>{item.word}</span>
                        <small className="text-muted">{item.timestamp}</small>
                      </li>
                    ))
                  )}
                </ul>
              </div>
              {history.length > 0 && (
                <div className="card">
                  <div className="card-header">Translated Phrase</div>
                  <div className="card-body">
                    <textarea 
                      className="form-control mb-3 fs-4" 
                      value={phrase} 
                      onKeyDown={handlePhraseKeyDown}
                      onChange={(e) => setPhrase(e.target.value)}
                      rows="2"
                      placeholder="Translation will appear here. Press Backspace to delete or Space to add space."
                      style={{ resize: "none", backgroundColor: "#f8f9fa", border: "1px solid #ced4da" }}
                    />
                    <button className="btn btn-primary" onClick={readSentence}>
                      <Volume2 size={14} className="me-1" /> Speak Phrase
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "practice" && <PracticeView currentPrediction={prediction} confidence={confidence} />}
          {activeTab === "dictionary" && <DictionaryView />}
        </div>
      </div>
    </div>
  );
}

export default App;
