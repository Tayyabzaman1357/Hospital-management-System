# HealthCare Pro - Clinic Management System

A comprehensive healthcare clinic management system built for the Mid Hackathon. This SaaS-based platform helps clinics manage patients, appointments, prescriptions, and provides AI-powered diagnostic assistance.

## 🏥 Features

### Core Features
- **Authentication & Authorization**
  - Secure email/password login
  - Role-based access (Admin, Doctor, Receptionist, Patient)
  - Protected routes
  - Input validation

- **Patient Management**
  - Add/Edit/Delete patients
  - View patient profiles
  - Medical history timeline
  - Search and filter patients

- **Appointment Management**
  - Book appointments
  - Cancel/Update appointments
  - Status tracking (Pending/Confirmed/Completed/Cancelled)
  - Doctor schedule view

- **Prescription System**
  - Create prescriptions with multiple medicines
  - Add dosage, frequency, and duration
  - Doctor's notes and instructions
  - Lifestyle recommendations
  - PDF generation and download

- **Medical History Timeline**
  - Appointment history
  - Diagnosis history
  - Prescription history
  - Timestamp tracking

### AI Features (Pro Plan)
1. **Smart Symptom Checker**
   - Analyzes symptoms, age, gender, and medical history
   - Returns possible conditions
   - Risk level assessment
   - Suggested tests

2. **Prescription Explanation**
   - Simple patient-friendly explanations
   - Lifestyle recommendations
   - Preventive advice
   - Optional Urdu translation

3. **Risk Flagging**
   - Detects repeated infection patterns
   - Identifies chronic symptoms
   - Flags high-risk medication combinations

4. **Predictive Analytics** (Final Hackathon)
   - Most common diseases
   - Patient load forecast
   - Doctor performance trends

### SaaS Features
- **Free Plan**
  - Up to 50 patients
  - Basic appointment management
  - Prescription generation
  - No AI features

- **Pro Plan** ($29/month)
  - Unlimited patients
  - All AI features enabled
  - Advanced analytics
  - Priority support

### Dashboards
- **Admin Dashboard**: Total patients, doctors, appointments, revenue, common diagnoses
- **Doctor Dashboard**: Daily appointments, monthly stats, prescription count
- **Receptionist Dashboard**: Appointment management, patient registration

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase
  - Firebase Authentication
  - Firestore Database
  - Firebase Storage
- **Libraries**:
  - jsPDF (PDF generation)
  - Font Awesome (Icons)
  - Google Fonts (Inter)

## 📁 Database Structure

### Users
```
{
  id: string
  name: string
  email: string
  role: "admin" | "doctor" | "receptionist" | "patient"
  subscriptionPlan: "free" | "pro"
  createdAt: timestamp
  isActive: boolean
}
```

### Patients
```
{
  id: string
  name: string
  age: number
  gender: string
  contact: string
  email: string
  address: string
  bloodGroup: string
  createdBy: string (userId)
  createdAt: timestamp
  updatedAt: timestamp
  lastVisit: timestamp
}
```

### Appointments
```
{
  id: string
  patientId: string
  doctorId: string
  date: string
  time: string
  reason: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  createdBy: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Prescriptions
```
{
  id: string
  patientId: string
  doctorId: string
  appointmentId: string (optional)
  diagnosis: string
  medicines: [
    {
      name: string
      dosage: string
      frequency: string
      duration: number
    }
  ]
  notes: string
  lifestyleRecommendations: string
  createdAt: timestamp
}
```

### DiagnosisLogs
```
{
  id: string
  symptoms: string[]
  age: number
  gender: string
  history: string
  aiResponse: {
    conditions: string[]
    tests: string[]
    riskLevel: "low" | "medium" | "high"
  }
  doctorId: string
  createdAt: timestamp
}
```

## 🚀 Getting Started

### Prerequisites
- A Firebase project with:
  - Authentication enabled (Email/Password)
  - Firestore Database created
  - Storage bucket enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Health-clinic
   ```

2. **Configure Firebase**
   - Open `firebase-config.js`
   - Replace the `firebaseConfig` object with your Firebase project credentials

3. **🎯 Quick Setup (Recommended)**
   - Open `setup.html` in your browser
   - Follow the guided setup wizard
   - It will check your Firebase configuration and create your first admin account

4. **Manual Setup**
   - **Enable Email/Password Authentication:**
     - Go to [Firebase Console → Authentication](https://console.firebase.google.com/project/health-9b03f/authentication/providers)
     - Click "Sign-in method" tab
     - Enable "Email/Password"
     - Click Save
   
   - **Create Firestore Database:**
     - Go to Firebase Console → Firestore Database
     - Click "Create database"
     - Start in test mode
   
   - See `FIREBASE_SETUP.md` for detailed instructions

5. **Run the application**
   - Open `index.html` in a modern web browser
   - Or use a local server:
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js (http-server)
     npx http-server
     ```

6. **Create your first account**
   - Click "Sign Up"
   - Fill in your details
   - Select a role (Admin/Doctor/Receptionist/Patient)
   - Choose a subscription plan

## 📱 Usage

### As Admin
1. View overall clinic statistics
2. Manage all patients and doctors
3. Access analytics dashboard
4. Monitor revenue and performance

### As Doctor
1. View daily appointment schedule
2. Create prescriptions for patients
3. Access AI diagnostic tools
4. View patient medical history

### As Receptionist
1. Register new patients
2. Book appointments
3. Manage appointment schedules
4. Update patient information

### As Patient
1. View your medical history
2. Download prescriptions
3. Book appointments (if enabled)

## 🎨 UI Features

- Clean, modern medical theme
- Responsive design (mobile, tablet, desktop)
- Sidebar navigation
- Toast notifications
- Loading states
- Form validation
- Error handling

## 🔒 Security

- Firebase Authentication for secure login
- Role-based access control
- Protected routes
- Input validation
- Subscription-based feature access

## 📊 Analytics

Track key metrics:
- Total patients and doctors
- Monthly appointments
- Revenue overview
- Most common diagnoses
- Patient load forecast
- Doctor performance

## 🚀 Deployment

### Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Deploy to Netlify
1. Drag and drop your project folder to [Netlify Drop](https://app.netlify.com/drop)
2. Or connect your GitHub repository

### Firebase Hosting
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init hosting

# Deploy
firebase deploy
```

## 📹 Demo Video

Create a 3-7 minute demo video showing:
- Login and role-based dashboards
- Patient management (Add, Edit, View)
- Appointment booking
- Prescription generation (PDF download)
- Medical history timeline
- AI features (Symptom Checker, Prescription Explanation)
- Admin analytics

## 🎯 Future Enhancements

- SMS reminders for appointments
- WhatsApp integration
- Billing module
- Telemedicine consultations
- E-prescription sharing
- Lab test integration
- Multi-clinic support
- Mobile app (React Native/Flutter)

## 🤝 Contributing

This is a hackathon project. Feel free to fork and enhance it!

## 📄 License

MIT License - Feel free to use this for your clinic or startup!

## 💼 Startup Opportunity

This project is designed to be commercialized. To launch as a SaaS:

1. Add payment integration (Stripe/PayPal)
2. Implement multi-tenant architecture
3. Add SMS/Email notifications
4. Create marketing website
5. Approach local clinics for beta testing
6. Iterate based on feedback

## 👨‍💻 Built For

Mid Hackathon - Batch 16 & 17
- Option 2: HTML, CSS, JavaScript + Firebase

## 🙏 Acknowledgments

- Firebase for backend infrastructure
- Font Awesome for icons
- Google Fonts for typography
- jsPDF for PDF generation

---

**Made with ❤️ for the healthcare community**

For questions or support, contact: [Your Email]
