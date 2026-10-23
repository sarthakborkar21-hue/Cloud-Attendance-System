import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase/config';
import { INITIAL_USERS } from '../firebase/mockData';

const AuthContext = createContext(null);
const SESSION_STORAGE_KEY = 'cas_current_session_user';

function clearSession(setCurrentUser, setUserRole, setUserProfile) {
  setCurrentUser(null);
  setUserRole(null);
  setUserProfile(null);
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

async function getProfile(firebaseUser) {
  const snapshot = await getDoc(doc(db, 'users', firebaseUser.uid));
  if (!snapshot.exists()) {
    throw new Error('Your Firebase account has no Firestore users profile. Contact your administrator.');
  }
  const profile = snapshot.data();
  const role = profile.role;
  if (!['admin', 'teacher', 'student'].includes(role)) {
    throw new Error('Your Firestore users profile must have role set to lowercase admin, teacher, or student. Contact your administrator.');
  }
  return {
    ...profile,
    role,
    uid: firebaseUser.uid,
    email: firebaseUser.email
  };
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        try {
          const user = JSON.parse(stored);
          if (['admin', 'teacher', 'student'].includes(user.role)) {
            setCurrentUser(user);
            setUserRole(user.role);
            setUserProfile(user);
          }
        } catch (error) {
          console.error('Unable to restore local demo session:', error);
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
      setLoading(false);
      return undefined;
    }

    let authEventId = 0;
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      const currentEventId = ++authEventId;
      if (!firebaseUser) {
        clearSession(setCurrentUser, setUserRole, setUserProfile);
        setLoading(false);
        return;
      }

      try {
        const profile = await getProfile(firebaseUser);
        if (currentEventId !== authEventId) return;
        setAuthError('');
        setCurrentUser(firebaseUser);
        setUserRole(profile.role);
        setUserProfile(profile);
      } catch (error) {
        console.error('Unable to load the authenticated user profile:', error);
        if (currentEventId !== authEventId) return;
        setAuthError(error.message || 'Unable to load your Firestore profile.');
        clearSession(setCurrentUser, setUserRole, setUserProfile);
      } finally {
        if (currentEventId === authEventId) setLoading(false);
      }
    });
    return () => {
      authEventId++;
      unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    setAuthError('');
    if (isFirebaseConfigured && auth) {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      let profile;
      try {
        profile = await getProfile(credential.user);
      } catch (error) {
        await signOut(auth);
        throw error;
      }
      setCurrentUser(credential.user);
      setUserRole(profile.role);
      setUserProfile(profile);
      return { user: credential.user, role: profile.role };
    }

    const savedUsers = localStorage.getItem('cas_users');
    const users = savedUsers ? JSON.parse(savedUsers) : INITIAL_USERS;
    const found = users.find(user => user.email.toLowerCase() === email.toLowerCase());
    if (!found) throw new Error('Demo user not found. Choose a local demo login.');
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const sessionUser = {
      ...found,
      displayName: found.displayName || found.name || email.split('@')[0]
    };
    setCurrentUser(sessionUser);
    setUserRole(sessionUser.role);
    setUserProfile(sessionUser);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser));
    return { user: sessionUser, role: sessionUser.role };
  };

  const register = async (email, password, profileData = {}) => {
    if (isFirebaseConfigured && auth && db) {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const profile = {
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: profileData.name || email.split('@')[0],
        role: 'student',
        phone: profileData.phone || '',
        department: profileData.department || '',
        createdAt: new Date().toISOString()
      };
      try {
        await setDoc(doc(db, 'users', credential.user.uid), profile);
      } catch (error) {
        await signOut(auth);
        throw error;
      }
      setCurrentUser(credential.user);
      setUserRole('student');
      setUserProfile(profile);
      return { user: credential.user, role: 'student' };
    }

    const savedUsers = localStorage.getItem('cas_users');
    const users = savedUsers ? JSON.parse(savedUsers) : INITIAL_USERS;
    if (users.some(user => user.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists.');
    }
    const user = {
      uid: `usr-${Date.now()}`,
      email,
      displayName: profileData.name || email.split('@')[0],
      role: 'student',
      phone: profileData.phone || '',
      department: profileData.department || '',
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('cas_users', JSON.stringify([...users, user]));
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    setCurrentUser(user);
    setUserRole('student');
    setUserProfile(user);
    return { user, role: 'student' };
  };

  const switchDemoRole = targetRole => {
    if (isFirebaseConfigured) return;
    const demoUser = INITIAL_USERS.find(user => user.role === targetRole);
    if (!demoUser) return;
    setCurrentUser(demoUser);
    setUserRole(demoUser.role);
    setUserProfile(demoUser);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(demoUser));
  };

  const updateUserProfile = async updates => {
    const allowedUpdates = {
      displayName: updates.displayName,
      phone: updates.phone || ''
    };
    if (isFirebaseConfigured && auth?.currentUser && db) {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), allowedUpdates);
      const profile = { ...userProfile, ...allowedUpdates };
      setUserProfile(profile);
      return profile;
    }
    if (!currentUser) throw new Error('Sign in before updating your profile.');
    const user = { ...currentUser, ...allowedUpdates };
    setCurrentUser(user);
    setUserProfile(user);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    return user;
  };

  const changePassword = async (currentPassword, newPassword) => {
    if (!isFirebaseConfigured || !auth?.currentUser || !auth.currentUser.email) {
      throw new Error('Password changes require a Firebase-authenticated account.');
    }
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
    await updatePassword(auth.currentUser, newPassword);
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) await signOut(auth);
    clearSession(setCurrentUser, setUserRole, setUserProfile);
  };

  const value = {
    currentUser,
    userRole,
    userProfile,
    authError,
    clearAuthError: () => setAuthError(''),
    loading,
    login,
    register,
    logout,
    switchDemoRole,
    updateUserProfile,
    changePassword,
    isFirebaseConfigured
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
