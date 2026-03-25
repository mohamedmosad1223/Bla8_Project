import api from './api';

export interface ChatMessage {
  message_id: number;
  request_id?: number;
  sender_id: number;
  receiver_id: number;
  message_text: string;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'document';
  file_path?: string;
  is_read: boolean;
  created_at: string;
}

export interface ChatPreview {
  request_id: number | null;
  other_user_id: number;
  other_party_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  is_direct?: boolean;
}

export type WSMessageHandler = (event: string, data: Record<string, unknown>) => void;

class ChatWebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Set<WSMessageHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * REST: Get list of active chats for the sidebar
   */
  async getMyChats(): Promise<ChatPreview[]> {
    const response = await api.get('/messages/my-chats');
    return response.data.data;
  }

  /**
   * REST: Get history for a specific chat
   */
  async getChatHistory(otherUserId: number, requestId?: number): Promise<ChatMessage[]> {
    if (requestId) {
      const response = await api.get(`/messages/chat-history/${requestId}`);
      return response.data.data;
    } else {
      const response = await api.get(`/messages/dm-history/${otherUserId}`);
      return response.data.data;
    }
  }

  /**
   * Connect to WebSocket
   */
  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Using the same host/port. Vite proxy will catch `/ws/chat` and forward it.
    const wsUrl = `${protocol}//${window.location.host}/ws/chat`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('Chat WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        this.notifyListeners(parsed.event, parsed);
      } catch (err) {
        console.error('Failed to parse WS message:', err);
      }
    };

    this.ws.onclose = () => {
      console.log('Chat WebSocket disconnected');
      this.attemptReconnect();
    };

    this.ws.onerror = (err) => {
      console.error('Chat WebSocket error:', err);
    };
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const timeout = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      console.log(`Reconnecting to WebSocket in ${timeout}ms...`);
      setTimeout(() => this.connect(), timeout);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Send a WS action
   */
  private sendAction(action: string, payload: Record<string, unknown>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action, ...payload }));
    } else {
      console.warn('Cannot send action, WebSocket is not open');
    }
  }

  sendMessage(receiverId: number, text: string, requestId: number | null = null) {
    this.sendAction('send_message', {
      receiver_id: receiverId,
      request_id: requestId,
      message_text: text,
      message_type: 'text',
    });
  }

  sendTyping(receiverId: number, requestId: number | null = null) {
    this.sendAction('typing', { receiver_id: receiverId, request_id: requestId });
  }

  stopTyping(receiverId: number, requestId: number | null = null) {
    this.sendAction('stop_typing', { receiver_id: receiverId, request_id: requestId });
  }

  markAsRead(messageIds: number[]) {
    this.sendAction('read', { message_ids: messageIds });
  }

  checkOnlineStatus(userIds: number[]) {
    this.sendAction('check_online', { user_ids: userIds });
  }

  /**
   * Subscribe to WS events
   */
  addListener(handler: WSMessageHandler) {
    this.listeners.add(handler);
  }

  removeListener(handler: WSMessageHandler) {
    this.listeners.delete(handler);
  }

  private notifyListeners(eventName: string, data: Record<string, unknown>) {
    this.listeners.forEach(handler => handler(eventName, data));
  }
}

export const chatService = new ChatWebSocketService();
