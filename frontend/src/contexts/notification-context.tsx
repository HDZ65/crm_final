"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/auth';
import { useOrganisation } from '@/contexts/organisation-context';
import { api } from '@/lib/api';
import type { Notification, NotificationCount, NotificationEvents } from '@/types/notification';

// Use same base URL as API for WebSocket connection
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
  isLoading: boolean;
  isConnected: boolean;
  error: Error | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { ready, isAuthenticated, token } = useAuth();
  const { user, activeOrganisation } = useOrganisation();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const hasFetched = useRef(false);

  // Récupérer les notifications initiales via REST API
  const fetchNotifications = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const [notifs, count] = await Promise.all([
        api.get<Notification[]>('/notifications/me'),
        api.get<NotificationCount>('/notifications/me/count'),
      ]);

      setNotifications(notifs);
      setUnreadCount(count.unread);
      setTotalCount(count.total);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors du chargement des notifications'));
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Connexion WebSocket
  useEffect(() => {
    if (!ready || !isAuthenticated || !token || !user?.id || !activeOrganisation?.id) {
      return;
    }

    // Éviter les reconnexions multiples
    if (socketRef.current?.connected) {
      return;
    }

    const socket = io(`${WS_URL}/notifications`, {
      transports: ['websocket'],
      autoConnect: true,
      reconnectionAttempts: 3, // Limit reconnection attempts
      reconnectionDelay: 5000, // Wait 5s between attempts
      timeout: 10000, // Connection timeout
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);

      // S'authentifier après connexion
      socket.emit('authenticate', {
        userId: user.id,
        organisationId: activeOrganisation.id,
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      setIsConnected(false);
      // Don't set error state in dev to avoid noisy UI when backend is not running
      if (process.env.NODE_ENV !== 'development') {
        setError(new Error(`Erreur de connexion WebSocket: ${err.message}`));
      } else {
        // Log at debug level to reduce noise in dev
        console.debug('[WebSocket] Connection error (backend may not be running):', err.message);
      }
    });

    // Événements de notification
    socket.on('notification:new', (notification: NotificationEvents['notification:new']) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      setTotalCount((prev) => prev + 1);
    });

    socket.on('notification:read', ({ id }: NotificationEvents['notification:read']) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lue: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });

    socket.on('notification:all-read', () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, lue: true })));
      setUnreadCount(0);
    });

    socket.on('notification:deleted', ({ id }: NotificationEvents['notification:deleted']) => {
      setNotifications((prev) => {
        const notif = prev.find((n) => n.id === id);
        if (notif && !notif.lue) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
      setTotalCount((prev) => Math.max(0, prev - 1));
    });

    // Événements métier (optionnels pour affichage spécial)
    socket.on('client:new', (data: NotificationEvents['client:new']) => {
      console.log('Nouveau client:', data);
    });

    socket.on('contrat:new', (data: NotificationEvents['contrat:new']) => {
      console.log('Nouveau contrat:', data);
    });

    socket.on('contrat:expiring-soon', (data: NotificationEvents['contrat:expiring-soon']) => {
      console.log('Contrat expire bientôt:', data);
    });

    socket.on('client:impaye', (data: NotificationEvents['client:impaye']) => {
      console.log('Client impayé:', data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [ready, isAuthenticated, token, user?.id, activeOrganisation?.id]);

  // Fetch initial des notifications
  useEffect(() => {
    if (ready && isAuthenticated && token && !hasFetched.current) {
      hasFetched.current = true;
      fetchNotifications();
    }

    if (ready && !isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setTotalCount(0);
      setIsLoading(false);
      hasFetched.current = false;
    }
  }, [ready, isAuthenticated, token, fetchNotifications]);

  // Actions
  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lue: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Erreur lors du marquage comme lu:', err);
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/notifications/me/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, lue: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Erreur lors du marquage de toutes comme lues:', err);
      throw err;
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => {
        const notif = prev.find((n) => n.id === id);
        if (notif && !notif.lue) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      throw err;
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        totalCount,
        isLoading: isAuthenticated ? isLoading : false,
        isConnected,
        error,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refetch,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
