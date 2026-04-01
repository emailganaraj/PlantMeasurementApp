/**
 * ChatComponent.tsx
 * 
 * WhatsApp-like chat component for analysis discussions.
 * Displays messages with user on right, admin on left.
 * Stores chat data in JSON format on backend.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';

interface ChatMessage {
  msg_id: string;
  user: string;
  message: string;
  date: string;
  time: string;
}

interface ChatComponentProps {
  analysisId: string;
  userId: string;
  username: string;
  apiUrl: string;
  flow: 'new_analysis' | 'development'; // Add flow parameter
}

const ChatComponent: React.FC<ChatComponentProps> = ({
  analysisId,
  userId,
  username,
  apiUrl,
  flow,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load chat messages on component mount
  useEffect(() => {
    loadChatMessages();
  }, [analysisId, apiUrl, flow]);

  const loadChatMessages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${apiUrl}/chat/${analysisId}?user_id=${userId}&flow=${flow}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      } else if (response.status === 404) {
        // No chat file exists yet, start with empty messages
        setMessages([]);
      } else {
        console.warn('Failed to load chat messages:', response.status);
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const now = new Date();
      const messageData = {
        msg_id: Date.now().toString(),
        user: username,
        message: newMessage.trim(),
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const response = await fetch(`${apiUrl}/chat/${analysisId}?user_id=${userId}&flow=${flow}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        setMessages(prev => [...prev, messageData]);
        setNewMessage('');
      } else {
        Alert.alert('Error', 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  // Calculate dynamic height based on message count
  const getChatHeight = () => {
    const baseHeight = 60; // Minimum height for 1-2 messages
    const messageHeight = 45; // Height per message
    
    if (messages.length <= 2) return baseHeight;
    return baseHeight + (messages.length - 2) * messageHeight;
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isCurrentUser = message.user === username;
    const showDate = index === 0 || 
      messages[index - 1]?.date !== message.date;

    return (
      <View key={message.msg_id}>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{message.date}</Text>
          </View>
        )}
        <View
          style={[
            styles.messageContainer,
            isCurrentUser ? styles.userMessage : styles.adminMessage,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isCurrentUser ? styles.userBubble : styles.adminBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isCurrentUser ? styles.userMessageText : styles.adminMessageText,
              ]}
            >
              {message.message}
            </Text>
          </View>
          <Text style={styles.messageTime}>{message.time}</Text>
          {!isCurrentUser && (
            <Text style={styles.senderName}>{message.user}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.chatSection}>
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <Text style={styles.chatTitle}>Analysis Discussion</Text>
        <Text style={styles.chatSubtitle}>Chat with admin about this analysis</Text>
      </View>

      {/* Messages Area */}
      <View style={styles.chatContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <View style={[styles.messagesContainer, { minHeight: getChatHeight() }]}>
            {messages.length === 0 ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>No messages yet. Start a conversation!</Text>
              </View>
            ) : (
              messages.map((message, index) => renderMessage(message, index))
            )}
          </View>
        )}
      </View>
      
      {/* Input Area - Always at bottom */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor={Colors.gray500}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, { opacity: newMessage.trim() ? 1 : 0.5 }]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chatSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    margin: Spacing[3],
    marginBottom: Spacing[5],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  chatHeader: {
    backgroundColor: Colors.primary,
    padding: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryDark,
  },
  chatTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.white,
    marginBottom: Spacing[1],
  },
  chatSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.white,
    opacity: 0.8,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#ECE5DD', // WhatsApp light background color
    padding: Spacing[2],
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: Spacing[2],
  },
  dateText: {
    fontSize: Typography.sizes.xs,
    color: Colors.gray500,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.sm,
  },
  messageContainer: {
    marginVertical: Spacing[1],
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  adminMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: 18,
    marginHorizontal: Spacing[1],
  },
  userBubble: {
    backgroundColor: '#DCF8C6', // WhatsApp outgoing message green
    borderBottomRightRadius: 4,
  },
  adminBubble: {
    backgroundColor: '#FFFFFF', // WhatsApp incoming message white
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  messageText: {
    fontSize: Typography.sizes.sm,
    lineHeight: 18,
  },
  userMessageText: {
    color: '#000000', // WhatsApp outgoing text - black
  },
  adminMessageText: {
    color: '#000000', // WhatsApp incoming text - black
  },
  messageTime: {
    fontSize: Typography.sizes.xs,
    color: Colors.gray500,
    marginHorizontal: Spacing[2],
  },
  senderName: {
    fontSize: Typography.sizes.xs,
    color: Colors.gray600,
    fontWeight: Typography.weights.semibold,
    marginLeft: Spacing[2],
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[4],
  },
  emptyStateText: {
    fontSize: Typography.sizes.sm,
    color: Colors.gray500,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing[2],
  },
  loadingText: {
    fontSize: Typography.sizes.xs,
    color: Colors.gray500,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing[2],
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[2],
    marginRight: Spacing[2],
    maxHeight: 60,
    fontSize: Typography.sizes.sm,
    color: Colors.gray800,
    backgroundColor: Colors.white,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.gray300,
  },
  sendButtonText: {
    color: Colors.white,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  sendButtonTextDisabled: {
    color: Colors.gray500,
  },
});

export default ChatComponent;
