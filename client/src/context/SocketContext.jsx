import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { createDemoPriceTicker, isDemoApiEnabled } from '../api/demoApi';

const SocketContext = createContext(null);

function createDemoSocket() {
  const listeners = new Map();
  return {
    on(event, handler) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(handler);
    },
    off(event, handler) {
      listeners.get(event)?.delete(handler);
    },
    emitLocal(event, payload) {
      listeners.get(event)?.forEach((handler) => handler(payload));
    },
    disconnect() {
      listeners.clear();
    },
  };
}

export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const demoSocketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      demoSocketRef.current = null;
      setSocket(null);
      setConnected(false);
      return undefined;
    }

    if (isDemoApiEnabled()) {
      const demoSocket = createDemoSocket();
      demoSocketRef.current = demoSocket;
      setSocket(demoSocket);
      setConnected(true);

      const stop = createDemoPriceTicker((quote) => {
        demoSocket.emitLocal('price:update', quote);
      });

      return () => {
        stop();
        demoSocket.disconnect();
        demoSocketRef.current = null;
        setSocket(null);
        setConnected(false);
      };
    }

    const url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const instance = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    instance.on('connect', onConnect);
    instance.on('disconnect', onDisconnect);
    setSocket(instance);

    return () => {
      instance.off('connect', onConnect);
      instance.off('disconnect', onDisconnect);
      instance.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [isAuthenticated]);

  const value = useMemo(() => ({ socket, connected }), [socket, connected]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return ctx;
}
