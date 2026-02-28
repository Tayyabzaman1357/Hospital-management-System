import { auth, db, collection, addDoc, getDocs, query, where, doc, setDoc } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Auth state observer
export function onAuthStateChange(callback) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Get user data from Firestore
            const userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', user.email)));
            let userData = null;
            if (!userDoc.empty) {
                userData = userDoc.docs[0].data();
                userData.id = userDoc.docs[0].id;
            }
            callback({ user, userData });
        } else {
            callback({ user: null, userData: null });
        }
    });
}

// Sign up
export async function signUp(email, password, name, role, plan = 'free') {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update display name
        await updateProfile(user, { displayName: name });
        
        // Create user document in Firestore
        const userData = {
            id: user.uid,
            name,
            email,
            role,
            subscriptionPlan: plan,
            createdAt: new Date().toISOString(),
            isActive: true
        };
        
        await setDoc(doc(db, 'users', user.uid), userData);
        
        return { success: true, user: { ...user, userData } };
    } catch (error) {
        console.error('Sign up error:', error);
        let errorMessage = 'Sign up failed. ';
        
        if (error.code === 'auth/email-already-in-use') {
            errorMessage += 'This email is already registered. Please sign in instead.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage += 'Invalid email address.';
        } else if (error.code === 'auth/operation-not-allowed') {
            errorMessage += 'Email/Password authentication is not enabled in Firebase Console.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage += 'Password should be at least 6 characters.';
        } else if (error.message.includes('API_KEY_INVALID')) {
            errorMessage += 'Firebase API key is invalid.';
        } else if (error.message.includes('NETWORK_REQUEST_FAILED')) {
            errorMessage += 'Network error. Please check your internet connection.';
        } else {
            errorMessage += error.message || 'Please try again.';
        }
        
        return { success: false, error: errorMessage };
    }
}

// Sign in
export async function signIn(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Get user data from Firestore
        const userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
        let userData = null;
        if (!userDoc.empty) {
            userData = userDoc.docs[0].data();
            userData.id = userDoc.docs[0].id;
        }
        
        return { success: true, user: { ...user, userData } };
    } catch (error) {
        console.error('Sign in error:', error);
        let errorMessage = 'Login failed. ';
        
        if (error.code === 'auth/invalid-email') {
            errorMessage += 'Invalid email address.';
        } else if (error.code === 'auth/user-disabled') {
            errorMessage += 'This account has been disabled.';
        } else if (error.code === 'auth/user-not-found') {
            errorMessage += 'No account found with this email. Please sign up first.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage += 'Incorrect password. Please try again.';
        } else if (error.code === 'auth/invalid-credential') {
            errorMessage += 'Invalid email or password. Please check your credentials or sign up.';
        } else if (error.message.includes('API_KEY_INVALID')) {
            errorMessage += 'Firebase API key is invalid. Check your Firebase configuration.';
        } else if (error.message.includes('OPERATION_NOT_ALLOWED')) {
            errorMessage += 'Email/Password authentication is not enabled in Firebase Console. Please enable it.';
        } else {
            errorMessage += error.message || 'Please try again.';
        }
        
        return { success: false, error: errorMessage };
    }
}

// Sign out
export async function logOut() {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Get current user
export function getCurrentUser() {
    return auth.currentUser;
}

// Check if user has access to feature based on subscription
export function hasFeatureAccess(userData, feature) {
    if (!userData) return false;

    const { subscriptionPlan } = userData;

    // Dashboard is always accessible
    if (feature === 'dashboard') {
        return true;
    }

    // Free plan restrictions
    if (subscriptionPlan === 'free') {
        const freePlanFeatures = ['patients', 'appointments', 'prescriptions'];
        if (!freePlanFeatures.includes(feature)) {
            return false;
        }
    }

    return true;
}

// Check patient limit for free plan
export async function checkPatientLimit(userId) {
    const patientsRef = collection(db, 'patients');
    const q = query(patientsRef, where('createdBy', '==', userId));
    const snapshot = await getDocs(q);
    
    // Free plan limit: 50 patients
    return snapshot.size < 50;
}
