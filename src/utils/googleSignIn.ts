import { Linking } from 'react-native';
import { api } from '@api/api';

/**
 * Google Sign-In for React Native
 * Opens Google OAuth URL in browser and handles callback
 */
export const handleGoogleSignIn = async (): Promise<{
  success: boolean;
  token?: string;
  user?: any;
  error?: string;
}> => {
  try {
    // Get Google OAuth URL from backend
    const response = await api.auth.getGoogleAuthUrl();
    
    if (!response.success || !response.data?.authUrl) {
      return {
        success: false,
        error: 'Failed to get Google Sign-In URL',
      };
    }

    const authUrl = response.data.authUrl;
    
    // Open browser for OAuth
    const canOpen = await Linking.canOpenURL(authUrl);
    
    if (!canOpen) {
      return {
        success: false,
        error: 'Cannot open browser for Google Sign-In',
      };
    }

    // Open the OAuth URL
    await Linking.openURL(authUrl);
    
    // Note: In a production app, you would:
    // 1. Set up deep linking to handle the callback
    // 2. Extract the token from the callback URL
    // 3. Send it to your backend for verification
    // 4. Store the token and update auth state
    
    return {
      success: true,
      error: 'Please complete sign-in in the browser. Deep linking will be handled automatically.',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Google Sign-In failed',
    };
  }
};

/**
 * Handle Google OAuth callback
 * This should be called when the app receives a deep link from Google OAuth
 */
export const handleGoogleCallback = async (callbackUrl: string): Promise<{
  success: boolean;
  token?: string;
  user?: any;
  error?: string;
}> => {
  try {
    // Extract token from callback URL
    const url = new URL(callbackUrl);
    const token = url.searchParams.get('token');
    const error = url.searchParams.get('error');

    if (error) {
      return {
        success: false,
        error: decodeURIComponent(error),
      };
    }

    if (!token) {
      return {
        success: false,
        error: 'No token received from Google Sign-In',
      };
    }

    // Verify token with backend and get user info
    // This would typically be done via your backend API
    // For now, we'll return the token
    
    return {
      success: true,
      token,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to process Google callback',
    };
  }
};

