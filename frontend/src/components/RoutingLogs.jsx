import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, RefreshCw, ChevronRight, Eye } from 'lucide-react';

export default function RoutingLogs() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIntent, setSelectedIntent] = useState('all');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.0);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.ok ? await res.json() : [];
        setLogs(data);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    let result = [...logs];

    // Search term filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        log =>
          (log.user_message && log.user_message.toLowerCase().includes(q)) ||
          (log.final_response && log.final_response.toLowerCase().includes(q))
      );
    }

    // Intent filter
    if (selectedIntent !== 'all') {
      result = result.filter(log => log.intent === selectedIntent);
    }

    // Confidence threshold filter
    result = result.filter(log => (log.confidence ?? 0) >= confidenceThreshold);

    setFilteredLogs(result);
  }, [logs, searchTerm, selectedIntent, confidenceThreshold]);

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="screen-layout animate-fade-in">
      <div className="screen-panel">
        <div className="screen-header">
          <div className="screen-title">
            <h2>Routing Logs</h2>
            <p>Audit trail of all classification decisions and LLM generations</p>
          </div>
          <button onClick={fetchLogs} className="icon-action-btn glass-panel" disabled={isLoading}>
            <RefreshCw size={14} className={isLoading ? 'spinning' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter controls panel */}
        <div className="filters-container glass-panel">
          <div className="filter-group search">
            <Search size={16} className="filter-icon" />
            <input
              type="text"
              placeholder="Search logs message or response..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group select">
            <SlidersHorizontal size={14} className="filter-icon" />
            <select
              value={selectedIntent}
              onChange={(e) => setSelectedIntent(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Intents</option>
              <option value="code">code</option>
              <option value="data">data</option>
              <option value="writing">writing</option>
              <option value="career">career</option>
              <option value="unclear">unclear</option>
            </select>
          </div>

          <div className="filter-group slider">
            <span className="slider-label">Min Confidence: <strong>{(confidenceThreshold * 100).toFixed(0)}%</strong></span>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
              className="filter-slider"
            />
          </div>
        </div>

        {/* Table view */}
        <div className="logs-table-container glass-panel flex-grow">
          {filteredLogs.length === 0 ? (
            <div className="empty-state">
              <p>{isLoading ? 'Loading logs...' : 'No route logs matching filters.'}</p>
            </div>
          ) : (
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Intent</th>
                  <th>Confidence</th>
                  <th>User Message</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => (
                  <tr
                    key={idx}
                    onClick={() => setSelectedLog(log)}
                    className={selectedLog === log ? 'selected-row' : ''}
                  >
                    <td className="time-col">{formatTime(log.timestamp)}</td>
                    <td>
                      <span className={`intent-badge ${log.intent}`}>{log.intent}</span>
                    </td>
                    <td className="confidence-col mono">
                      {((log.confidence ?? 0) * 100).toFixed(0)}%
                    </td>
                    <td className="msg-col">{log.user_message}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="inspect-btn">
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right details inspection panel */}
      <div className="expert-drawer glass-panel">
        <div className="drawer-section">
          <h3>Log Inspector</h3>
          <p className="drawer-subtitle">Routing details & response content</p>
        </div>

        {selectedLog ? (
          <div className="log-detail-view">
            <div className="inspect-header-grid">
              <div>
                <span className="detail-title">Timestamp</span>
                <p className="mono-value">{selectedLog.timestamp}</p>
              </div>
              <div>
                <span className="detail-title">Classification</span>
                <div style={{ marginTop: '4px' }}>
                  <span className={`intent-badge ${selectedLog.intent}`}>{selectedLog.intent}</span>
                  <span className="conf-value mono">{(selectedLog.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            <div className="detail-card">
              <span className="detail-title">User Query</span>
              <p className="query-content">{selectedLog.user_message}</p>
            </div>

            <div className="detail-card flex-grow">
              <span className="detail-title">Expert Response</span>
              <div className="response-content">
                {selectedLog.final_response.split('\n').map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="inspector-empty-state">
            <ChevronRight size={32} className="pulse-icon" />
            <p>Select a log entry from the table to inspect details.</p>
          </div>
        )}
      </div>
    </div>
  );
}
