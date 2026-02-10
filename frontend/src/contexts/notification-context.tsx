"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/auth';
import { useOrganisation } from '@/contexts/organisation-context';
import {
  getNotificationsByUser,
  getNotificationCount,
  markNotificationAsRead as markAsReadAction,
  markAllNotificationsAsRead as markAllAsReadAction,
  deleteNotification as deleteNotificationAction,
  deleteAllNotifications as deleteAllNotificationsAction,
} from '@/actions/notifications';
import type { Notification } from '@proto/notifications/notifications';
import type { NotificationEvents } from '@/lib/ui/display-types/notification';

// WebSocket URL for notifications service (port 3001 by default)
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

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
  deleteAllNotifications: () => Promise<void>;
  refetch: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

interface InitialNotificationData {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
}

interface NotificationProviderProps {
  children: React.ReactNode;
  /** Initial notification data from server - skips client-side fetch if provided */
  initialData?: InitialNotificationData | null;
}

export function NotificationProvider({ children, initialData }: NotificationProviderProps) {
  const { ready, isAuthenticated, token } = useAuth();
  const { utilisateur, activeOrganisation } = useOrganisation();

  const [notifications, setNotifications] = useState<Notification[]>(initialData?.notifications || []);
  const [unreadCount, setUnreadCount] = useState(initialData?.unreadCount || 0);
  const [totalCount, setTotalCount] = useState(initialData?.totalCount || 0);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const hasFetched = useRef(!!initialData);

  // Récupérer les notifications initiales via gRPC Server Actions
  const fetchNotifications = useCallback(async () => {
    if (!utilisateur?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const [notifsResult, countResult] = await Promise.all([
        getNotificationsByUser(utilisateur.id),
        getNotificationCount(utilisateur.id),
      ]);

      if (notifsResult.error) {
        throw new Error(notifsResult.error);
      }
      if (countResult.error) {
        throw new Error(countResult.error);
      }

      // Mapper les données gRPC vers le type Notification local
      const mappedNotifications: Notification[] = (notifsResult.data || []).map((n) => ({
        id: n.id,
        type: n.type as unknown as Notification['type'],
        titre: n.titre,
        message: n.message,
        lu: n.lu,
        utilisateurId: n.utilisateurId,
        organisationId: n.organisationId,
        metadata: n.metadata || {},
        lienUrl: n.lienUrl,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      }));

      setNotifications(mappedNotifications);
      setUnreadCount(countResult.data?.unread || 0);
      setTotalCount(countResult.data?.total || 0);
    } catch (err) {
      console.error('[Notifications] Erreur lors du chargement:', err);
      setError(err instanceof Error ? err : new Error('Erreur lors du chargement des notifications'));
    } finally {
      setIsLoading(false);
    }
  }, [utilisateur?.id]);

  // Connexion WebSocket (always client-side for real-time updates)
  useEffect(() => {
    if (!ready || !isAuthenticated || !token || !utilisateur?.id || !activeOrganisation?.organisationId) {
      return;
    }

    // Éviter les reconnexions multiples
    if (socketRef.current?.connected) {
      return;
    }

    const socket = io(`${WS_URL}/notifications`, {
      transports: ['websocket'],
      autoConnect: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 5000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);

      // S'authentifier après connexion
      socket.emit('authenticate', {
        userId: utilisateur.id,
        organisationId: activeOrganisation.organisationId,
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      setIsConnected(false);
      if (process.env.NODE_ENV !== 'development') {
        setError(new Error(`Erreur de connexion WebSocket: ${err.message}`));
      } else {
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
        prev.map((n) => (n.id === id ? { ...n, lu: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });

    socket.on('notification:all-read', () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
      setUnreadCount(0);
    });

    socket.on('notification:deleted', ({ id }: NotificationEvents['notification:deleted']) => {
      setNotifications((prev) => {
        const notif = prev.find((n) => n.id === id);
        if (notif && !notif.lu) {
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
  }, [ready, isAuthenticated, token, utilisateur?.id, activeOrganisation?.organisationId]);

  // Fetch initial des notifications (skip si initialData provided)
  useEffect(() => {
    if (ready && isAuthenticated && utilisateur?.id && !hasFetched.current) {
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
  }, [ready, isAuthenticated, utilisateur?.id, fetchNotifications]);

  // Actions via gRPC Server Actions
  const markAsRead = useCallback(async (id: string) => {
    try {
      const result = await markAsReadAction(id);
      if (result.error) {
        throw new Error(result.error);
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lu: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Erreur lors du marquage comme lu:', err);
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!utilisateur?.id) return;
    try {
      const result = await markAllAsReadAction(utilisateur.id);
      if (result.error) {
        throw new Error(result.error);
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Erreur lors du marquage de toutes comme lues:', err);
      throw err;
    }
  }, [utilisateur?.id]);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const result = await deleteNotificationAction(id);
      if (result.error) {
        throw new Error(result.error);
      }
      setNotifications((prev) => {
        const notif = prev.find((n) => n.id === id);
        if (notif && !notif.lu) {
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

  const deleteAllNotifications = useCallback(async () => {
    if (!utilisateur?.id) return;
    try {
      const result = await deleteAllNotificationsAction(utilisateur.id);
      if (result.error) {
        throw new Error(result.error);
      }
      setNotifications([]);
      setUnreadCount(0);
      setTotalCount(0);
    } catch (err) {
      console.error('Erreur lors de la suppression de toutes les notifications:', err);
      throw err;
    }
  }, [utilisateur?.id]);

  const refetch = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    notifications,
    unreadCount,
    totalCount,
    isLoading: isAuthenticated ? isLoading : false,
    isConnected,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refetch,
  }), [
    notifications,
    unreadCount,
    totalCount,
    isAuthenticated,
    isLoading,
    isConnected,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refetch,
  ]);

  return (
    <NotificationContext.Provider value={contextValue}>
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
