// hooks/useWakuBountyMessaging.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount } from "wagmi";
import {
  createLightNode,
  createEncoder,
  createDecoder,
  Protocols,
} from "@waku/sdk";
import protobuf from "protobufjs";

// Message structure for Waku
const BountyMessage = new protobuf.Type("BountyMessage")
  .add(new protobuf.Field("bountyId", 1, "uint64"))
  .add(new protobuf.Field("sender", 2, "string"))
  .add(new protobuf.Field("message", 3, "string"))
  .add(new protobuf.Field("timestamp", 4, "uint64"))
  .add(new protobuf.Field("messageType", 5, "string")) // 'application', 'question', 'update'
  .add(new protobuf.Field("signature", 6, "string")); // For message authentication

interface WakuMessage {
  id: string;
  bountyId: number;
  sender: string;
  message: string;
  timestamp: number;
  messageType: "application" | "question" | "update" | "payment";
  isFromCurrentUser: boolean;
}

interface UseWakuBountyMessagingProps {
  bountyId: number;
  enabled?: boolean;
}

// Simplified version following Waku docs exactly
export function useSimpleBountyMessaging({
  bountyId,
  enabled = true,
}: UseWakuBountyMessagingProps) {
  const { address } = useAccount();
  const [node, setNode] = useState<any>(null);
  const [messages, setMessages] = useState<WakuMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simple content topic
  const contentTopic = `/zuitz-bounty/1/chat/proto`;

  // Create encoder and decoder
  const encoder = createEncoder({ contentTopic });
  const decoder = createDecoder(contentTopic);

  // Initialize node
  useEffect(() => {
    if (!enabled || !address) return;

    const initNode = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Create node exactly like docs
        const wakuNode = await createLightNode({ defaultBootstrap: true });
        await wakuNode.start();
        await wakuNode.waitForPeers();

        setNode(wakuNode);
        setIsConnected(true);

        // Subscribe to messages
        const { error: subError, subscription } =
          await wakuNode.filter.createSubscription({
            contentTopics: [contentTopic],
          });

        if (subError) {
          throw new Error(subError);
        }

        await subscription.subscribe([decoder], (wakuMessage: any) => {
          if (!wakuMessage.payload) return;

          try {
            const decodedMessage = BountyMessage.decode(wakuMessage.payload);

            // Only show messages for this bounty
            if (Number(decodedMessage.bountyId) !== bountyId) return;

            // Create unique ID to prevent duplicates
            const messageId = `${decodedMessage.sender}-${
              decodedMessage.timestamp
            }-${Math.random().toString(36).substr(2, 9)}`;

            const newMessage: WakuMessage = {
              id: messageId,
              bountyId: Number(decodedMessage.bountyId),
              sender: decodedMessage.sender,
              message: decodedMessage.message,
              timestamp: Number(decodedMessage.timestamp),
              messageType: decodedMessage.messageType as any,
              isFromCurrentUser:
                decodedMessage.sender.toLowerCase() === address?.toLowerCase(),
            };

            setMessages((prev) => {
              // Check for duplicates by sender, timestamp, and message content
              const isDuplicate = prev.some(
                (msg) =>
                  msg.sender === newMessage.sender &&
                  msg.timestamp === newMessage.timestamp &&
                  msg.message === newMessage.message
              );

              if (isDuplicate) {
                console.log("⚠️ Duplicate message detected, skipping");
                return prev;
              }

              return [...prev, newMessage].sort(
                (a, b) => a.timestamp - b.timestamp
              );
            });
          } catch (err) {
            console.error("Error decoding message:", err);
          }
        });
      } catch (err) {
        console.error("Failed to initialize Waku:", err);
        setError(err instanceof Error ? err.message : "Connection failed");
      } finally {
        setIsLoading(false);
      }
    };

    initNode();

    return () => {
      if (node) {
        node.stop().catch(console.error);
      }
    };
  }, [bountyId, address, enabled]);

  // Send message
  const sendMessage = async (
    message: string,
    messageType: "application" | "question" | "update" | "payment" = "question"
  ) => {
    if (!node || !address || !message.trim()) return;

    try {
      const timestamp = Date.now();
      const messageObj = BountyMessage.create({
        bountyId: bountyId,
        sender: address,
        message: message.trim(),
        timestamp: timestamp,
        messageType: messageType,
        signature: "",
      });

      const payload = BountyMessage.encode(messageObj).finish();
      await node.lightPush.send(encoder, { payload });

      console.log(`📤 Message sent for bounty ${bountyId}:`, {
        sender: address,
        message: message.trim(),
        messageType,
        timestamp,
      });

      // DON'T add to local state immediately - let it come through the subscription
      // This prevents duplicate messages
    } catch (err) {
      console.error("Failed to send message:", err);
      throw err;
    }
  };

  return {
    messages,
    sendMessage,
    isConnected,
    isLoading,
    error,
  };
}

export function useWakuBountyMessaging({
  bountyId,
  enabled = true,
}: UseWakuBountyMessagingProps) {
  const { address } = useAccount();
  const [node, setNode] = useState<any>(null);
  const [messages, setMessages] = useState<WakuMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);

  // Content topic for this specific bounty (proper Waku format)
  const contentTopic = `/zuitz-bounty/1/messages-${bountyId}/proto`;

  // Create encoder and decoder
  const encoder = createEncoder({
    contentTopic,
    ephemeral: false, // We want messages to be stored
  });
  const decoder = createDecoder(contentTopic);

  // Initialize Waku node
  const initializeWaku = useCallback(async () => {
    if (!enabled || !address) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log(`🚀 Initializing Waku for bounty ${bountyId}...`);

      // Create and start light node (simplified approach)
      const wakuNode = await createLightNode({
        defaultBootstrap: true,
      });

      await wakuNode.start();

      // Wait for peer connections
      console.log("⏳ Waiting for peers...");
      await wakuNode.waitForPeers([Protocols.LightPush, Protocols.Filter]);

      setNode(wakuNode);
      setIsConnected(true);

      console.log(`✅ Waku node connected for bounty ${bountyId}`);

      // Load message history
      await loadMessageHistory(wakuNode);

      // Subscribe to new messages
      await subscribeToMessages(wakuNode);
    } catch (err) {
      console.error(
        `❌ Failed to initialize Waku for bounty ${bountyId}:`,
        err
      );
      setError(
        err instanceof Error ? err.message : "Failed to connect to Waku"
      );
    } finally {
      setIsLoading(false);
    }
  }, [bountyId, contentTopic, enabled, address]);

  // Load message history from Waku Store
  const loadMessageHistory = async (wakuNode: any) => {
    try {
      console.log(`📚 Loading message history for bounty ${bountyId}...`);

      const messages: WakuMessage[] = [];

      // Query messages from the last 30 days
      for await (const message of wakuNode.store.queryMessages({
        contentTopics: [contentTopic],
        timeFilter: {
          startTime: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
          endTime: Date.now(),
        },
      })) {
        try {
          if (message.payload) {
            const decodedMessage = BountyMessage.decode(message.payload);
            messages.push({
              id: `${decodedMessage.sender}-${decodedMessage.timestamp}`,
              bountyId: Number(decodedMessage.bountyId),
              sender: decodedMessage.sender,
              message: decodedMessage.message,
              timestamp: Number(decodedMessage.timestamp),
              messageType: decodedMessage.messageType as any,
              isFromCurrentUser:
                decodedMessage.sender.toLowerCase() === address?.toLowerCase(),
            });
          }
        } catch (err) {
          console.error("Error decoding message:", err);
        }
      }

      // Sort messages by timestamp
      messages.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(messages);

      console.log(
        `📚 Loaded ${messages.length} historical messages for bounty ${bountyId}`
      );
    } catch (err) {
      console.error("Error loading message history:", err);
    }
  };

  // Subscribe to new messages
  const subscribeToMessages = async (wakuNode: any) => {
    try {
      console.log(`🔔 Subscribing to messages for bounty ${bountyId}...`);

      const { error, subscription } = await wakuNode.filter.createSubscription({
        contentTopics: [contentTopic],
      });

      if (error) {
        throw new Error(error);
      }

      const unsubscribe = await subscription.subscribe(
        [decoder],
        (wakuMessage: any) => {
          try {
            if (!wakuMessage.payload) return;

            const decodedMessage = BountyMessage.decode(wakuMessage.payload);
            const newMessage: WakuMessage = {
              id: `${decodedMessage.sender}-${decodedMessage.timestamp}`,
              bountyId: Number(decodedMessage.bountyId),
              sender: decodedMessage.sender,
              message: decodedMessage.message,
              timestamp: Number(decodedMessage.timestamp),
              messageType: decodedMessage.messageType as any,
              isFromCurrentUser:
                decodedMessage.sender.toLowerCase() === address?.toLowerCase(),
            };

            // Only add if it's not already in messages (avoid duplicates)
            setMessages((prev) => {
              const exists = prev.some((msg) => msg.id === newMessage.id);
              if (exists) return prev;

              return [...prev, newMessage].sort(
                (a, b) => a.timestamp - b.timestamp
              );
            });

            console.log(
              `📨 New message received for bounty ${bountyId}:`,
              newMessage
            );
          } catch (err) {
            console.error("Error processing new message:", err);
          }
        }
      );

      subscriptionRef.current = unsubscribe;
      console.log(`✅ Subscribed to messages for bounty ${bountyId}`);
    } catch (err) {
      console.error("Error subscribing to messages:", err);
    }
  };

  // Send message via Waku
  const sendMessage = async (
    message: string,
    messageType: "application" | "question" | "update" | "payment" = "question"
  ) => {
    if (!node || !address || !message.trim()) {
      throw new Error(
        "Cannot send message: Node not connected or missing data"
      );
    }

    try {
      const timestamp = Date.now();

      // Create message object
      const messageObj = BountyMessage.create({
        bountyId: bountyId,
        sender: address,
        message: message.trim(),
        timestamp: timestamp,
        messageType: messageType,
        signature: "", // In production, you might want to sign this
      });

      // Encode message
      const payload = BountyMessage.encode(messageObj).finish();

      // Send via Light Push
      await node.lightPush.send(encoder, { payload });

      console.log(`📤 Message sent for bounty ${bountyId}:`, {
        sender: address,
        message: message.trim(),
        messageType,
      });

      // Add to local state immediately for better UX
      const newMessage: WakuMessage = {
        id: `${address}-${timestamp}`,
        bountyId,
        sender: address,
        message: message.trim(),
        timestamp,
        messageType,
        isFromCurrentUser: true,
      };

      setMessages((prev) =>
        [...prev, newMessage].sort((a, b) => a.timestamp - b.timestamp)
      );
    } catch (err) {
      console.error(`❌ Failed to send message for bounty ${bountyId}:`, err);
      throw err;
    }
  };

  // Cleanup function
  const cleanup = useCallback(async () => {
    try {
      if (subscriptionRef.current) {
        await subscriptionRef.current();
        subscriptionRef.current = null;
      }

      if (node) {
        await node.stop();
        setNode(null);
      }

      setIsConnected(false);
      console.log(`🧹 Cleaned up Waku resources for bounty ${bountyId}`);
    } catch (err) {
      console.error("Error during cleanup:", err);
    }
  }, [node, bountyId]);

  // Initialize on mount
  useEffect(() => {
    if (enabled && address) {
      initializeWaku();
    }

    return () => {
      cleanup();
    };
  }, [bountyId, address, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    messages,
    sendMessage,
    isConnected,
    isLoading,
    error,
    reconnect: initializeWaku,
  };
}
