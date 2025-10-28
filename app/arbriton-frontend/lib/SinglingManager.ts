const WS_URL = process.env.NEXT_PUBLIC_WS_URL!;

type MessagePayload = {
  [key: string]: any;
};

export class SignalingManager {
  private ws: WebSocket;
  private static instance: SignalingManager;
  private bufferedMessages: string[] = [];
  private registeredCallbacks: Map<
    string,
    { id: string; callback: (...args: any[]) => void }[]
  > = new Map();
  private id = 0;
  private initialized = false;

  private constructor() {
    this.ws = new WebSocket(WS_URL);
    this.init();
  }

  private init() {
    this.ws.onopen = () => {
      this.initialized = true;
      this.bufferedMessages.forEach((msg) => this.ws.send(msg));
      this.bufferedMessages = [];
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const callbacks = this.registeredCallbacks.get(message.type);
      if (callbacks) {
        callbacks.forEach(({ callback }) => callback(message.payload));
      }
    };

    this.ws.onclose = () => {
      this.initialized = false;
      console.warn("WebSocket closed. Reconnecting...");
      setTimeout(() => this.reconnect(), 2000);
    };

    this.ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };
  }

  private reconnect() {
    this.ws = new WebSocket(WS_URL);
    this.init();
  }

  public static getInstance(): SignalingManager {
    if (!this.instance) {
      this.instance = new SignalingManager();
    }
    return this.instance;
  }

  public sendMessage(message: any) {
    const messageToSend = JSON.stringify({
      id: this.id++,
      ...message,
    });

    if (!this.initialized) {
      this.bufferedMessages.push(messageToSend);
      return;
    }

    this.ws.send(messageToSend);
  }

  public registerCallback(
    type: string,
    callback: (...args: any[]) => void,
    id: string
  ) {
    const existing = this.registeredCallbacks.get(type) || [];
    existing.push({ id, callback });
    this.registeredCallbacks.set(type, existing);
  }

  public unregisterCallback(type: string, id: string) {
    const callbacks = this.registeredCallbacks.get(type);
    if (callbacks) {
      this.registeredCallbacks.set(
        type,
        callbacks.filter((c) => c.id !== id)
      );
    }
  }
}
