import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, AlertTriangle, CheckCircle, XCircle, Cpu, Clock, Award } from 'lucide-react';

const EXPECTED_INTENTS = {
  "how do i sort a list of objects in python?": "code",
  "explain this sql query for me": "code",
  "fxi thsi bug pls: for i in range(10) print(i)": "code",
  "I need to write a function that takes a user id and returns their profile.": "code",
  "what's the average of these numbers: 12, 45, 23, 67, 34": "data",
  "what is a pivot table": "data",
  "This paragraph sounds awkward, can you help me fix it?": "writing",
  "Rewrite this sentence to be more professional.": "writing",
  "My boss says my writing is too verbose.": "writing",
  "I'm preparing for a job interview, any tips?": "career",
  "How do I structure a cover letter?": "career",
  "I'm not sure what to do with my career.": "career",
  "Help me make this better.": "unclear",
  "hey": "unclear",
  "Can you write me a poem about clouds?": "unclear",
  "I need to write a function that takes a user id and returns their profile, but also i need help with my resume.": "code"
};

export default function TestSuiteRunner() {
  const [testQuestions, setTestQuestions] = useState([]);
  const [results, setResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [stats, setStats] = useState({
    accuracy: 0,
    avgConfidence: 0,
    totalLatency: 0,
    completedCount: 0,
  });

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch('/api/test-messages');
        if (res.ok) {
          const data = await res.json();
          setTestQuestions(data);
        }
      } catch (err) {
        console.error('Error fetching test questions:', err);
      }
    };
    fetchQuestions();
  }, []);

  const runSingleTest = async (index) => {
    const question = testQuestions[index];
    const expected = EXPECTED_INTENTS[question] || 'unclear';
    
    setCurrentIndex(index);
    setResults(prev => ({
      ...prev,
      [index]: { status: 'running', expected }
    }));

    const startTime = performance.now();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question })
      });

      const latency = Math.round(performance.now() - startTime);

      if (!response.ok) {
        throw new Error('API Error');
      }

      const data = await response.json();
      const isMatch = data.intent === expected;

      setResults(prev => ({
        ...prev,
        [index]: {
          status: 'done',
          expected,
          actual: data.intent,
          confidence: data.confidence,
          latency,
          isMatch
        }
      }));

      // Update statistics
      setStats(prev => {
        const nextCompleted = prev.completedCount + 1;
        
        // Calculate new match count using current test results
        const prevResults = Object.values(results);
        const prevMatches = prevResults.filter(r => r.status === 'done' && r.isMatch).length;
        const matches = prevMatches + (isMatch ? 1 : 0);
        const newAccuracy = (matches / nextCompleted) * 100;

        // Calculate average confidence
        const prevConfidenceSum = prevResults.filter(r => r.status === 'done').reduce((acc, r) => acc + (r.confidence || 0), 0);
        const totalConf = prevConfidenceSum + data.confidence;
        const newAvgConf = (totalConf / nextCompleted) * 100;

        return {
          completedCount: nextCompleted,
          accuracy: newAccuracy,
          avgConfidence: newAvgConf,
          totalLatency: prev.totalLatency + latency
        };
      });

    } catch (err) {
      setResults(prev => ({
        ...prev,
        [index]: {
          status: 'error',
          expected,
          errorMsg: err.message
        }
      }));
      setStats(prev => ({
        ...prev,
        completedCount: prev.completedCount + 1
      }));
    }
  };

  const handleStart = () => {
    if (testQuestions.length === 0) return;
    
    // If starting fresh
    if (currentIndex === -1 || currentIndex === testQuestions.length - 1) {
      setResults({});
      setStats({
        accuracy: 0,
        avgConfidence: 0,
        totalLatency: 0,
        completedCount: 0,
      });
      setCurrentIndex(-1);
    }
    
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setCurrentIndex(-1);
    setResults({});
    setStats({
      accuracy: 0,
      avgConfidence: 0,
      totalLatency: 0,
      completedCount: 0,
    });
  };

  useEffect(() => {
    if (!isRunning || testQuestions.length === 0) return;

    // Check if any test is currently running
    const isAnyTestRunning = Object.values(results).some(res => res.status === 'running');
    if (isAnyTestRunning) return;

    // Find the next index that needs to be run
    const nextIndex = testQuestions.findIndex((_, idx) => {
      const res = results[idx];
      return !res || (res.status !== 'done' && res.status !== 'error');
    });

    if (nextIndex === -1) {
      setIsRunning(false);
      return;
    }

    runSingleTest(nextIndex);
  }, [isRunning, results, testQuestions]);


  const progressPercent = testQuestions.length
    ? Math.round((stats.completedCount / testQuestions.length) * 100)
    : 0;

  return (
    <div className="screen-layout test-suite animate-fade-in">
      <div className="screen-panel">
        <div className="screen-header">
          <div className="screen-title">
            <h2>Test Suite Runner</h2>
            <p>Perform batch regression testing against all predefined classification scenarios</p>
          </div>
          <div className="run-controls">
            {!isRunning ? (
              <button onClick={handleStart} className="run-btn primary-glow" disabled={testQuestions.length === 0}>
                <Play size={14} fill="white" />
                <span>{currentIndex > 0 && currentIndex < testQuestions.length - 1 ? 'Resume' : 'Run Suite'}</span>
              </button>
            ) : (
              <button onClick={handleStop} className="run-btn stop">
                <span className="stop-icon" />
                <span>Pause</span>
              </button>
            )}
            <button onClick={handleReset} className="icon-action-btn glass-panel">
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-section glass-panel">
          <div className="progress-header">
            <span>Test Suite Progress</span>
            <span className="mono">{stats.completedCount} / {testQuestions.length} Completed</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Test Cases Grid */}
        <div className="test-grid flex-grow">
          <div className="test-cards-scroller">
            {testQuestions.map((question, index) => {
              const res = results[index];
              const expected = EXPECTED_INTENTS[question] || 'unclear';
              return (
                <div
                  key={index}
                  className={`test-card glass-panel ${
                    currentIndex === index ? 'active-test' : ''
                  } ${res?.status === 'done' ? (res.isMatch ? 'success' : 'failure') : ''}`}
                >
                  <div className="card-top">
                    <span className="test-number">Test #{index + 1}</span>
                    {res?.status === 'running' && <span className="status-spinner" />}
                    {res?.status === 'done' && (
                      res.isMatch ? (
                        <span className="status-icon-text green"><CheckCircle size={14} /> Match</span>
                      ) : (
                        <span className="status-icon-text red"><XCircle size={14} /> Mismatch</span>
                      )
                    )}
                    {res?.status === 'error' && (
                      <span className="status-icon-text yellow"><AlertTriangle size={14} /> Error</span>
                    )}
                  </div>
                  <p className="test-question">{question}</p>
                  <div className="expected-actual-row">
                    <div>
                      <span className="label">Expected</span>
                      <span className={`intent-badge ${expected}`}>{expected}</span>
                    </div>
                    {res?.status === 'done' && (
                      <div>
                        <span className="label">Actual</span>
                        <span className={`intent-badge ${res.actual}`}>{res.actual}</span>
                      </div>
                    )}
                  </div>
                  {res?.status === 'done' && (
                    <div className="card-metrics-footer">
                      <span>Conf: <strong>{(res.confidence * 100).toFixed(0)}%</strong></span>
                      <span>Latency: <strong>{res.latency}ms</strong></span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right side metrics drawer */}
      <div className="expert-drawer glass-panel">
        <div className="drawer-section">
          <h3>Suite Performance</h3>
          <p className="drawer-subtitle">Aggregated batch test results</p>
        </div>

        <div className="suite-metrics-container">
          <div className="metric-box">
            <Award className="metric-icon purple" size={24} />
            <div>
              <span className="metric-title">Accuracy Rate</span>
              <h3>{stats.accuracy.toFixed(1)}%</h3>
              <p className="metric-desc">Matched vs total runs</p>
            </div>
          </div>

          <div className="metric-box">
            <Cpu className="metric-icon blue" size={24} />
            <div>
              <span className="metric-title">Avg Confidence</span>
              <h3>{stats.avgConfidence.toFixed(1)}%</h3>
              <p className="metric-desc">Mean classification score</p>
            </div>
          </div>

          <div className="metric-box">
            <Clock className="metric-icon orange" size={24} />
            <div>
              <span className="metric-title">Total Runtime</span>
              <h3>{(stats.totalLatency / 1000).toFixed(2)}s</h3>
              <p className="metric-desc">Cumulative response latency</p>
            </div>
          </div>
        </div>

        <div className="drawer-footer">
          <p>Total cases: {testQuestions.length}</p>
          <p>Target model: llama-3.1-8b-instant</p>
        </div>
      </div>
    </div>
  );
}
