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

    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;
    let isDisposed = false;

    const connectWs = () => {
      if (isDisposed) return;
      try {
        const wsUrl = getWebSocketUrl();
        const token = localStorage.getItem('cyvantis_token');
        socket = token 
          ? new WebSocket(wsUrl, ['cyvantis.bearer', token])
          : new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setIsConnected(true);
        };

        socket.onmessage = (event) => {
          if (isPausedRef.current) return;

          try {
            const parsed = JSON.parse(event.data);
            if (parsed.type === 'event' && parsed.data) {
              setLiveEvents((prev) => [parsed.data as HoneypotEvent, ...prev.slice(0, 99)]);
            } else if (parsed.eventid) {
              setLiveEvents((prev) => [parsed as HoneypotEvent, ...prev.slice(0, 99)]);
            }
          } catch (err) {
            console.error('Failed to parse WebSocket honeypot event:', err);
          }
        };

        socket.onclose = () => {
          setIsConnected(false);
          if (!isDisposed) {
            reconnectTimeout = setTimeout(connectWs, 3000);
          }
        };

        socket.onerror = () => {
          setIsConnected(false);
          socket?.close();
        };
      } catch (err) {
        setIsConnected(false);
        if (!isDisposed) {
          reconnectTimeout = setTimeout(connectWs, 3000);
        }
      }
    };

    connectWs();

    return () => {
      isDisposed = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket) {
        socket.close();
      }
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
