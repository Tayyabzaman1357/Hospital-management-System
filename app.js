import { auth, db, storage, collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, setDoc, ref, uploadBytes, getDownloadURL } from './firebase-config.js';
import { onAuthStateChange, signIn, signUp, logOut, hasFeatureAccess, checkPatientLimit, getCurrentUser } from './auth.js';

// Global state
let currentUser = null;
let currentUserData = null;
let currentPatientId = null;
let currentPrescriptionId = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Force hide loading overlay on init
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('active');
        loadingOverlay.style.display = 'none';
    }
    initializeApp();
});

function initializeApp() {
    // Auth state listener
    onAuthStateChange(({ user, userData }) => {
        if (user) {
            currentUser = user;
            currentUserData = userData;
            
            // Ensure all pages are hidden except dashboard
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            
            showDashboard();
        } else {
            currentUser = null;
            currentUserData = null;
            showLogin();
        }
    });

    // Login form
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('signup-form')?.addEventListener('submit', handleSignup);
    document.getElementById('show-signup')?.addEventListener('click', (e) => {
        e.preventDefault();
        showSignup();
    });
    document.getElementById('show-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        showLogin();
    });

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', handleNavigation);
    });
    
    // View All links
    document.querySelectorAll('.btn-link[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            showPage(page);
        });
    });

    // Menu toggle for mobile
    document.getElementById('menu-toggle')?.addEventListener('click', toggleMenu);

    // Patient management
    document.getElementById('add-patient-btn')?.addEventListener('click', () => openPatientModal());
    document.getElementById('patient-form')?.addEventListener('submit', handlePatientSubmit);
    document.getElementById('patient-search')?.addEventListener('input', searchPatients);

    // Appointment management
    document.getElementById('add-appointment-btn')?.addEventListener('click', () => openAppointmentModal());
    document.getElementById('appointment-form')?.addEventListener('submit', handleAppointmentSubmit);

    // Prescription management
    document.getElementById('add-prescription-btn')?.addEventListener('click', () => openPrescriptionModal());
    document.getElementById('prescription-form')?.addEventListener('submit', handlePrescriptionSubmit);

    // AI Tools
    document.getElementById('symptom-checker-form')?.addEventListener('submit', handleSymptomCheck);
    document.getElementById('prescription-explain-form')?.addEventListener('submit', handlePrescriptionExplain);

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllModals();
        });
    });

    // Close modal on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });
}

// Auth handlers
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    showLoading(true);
    const result = await signIn(email, password);
    showLoading(false);
    
    if (result.success) {
        // Check Firestore connection
        try {
            await getDocs(collection(db, 'users'));
            showToast('Login successful!', 'success');
        } catch (firestoreError) {
            console.error('Firestore error:', firestoreError);
            if (firestoreError.message.includes('permission-denied') || 
                firestoreError.message.includes('not been used') ||
                firestoreError.message.includes('disabled')) {
                showToast('Firestore not enabled. Please enable Firestore API in Firebase Console.', 'error');
                showFirestoreSetupModal();
            } else {
                showToast('Login successful but Firestore connection failed. Check console.', 'warning');
            }
        }
    } else {
        showToast(result.error, 'error');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const role = document.getElementById('signup-role').value;
    const plan = document.getElementById('signup-plan').value;
    
    showLoading(true);
    const result = await signUp(email, password, name, role, plan);
    showLoading(false);
    
    if (result.success) {
        // Check Firestore connection
        try {
            await getDocs(collection(db, 'users'));
            showToast('Account created successfully!', 'success');
        } catch (firestoreError) {
            console.error('Firestore error:', firestoreError);
            if (firestoreError.message.includes('permission-denied') || 
                firestoreError.message.includes('not been used') ||
                firestoreError.message.includes('disabled')) {
                showToast('Account created but Firestore not enabled. Please enable Firestore API.', 'warning');
                showFirestoreSetupModal();
            } else {
                showToast('Account created but Firestore connection failed. Check console.', 'warning');
            }
        }
    } else {
        showToast(result.error, 'error');
    }
}

async function handleLogout() {
    await logOut();
    showToast('Logged out successfully', 'success');
}

// Navigation
function handleNavigation(e) {
    e.preventDefault();
    const page = e.currentTarget.dataset.page;
    
    // Check feature access
    if (!hasFeatureAccess(currentUserData, page)) {
        showToast('This feature is only available in Pro plan', 'warning');
        showPage('subscription');
        return;
    }
    
    // Hide loading overlay in case it's stuck
    showLoading(false);
    
    showPage(page);
}

function showPage(pageName) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageName) {
            item.classList.add('active');
        }
    });
    
    // Update pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(`page-${pageName}`)?.classList.add('active');
    
    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'patients': 'Patients',
        'appointments': 'Appointments',
        'prescriptions': 'Prescriptions',
        'ai-tools': 'AI Tools',
        'analytics': 'Analytics',
        'subscription': 'Subscription'
    };
    document.getElementById('page-title').textContent = titles[pageName] || 'Dashboard';
    
    // Load page data
    loadPageData(pageName);
    
    // Close mobile menu
    document.querySelector('.sidebar')?.classList.remove('active');
}

function loadPageData(pageName) {
    try {
        switch(pageName) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'patients':
                loadPatients();
                break;
            case 'appointments':
                loadAppointments();
                break;
            case 'prescriptions':
                loadPrescriptions();
                break;
            case 'ai-tools':
                // AI tools page doesn't need data loading
                break;
            case 'analytics':
                loadAnalytics();
                break;
            case 'subscription':
                // Subscription page doesn't need data loading
                break;
            default:
                loadDashboard();
        }
    } catch (error) {
        console.error(`Error loading page ${pageName}:`, error);
        showToast(`Error loading ${pageName}: ${error.message}`, 'error');
        // Hide loading overlay if stuck
        showLoading(false);
    }
}

// Dashboard
async function loadDashboard() {
    if (!currentUser) return;
    
    try {
        // Ensure dashboard page is visible
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        const dashboardPage = document.getElementById('page-dashboard');
        if (dashboardPage) {
            dashboardPage.classList.add('active');
        }

        const statsContainer = document.getElementById('dashboard-stats');
        const recentAppointmentsContainer = document.getElementById('recent-appointments');
        const quickActionsContainer = document.getElementById('quick-actions');

        // Load stats based on role
        const stats = await getDashboardStats();
    
    let statsHTML = '';
    if (currentUserData?.role === 'admin') {
        statsHTML = `
            <div class="stat-card">
                <div class="stat-icon blue"><i class="fas fa-users"></i></div>
                <div class="stat-content">
                    <div class="stat-label">Total Patients</div>
                    <div class="stat-value">${stats.totalPatients || 0}</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green"><i class="fas fa-user-md"></i></div>
                <div class="stat-content">
                    <div class="stat-label">Total Doctors</div>
                    <div class="stat-value">${stats.totalDoctors || 0}</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange"><i class="fas fa-calendar-check"></i></div>
                <div class="stat-content">
                    <div class="stat-label">Today's Appointments</div>
                    <div class="stat-value">${stats.todayAppointments || 0}</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple"><i class="fas fa-dollar-sign"></i></div>
                <div class="stat-content">
                    <div class="stat-label">Monthly Revenue</div>
                    <div class="stat-value">$${stats.monthlyRevenue || 0}</div>
                </div>
            </div>
        `;
    } else if (currentUserData?.role === 'doctor') {
        statsHTML = `
            <div class="stat-card">
                <div class="stat-icon blue"><i class="fas fa-calendar-day"></i></div>
                <div class="stat-content">
                    <div class="stat-label">Today's Appointments</div>
                    <div class="stat-value">${stats.todayAppointments || 0}</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green"><i class="fas fa-file-prescription"></i></div>
                <div class="stat-content">
                    <div class="stat-label">Prescriptions This Month</div>
                    <div class="stat-value">${stats.monthlyPrescriptions || 0}</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange"><i class="fas fa-users"></i></div>
                <div class="stat-content">
                    <div class="stat-label">Total Patients</div>
                    <div class="stat-value">${stats.myPatients || 0}</div>
                </div>
            </div>
        `;
    } else {
        statsHTML = `
            <div class="stat-card">
                <div class="stat-icon blue"><i class="fas fa-calendar-check"></i></div>
                <div class="stat-content">
                    <div class="stat-label">Today's Appointments</div>
                    <div class="stat-value">${stats.todayAppointments || 0}</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green"><i class="fas fa-users"></i></div>
                <div class="stat-content">
                    <div class="stat-label">Total Patients</div>
                    <div class="stat-value">${stats.totalPatients || 0}</div>
                </div>
            </div>
        `;
    }
    
    statsContainer.innerHTML = statsHTML;
    
    // Load recent appointments
    const appointments = await getRecentAppointments(5);
    if (appointments.length > 0) {
        recentAppointmentsContainer.innerHTML = appointments.map(apt => `
            <div class="appointment-card" style="grid-template-columns: 1fr auto; padding: 16px;">
                <div>
                    <h4>${apt.patientName}</h4>
                    <p>${apt.doctorName || 'Doctor'} • ${formatDate(apt.date)} at ${apt.time}</p>
                    <p style="font-size: 13px; color: var(--gray-500);">${apt.reason || 'Appointment'}</p>
                </div>
                <span class="appointment-status ${apt.status}">${apt.status}</span>
            </div>
        `).join('');
    } else {
        recentAppointmentsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>No Appointments</h3>
                <p>No recent appointments found</p>
            </div>
        `;
    }
    
    // Load quick actions based on role
    const role = currentUserData?.role;
    let quickActionsHTML = '';
    
    if (role === 'admin' || role === 'receptionist') {
        quickActionsHTML = `
            <button class="quick-action-btn" onclick="openPatientModal()">
                <i class="fas fa-user-plus"></i>
                <span>Add Patient</span>
            </button>
            <button class="quick-action-btn" onclick="openAppointmentModal()">
                <i class="fas fa-calendar-plus"></i>
                <span>Book Appointment</span>
            </button>
        `;
    }
    
    if (role === 'doctor') {
        quickActionsHTML = `
            <button class="quick-action-btn" onclick="openPrescriptionModal()">
                <i class="fas fa-file-prescription"></i>
                <span>Create Prescription</span>
            </button>
            <button class="quick-action-btn" onclick="showPage('appointments')">
                <i class="fas fa-calendar-check"></i>
                <span>View Schedule</span>
            </button>
        `;
    }
    
    if (hasFeatureAccess(currentUserData, 'ai-tools')) {
        quickActionsHTML += `
            <button class="quick-action-btn" onclick="showPage('ai-tools')">
                <i class="fas fa-robot"></i>
                <span>AI Symptom Checker</span>
            </button>
        `;
    }

    quickActionsContainer.innerHTML = quickActionsHTML;
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('Error loading dashboard: ' + error.message, 'error');
    }
}

async function getDashboardStats() {
    const stats = {};
    
    // Get patients count
    const patientsSnapshot = await getDocs(collection(db, 'patients'));
    stats.totalPatients = patientsSnapshot.size;
    
    // Get doctors count
    const doctorsQuery = query(collection(db, 'users'), where('role', '==', 'doctor'));
    const doctorsSnapshot = await getDocs(doctorsQuery);
    stats.totalDoctors = doctorsSnapshot.size;
    
    // Get today's appointments
    const today = new Date().toISOString().split('T')[0];
    const aptQuery = query(collection(db, 'appointments'), where('date', '==', today));
    const aptSnapshot = await getDocs(aptQuery);
    stats.todayAppointments = aptSnapshot.size;
    
    // Get monthly prescriptions for doctor
    if (currentUserData?.role === 'doctor') {
        const rxQuery = query(
            collection(db, 'prescriptions'),
            where('doctorId', '==', currentUser.uid)
        );
        const rxSnapshot = await getDocs(rxQuery);
        stats.monthlyPrescriptions = rxSnapshot.size;
        
        // My patients
        const myPatientsQuery = query(
            collection(db, 'patients'),
            where('createdBy', '==', currentUser.uid)
        );
        const myPatientsSnapshot = await getDocs(myPatientsQuery);
        stats.myPatients = myPatientsSnapshot.size;
    }
    
    // Simulated revenue
    stats.monthlyRevenue = Math.floor(Math.random() * 5000) + 2000;
    
    return stats;
}

async function getRecentAppointments(limit = 5) {
    const appointments = [];

    let snapshot;
    
    // Simplified queries without orderBy
    if (currentUserData?.role === 'doctor') {
        const q = query(
            collection(db, 'appointments'),
            where('doctorId', '==', currentUser.uid)
        );
        snapshot = await getDocs(q);
    } else {
        snapshot = await getDocs(collection(db, 'appointments'));
    }

    // Convert to array and sort client-side
    const allAppointments = [];
    snapshot.forEach((docSnapshot) => {
        allAppointments.push({ id: docSnapshot.id, ...docSnapshot.data() });
    });
    
    // Sort by date in JavaScript
    allAppointments.sort((a, b) => {
        const dateA = new Date(a.date + 'T' + (a.time || '00:00'));
        const dateB = new Date(b.date + 'T' + (b.time || '00:00'));
        return dateB - dateA;
    });

    for (const appointmentItem of allAppointments.slice(0, limit)) {
        const data = appointmentItem;

        // Get patient name
        let patientName = 'Unknown';
        if (data.patientId) {
            const patientDoc = await getDoc(doc(db, 'patients', data.patientId));
            if (patientDoc.exists()) {
                patientName = patientDoc.data().name;
            }
        }

        // Get doctor name
        let doctorName = 'Unknown';
        if (data.doctorId) {
            const doctorDoc = await getDoc(doc(db, 'users', data.doctorId));
            if (doctorDoc.exists()) {
                doctorName = doctorDoc.data().name;
            }
        }

        appointments.push({
            id: appointmentItem.id,
            ...data,
            patientName,
            doctorName
        });
    }

    return appointments;
}

// Patient Management
async function loadPatients() {
    const tbody = document.getElementById('patients-table-body');
    
    try {
        const patientsSnapshot = await getDocs(collection(db, 'patients'));

        if (patientsSnapshot.empty) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="empty-state">
                            <i class="fas fa-users"></i>
                            <h3>No Patients Found</h3>
                            <p>Add your first patient to get started</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        const patients = [];
        for (const doc of patientsSnapshot.docs) {
            patients.push({ id: doc.id, ...doc.data() });
        }

        tbody.innerHTML = patients.map(patient => `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="user-avatar" style="width: 36px; height: 36px; font-size: 14px;">
                            ${patient.name.charAt(0)}
                        </div>
                        ${patient.name}
                    </div>
                </td>
                <td>${patient.age || '--'}</td>
                <td>${patient.gender || '--'}</td>
                <td>${patient.contact || '--'}</td>
                <td>${patient.lastVisit ? formatDate(patient.lastVisit) : '--'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="viewPatient('${patient.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit" onclick="editPatient('${patient.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="deletePatient('${patient.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading patients:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Error Loading Patients</h3>
                        <p>${error.message}</p>
                        <button class="btn-primary" onclick="loadPatients()" style="margin-top: 15px;">
                            <i class="fas fa-refresh"></i> Retry
                        </button>
                    </div>
                </td>
            </tr>
        `;
        showToast('Error loading patients: ' + error.message, 'error');
    }
}

async function openPatientModal(patientId = null) {
    const modal = document.getElementById('patient-form-modal');
    const title = document.getElementById('patient-form-title');
    const form = document.getElementById('patient-form');
    
    form.reset();
    document.getElementById('patient-id').value = '';
    
    if (patientId) {
        title.textContent = 'Edit Patient';
        const patientDoc = await getDoc(doc(db, 'patients', patientId));
        if (patientDoc.exists()) {
            const patient = patientDoc.data();
            document.getElementById('patient-id').value = patientId;
            document.getElementById('patient-name').value = patient.name || '';
            document.getElementById('patient-age').value = patient.age || '';
            document.getElementById('patient-gender').value = patient.gender || '';
            document.getElementById('patient-contact').value = patient.contact || '';
            document.getElementById('patient-email').value = patient.email || '';
            document.getElementById('patient-address').value = patient.address || '';
            document.getElementById('patient-blood-group').value = patient.bloodGroup || '';
        }
    } else {
        title.textContent = 'Add Patient';
    }
    
    modal.classList.add('active');
}

async function handlePatientSubmit(e) {
    e.preventDefault();
    
    // Check patient limit for free plan
    if (currentUserData?.subscriptionPlan === 'free') {
        const canAdd = await checkPatientLimit(currentUser.uid);
        if (!canAdd) {
            showToast('Free plan limit reached (50 patients). Upgrade to Pro for unlimited patients.', 'warning');
            return;
        }
    }
    
    const patientId = document.getElementById('patient-id').value;
    const patientData = {
        name: document.getElementById('patient-name').value,
        age: parseInt(document.getElementById('patient-age').value),
        gender: document.getElementById('patient-gender').value,
        contact: document.getElementById('patient-contact').value,
        email: document.getElementById('patient-email').value,
        address: document.getElementById('patient-address').value,
        bloodGroup: document.getElementById('patient-blood-group').value,
        updatedAt: new Date().toISOString()
    };
    
    showLoading(true);
    
    try {
        if (patientId) {
            // Update existing patient
            await updateDoc(doc(db, 'patients', patientId), patientData);
            showToast('Patient updated successfully!', 'success');
        } else {
            // Add new patient
            patientData.createdBy = currentUser.uid;
            patientData.createdAt = new Date().toISOString();
            patientData.lastVisit = null;
            await addDoc(collection(db, 'patients'), patientData);
            showToast('Patient added successfully!', 'success');
        }
        
        closeAllModals();
        loadPatients();
    } catch (error) {
        showToast('Error saving patient: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function viewPatient(patientId) {
    currentPatientId = patientId;
    const modal = document.getElementById('patient-modal');
    const patientDoc = await getDoc(doc(db, 'patients', patientId));
    
    if (patientDoc.exists()) {
        const patient = patientDoc.data();
        document.getElementById('patient-profile-name').textContent = patient.name;
        document.getElementById('patient-profile-details').textContent = 
            `Age: ${patient.age || '--'} | Gender: ${patient.gender || '--'} | Blood Group: ${patient.bloodGroup || '--'}`;
        document.getElementById('patient-profile-contact').textContent = 
            `Contact: ${patient.contact || '--'} | Email: ${patient.email || '--'}`;
        
        // Load medical history
        loadPatientHistory(patientId);
    }
    
    modal.classList.add('active');
}

async function loadPatientHistory(patientId) {
    const content = document.getElementById('patient-tab-content');
    
    // Get appointments
    const aptQuery = query(
        collection(db, 'appointments'),
        where('patientId', '==', patientId),
        orderBy('date', 'desc')
    );
    const aptSnapshot = await getDocs(aptQuery);
    
    // Get prescriptions
    const rxQuery = query(
        collection(db, 'prescriptions'),
        where('patientId', '==', patientId)
    );
    const rxSnapshot = await getDocs(rxQuery);
    
    let html = '<div class="timeline">';
    
    // Add appointments to timeline
    aptSnapshot.forEach(doc => {
        const apt = doc.data();
        html += `
            <div class="timeline-item">
                <div class="timeline-content">
                    <div class="timeline-date">${formatDate(apt.date)}</div>
                    <div class="timeline-title">Appointment - ${apt.status}</div>
                    <div class="timeline-description">${apt.reason || 'Regular checkup'}</div>
                </div>
            </div>
        `;
    });
    
    // Add prescriptions to timeline
    rxSnapshot.forEach(doc => {
        const rx = doc.data();
        html += `
            <div class="timeline-item">
                <div class="timeline-content">
                    <div class="timeline-date">${formatDate(rx.createdAt)}</div>
                    <div class="timeline-title">Prescription</div>
                    <div class="timeline-description">${rx.medicines?.length || 0} medicines prescribed</div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    if (aptSnapshot.empty && rxSnapshot.empty) {
        html = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <h3>No History Yet</h3>
                <p>No medical records found for this patient</p>
            </div>
        `;
    }
    
    content.innerHTML = html;
}

async function editPatient(patientId) {
    openPatientModal(patientId);
}

async function deletePatient(patientId) {
    if (!confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
        return;
    }
    
    showLoading(true);
    try {
        await deleteDoc(doc(db, 'patients', patientId));
        showToast('Patient deleted successfully!', 'success');
        loadPatients();
    } catch (error) {
        showToast('Error deleting patient: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function searchPatients() {
    const searchTerm = document.getElementById('patient-search').value.toLowerCase();
    const rows = document.querySelectorAll('#patients-table-body tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Appointment Management
async function loadAppointments() {
    const grid = document.getElementById('appointments-grid');

    try {
        let snapshot;
        
        // Simplified queries that don't require indexes
        if (currentUserData?.role === 'doctor') {
            const q = query(
                collection(db, 'appointments'),
                where('doctorId', '==', currentUser.uid)
            );
            snapshot = await getDocs(q);
        } else {
            snapshot = await getDocs(collection(db, 'appointments'));
        }

        if (snapshot.empty) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <h3>No Appointments</h3>
                    <p>No appointments found</p>
                </div>
            `;
            return;
        }

        const appointments = [];
        for (const docSnapshot of snapshot.docs) {
            const data = docSnapshot.data();

            // Get patient name
            let patientName = 'Unknown';
            if (data.patientId) {
                const patientDocRef = doc(db, 'patients', data.patientId);
                const patientDoc = await getDoc(patientDocRef);
                if (patientDoc.exists()) {
                    patientName = patientDoc.data().name;
                }
            }

            appointments.push({
                id: docSnapshot.id,
                ...data,
                patientName
            });
        }
        
        // Sort by date in JavaScript (client-side)
        appointments.sort((a, b) => {
            const dateA = new Date(a.date + 'T' + (a.time || '00:00'));
            const dateB = new Date(b.date + 'T' + (b.time || '00:00'));
            return dateB - dateA; // Descending order
        });

        grid.innerHTML = appointments.map(apt => `
            <div class="appointment-card">
                <div class="appointment-time">
                    <div class="time">${formatTime(apt.time)}</div>
                    <div class="period">${getPeriod(apt.time)}</div>
                </div>
                <div class="appointment-details">
                    <h4>${apt.patientName}</h4>
                    <p>${formatDate(apt.date)} • ${apt.reason || 'Regular appointment'}</p>
                </div>
                <div style="display: flex; gap: 12px; align-items: center;">
                    <span class="appointment-status ${apt.status}">${apt.status}</span>
                    ${canManageAppointment(apt) ? `
                        <button class="action-btn edit" onclick="editAppointment('${apt.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="cancelAppointment('${apt.id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        // Populate patient and doctor dropdowns
        populatePatientDropdown();
        populateDoctorDropdown();
    } catch (error) {
        console.error('Error loading appointments:', error);
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Appointments</h3>
                <p>${error.message}</p>
                <button class="btn-primary" onclick="loadAppointments()" style="margin-top: 15px;">
                    <i class="fas fa-refresh"></i> Retry
                </button>
            </div>
        `;
        showToast('Error loading appointments: ' + error.message, 'error');
    }
}

async function openAppointmentModal(appointmentId = null) {
    const modal = document.getElementById('appointment-modal');
    const title = document.getElementById('appointment-form-title');
    const form = document.getElementById('appointment-form');

    form.reset();
    document.getElementById('appointment-id').value = '';

    // Show/hide doctor field based on role
    const doctorGroup = document.getElementById('appointment-doctor-group');
    const statusGroup = document.getElementById('appointment-status-group');
    const doctorSelect = document.getElementById('appointment-doctor');

    if (currentUserData?.role === 'doctor') {
        doctorGroup.style.display = 'none';
        doctorSelect.removeAttribute('required'); // Remove required for doctors
    } else {
        doctorGroup.style.display = 'block';
        doctorSelect.setAttribute('required', 'required'); // Required for others
    }

    if (appointmentId) {
        title.textContent = 'Edit Appointment';
        statusGroup.style.display = 'block';

        const aptDoc = await getDoc(doc(db, 'appointments', appointmentId));
        if (aptDoc.exists()) {
            const apt = aptDoc.data();
            document.getElementById('appointment-id').value = appointmentId;
            document.getElementById('appointment-patient').value = apt.patientId || '';
            document.getElementById('appointment-doctor').value = apt.doctorId || '';
            document.getElementById('appointment-date').value = apt.date || '';
            document.getElementById('appointment-time').value = apt.time || '';
            document.getElementById('appointment-reason').value = apt.reason || '';
            document.getElementById('appointment-status').value = apt.status || 'pending';
        }
    } else {
        title.textContent = 'Book Appointment';
        statusGroup.style.display = 'none';

        // Set default date to today
        document.getElementById('appointment-date').value = new Date().toISOString().split('T')[0];
    }
    
    await populatePatientDropdown();
    await populateDoctorDropdown();
    
    modal.classList.add('active');
}

async function handleAppointmentSubmit(e) {
    e.preventDefault();
    
    const appointmentId = document.getElementById('appointment-id').value;
    const appointmentData = {
        patientId: document.getElementById('appointment-patient').value,
        doctorId: document.getElementById('appointment-doctor').value || currentUser.uid,
        date: document.getElementById('appointment-date').value,
        time: document.getElementById('appointment-time').value,
        reason: document.getElementById('appointment-reason').value,
        status: document.getElementById('appointment-status').value || 'pending',
        updatedAt: new Date().toISOString()
    };
    
    showLoading(true);
    
    try {
        if (appointmentId) {
            await updateDoc(doc(db, 'appointments', appointmentId), appointmentData);
            showToast('Appointment updated successfully!', 'success');
        } else {
            appointmentData.createdBy = currentUser.uid;
            appointmentData.createdAt = new Date().toISOString();
            await addDoc(collection(db, 'appointments'), appointmentData);
            showToast('Appointment booked successfully!', 'success');
        }
        
        closeAllModals();
        loadAppointments();
    } catch (error) {
        showToast('Error saving appointment: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function editAppointment(appointmentId) {
    openAppointmentModal(appointmentId);
}

async function cancelAppointment(appointmentId) {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
        return;
    }
    
    showLoading(true);
    try {
        await updateDoc(doc(db, 'appointments', appointmentId), {
            status: 'cancelled',
            updatedAt: new Date().toISOString()
        });
        showToast('Appointment cancelled!', 'success');
        loadAppointments();
    } catch (error) {
        showToast('Error cancelling appointment: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function populatePatientDropdown() {
    const select = document.getElementById('appointment-patient');
    const prescriptionSelect = document.getElementById('prescription-patient');
    
    const snapshot = await getDocs(collection(db, 'patients'));
    let options = '<option value="">Select Patient</option>';
    
    snapshot.forEach(doc => {
        const patient = doc.data();
        options += `<option value="${doc.id}">${patient.name}</option>`;
    });
    
    if (select) select.innerHTML = options;
    if (prescriptionSelect) prescriptionSelect.innerHTML = options;
}

async function populateDoctorDropdown() {
    const select = document.getElementById('appointment-doctor');
    if (!select) return;

    try {
        const q = query(collection(db, 'users'), where('role', '==', 'doctor'));
        const snapshot = await getDocs(q);
        let options = '<option value="">Select Doctor</option>';

        snapshot.forEach(doc => {
            const doctor = doc.data();
            options += `<option value="${doc.id}">Dr. ${doctor.name}</option>`;
        });

        // If no doctors found, add a note
        const note = document.getElementById('doctor-note');
        if (snapshot.empty) {
            options = '<option value="">No Doctors Available</option>';
            if (note) note.style.display = 'block';
            console.log('No doctors found in the system');
        } else {
            if (note) note.style.display = 'none';
        }

        select.innerHTML = options;
    } catch (error) {
        console.error('Error loading doctors:', error);
        select.innerHTML = '<option value="">Error loading doctors</option>';
        const note = document.getElementById('doctor-note');
        if (note) {
            note.textContent = '⚠️ Error loading doctors. Check console.';
            note.style.display = 'block';
        }
    }
}

function canManageAppointment(appointment) {
    const role = currentUserData?.role;
    return role === 'admin' || role === 'receptionist' || appointment.doctorId === currentUser?.uid;
}

// Prescription Management
async function loadPrescriptions() {
    const tbody = document.getElementById('prescriptions-table-body');
    
    let q;
    if (currentUserData?.role === 'doctor') {
        q = query(
            collection(db, 'prescriptions'),
            where('doctorId', '==', currentUser.uid)
        );
    } else {
        q = collection(db, 'prescriptions');
    }
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <i class="fas fa-file-prescription"></i>
                        <h3>No Prescriptions</h3>
                        <p>No prescriptions found</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    const prescriptions = [];
    for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // Get patient name
        let patientName = 'Unknown';
        if (data.patientId) {
            const patientDoc = await getDoc(doc(db, 'patients', data.patientId));
            if (patientDoc.exists()) {
                patientName = patientDoc.data().name;
            }
        }
        
        // Get doctor name
        let doctorName = 'Unknown';
        if (data.doctorId) {
            const doctorDoc = await getDoc(doc(db, 'users', data.doctorId));
            if (doctorDoc.exists()) {
                doctorName = doctorDoc.data().name;
            }
        }
        
        prescriptions.push({
            id: doc.id,
            ...data,
            patientName,
            doctorName
        });
    }
    
    tbody.innerHTML = prescriptions.map(rx => `
        <tr>
            <td>${rx.patientName}</td>
            <td>${rx.doctorName}</td>
            <td>${formatDate(rx.createdAt)}</td>
            <td>${rx.medicines?.length || 0} medicines</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="viewPrescription('${rx.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function openPrescriptionModal() {
    const modal = document.getElementById('prescription-modal');
    const form = document.getElementById('prescription-form');
    
    form.reset();
    document.getElementById('medicines-container').innerHTML = `
        <div class="medicine-row">
            <input type="text" class="medicine-name" placeholder="Medicine name" required>
            <input type="text" class="medicine-dosage" placeholder="Dosage (e.g., 500mg)" required>
            <input type="text" class="medicine-frequency" placeholder="Frequency (e.g., 2x daily)" required>
            <input type="number" class="medicine-duration" placeholder="Days" min="1" required>
            <button type="button" class="btn-icon btn-remove" onclick="removeMedicine(this)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    await populatePatientDropdown();
    
    // Populate appointments dropdown for doctors
    if (currentUserData?.role === 'doctor') {
        const aptQuery = query(
            collection(db, 'appointments'),
            where('doctorId', '==', currentUser.uid),
            where('status', '==', 'completed')
        );
        const aptSnapshot = await getDocs(aptQuery);
        
        let options = '<option value="">Select Appointment (Optional)</option>';
        aptSnapshot.forEach(doc => {
            const apt = doc.data();
            options += `<option value="${doc.id}">${apt.date} - Patient</option>`;
        });
        
        document.getElementById('prescription-appointment').innerHTML = options;
    }
    
    modal.classList.add('active');
}

async function handlePrescriptionSubmit(e) {
    e.preventDefault();
    
    const medicineRows = document.querySelectorAll('.medicine-row');
    const medicines = [];
    
    medicineRows.forEach(row => {
        const name = row.querySelector('.medicine-name').value;
        const dosage = row.querySelector('.medicine-dosage').value;
        const frequency = row.querySelector('.medicine-frequency').value;
        const duration = row.querySelector('.medicine-duration').value;
        
        if (name && dosage && frequency && duration) {
            medicines.push({ name, dosage, frequency, duration });
        }
    });
    
    if (medicines.length === 0) {
        showToast('Please add at least one medicine', 'error');
        return;
    }
    
    const prescriptionData = {
        patientId: document.getElementById('prescription-patient').value,
        doctorId: currentUser.uid,
        appointmentId: document.getElementById('prescription-appointment').value || null,
        diagnosis: document.getElementById('prescription-diagnosis').value,
        medicines,
        notes: document.getElementById('prescription-notes').value,
        lifestyleRecommendations: document.getElementById('prescription-lifestyle').value,
        createdAt: new Date().toISOString()
    };
    
    showLoading(true);
    
    try {
        const docRef = await addDoc(collection(db, 'prescriptions'), prescriptionData);
        currentPrescriptionId = docRef.id;
        
        // Update patient's last visit
        await updateDoc(doc(db, 'patients', prescriptionData.patientId), {
            lastVisit: new Date().toISOString()
        });
        
        showToast('Prescription created successfully!', 'success');
        closeAllModals();
        loadPrescriptions();
        
        // Show prescription view
        viewPrescription(docRef.id);
    } catch (error) {
        showToast('Error creating prescription: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function viewPrescription(prescriptionId) {
    currentPrescriptionId = prescriptionId;
    const modal = document.getElementById('view-prescription-modal');
    const view = document.getElementById('prescription-view');
    
    const rxDoc = await getDoc(doc(db, 'prescriptions', prescriptionId));
    
    if (rxDoc.exists()) {
        const rx = rxDoc.data();
        
        // Get patient and doctor details
        let patientName = 'Unknown', patientAge = '--', patientGender = '--';
        if (rx.patientId) {
            const patientDoc = await getDoc(doc(db, 'patients', rx.patientId));
            if (patientDoc.exists()) {
                const p = patientDoc.data();
                patientName = p.name;
                patientAge = p.age;
                patientGender = p.gender;
            }
        }
        
        let doctorName = 'Unknown';
        if (rx.doctorId) {
            const doctorDoc = await getDoc(doc(db, 'users', rx.doctorId));
            if (doctorDoc.exists()) {
                doctorName = doctorDoc.data().name;
            }
        }
        
        view.innerHTML = `
            <div class="prescription-header">
                <h2><i class="fas fa-heartbeat"></i> HealthCare Pro</h2>
                <p>Prescription Record</p>
            </div>
            
            <div class="prescription-info">
                <div class="info-group">
                    <label>Patient Name</label>
                    <p>${patientName}</p>
                </div>
                <div class="info-group">
                    <label>Age/Gender</label>
                    <p>${patientAge} / ${patientGender}</p>
                </div>
                <div class="info-group">
                    <label>Doctor</label>
                    <p>${doctorName}</p>
                </div>
                <div class="info-group">
                    <label>Date</label>
                    <p>${formatDate(rx.createdAt)}</p>
                </div>
            </div>
            
            ${rx.diagnosis ? `
            <div class="prescription-section">
                <h4>Diagnosis</h4>
                <p>${rx.diagnosis}</p>
            </div>
            ` : ''}
            
            <div class="prescription-section">
                <h4>Medicines</h4>
                <ul class="medicine-list">
                    ${rx.medicines.map(m => `
                        <li>
                            <div class="medicine-name">${m.name}</div>
                            <div class="medicine-details">
                                ${m.dosage} • ${m.frequency} • ${m.duration} days
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>
            
            ${rx.notes ? `
            <div class="prescription-section">
                <h4>Instructions</h4>
                <p>${rx.notes}</p>
            </div>
            ` : ''}
            
            ${rx.lifestyleRecommendations ? `
            <div class="prescription-section">
                <h4>Lifestyle Recommendations</h4>
                <p>${rx.lifestyleRecommendations}</p>
            </div>
            ` : ''}
        `;
    }
    
    modal.classList.add('active');
}

// AI Features
async function handleSymptomCheck(e) {
    e.preventDefault();
    
    if (!hasFeatureAccess(currentUserData, 'ai-tools')) {
        showToast('AI features require Pro plan', 'warning');
        showPage('subscription');
        return;
    }
    
    const symptoms = [];
    document.querySelectorAll('.symptom-input').forEach(input => {
        if (input.value.trim()) {
            symptoms.push(input.value.trim());
        }
    });
    
    const age = document.getElementById('sc-age').value;
    const gender = document.getElementById('sc-gender').value;
    const history = document.getElementById('sc-history').value;
    
    showLoading(true);
    
    try {
        // Simulated AI analysis (in production, call actual AI API)
        const aiResponse = await analyzeSymptomsAI(symptoms, age, gender, history);
        
        document.getElementById('sc-conditions').innerHTML = aiResponse.conditions
            .map(c => `<span class="risk-badge medium">${c}</span>`).join('');
        
        const riskElement = document.getElementById('sc-risk');
        riskElement.textContent = aiResponse.riskLevel;
        riskElement.className = `risk-badge ${aiResponse.riskLevel.toLowerCase()}`;
        
        document.getElementById('sc-tests').innerHTML = aiResponse.tests
            .map(t => `<div>• ${t}</div>`).join('');
        
        document.getElementById('symptom-results').style.display = 'block';
        showToast('AI analysis complete!', 'success');
    } catch (error) {
        showToast('AI analysis failed: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function analyzeSymptomsAI(symptoms, age, gender, history) {
    // Simulated AI response - replace with actual AI API call
    // This is a fallback that always works
    
    const symptomKeywords = {
        'fever': { conditions: ['Viral Infection', 'Bacterial Infection', 'Flu'], tests: ['CBC', 'Blood Culture'], risk: 'medium' },
        'headache': { conditions: ['Tension Headache', 'Migraine', 'Sinusitis'], tests: ['CT Scan', 'MRI'], risk: 'low' },
        'cough': { conditions: ['Common Cold', 'Bronchitis', 'Pneumonia'], tests: ['Chest X-Ray', 'Sputum Test'], risk: 'medium' },
        'chest pain': { conditions: ['Angina', 'GERD', 'Anxiety'], tests: ['ECG', 'Cardiac Enzymes'], risk: 'high' },
        'abdominal pain': { conditions: ['Gastritis', 'Appendicitis', 'IBS'], tests: ['Ultrasound', 'CT Abdomen'], risk: 'medium' },
        'fatigue': { conditions: ['Anemia', 'Thyroid Disorder', 'Depression'], tests: ['CBC', 'TSH', 'Vitamin D'], risk: 'low' }
    };
    
    let conditions = [], tests = [], riskLevel = 'low';
    
    symptoms.forEach(symptom => {
        const lowerSymptom = symptom.toLowerCase();
        Object.keys(symptomKeywords).forEach(keyword => {
            if (lowerSymptom.includes(keyword)) {
                const data = symptomKeywords[keyword];
                conditions.push(...data.conditions);
                tests.push(...data.tests);
                if (data.risk === 'high') riskLevel = 'high';
                else if (data.risk === 'medium' && riskLevel !== 'high') riskLevel = 'medium';
            }
        });
    });
    
    if (conditions.length === 0) {
        conditions = ['General Consultation Recommended'];
        tests = ['Basic Health Checkup'];
    }
    
    // Remove duplicates
    conditions = [...new Set(conditions)];
    tests = [...new Set(tests)];
    
    // Save to diagnosis logs
    try {
        await addDoc(collection(db, 'diagnosisLogs'), {
            symptoms,
            age,
            gender,
            history,
            aiResponse: { conditions, tests, riskLevel },
            createdAt: new Date().toISOString(),
            doctorId: currentUser.uid
        });
    } catch (e) {
        console.error('Error saving diagnosis log:', e);
    }
    
    return { conditions, tests, riskLevel };
}

async function handlePrescriptionExplain(e) {
    e.preventDefault();
    
    if (!hasFeatureAccess(currentUserData, 'ai-tools')) {
        showToast('AI features require Pro plan', 'warning');
        showPage('subscription');
        return;
    }
    
    const medicines = document.getElementById('pe-medicines').value;
    const diagnosis = document.getElementById('pe-diagnosis').value;
    const includeUrdu = document.getElementById('pe-urdu').checked;
    
    showLoading(true);
    
    try {
        const explanation = await generatePrescriptionExplanationAI(medicines, diagnosis);
        
        document.getElementById('pe-explanation').innerHTML = `
            <div style="line-height: 1.8;">${explanation.simple}</div>
            ${explanation.lifestyle ? `<div style="margin-top: 16px;"><strong>Lifestyle Tips:</strong><br>${explanation.lifestyle}</div>` : ''}
        `;
        
        if (includeUrdu) {
            document.getElementById('pe-urdu-text').textContent = explanation.urdu || 'Urdu translation not available';
            document.getElementById('pe-urdu-text').style.display = 'block';
        } else {
            document.getElementById('pe-urdu-text').style.display = 'none';
        }
        
        document.getElementById('explanation-results').style.display = 'block';
        showToast('Explanation generated!', 'success');
    } catch (error) {
        showToast('Failed to generate explanation: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function generatePrescriptionExplanationAI(medicines, diagnosis) {
    // Simulated AI explanation
    return {
        simple: `Based on your diagnosis of ${diagnosis || 'your condition'}, your doctor has prescribed the following medications. Please take all medicines as directed by your doctor. Complete the full course even if you start feeling better. If you experience any side effects, contact your doctor immediately.`,
        lifestyle: 'Get adequate rest, drink plenty of water, eat a balanced diet, and avoid strenuous activities until you recover.',
        urdu: includeUrduText(diagnosis)
    };
}

function includeUrduText(diagnosis) {
    return 'آپ کی تشخیص کی بنیاد پر، آپ کے ڈاکٹر نے درج ذیل ادویات تجویز کی ہیں۔ برائے مہربانی تمام ادویات ڈاکٹر کے ہدایت کے مطابق استعمال کریں۔';
}

async function analyzePatientRisks() {
    if (!hasFeatureAccess(currentUserData, 'ai-tools')) {
        showToast('AI features require Pro plan', 'warning');
        showPage('subscription');
        return;
    }
    
    showLoading(true);
    
    try {
        const patientsSnapshot = await getDocs(collection(db, 'patients'));
        const riskResults = [];
        
        // Analyze each patient's history
        for (const patientDoc of patientsSnapshot.docs) {
            const patient = patientDoc.data();
            
            // Get patient's appointments
            const aptQuery = query(
                collection(db, 'appointments'),
                where('patientId', '==', patientDoc.id)
            );
            const aptSnapshot = await getDocs(aptQuery);
            
            // Check for repeated visits (potential chronic condition)
            if (aptSnapshot.size >= 5) {
                riskResults.push({
                    patientName: patient.name,
                    risk: 'High frequency of visits',
                    level: 'medium'
                });
            }
        }
        
        const riskList = document.getElementById('risk-list');
        
        if (riskResults.length > 0) {
            riskList.innerHTML = riskResults.map(r => `
                <div class="risk-item">
                    <h5>${r.patientName}</h5>
                    <p>${r.risk}</p>
                </div>
            `).join('');
            document.getElementById('risk-results').style.display = 'block';
        } else {
            riskList.innerHTML = '<p>No high-risk patterns detected</p>';
            document.getElementById('risk-results').style.display = 'block';
        }
        
        showToast('Risk analysis complete!', 'success');
    } catch (error) {
        showToast('Risk analysis failed: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Analytics
async function loadAnalytics() {
    if (!hasFeatureAccess(currentUserData, 'analytics')) {
        showToast('Analytics requires Pro plan', 'warning');
        showPage('subscription');
        return;
    }
    
    const period = document.getElementById('analytics-period')?.value || 'month';
    
    // Load analytics stats
    const statsContainer = document.getElementById('analytics-stats');
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon blue"><i class="fas fa-users"></i></div>
            <div class="stat-content">
                <div class="stat-label">Total Patients</div>
                <div class="stat-value">${Math.floor(Math.random() * 100) + 50}</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon green"><i class="fas fa-calendar-check"></i></div>
            <div class="stat-content">
                <div class="stat-label">Appointments</div>
                <div class="stat-value">${Math.floor(Math.random() * 50) + 20}</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon orange"><i class="fas fa-file-prescription"></i></div>
            <div class="stat-content">
                <div class="stat-label">Prescriptions</div>
                <div class="stat-value">${Math.floor(Math.random() * 30) + 10}</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon purple"><i class="fas fa-dollar-sign"></i></div>
            <div class="stat-content">
                <div class="stat-label">Revenue</div>
                <div class="stat-value">$${Math.floor(Math.random() * 3000) + 1000}</div>
            </div>
        </div>
    `;
    
    // Common diagnoses
    document.getElementById('common-diagnoses').innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <span>Viral Fever</span>
                <div style="flex: 1; margin: 0 16px; background: var(--gray-200); border-radius: 4px; height: 8px;">
                    <div style="width: 75%; background: var(--primary-color); height: 100%; border-radius: 4px;"></div>
                </div>
                <span>75%</span>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <span>Respiratory Infection</span>
                <div style="flex: 1; margin: 0 16px; background: var(--gray-200); border-radius: 4px; height: 8px;">
                    <div style="width: 60%; background: var(--success-color); height: 100%; border-radius: 4px;"></div>
                </div>
                <span>60%</span>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <span>Gastritis</span>
                <div style="flex: 1; margin: 0 16px; background: var(--gray-200); border-radius: 4px; height: 8px;">
                    <div style="width: 45%; background: var(--warning-color); height: 100%; border-radius: 4px;"></div>
                </div>
                <span>45%</span>
            </div>
        </div>
    `;
    
    // Patient forecast
    document.getElementById('patient-forecast').innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div style="font-size: 36px; font-weight: 700; color: var(--primary-color);">+15%</div>
            <p style="color: var(--gray-600);">Expected patient increase next month</p>
        </div>
    `;
    
    // Doctor performance
    document.getElementById('doctor-performance').innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="padding: 12px; background: var(--gray-50); border-radius: 8px;">
                <strong>Dr. Smith</strong>
                <div style="font-size: 13px; color: var(--gray-600);">45 patients this month</div>
            </div>
            <div style="padding: 12px; background: var(--gray-50); border-radius: 8px;">
                <strong>Dr. Johnson</strong>
                <div style="font-size: 13px; color: var(--gray-600);">38 patients this month</div>
            </div>
        </div>
    `;
    
    // Revenue
    document.getElementById('revenue-overview').innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 42px; font-weight: 700; color: var(--success-color);">$4,250</div>
            <p style="color: var(--gray-600);">This month's revenue</p>
            <div style="margin-top: 12px; color: var(--success-color);">
                <i class="fas fa-arrow-up"></i> 12% from last month
            </div>
        </div>
    `;
}

// Helper functions
function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (!overlay) return;
    
    if (show) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

function showLogin() {
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('signup-page').style.display = 'none';
    document.getElementById('dashboard-page').style.display = 'none';
}

function showSignup() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('signup-page').style.display = 'flex';
    document.getElementById('dashboard-page').style.display = 'none';
}

function showDashboard() {
    // Force hide loading overlay
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('active');
        loadingOverlay.style.display = 'none';
    }

    document.getElementById('login-page').style.display = 'none';
    document.getElementById('signup-page').style.display = 'none';
    document.getElementById('dashboard-page').style.display = 'flex';

    // Update user info in sidebar
    if (currentUserData) {
        document.getElementById('user-name').textContent = currentUserData.name;
        document.getElementById('user-role').textContent = currentUserData.role;

        // Update subscription badge
        const badge = document.getElementById('subscription-badge');
        if (badge) {
            badge.innerHTML = `<i class="fas fa-crown"></i><span>${currentUserData.subscriptionPlan || 'Free'}</span>`;
        }

        // Show/hide nav items based on role and plan
        const isPro = currentUserData.subscriptionPlan === 'pro';
        const role = currentUserData.role;

        document.getElementById('nav-ai-tools').style.display = isPro ? 'flex' : 'none';
        document.getElementById('nav-analytics').style.display = isPro ? 'flex' : 'none';
        document.getElementById('nav-subscription').style.display = role === 'admin' || !isPro ? 'flex' : 'none';

        // Show/hide patient nav based on role
        document.getElementById('nav-patients').style.display =
            (role === 'admin' || role === 'doctor' || role === 'receptionist') ? 'flex' : 'none';
        document.getElementById('nav-appointments').style.display = 'flex';
        document.getElementById('nav-prescriptions').style.display = 'flex';
        
        // Set dashboard as active page
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === 'dashboard') {
                item.classList.add('active');
            }
        });
        
        // Set page title
        document.getElementById('page-title').textContent = 'Dashboard';
    }

    loadDashboard();
}

function toggleMenu() {
    document.querySelector('.sidebar')?.classList.toggle('active');
}

function showFirestoreSetupModal() {
    // Redirect to dedicated Firestore setup page
    window.location.href = 'enable-firestore.html';
}

function formatDate(dateString) {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(timeString) {
    if (!timeString) return '--';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function getPeriod(timeString) {
    if (!timeString) return '';
    const [hours] = timeString.split(':');
    return parseInt(hours) >= 12 ? 'PM' : 'AM';
}

// Global functions for onclick handlers
window.openPatientModal = openPatientModal;
window.editPatient = editPatient;
window.deletePatient = deletePatient;
window.viewPatient = viewPatient;
window.openAppointmentModal = openAppointmentModal;
window.editAppointment = editAppointment;
window.cancelAppointment = cancelAppointment;
window.viewPrescription = viewPrescription;
window.downloadPrescriptionPDF = downloadPrescriptionPDF;
window.analyzePatientRisks = analyzePatientRisks;
window.loadAnalytics = loadAnalytics;
window.addMedicine = addMedicine;
window.removeMedicine = removeMedicine;
window.addSymptomInput = addSymptomInput;
window.upgradeToPro = upgradeToPro;
window.showPage = showPage; // Make showPage globally accessible
window.loadAppointments = loadAppointments; // Make loadAppointments globally accessible

// Function definitions for global access
function addMedicine() {
    const container = document.getElementById('medicines-container');
    const newRow = document.createElement('div');
    newRow.className = 'medicine-row';
    newRow.innerHTML = `
        <input type="text" class="medicine-name" placeholder="Medicine name" required>
        <input type="text" class="medicine-dosage" placeholder="Dosage (e.g., 500mg)" required>
        <input type="text" class="medicine-frequency" placeholder="Frequency (e.g., 2x daily)" required>
        <input type="number" class="medicine-duration" placeholder="Days" min="1" required>
        <button type="button" class="btn-icon btn-remove" onclick="removeMedicine(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(newRow);
}

function removeMedicine(btn) {
    const container = document.getElementById('medicines-container');
    if (container.children.length > 1) {
        btn.parentElement.remove();
    } else {
        showToast('At least one medicine is required', 'warning');
    }
}

function addSymptomInput() {
    const container = document.getElementById('symptoms-container');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'symptom-input';
    input.placeholder = 'Enter a symptom';
    input.style.marginTop = '8px';
    container.appendChild(input);
}

function downloadPrescriptionPDF() {
    if (typeof window.jspdf === 'undefined') {
        showToast('PDF library loading, please try again', 'warning');
        return;
    }
    
    const doc = new window.jspdf.jsPDF();
    
    const view = document.getElementById('prescription-view');
    if (!view) return;
    
    // Simple PDF generation
    doc.setFontSize(20);
    doc.text('HealthCare Pro - Prescription', 20, 20);
    
    doc.setFontSize(12);
    const text = view.innerText;
    const lines = doc.splitTextToSize(text, 170);
    doc.text(lines, 20, 40);
    
    doc.save(`prescription-${currentPrescriptionId}.pdf`);
    showToast('PDF downloaded!', 'success');
}

function upgradeToPro() {
    showToast('Contact admin to upgrade to Pro plan', 'info');
}
