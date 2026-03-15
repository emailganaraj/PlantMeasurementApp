import 'react-native-gesture-handler';
import 'react-native-gesture-handler';
/**
 * Plant Measurement App - V26
 * V26: Login/Logout session management with AsyncStorage
 * Maintains ALL original functionality + user_id tracking
 * Last Updated: March 13, 2026
 */

import React, { useState, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Image,
    ActivityIndicator,
    Alert,
    Modal,
    useWindowDimensions,
    PanResponder,
    Animated,
    TextInput,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import AppContent from './src/AppContent';
import { AppWithNavigationTabs } from './src/AppWithNavigationTabs';

interface PlantAnalysis {
    plants?: Array<{
        id: number;
        root_length_cm: number;
        shoot_length_cm: number;
        total_length_cm: number;
    }>;
    image_id?: string;
    timestamp?: string;
    comprehensive_annotation?: string;
    per_plant?: any[];
    statistics?: any;
    [key: string]: any;
}

interface BackgroundRemovalState {
    isRemoving: boolean;
    showColorPalette: boolean;
    backgroundColor: string;
    processedImageData: string | null;
}

// LoginScreen Component
interface LoginScreenProps {
    onLoginSuccess: (userId: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loggingIn, setLoggingIn] = useState(false);

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            Alert.alert('Error', 'Please enter username and password');
            return;
        }

        setLoggingIn(true);
        try {
            // Get API config
            const { API_CONFIG } = require('./src/config');
            const API_URL = API_CONFIG.BASE_URL;
            const loginUrl = `${API_URL}/login`;

            console.log('Attempting login to:', loginUrl);
            console.log('Username:', username.trim());

            // Send login request to backend (Form data, not JSON)
            const formData = new FormData();
            formData.append('username', username.trim());
            formData.append('password', password.trim());

            const response = await fetch(loginUrl, {
                method: 'POST',
                body: formData,
            });

            console.log('Login response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Login error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('Login response data:', data);

            // Try different field names for user_id
            const userId = data.user_id || data.id || data.al_ai;

            if (!userId) {
                console.error('Response fields:', Object.keys(data));
                throw new Error(`No user_id found. Response: ${JSON.stringify(data)}`);
            }

            // Store user session
            await AsyncStorage.setItem('user_id', userId.toString());
            await AsyncStorage.setItem('username', username);
            await AsyncStorage.setItem('is_logged_in', 'true');
            
            console.log('Login successful, user_id:', userId, 'username:', username);
            onLoginSuccess(userId.toString());
        } catch (error: any) {
            console.error('Login error:', error);
            const errorMsg = error?.message || String(error);
            Alert.alert('Login Failed', `${errorMsg}\n\nCheck console for details`);
        } finally {
            setLoggingIn(false);
        }
    };

    return (
        <SafeAreaView style={loginStyles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1e293b" />
            <ScrollView contentInsetAdjustmentBehavior="automatic">
                <View style={loginStyles.header}>
                    <Text style={loginStyles.title}>🌱 Plant Measurement Pro</Text>
                    <Text style={loginStyles.subtitle}>AI-Powered Seedling Analysis</Text>
                </View>

                <View style={loginStyles.formContainer}>
                    <View style={loginStyles.section}>
                        <Text style={loginStyles.sectionTitle}>Login</Text>
                        
                        <TextInput
                            style={loginStyles.input}
                            placeholder="Username"
                            placeholderTextColor="#9ca3af"
                            value={username}
                            onChangeText={setUsername}
                            editable={!loggingIn}
                        />

                        <TextInput
                            style={loginStyles.input}
                            placeholder="Password"
                            placeholderTextColor="#9ca3af"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            editable={!loggingIn}
                        />

                        <TouchableOpacity
                            style={[loginStyles.button, loggingIn && loginStyles.disabledButton]}
                            onPress={handleLogin}
                            disabled={loggingIn}
                        >
                            {loggingIn ? (
                                <ActivityIndicator size="large" color="#fff" />
                            ) : (
                                <Text style={loginStyles.buttonText}>Login</Text>
                            )}
                        </TouchableOpacity>

                        <Text style={loginStyles.infoText}>
                            Demo: Enter any username and password
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};



// Wrapper component with login logic
function App(): React.JSX.Element {
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);

    // Check session on mount
    useEffect(() => {
        const checkSession = async () => {
            try {
                const storedUserId = await AsyncStorage.getItem('user_id');
                const isLoggedInStored = await AsyncStorage.getItem('is_logged_in');
                
                if (storedUserId && isLoggedInStored === 'true') {
                    setUserId(storedUserId);
                    setIsLoggedIn(true);
                    console.log('Session restored, user_id:', storedUserId);
                } else {
                    setIsLoggedIn(false);
                }
            } catch (error) {
                console.error('Error checking session:', error);
                setIsLoggedIn(false);
            } finally {
                setCheckingSession(false);
            }
        };

        checkSession();
    }, []);

    const handleLogin = async (newUserId: string) => {
        setUserId(newUserId);
        setIsLoggedIn(true);
    };

    const handleLogout = async () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', onPress: () => { } },
            {
                text: 'Logout',
                onPress: async () => {
                    try {
                        await AsyncStorage.removeItem('user_id');
                        await AsyncStorage.removeItem('username');
                        await AsyncStorage.removeItem('is_logged_in');
                        setUserId(null);
                        setIsLoggedIn(false);
                        Alert.alert('Success', 'You have been logged out');
                    } catch (error) {
                        console.error('Logout error:', error);
                    }
                },
                style: 'destructive'
            }
        ]);
    };

    if (checkingSession) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0fdf4' }}>
                <ActivityIndicator size="large" color="#16a34a" />
            </SafeAreaView>
        );
    }

    if (!isLoggedIn || !userId) {
        return <LoginScreen onLoginSuccess={handleLogin} />;
    }

    // Get API config
    const { API_CONFIG } = require('./src/config');
    const API_URL = API_CONFIG.BASE_URL;

    // Return main app with header containing user info and logout button + navigation tabs
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f0fdf4' }}>
            <StatusBar barStyle="light-content" backgroundColor="#1e293b" />
            {/* User Header */}
            <View style={headerStyles.userHeader}>
                <View style={headerStyles.userInfo}>
                    <Text style={headerStyles.userLabel}>User ID:</Text>
                    <Text style={headerStyles.userId}>{userId}</Text>
                </View>
                <TouchableOpacity
                    style={headerStyles.logoutButton}
                    onPress={handleLogout}
                >
                    <Text style={headerStyles.logoutText}>🚪 Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Main App Content with Bottom Tab Navigation */}
            <AppWithNavigationTabs userId={userId} apiUrl={API_URL} />
        </SafeAreaView>
    );
}

// All original styles from App.tsx
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0fdf4',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        backgroundColor: '#fff5e6',
        paddingVertical: 28,
        paddingHorizontal: 24,
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        marginBottom: 20,
        shadowColor: '#fb923c',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 12,
        borderBottomWidth: 3,
        borderBottomColor: '#16a34a',
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#16a34a',
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        color: '#fb923c',
        letterSpacing: 0.8,
        fontWeight: '700',
        marginBottom: 12,
    },
    testButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#3b82f6',
        borderRadius: 8,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    testButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    section: {
        marginHorizontal: 12,
        marginBottom: 18,
        paddingTop: 12,
        paddingHorizontal: 20,
        paddingBottom: 24,
        backgroundColor: '#ffffff',
        borderRadius: 18,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 6,
        borderLeftWidth: 5,
        borderLeftColor: '#16a34a',
        borderTopWidth: 1,
        borderTopColor: '#dcfce7',
        borderRightWidth: 1,
        borderRightColor: '#e8e8e8',
        borderBottomWidth: 2,
        borderBottomColor: '#dcfce7',
    },
    sectionTitle: {
        fontSize: 19,
        fontWeight: '800',
        color: '#16a34a',
        marginBottom: 16,
        letterSpacing: 0.3,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
    },
    button: {
        flex: 1,
        paddingVertical: 15,
        paddingHorizontal: 12,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
    },
    buttonPrimary: {
        backgroundColor: '#16a34a',
    },
    buttonSecondary: {
        backgroundColor: '#fb923c',
    },
    buttonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    imageContainer: {
        flex: 1,
        position: 'relative',
        alignItems: 'center',
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
        borderWidth: 2,
        borderColor: '#e0e0e0',
        paddingBottom: 12,
        maxHeight: 350,
    },
    image: {
        width: '100%',
        height: 300,
        resizeMode: 'contain',
        backgroundColor: '#f9fafb',
    },
    imageWrapperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginHorizontal: 8,
        marginBottom: 16,
        paddingVertical: 12,
    },
    rotateButtonLeft: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#8b5cf6',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    rotateButtonRight: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#8b5cf6',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    rotateButtonIconText: {
        fontSize: 24,
        color: '#fff',
        fontWeight: '700',
    },
    removeButtonCorner: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#dc2626',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 5,
    },
    removeTextCorner: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    rotationControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 24,
        marginBottom: 14,
        width: '100%',
    },
    rotateButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#fb923c',
        borderRadius: 8,
        shadowColor: '#fb923c',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    rotateButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    rotationDisplay: {
        backgroundColor: '#1f2937',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 8,
        marginTop: 8,
        borderWidth: 2,
        borderColor: '#8b5cf6',
    },
    rotationText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#8b5cf6',
    },
    analyzeSection: {
        marginHorizontal: 12,
        marginBottom: 18,
    },
    analyzeButton: {
        backgroundColor: '#16a34a',
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 18,
        alignItems: 'center',
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 8,
        borderBottomWidth: 3,
        borderBottomColor: '#15803d',
    },
    disabledButton: {
        backgroundColor: '#9ca3af',
        opacity: 0.6,
    },
    analyzeButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    zoomButton: {
        backgroundColor: '#16a34a',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 14,
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4,
    },
    zoomButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    annotationImageSmall: {
        width: '90%',
        height: 220,
        borderRadius: 14,
        borderWidth: 3,
        borderColor: '#16a34a',
        alignSelf: 'center',
        marginTop: 12,
    },
    tableContainer: {
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: '#f3f4f6',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#dcfce7',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 14,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    tableHeaderRow: {
        backgroundColor: '#16a34a',
        borderBottomWidth: 2,
        borderBottomColor: '#15803d',
    },
    tableRowAlt: {
        backgroundColor: '#f9fafb',
    },
    tableRowLast: {
        borderBottomWidth: 0,
    },
    tableCell: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '500',
    },
    tableCellBold: {
        fontWeight: '700',
        color: '#1f2937',
    },
    tableCellRoot: {
        color: '#16a34a',
        fontWeight: '600',
    },
    tableCellShoot: {
        color: '#3b82f6',
        fontWeight: '600',
    },
    tableCellTotal: {
        color: '#8b5cf6',
        fontWeight: '700',
    },
    tableHeader: {
        color: '#ffffff',
        fontWeight: '800',
        paddingVertical: 12,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff5e6',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 14,
        alignItems: 'center',
        borderLeftWidth: 4,
        borderLeftColor: '#fb923c',
        borderTopWidth: 1,
        borderTopColor: '#fed7aa',
        shadowColor: '#fb923c',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statLabel: {
        fontSize: 12,
        color: '#92400e',
        marginBottom: 6,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#16a34a',
    },
    statUnit: {
        fontSize: 11,
        color: '#b45309',
        marginTop: 4,
        fontWeight: '600',
    },
    sviSection: {
        marginTop: 20,
        padding: 16,
        backgroundColor: '#f0fdf4',
        borderRadius: 14,
        borderLeftWidth: 5,
        borderLeftColor: '#16a34a',
        borderTopWidth: 1,
        borderTopColor: '#dcfce7',
    },
    sviTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#16a34a',
        marginBottom: 16,
        textAlign: 'center',
    },
    formulaBox: {
        backgroundColor: '#ffffff',
        padding: 12,
        borderRadius: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#fb923c',
        marginBottom: 14,
    },
    formulaTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#b45309',
        marginBottom: 6,
    },
    formulaLine: {
        backgroundColor: '#fff5e6',
        padding: 10,
        borderRadius: 8,
    },
    formulaText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#7c2d12',
        fontStyle: 'italic',
    },
    valuesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 14,
    },
    valueCard: {
        width: '48%',
        backgroundColor: '#ffffff',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#dcfce7',
    },
    valueLabel: {
        fontSize: 11,
        color: '#6b7280',
        fontWeight: '600',
        marginBottom: 4,
    },
    valueNumber: {
        fontSize: 16,
        fontWeight: '800',
        color: '#16a34a',
    },
    calculationBox: {
        backgroundColor: '#ffffff',
        padding: 12,
        borderRadius: 10,
        marginBottom: 14,
        borderLeftWidth: 4,
        borderLeftColor: '#3b82f6',
    },
    calcLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1e40af',
        marginBottom: 8,
    },
    calcStep: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '500',
        marginBottom: 6,
        lineHeight: 18,
    },
    calcValue: {
        fontWeight: '800',
        color: '#16a34a',
    },
    sviResultBox: {
        backgroundColor: '#dcfce7',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#16a34a',
    },
    sviResultLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#15803d',
        marginBottom: 8,
    },
    sviResultFinal: {
        fontSize: 36,
        fontWeight: '900',
        color: '#16a34a',
    },
    clearButton: {
        backgroundColor: '#dc2626',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4,
        borderBottomWidth: 2,
        borderBottomColor: '#b91c1c',
    },
    clearButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    instructionsSection: {
        marginHorizontal: 12,
        marginBottom: 20,
        paddingVertical: 18,
        paddingHorizontal: 16,
        backgroundColor: '#fff5e6',
        borderRadius: 16,
        borderLeftWidth: 5,
        borderLeftColor: '#fb923c',
        borderTopWidth: 1,
        borderTopColor: '#fed7aa',
        borderRightWidth: 1,
        borderRightColor: '#f5deb3',
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#b45309',
        marginBottom: 12,
        letterSpacing: 0.2,
    },
    instructionText: {
        fontSize: 13,
        color: '#7c2d12',
        marginBottom: 8,
        lineHeight: 20,
        fontWeight: '500',
    },
    zoomOverlay: {
        flex: 1,
        backgroundColor: '#000000',
    },
    zoomHeader: {
        backgroundColor: '#1f2937',
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#16a34a',
    },
    zoomHelpText: {
        color: '#16a34a',
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.2,
        flex: 1,
    },
    zoomCloseButton: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        backgroundColor: '#dc2626',
        borderRadius: 8,
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 3,
    },
    zoomCloseText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
        letterSpacing: 0.2,
    },
    zoomContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    zoomContentContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100%',
    },
    zoomImage: {
        width: '90%',
        height: 1000,
    },
    zoomFooter: {
        backgroundColor: '#1f2937',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderTopWidth: 2,
        borderTopColor: '#16a34a',
        alignItems: 'center',
    },
    zoomScaleText: {
        color: '#16a34a',
        fontSize: 13,
        fontWeight: '700',
    },
    bgRemovalSection: {
        marginHorizontal: 12,
        marginVertical: 16,
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#f3e8ff',
        borderRadius: 16,
        borderLeftWidth: 5,
        borderLeftColor: '#a78bfa',
        borderTopWidth: 1,
        borderTopColor: '#e9d5ff',
    },
    bgRemovalTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#6d28d9',
        marginBottom: 14,
        letterSpacing: 0.2,
    },
    bgButton: {
        backgroundColor: '#8b5cf6',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4,
        borderBottomWidth: 2,
        borderBottomColor: '#6d28d9',
        marginBottom: 12,
    },
    bgButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    colorPaletteToggle: {
        backgroundColor: '#c4b5fd',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#a78bfa',
    },
    colorPaletteToggleText: {
        color: '#5b21b6',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    colorPaletteGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
        justifyContent: 'space-between',
    },
    colorItem: {
        width: '22%',
        aspectRatio: 1,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#e9d5ff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 2,
    },
    colorItemSelected: {
        borderWidth: 3,
        borderColor: '#1f2937',
        shadowOpacity: 0.35,
    },
    colorItemCheckmark: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
        textShadowColor: '#000',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    processedImagePreview: {
        width: '100%',
        height: 260,
        borderRadius: 12,
        marginTop: 12,
        overflow: 'hidden',
    },
});

// Login Screen Styles
const loginStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0fdf4',
    },
    header: {
        backgroundColor: '#fff5e6',
        paddingVertical: 48,
        paddingHorizontal: 24,
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        marginBottom: 40,
        shadowColor: '#fb923c',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 12,
        borderBottomWidth: 3,
        borderBottomColor: '#16a34a',
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#16a34a',
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        color: '#fb923c',
        letterSpacing: 0.8,
        fontWeight: '700',
    },
    formContainer: {
        paddingHorizontal: 16,
    },
    section: {
        paddingHorizontal: 20,
        paddingVertical: 32,
        backgroundColor: '#ffffff',
        borderRadius: 18,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 6,
        borderLeftWidth: 5,
        borderLeftColor: '#16a34a',
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#16a34a',
        marginBottom: 24,
        letterSpacing: 0.3,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
        fontSize: 15,
        color: '#1f2937',
        backgroundColor: '#f9fafb',
    },
    button: {
        backgroundColor: '#16a34a',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4,
    },
    disabledButton: {
        backgroundColor: '#9ca3af',
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    infoText: {
        fontSize: 13,
        color: '#6b7280',
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

// Header Styles
const headerStyles = StyleSheet.create({
    userHeader: {
        backgroundColor: '#fff5e6',
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#16a34a',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    userLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#b45309',
    },
    userId: {
        fontSize: 12,
        fontWeight: '600',
        color: '#16a34a',
        maxWidth: 180,
    },
    logoutButton: {
        backgroundColor: '#dc2626',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    logoutText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
});

export default App;
