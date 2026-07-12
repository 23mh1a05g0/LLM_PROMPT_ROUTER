import React, { useState, useEffect } from 'react';
import { MessageSquare, ListCollapse, PlaySquare, Compass } from 'lucide-react';
import ChatSimulator from './components/ChatSimulator';
import RoutingLogs from './components/RoutingLogs';
import TestSuiteRunner from './components/TestSuiteRunner';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [isApiOnline, setIsApiOnline] = useState(true);

  useEffect(() => {
    // Check backend API health
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/test-messages');
        setIsApiOnline(res.ok);
      } catch {
        setIsApiOnline(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      {/* Background Animated Neon Glows */}
      <div className="bg-glows">
        <div className="bg-glow-1" />
        <div className="bg-glow-2" />
      </div>

      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand-section">
          <div className="brand-icon">
            <Compass className="brand-logo-img" />
          </div>
          <div className="brand-info">
            <h1>Prompt Router</h1>
            <span>OBSIDIAN v1.0.0</span>
          </div>
        </div>

        <nav className="nav-links">
          <button
            onClick={() => setActiveTab('chat')}
            className={`nav-button ${activeTab === 'chat' ? 'active' : ''}`}
          >
            <MessageSquare className="nav-icon" />
            <span>Chat Simulator</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`nav-button ${activeTab === 'logs' ? 'active' : ''}`}
          >
            <ListCollapse className="nav-icon" />
            <span>Routing Logs</span>
          </button>
          <button
            onClick={() => setActiveTab('suite')}
            className={`nav-button ${activeTab === 'suite' ? 'active' : ''}`}
          >
            <PlaySquare className="nav-icon" />
            <span>Test Suite Runner</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="api-status">
            <span className={`status-dot ${isApiOnline ? '' : 'offline'}`} />
            <span>System API: {isApiOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
        </div>
      </aside>

      {/* Main Workspace Panel */}
      <main className="main-content">
        {activeTab === 'chat' && <ChatSimulator />}
        {activeTab === 'logs' && <RoutingLogs />}
        {activeTab === 'suite' && <TestSuiteRunner />}
      </main>
    </div>
  );
}
