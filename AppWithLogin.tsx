import 'react-native-gesture-handler';
import 'react-native-gesture-handler';
/**
 * Plant Measurement App - V26
 * V26: Login/Logout session management with AsyncStorage
 * Maintains ALL original functionality + user_id tracking
 * Last Updated: March 13, 2026
 */

import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Alert,
    TextInput,
    Animated,
    Easing,
    Image,
} from 'react-native';
import { AppWithNavigationTabs } from './src/AppWithNavigationTabs';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from './src/theme';

// LoginScreen Component
interface LoginScreenProps {
    onLoginSuccess: (userId: string, username: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loggingIn, setLoggingIn] = useState(false);
    const [focusedField, setFocusedField] = useState<'username' | 'password' | null>(null);

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
            onLoginSuccess(userId.toString(), username);
        } catch (error: any) {
            console.error('Login error:', error);
            const errorMsg = error?.message || String(error);
            Alert.alert('Login Failed', `${errorMsg}\n\nCheck console for details`);
        } finally {
            setLoggingIn(false);
        }
    };

    return (
        <SafeAreaView style={[loginStyles.container, { backgroundColor: Colors.primaryBg }]}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.primaryBg} />
            <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}>
                {/* Decorative Header Section */}
                <View style={[loginStyles.decorativeHeader, { backgroundColor: Colors.surfaceWarm }]}>
                    <View style={loginStyles.accentBar1} />
                    <View style={loginStyles.accentBar2} />
                </View>

                {/* Header Section with Corner Logos */}
                <View style={[loginStyles.header, { backgroundColor: Colors.surfaceWarm }]}>
                    {/* ICAR-NISST Corner Logos */}
                    <Image 
                        source={require('./src/assets/image/icar_nisst_logo_left.png')} 
                        style={loginStyles.cornerLeftLogo}
                        resizeMode="contain"
                    />
                    <Image 
                        source={require('./src/assets/image/icar_nisst_logo_right.png')} 
                        style={loginStyles.cornerRightLogo}
                        resizeMode="contain"
                    />
                    
                    <Text style={[loginStyles.title, { color: Colors.primary }]}>
                        ICAR NISST SeedMetrics Pro
                    </Text>
                    <Text style={[loginStyles.subtitle, { color: Colors.accent }]}>
                        Bengaluru
                    </Text>
                    <Text style={[loginStyles.description, { color: Colors.gray600 }]}>
                        Seedling Analysis System
                    </Text>
                    <Text style={[loginStyles.institutionText, { color: Colors.gray500 }]}>
                        Indian Council of Agricultural Research
                        National Institute of Seed Science
                    </Text>
                </View>

                <View style={loginStyles.formContainer}>
                    <View style={[loginStyles.section, { backgroundColor: Colors.surface }]}>
                        <Text style={[loginStyles.sectionTitle, { color: Colors.primary }]}>
                            Welcome Back
                        </Text>
                        <Text style={[loginStyles.sectionSubtitle, { color: Colors.gray600 }]}>
                            Sign in to your account
                        </Text>

                        {/* Username Input with Icon */}
                        <View style={loginStyles.inputWrapper}>
                            <Text style={loginStyles.inputIcon}>👤</Text>
                            <TextInput
                                style={[
                                    loginStyles.input,
                                    {
                                        color: Colors.dark,
                                        backgroundColor: Colors.gray50,
                                        borderColor: focusedField === 'username' ? Colors.primary : Colors.gray200,
                                    }
                                ]}
                                placeholder="Username"
                                placeholderTextColor={Colors.gray400}
                                value={username}
                                onChangeText={setUsername}
                                onFocus={() => setFocusedField('username')}
                                onBlur={() => setFocusedField(null)}
                                editable={!loggingIn}
                            />
                        </View>

                        {/* Password Input with Icon */}
                        <View style={loginStyles.inputWrapper}>
                            <Text style={loginStyles.inputIcon}>🔐</Text>
                            <TextInput
                                style={[
                                    loginStyles.input,
                                    {
                                        color: Colors.dark,
                                        backgroundColor: Colors.gray50,
                                        borderColor: focusedField === 'password' ? Colors.primary : Colors.gray200,
                                    }
                                ]}
                                placeholder="Password"
                                placeholderTextColor={Colors.gray400}
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                editable={!loggingIn}
                            />
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            style={[
                                loginStyles.button,
                                loggingIn && loginStyles.disabledButton,
                                { backgroundColor: Colors.primary }
                            ]}
                            onPress={handleLogin}
                            disabled={loggingIn}
                            activeOpacity={0.85}
                        >
                            {loggingIn ? (
                                <ActivityIndicator size="large" color={Colors.white} />
                            ) : (
                                <Text style={[loginStyles.buttonText, { color: Colors.white }]}>
                                    Sign In
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Helper Text */}
                        <View style={loginStyles.infoContainer}>
                            <Text style={[loginStyles.infoLabel, { color: Colors.gray600 }]}>
                                Demo Mode
                            </Text>
                            <Text style={[loginStyles.infoText, { color: Colors.gray500 }]}>
                                Enter any username and password to test the app
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Footer accent */}
                <View style={loginStyles.footerAccent} />
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
                const storedUsername = await AsyncStorage.getItem('username');
                const isLoggedInStored = await AsyncStorage.getItem('is_logged_in');
                
                if (storedUserId && isLoggedInStored === 'true') {
                    setUserId(storedUserId);
                    setUsername(storedUsername || '');
                    setIsLoggedIn(true);
                    console.log('Session restored, user_id:', storedUserId, 'username:', storedUsername);
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

    const [username, setUsername] = useState<string>('');

    const handleLogin = async (newUserId: string, newUsername?: string) => {
        setUserId(newUserId);
        setUsername(newUsername || '');
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
                    <Text style={headerStyles.userLabel}>Welcome,</Text>
                    <Text style={headerStyles.userId}>{username || userId}</Text>
                </View>
                <TouchableOpacity
                    style={headerStyles.logoutButton}
                    onPress={handleLogout}
                >
                    <Text style={headerStyles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Main App Content with Bottom Tab Navigation */}
            <AppWithNavigationTabs userId={userId} username={username} apiUrl={API_URL} />
        </SafeAreaView>
    );
}

// Login Screen Styles
const loginStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    decorativeHeader: {
        paddingVertical: Spacing[12],
        paddingHorizontal: Spacing[8],
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    accentBar1: {
        position: 'absolute',
        bottom: Spacing[4],
        left: Spacing[4],
        width: '30%',
        height: 4,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.full,
        opacity: 0.3,
    },
    accentBar2: {
        position: 'absolute',
        bottom: Spacing[4],
        right: Spacing[4],
        width: '25%',
        height: 4,
        backgroundColor: Colors.accent,
        borderRadius: BorderRadius.full,
        opacity: 0.3,
    },
    header: {
        paddingVertical: Spacing[8],
        paddingHorizontal: Spacing[6],
        alignItems: 'center',
        marginBottom: Spacing[8],
        position: 'relative',
        minHeight: 180,
    },
    cornerLeftLogo: {
        position: 'absolute',
        top: Spacing[2],
        left: Spacing[4],
        width: 120,
        height: 60,
    },
    cornerRightLogo: {
        position: 'absolute',
        top: Spacing[2],
        right: Spacing[4],
        width: 120,
        height: 60,
    },
    title: {
        fontSize: Typography.sizes['2xl'],
        fontWeight: Typography.weights.black,
        marginBottom: Spacing[3],
        letterSpacing: Typography.letterSpacing.tight,
        textAlign: 'center',
        marginTop: Spacing[20],
        paddingTop: Spacing[8],
    },
    subtitle: {
        fontSize: Typography.sizes.lg,
        letterSpacing: Typography.letterSpacing.wide,
        fontWeight: Typography.weights.bold,
        marginBottom: Spacing[2],
        textAlign: 'center',
    },
    description: {
        fontSize: Typography.sizes.sm,
        lineHeight: Typography.lineHeights.snug,
        fontWeight: Typography.weights.medium,
        textAlign: 'center',
        marginTop: Spacing[2],
        paddingHorizontal: Spacing[4],
    },
    institutionText: {
        fontSize: Typography.sizes.xs,
        lineHeight: Typography.lineHeights.snug,
        fontWeight: Typography.weights.regular,
        textAlign: 'center',
        marginTop: Spacing[3],
        paddingHorizontal: Spacing[4],
        fontStyle: 'italic',
    },
    formContainer: {
        paddingHorizontal: Spacing[4],
        marginBottom: Spacing[8],
    },
    section: {
        paddingHorizontal: Spacing[6],
        paddingVertical: Spacing[10],
        borderRadius: BorderRadius.xl,
        ...Shadows.lg,
        borderLeftWidth: 5,
        borderLeftColor: Colors.primary,
        borderTopRightRadius: BorderRadius['2xl'],
        borderBottomRightRadius: BorderRadius['2xl'],
    },
    sectionTitle: {
        fontSize: Typography.sizes['2xl'],
        fontWeight: Typography.weights.extrabold,
        marginBottom: Spacing[2],
        letterSpacing: Typography.letterSpacing.tight,
    },
    sectionSubtitle: {
        fontSize: Typography.sizes.base,
        fontWeight: Typography.weights.medium,
        marginBottom: Spacing[8],
        letterSpacing: Typography.letterSpacing.normal,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing[4],
        position: 'relative',
    },
    inputIcon: {
        fontSize: Typography.sizes['2xl'],
        marginRight: Spacing[3],
        marginLeft: Spacing[1],
    },
    input: {
        flex: 1,
        borderWidth: 2,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing[8],
        paddingHorizontal: Spacing[4],
        fontSize: Typography.sizes.base,
        fontWeight: Typography.weights.medium,
    },
    button: {
        paddingVertical: Spacing[9],
        paddingHorizontal: Spacing[6],
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        marginTop: Spacing[6],
        marginBottom: Spacing[2],
        borderBottomWidth: 4,
        borderBottomColor: Colors.primaryDark,
        ...Shadows.greenLg,
    },
    disabledButton: {
        backgroundColor: Colors.gray400,
        opacity: 0.6,
        borderBottomColor: Colors.gray500,
    },
    buttonText: {
        fontSize: Typography.sizes.lg,
        fontWeight: Typography.weights.bold,
        letterSpacing: Typography.letterSpacing.wide,
    },
    infoContainer: {
        marginTop: Spacing[6],
        paddingTop: Spacing[6],
        borderTopWidth: 1,
        borderTopColor: Colors.gray200,
    },
    infoLabel: {
        fontSize: Typography.sizes.sm,
        fontWeight: Typography.weights.semibold,
        marginBottom: Spacing[2],
        letterSpacing: Typography.letterSpacing.tight,
    },
    infoText: {
        fontSize: Typography.sizes.sm,
        textAlign: 'center',
        fontWeight: Typography.weights.medium,
        lineHeight: Typography.lineHeights.snug,
    },
    footerAccent: {
        height: 3,
        backgroundColor: Colors.primary,
        opacity: 0.1,
        marginHorizontal: Spacing[4],
        borderRadius: BorderRadius.full,
        marginBottom: Spacing[8],
    },
});

// Header Styles
const headerStyles = StyleSheet.create({
    userHeader: {
        backgroundColor: Colors.surfaceWarm,
        paddingVertical: Spacing[2],
        paddingHorizontal: Spacing[4],
        paddingTop: Spacing[14],
        paddingBottom: Spacing[4],
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: Colors.primary,
    },
    userInfo: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: Spacing[2],
        flex: 1,
    },
    userLabel: {
        fontSize: Typography.sizes.sm,
        fontWeight: Typography.weights.bold,
        color: Colors.accent,
    },
    userId: {
        fontSize: Typography.sizes.sm,
        fontWeight: Typography.weights.semibold,
        color: Colors.primary,
        maxWidth: 150,
    },
    logoutButton: {
        backgroundColor: Colors.error,
        paddingVertical: Spacing[2],
        paddingHorizontal: Spacing[3],
        borderRadius: BorderRadius.sm,
        ...Shadows.xs,
        marginLeft: Spacing[2],
    },
    logoutText: {
        color: Colors.white,
        fontSize: Typography.sizes.xs,
        fontWeight: Typography.weights.bold,
        letterSpacing: Typography.letterSpacing.wide,
    },
});

export default App;
