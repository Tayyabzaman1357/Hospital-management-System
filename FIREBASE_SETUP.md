# 🔥 Firebase Setup Guide for HealthCare Pro

## Step 1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **health-9b03f**

## Step 2: Enable Email/Password Authentication ⚠️ **IMPORTANT**

The 400 error you're seeing means Email/Password authentication is **not enabled**.

### To Fix:
1. In Firebase Console, click **Authentication** in the left sidebar
2. Click the **Sign-in method** tab
3. Find **Email/Password** in the list
4. Click on it
5. Toggle **Enable** to ON
6. Click **Save**

![Enable Email/Password Auth](https://i.imgur.com/example.png)

## Step 3: Create Firestore Database

1. In Firebase Console, click **Firestore Database** in the left sidebar
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select a location (choose closest to you)
5. Click **Enable**

## Step 4: Set Up Firestore Security Rules

1. In Firestore, go to the **Rules** tab
2. Copy the content from `firestore.rules` in this project
3. Paste it into the Firebase Console rules editor
4. Click **Publish**

## Step 5: Create Your First Admin Account

1. Open the app (`index.html`)
2. Click **Sign Up**
3. Fill in:
   - Name: Your Name
   - Email: your@email.com
   - Password: (min 6 characters)
   - Role: **Admin**
   - Plan: **Pro** (to test all features)
4. Click **Create Account**

## Step 6: Add Sample Data (Optional)

After logging in as admin, you can:
- Add doctors
- Add receptionists
- Add patients
- Create appointments

## Common Errors & Solutions

### ❌ Error: 400 Bad Request (OPERATION_NOT_ALLOWED)
**Solution:** Enable Email/Password authentication (Step 2)

### ❌ Error: Firestore not found
**Solution:** Create Firestore database (Step 3)

### ❌ Error: Permission denied
**Solution:** Update Firestore security rules (Step 4)

### ❌ Error: Network error
**Solution:** Check your internet connection

## Testing Your Setup

1. Open `test.html` in your browser
2. All checks should show ✅ green
3. If any show ❌ red, follow the error message

## Quick Start Commands

```bash
# Start local server
npm start

# Or use Python
python -m http.server 8080

# Then open http://localhost:8080
```

## Firebase Project URL
Your project: https://console.firebase.google.com/project/health-9b03f

---

**Need Help?**
- Check browser console (F12) for detailed errors
- Make sure you're using the correct Firebase config
- Verify Email/Password auth is enabled

Good luck with your hackathon! 🚀
