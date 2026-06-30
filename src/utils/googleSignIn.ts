import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID } from '@config/env';

export const configureGoogleSignIn = () => {
  console.log('[googleSignIn] Configuring with webClientId:', GOOGLE_WEB_CLIENT_ID);
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    offlineAccess: false,
  });
};

export const signInWithGoogle = async (): Promise<{
  idToken: string;
  user: { id: string; name: string; email: string; photo: string | null };
}> => {
  try {
    const playServices = await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    console.log('[signInWithGoogle] hasPlayServices:', playServices);

    // Check if already signed in
    const isSignedIn = await GoogleSignin.isSignedIn();
    console.log('[signInWithGoogle] isSignedIn:', isSignedIn);
    if (isSignedIn) {
      const currentUser = await GoogleSignin.getCurrentUser();
      console.log('[signInWithGoogle] currentUser:', currentUser ? 'exists' : 'null');
      await GoogleSignin.signOut();
    }

    const userInfo = await GoogleSignin.signIn();
    console.log('[signInWithGoogle] signIn success, user keys:', Object.keys(userInfo));
    console.log('[signInWithGoogle] has idToken:', !!userInfo.idToken);
    if (!userInfo.idToken) {
      throw new Error('No ID token returned from Google Sign-In');
    }
    return {
      idToken: userInfo.idToken,
      user: {
        id: userInfo.user.id,
        name: userInfo.user.name ?? '',
        email: userInfo.user.email ?? '',
        photo: userInfo.user.photo ?? null,
      },
    };
  } catch (err: any) {
    const code = err.code;
    let codeName = 'UNKNOWN';
    for (const [key, val] of Object.entries(statusCodes)) {
      if (val === code) { codeName = key; break; }
    }
    console.error('[signInWithGoogle] signIn error:', err.message);
    console.error('[signInWithGoogle] error code:', code, `(${codeName})`);
    console.error('[signInWithGoogle] error stack:', err.stack);
    throw err;
  }
};

export const signOutFromGoogle = async () => {
  try {
    await GoogleSignin.signOut();
  } catch {
    // ignore
  }
};

export { statusCodes };
