'use client';
import { useEffect, useRef, useCallback } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getAccessToken } from '@/lib/auth';

interface WSOptions {
  onPaymentUpdate?: (data: unknown) => void;
  onNotification?: (data: unknown) => void;
  userEmail?: string;
}

export const useWebSocket = ({ onPaymentUpdate, onNotification, userEmail }: WSOptions) => {
  const clientRef = useRef<Client | null>(null);

  const connect = useCallback(() => {
    if (!userEmail) return;
    const token = getAccessToken();
    if (!token) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/api/ws';
    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl.replace('ws://', 'http://').replace('wss://', 'https://')),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/user/queue/notifications`, (msg: IMessage) => {
          try {
            const payload = JSON.parse(msg.body);
            if (payload.type?.includes('PAYMENT')) onPaymentUpdate?.(payload);
            onNotification?.(payload);
          } catch { /* ignore */ }
        });
      },
      onStompError: (frame) => console.warn('STOMP error', frame.headers['message']),
    });

    client.activate();
    clientRef.current = client;
  }, [userEmail, onPaymentUpdate, onNotification]);

  useEffect(() => {
    connect();
    return () => { clientRef.current?.deactivate(); };
  }, [connect]);
};
