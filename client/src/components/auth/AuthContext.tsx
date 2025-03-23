import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<UserCredential>;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  logOut: () => Promise<void>;
  signInWithGoogle: () => Promise<UserCredential | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if Firebase is properly initialized
  useEffect(() => {
    if (!auth) {
      console.error("Firebase Auth is not initialized!");
      setLoading(false);
      return () => {};
    }
    
    // Handle redirect result first (if user is coming back from a redirect)
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log("Google sign-in redirect result:", result.user.uid);
          // You can dispatch an event or show a toast here
        }
      } catch (error) {
        console.error("Error handling redirect result:", error);
      } finally {
        setLoading(false);
      }
    };
  
    handleRedirectResult();
    
    // Then set up the auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user ? `User ${user.uid} logged in` : "No user");
      setCurrentUser(user);
      if (loading) setLoading(false);
    });
  
    return unsubscribe;
  }, []);

  // Sign up with email and password
  const signUp = async (email: string, password: string, name?: string) => {
    if (!auth) throw new Error("Firebase Auth is not initialized!");
    
    try {
      console.log("Attempting to create user with email:", email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with name if provided
      if (name && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: name
        });
      }
      
      console.log("User created successfully:", userCredential.user.uid);
      return userCredential;
    } catch (error: any) {
      console.error("Sign up error:", error.code, error.message);
      throw error;
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase Auth is not initialized!");
    
    try {
      console.log("Attempting to sign in with email:", email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("User signed in successfully:", userCredential.user.uid);
      return userCredential;
    } catch (error: any) {
      console.error("Sign in error:", error.code, error.message);
      throw error;
    }
  };

  // Sign out
  const logOut = async () => {
    if (!auth) throw new Error("Firebase Auth is not initialized!");
    
    try {
      console.log("Attempting to sign out");
      await signOut(auth);
      console.log("User signed out successfully");
    } catch (error: any) {
      console.error("Sign out error:", error.code, error.message);
      throw error;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    if (!auth) throw new Error("Firebase Auth is not initialized!");
    
    try {
      console.log("Attempting to sign in with Google");
      const provider = new GoogleAuthProvider();
      
      // Add these lines to improve popup behavior
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Try using redirect instead of popup for more reliable behavior
      if (window.innerWidth < 768) {
        // On mobile, use redirect (more reliable)
        console.log("Using redirect for Google auth (mobile detected)");
        await signInWithRedirect(auth, provider);
        return null; // This won't actually return as the page will redirect
      } else {
        // On desktop, use popup
        console.log("Using popup for Google auth");
        return await signInWithPopup(auth, provider);
      }
    } catch (error: any) {
      if (error.code !== 'auth/cancelled-popup-request' && 
          error.code !== 'auth/popup-closed-by-user') {
        console.error("Google sign in error:", error.code, error.message);
      } else {
        console.log("User cancelled the Google sign-in");
      }
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    signUp,
    signIn,
    logOut,
    signInWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : <div>Loading authentication...</div>}
    </AuthContext.Provider>
  );
}