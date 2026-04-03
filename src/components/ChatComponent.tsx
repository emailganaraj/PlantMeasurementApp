/**
 * ChatComponent.tsx
 * 
 * WhatsApp-like chat component for analysis discussions.
 * Displays messages with user on right, admin on left.
 * Stores chat data in JSON format on backend.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  Modal,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
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
  flow: 'new_analysis' | 'development';
  visible: boolean;
  onClose: () => void;
}

const ChatComponent: React.FC<ChatComponentProps> = ({
  analysisId,
  userId,
  username,
  apiUrl,
  flow,
  visible,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load chat messages on component mount
  useEffect(() => {
    loadChatMessages();
  }, [analysisId, apiUrl, flow]);

  // Scroll to bottom when messages load
  useEffect(() => {
    if (messages.length > 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Scroll to bottom when modal becomes visible
  useEffect(() => {
    if (visible && messages.length > 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  }, [visible, messages]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      // Scroll to bottom when keyboard opens
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }
      }, 100);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

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

    // Step 1: Dismiss keyboard first
    Keyboard.dismiss();

    // Step 2: Wait a bit for keyboard to dismiss, then send
    setTimeout(async () => {
      // Store message and clear input
      const messageToSend = newMessage.trim();
      setNewMessage(''); // Clear input

      try {
        const now = new Date();
        const messageData = {
          msg_id: Date.now().toString(),
          user: username,
          message: messageToSend,
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
          // Scroll to bottom after sending
          setTimeout(() => {
            if (scrollViewRef.current) {
              scrollViewRef.current.scrollToEnd({ animated: true });
            }
          }, 100);
        } else {
          Alert.alert('Error', 'Failed to send message');
          // Restore message if send failed
          setNewMessage(messageToSend);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        Alert.alert('Error', 'Failed to send message');
        // Restore message if send failed
        setNewMessage(messageToSend);
      }
    }, 300); // Wait 300ms for keyboard to dismiss
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
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <SafeAreaView style={styles.modalContainer}>
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          <Text style={styles.chatTitle}>Analysis Discussion</Text>
          <Text style={styles.chatSubtitle}>Chat with admin about this analysis</Text>
        </View>

        {/* Messages Area */}
        <View style={styles.messagesWrapper}>
          <ScrollView 
            ref={scrollViewRef}
            style={styles.chatContainer}
            contentContainerStyle={{ paddingBottom: keyboardVisible ? 250 : 100 }}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading messages...</Text>
              </View>
            ) : (
              <View style={styles.messagesContainer}>
                {messages.length === 0 ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>No messages yet. Start a conversation!</Text>
                  </View>
                ) : (
                  messages.map((message, index) => renderMessage(message, index))
                )}
              </View>
            )}
          </ScrollView>
        </View>
        
        {/* Input Area - Fixed at bottom */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor={Colors.gray500}
            multiline
            blurOnSubmit={false}
            returnKeyType="send"
            onSubmitEditing={() => {
              if (newMessage.trim()) {
                sendMessage();
              }
            }}
          />
          <TouchableOpacity
            style={[styles.sendButton, { opacity: newMessage.trim() ? 1 : 0.5 }]}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Text style={styles.sendButtonText}>
              {keyboardVisible ? '↓' : 'Send'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesWrapper: {
    flex: 1,
  },
  chatHeader: {
    backgroundColor: Colors.primary,
    padding: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing[3],
    right: Spacing[3],
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: Colors.white,
    fontWeight: 'bold',
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
  chatContainer: {
    flex: 1,
    backgroundColor: '#ECE5DD', // WhatsApp background
  },
  messagesContainer: {
    flex: 1,
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
    backgroundColor: '#DCF8C6', // WhatsApp green
    borderBottomRightRadius: 4,
  },
  adminBubble: {
    backgroundColor: '#FFFFFF', // WhatsApp white
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
    color: '#000000',
  },
  adminMessageText: {
    color: '#000000',
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
    minHeight: 60,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[2],
    marginRight: Spacing[2],
    maxHeight: 80,
    fontSize: Typography.sizes.sm,
    color: Colors.gray800,
    backgroundColor: Colors.white,
    minHeight: 40,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
    minHeight: 50,
  },
  sendButtonText: {
    color: Colors.white,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
});

export default ChatComponent;
