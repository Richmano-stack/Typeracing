'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/websocket/client';
import type { Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@/lib/websocket/events';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export function useWebSocket() {
  const { data: session } = useSession();
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  useEffect(() => {
    // Connect on mount
    const userId = session?.user?.id;
    const socket = connectSocket(userId);

    socketRef.current = socket;

    // Set up event listeners
    socket.on('connect', () => {
      console.log('WebSocket connected');
      setStatus('connected');
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setStatus('disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setStatus('error');
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        disconnectSocket();
        socketRef.current = null;
      }
    };
  }, [session?.user?.id]);

  const emit = useCallback(<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ) => {
    const socket = socketRef.current || getSocket();
    if (socket && socket.connected) {
      (socket.emit as any)(event, ...args);
    } else {
      console.warn('Socket not connected, cannot emit:', event);
    }
  }, []);

  const on = useCallback(<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ) => {
    const socket = socketRef.current || getSocket();
    if (socket) {
      socket.on(event, handler as any);
      return () => {
        socket.off(event, handler as any);
      };
    }
    return () => {};
  }, []);

  const off = useCallback(<K extends keyof ServerToClientEvents>(
    event: K,
    handler?: ServerToClientEvents[K]
  ) => {
    const socket = socketRef.current || getSocket();
    if (socket) {
      if (handler) {
        socket.off(event, handler as any);
      } else {
        socket.off(event);
      }
    }
  }, []);

  return {
    socket: socketRef.current,
    status,
    connected: status === 'connected',
    emit,
    on,
    off,
  };
}

