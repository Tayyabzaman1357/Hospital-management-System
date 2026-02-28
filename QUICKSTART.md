# 🚀 Quick Start Guide - HealthCare Pro

## ⚡ 3-Minute Setup

### Step 1: Enable Firebase Authentication (1 minute)

The **400 error** you're seeing means you need to enable Email/Password auth:

1. Go to: https://console.firebase.google.com/project/health-9b03f/authentication/providers
2. Click **"Email/Password"**
3. Toggle **"Enable"** to ON
4. Click **Save**

### Step 2: Enable Firestore API (1 minute) ⚠️ IMPORTANT

The **"permission-denied"** or **"API has not been used"** error means Firestore is disabled:

**🔗 Quick Fix:** Open this page in your browser:
```
enable-firestore.html
```

This page will guide you through enabling Firestore with direct links.

**OR do it manually:**

1. **Enable Firestore API:**
   - Go to: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=health-9b03f
   - Click **"ENABLE"** button

2. **Create Firestore Database:**
   - Go to: https://console.firebase.google.com/project/health-9b03f/firestore
   - Click **"Create database"**
   - Choose **"Start in test mode"**
   - Select location (closest to you)
   - Click **"Enable"**

3. **Wait 30-60 seconds** for changes to propagate

### Step 3: Launch the App (1 minute)

**Option A: Use Setup Wizard (Recommended)**
```
Open: setup.html in your browser
```
The wizard will guide you through everything and create your first admin account.

**Option B: Direct Launch**
```
Open: index.html in your browser
Click "Sign Up"
Create an Admin account with Pro plan
```

## ✅ You're Done!

You can now:
- ✅ Log in to your dashboard
- ✅ Add patients
- ✅ Book appointments
- ✅ Create prescriptions
- ✅ Use AI features (if Pro plan)
- ✅ View analytics

## 🆘 Troubleshooting

### Still getting 400 error?
- Make sure you **enabled** Email/Password authentication (Step 1)
- Refresh the page after enabling
- Clear browser cache

### Getting "permission-denied" or "API has not been used"?
- Firestore API is disabled
- Open `enable-firestore.html` in your browser
- Follow the guided setup with direct links
- OR manually enable Firestore API (see Step 2)
- Wait 30-60 seconds after enabling

### Can't create account?
- Check your internet connection
- Make sure password is at least 6 characters
- Try a different email address

## 📋 Test Credentials

After setup, create these test accounts:

**Admin Account:**
- Email: admin@clinic.com
- Password: admin123
- Role: Admin
- Plan: Pro

**Doctor Account:**
- Email: doctor@clinic.com
- Password: doctor123
- Role: Doctor
- Plan: Pro

**Receptionist Account:**
- Email: receptionist@clinic.com
- Password: receptionist123
- Role: Receptionist
- Plan: Free

## 🎯 What to Demo

For your hackathon submission:

1. **Login** with Admin account
2. **Dashboard** - Show statistics
3. **Add a Patient** - Fill form, save
4. **Book Appointment** - Select patient, doctor, date
5. **Create Prescription** - Add medicines, download PDF
6. **Medical History** - View patient timeline
7. **AI Tools** - Symptom checker, prescription explanation
8. **Analytics** - Show charts and insights

## 📹 Recording Your Demo

1. Start screen recording
2. Show the setup process
3. Create test accounts
4. Demonstrate each feature
5. Keep it 3-7 minutes
6. Upload to YouTube/LinkedIn

## 🔗 Important Links

- **Firebase Console:** https://console.firebase.google.com/project/health-9b03f
- **Authentication:** https://console.firebase.google.com/project/health-9b03f/authentication/providers
- **Firestore:** https://console.firebase.google.com/project/health-9b03f/firestore

---

**Need more help?**
- Check `FIREBASE_SETUP.md` for detailed setup
- Check `README.md` for full documentation
- Open browser console (F12) to see detailed errors

Good luck with your hackathon! 🎉
