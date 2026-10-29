import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { HoneypotEvent } from '../types';
import { getWebSocketUrl } from '../services/api';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
  liveEvents: HoneypotEvent[];
  isConnected: boolean;
  isPaused: boolean;
  togglePause: () => void;
  clearLiveEvents: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [liveEvents, setLiveEvents] = useState<HoneypotEvent[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  useEffect(() => {
    if (!isAuthenticated) return;

    const wsUrl = getWebSocketUrl();
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      if (isPausedRef.current) return;

      try {
        const newEvent: HoneypotEvent = JSON.parse(event.data);
        setLiveEvents((prev) => [newEvent, ...prev.slice(0, 99)]);
      } catch (err) {
        console.error('Failed to parse WebSocket honeypot event:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [isAuthenticated]);

  const togglePause = () => setIsPaused((prev) => !prev);
  const clearLiveEvents = () => setLiveEvents([]);

  return (
    <WebSocketContext.Provider
      value={{
        liveEvents,
        isConnected,
        isPaused,
        togglePause,
        clearLiveEvents
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
