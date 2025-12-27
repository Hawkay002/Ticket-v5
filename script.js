import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";   
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, addDoc, onSnapshot, getDocs, getDoc, query, deleteDoc, updateDoc, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ==========================================
// 1. FIREBASE CONFIGURATION
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyBYzmAZQ8sKHjXgVh_t-vbtYN_gRzBstw8",
    authDomain: "ticket-backend-5ee83.firebaseapp.com",
    projectId: "ticket-backend-5ee83",
    storageBucket: "ticket-backend-5ee83.firebasestorage.app",
    messagingSenderId: "370130815796",
    appId: "1:370130815796:web:33df8249fcc68ddc0f7361",
    measurementId: "G-CED9W20PBK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==========================================
// 2. CONSTANTS & GLOBAL STATE
// ==========================================
const APP_COLLECTION_ROOT = 'ticket_events_data';
const SHARED_DATA_ID = 'shared_event_db'; 
const ADMIN_EMAIL = 'admin.test@gmail.com';

const MANAGED_USERS = [
    { email: 'eveman.test@gmail.com', role: 'Event Manager' },
    { email: 'regdesk.test@gmail.com', role: 'Registration Desk' },
    { email: 'sechead.test@gmail.com', role: 'Security Head' }
];

// User & Auth State
let currentUser = null;
let currentUsername = null; 
let currentDeviceId = null;

// ======================================================
// EASTER EGG AUDIO SETUP
// ======================================================
const easterEggAudio = new Audio('music.mp3'); 
easterEggAudio.loop = true;

// Firestore Unsubscribers
let ticketsUnsubscribe = null;
let settingsUnsubscribe = null;
let adminPresenceUnsubscribes = []; 
let lockUnsubscribe = null;

// Intervals
let autoCheckInterval = null;
let heartbeatInterval = null;
let adminUiRefreshInterval = null;

// Data State
let bookedTickets = [];
let currentFilteredTickets = []; 
let selectedTicketIds = new Set(); 
let eventSettings = { name: '', place: '', deadline: '' };

// Admin/Security State
let remoteLockedTabs = []; 
let selectedUserForConfig = null; 
let selectedUsernamesForLock = new Set(); 
let managedUsersDeviceCache = {}; 
let currentLockData = null; 

// Logs State
let allActivityLogs = [];
let currentFilteredLogs = []; 
let currentLogFilter = 'all';
let isLogSelectionMode = false; 
let selectedLogIds = new Set(); 

// UI State
let searchTerm = '';
let currentFilter = 'all'; 
let currentGenderFilter = 'all';
let currentSort = 'newest';
let isSelectionMode = false;
let isCooldown = false; 

// ==========================================
// 3. DOM ELEMENT SELECTION
// ==========================================

// Login & Loading
const loginOverlay = document.getElementById('login-overlay');
const loadingScreen = document.getElementById('loading-screen');
const appContent = document.getElementById('appContent');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const togglePassword = document.getElementById('togglePassword');
const loginButton = document.getElementById('loginButton');
const authError = document.getElementById('auth-error');
const userEmailDisplay = document.getElementById('userEmailDisplay');
const logoutBtn = document.getElementById('logoutBtn');

// Gatekeeper Elements
const usernameGatekeeperModal = document.getElementById('username-gatekeeper-modal');
const gatekeeperUsernameInput = document.getElementById('gatekeeperUsernameInput');
const gatekeeperSubmitBtn = document.getElementById('gatekeeperSubmitBtn');
const gatekeeperError = document.getElementById('gatekeeper-error');
const gatekeeperLogoutBtn = document.getElementById('gatekeeperLogoutBtn');

// Navigation
const navButtons = document.querySelectorAll('.nav-btn');
const tabs = document.querySelectorAll('.tab-content');
const navLogsBtn = document.getElementById('nav-logs');

// Admin Panel
const adminLockPanel = document.getElementById('admin-lock-panel');
const userLockStatus = document.getElementById('user-lock-status');
const managedUsersList = document.getElementById('managed-users-list');
const userLockConfigArea = document.getElementById('user-lock-config-area');
const selectedUserEmailSpan = document.getElementById('selected-user-email');
const remoteLockCheckboxes = document.querySelectorAll('.remote-lock-checkbox');
const triggerLockModalBtn = document.getElementById('triggerLockModalBtn');
const triggerBtnText = document.getElementById('triggerBtnText');
const factoryResetBtn = document.getElementById('factoryResetBtn');
const usernameListContainer = document.getElementById('username-list-container');
const selectAllUsernamesBtn = document.getElementById('selectAllUsernamesBtn');

// Admin Lock Modal & NEW Reason Selector Elements
const adminLockModal = document.getElementById('admin-lock-modal');
const lockTargetEmailSpan = document.getElementById('lock-target-email');
const adminLockPassword = document.getElementById('adminLockPassword');
const toggleAdminLockPassword = document.getElementById('toggleAdminLockPassword');
const cancelAdminLock = document.getElementById('cancelAdminLock');
const confirmAdminLock = document.getElementById('confirmAdminLock');
// New Admin Elements
const reasonOptions = document.querySelectorAll('.reason-option');
const maintenanceTimeInput = document.getElementById('maintenanceTimeInput');
const lockPreviewBox = document.getElementById('lockPreviewBox');
const maintHours = document.getElementById('maintHours');
const maintMins = document.getElementById('maintMins');

// NEW: User Lock Popup Elements
const lockReasonModal = document.getElementById('lock-reason-modal');
const lockPopupTitle = document.getElementById('lockPopupTitle');
const lockPopupMessage = document.getElementById('lockPopupMessage');
const lockPopupIcon = document.getElementById('lockPopupIcon');
const lockPopupDuration = document.getElementById('lockPopupDuration');
const lockDurationText = document.getElementById('lockDurationText');
const dontShowLockPopupAgain = document.getElementById('dontShowLockPopupAgain');
const lockPopupRefreshBtn = document.getElementById('lockPopupRefreshBtn');
const closeLockPopupBtn = document.getElementById('closeLockPopupBtn');


// Factory Reset Modal
const factoryResetModal = document.getElementById('factory-reset-modal');
const factoryResetPasswordInput = document.getElementById('factoryResetPasswordInput');
const toggleFactoryPassword = document.getElementById('toggleFactoryPassword');
const cancelFactoryReset = document.getElementById('cancelFactoryReset');
const confirmFactoryReset = document.getElementById('confirmFactoryReset');

// Scanner
const startScanBtn = document.getElementById('startScanBtn');
const scannerVideo = document.getElementById('scanner-video');
const scanResult = document.getElementById('scanResult');

// Guest List & Filters
const bookedTicketsTable = document.getElementById('bookedTicketsTable');
const refreshStatusIndicator = document.getElementById('refreshStatusIndicator');
const searchInput = document.getElementById('searchGuestInput');
const filterSortBtn = document.getElementById('filterSortBtn');
const filterDropdown = document.getElementById('filterDropdown');

// Logs Elements
const refreshLogsBtn = document.getElementById('refreshLogsBtn');
const searchLogsInput = document.getElementById('searchLogsInput');
const filterLogsTypeBtn = document.getElementById('filterLogsTypeBtn');
const filterLogsDropdown = document.getElementById('filterLogsDropdown');
const activityLogsTable = document.getElementById('activityLogsTable');

// Logs Controls
const selectLogsBtn = document.getElementById('selectLogsBtn');
const deleteLogsBtn = document.getElementById('deleteLogsBtn');
const selectAllLogsCheckbox = document.getElementById('selectAllLogsCheckbox');
const logsSelectAllContainer = document.querySelector('.logs-select-all-container');
const logsSelectionCountSpan = document.getElementById('logsSelectionCount');

// Selection & Export
const selectBtn = document.getElementById('selectBtn');
const deleteBtn = document.getElementById('deleteBtn');
const selectAllCheckbox = document.getElementById('selectAllCheckbox');
const selectAllContainer = document.querySelector('.select-all-container');
const selectionCountSpan = document.getElementById('selectionCount');
const exportTriggerBtn = document.getElementById('exportTriggerBtn');
const exportModal = document.getElementById('export-modal');
const exportFileName = document.getElementById('exportFileName');
const exportFormat = document.getElementById('exportFormat');
const cancelExportBtn = document.getElementById('cancelExport');
const confirmExportBtn = document.getElementById('confirmExport');
const exportCountMsg = document.getElementById('export-count-msg');

// Ticket Creation & Views
const ticketForm = document.getElementById('ticketForm');
const eventSettingsForm = document.getElementById('eventSettingsForm');
const whatsappBtn = document.getElementById('whatsappBtn');
const ticketViewModal = document.getElementById('ticket-view-modal');
const closeTicketModal = document.getElementById('closeTicketModal');
const modalWhatsAppBtn = document.getElementById('modalWhatsAppBtn');

// Delete Modals
const confirmModal = document.getElementById('confirm-modal');
const deleteCountSpan = document.getElementById('delete-count');
const cancelDeleteBtn = document.getElementById('cancelDelete');
const confirmDeleteBtn = document.getElementById('confirmDelete');
let pendingDeleteIds = [];

const confirmLogDeleteModal = document.getElementById('confirm-log-delete-modal');
const deleteLogCountSpan = document.getElementById('delete-log-count');
const cancelLogDeleteBtn = document.getElementById('cancelLogDelete');
const confirmLogDeleteBtn = document.getElementById('confirmLogDelete');
let pendingLogDeleteIds = [];

// Contact Tray
const contactTray = document.getElementById('contactTray');
const trayToggle = document.getElementById('trayToggle');
const trayIcon = document.getElementById('trayIcon');

// Network Status Dot
const syncStatusDot = document.querySelector('.sync-dot');


// ==========================================
// 4. ENTER KEY HANDLERS (NEW)
// ==========================================

function addEnterKeyHandler(inputElement, buttonElement) {
    if (inputElement && buttonElement) {
        inputElement.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                buttonElement.click();
                inputElement.blur(); // Hides keyboard on mobile
            }
        });
    }
}

// Apply to Login
addEnterKeyHandler(emailInput, loginButton);
addEnterKeyHandler(passwordInput, loginButton);

// Apply to Gatekeeper
addEnterKeyHandler(gatekeeperUsernameInput, gatekeeperSubmitBtn);

// Apply to Admin Modals
addEnterKeyHandler(adminLockPassword, confirmAdminLock);
addEnterKeyHandler(factoryResetPasswordInput, confirmFactoryReset);

// Apply to Export Modal
addEnterKeyHandler(exportFileName, confirmExportBtn);


// ==========================================
// 5. LOGGING INFRASTRUCTURE
// ==========================================

async function logAction(actionType, details) {
    if (!currentUser) return;
    try {
        await addDoc(collection(db, 'activity_logs'), {
            timestamp: Date.now(),
            userEmail: currentUser.email,
            username: currentUsername || 'Auth Pending',
            action: actionType,
            details: details
        });
    } catch (e) {
        console.warn("Failed to log activity:", e);
    }
}


// ==========================================
// 6. AUTHENTICATION LIFECYCLE
// ==========================================

function getDeviceId() {
    let id = localStorage.getItem('device_session_id');
    if (!id) {
        id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('device_session_id', id);
    }
    return id;
}

function startHeartbeat(userEmail) {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    currentDeviceId = getDeviceId();
    
    updateHeartbeat(userEmail);
    heartbeatInterval = setInterval(() => {
        updateHeartbeat(userEmail);
    }, 10000);
}

async function updateHeartbeat(userEmail) {
    if (!navigator.onLine) return; 
    try {
        const deviceRef = doc(db, 'global_presence', userEmail, 'devices', currentDeviceId);
        await setDoc(deviceRef, {
            lastSeen: Date.now(),
            userAgent: navigator.userAgent,
            username: currentUsername || 'unknown' 
        }, { merge: true });
    } catch (e) {
        console.warn("Heartbeat update skipped");
    }
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        loadingScreen.style.display = 'none';
        loginOverlay.style.display = 'none';

        if (user.email === ADMIN_EMAIL) {
            currentUsername = "ADMIN";
            initializeAppSession();
            logAction("LOGIN", "Admin logged in via email.");
        } else {
            appContent.style.display = 'none';
            usernameGatekeeperModal.style.display = 'flex'; 
            gatekeeperUsernameInput.value = '';
            gatekeeperUsernameInput.focus();
        }
    } else {
        resetAppState();
        loadingScreen.style.display = 'none';
        loginOverlay.style.display = 'flex';
        appContent.style.display = 'none';
        usernameGatekeeperModal.style.display = 'none';
    }
});

// --- GATEKEEPER LOGIC ---

gatekeeperSubmitBtn.addEventListener('click', async () => {
    const inputUsername = gatekeeperUsernameInput.value.trim();
    if (!inputUsername) return;

    gatekeeperSubmitBtn.textContent = "Verifying...";
    gatekeeperSubmitBtn.disabled = true;
    gatekeeperError.style.display = 'none';

    try {
        const userDocRef = doc(db, 'allowed_usernames', inputUsername);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.email && userData.email !== currentUser.email) throw new Error("Email mismatch");

            currentUsername = inputUsername;
            userEmailDisplay.textContent = `${userData.realName} (${inputUsername})`;
            usernameGatekeeperModal.style.display = 'none';
            
            logAction("LOGIN", `Staff identity verified: ${inputUsername}`);
            initializeAppSession();
        } else {
            throw new Error("Username not found");
        }
    } catch (error) {
        console.error("Gatekeeper error:", error);
        gatekeeperError.textContent = "Invalid username or account mismatch.";
        gatekeeperError.style.display = 'block';
    } finally {
        gatekeeperSubmitBtn.textContent = "Verify Identity";
        gatekeeperSubmitBtn.disabled = false;
    }
});

gatekeeperLogoutBtn.addEventListener('click', async () => {
    await signOut(auth);
    window.location.reload();
});

// --- INITIALIZE MAIN APP ---

function initializeAppSession() {
    appContent.style.display = 'block';
    setupRealtimeListeners();
    startHeartbeat(currentUser.email);

    if (currentUser.email === ADMIN_EMAIL) {
        setupAdminPanel();
        initGlobalSecurity(); 
        remoteLockedTabs = []; 
        userEmailDisplay.textContent = "Administrator";
        if(navLogsBtn) navLogsBtn.style.display = 'inline-block';
        if(eventSettingsForm) eventSettingsForm.style.display = 'block';
    } else {
        listenForRemoteLocks(currentUser.email);
        adminLockPanel.style.display = 'none';
        userLockStatus.style.display = 'block';
        if(navLogsBtn) navLogsBtn.style.display = 'none';
        if(eventSettingsForm) eventSettingsForm.style.display = 'none';
    }

    if(autoCheckInterval) clearInterval(autoCheckInterval);
    autoCheckInterval = setInterval(performSync, 30000); 
    
    updateNetworkStatus();
    showToast("Welcome", `Logged in as ${currentUsername}`);
}

function resetAppState() {
    currentUser = null;
    currentUsername = null;
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (adminUiRefreshInterval) clearInterval(adminUiRefreshInterval);
    if (ticketsUnsubscribe) ticketsUnsubscribe();
    if (settingsUnsubscribe) settingsUnsubscribe();
    if (lockUnsubscribe) lockUnsubscribe();
    adminPresenceUnsubscribes.forEach(unsub => unsub());
    adminPresenceUnsubscribes = [];
}

loginButton.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    authError.style.display = 'none';
    loginButton.textContent = "Verifying...";
    loginButton.disabled = true;

    if (!email || !password) {
        showError("Please enter email and password.");
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error("Login Error:", error);
        showError("Access Denied. Please check credentials.");
    } finally {
        loginButton.textContent = "Authenticate";
        loginButton.disabled = false;
    }
});

function showError(msg) {
    authError.textContent = msg;
    authError.style.display = 'block';
    loginButton.textContent = "Authenticate";
    loginButton.disabled = false;
}

logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.reload();
    } catch (error) {
        window.location.reload();
    }
});

if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function () {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
}


// ==========================================
// 7. INSTANT ADMIN DASHBOARD LOGIC
// ==========================================

function setupAdminPanel() {
    adminLockPanel.style.display = 'block';
    userLockStatus.style.display = 'none';
    
    adminPresenceUnsubscribes.forEach(unsub => unsub());
    adminPresenceUnsubscribes = [];
    managedUsersDeviceCache = {};

    MANAGED_USERS.forEach(user => {
        const devicesRef = collection(db, 'global_presence', user.email, 'devices');
        const unsub = onSnapshot(devicesRef, (snapshot) => {
            const deviceData = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if(data.lastSeen) deviceData.push(data);
            });
            managedUsersDeviceCache[user.email] = deviceData;
            renderManagedUsersList();
            if (selectedUserForConfig === user.email) {
                 fetchAndRenderUsernames(user.email);
            }
        });
        adminPresenceUnsubscribes.push(unsub);
    });

    if(adminUiRefreshInterval) clearInterval(adminUiRefreshInterval);
    adminUiRefreshInterval = setInterval(renderManagedUsersList, 5000); 
    renderManagedUsersList();
}

function renderManagedUsersList() {
    if (!currentUser || currentUser.email !== ADMIN_EMAIL) return;
    
    const container = managedUsersList;
    const now = Date.now();
    const hasCards = container.querySelector('.user-card');
    
    if (!hasCards) {
        container.innerHTML = ''; 
        MANAGED_USERS.forEach(user => {
            const card = document.createElement('div');
            card.className = 'user-card';
            card.dataset.email = user.email; 
            card.onclick = () => selectUserForConfig(user.email);
            card.innerHTML = `
                <div class="user-card-info">
                    <span class="user-card-email">${user.email}</span>
                    <span class="user-card-role">${user.role}</span>
                </div>
                <div class="user-status-indicator" data-status-target="${user.email}">
                    Offline
                </div>
            `;
            container.appendChild(card);
        });
    }

    Array.from(container.children).forEach(card => {
        const email = card.dataset.email;
        if (!email) return;

        if (selectedUserForConfig === email) {
            if (!card.classList.contains('active-selection')) card.classList.add('active-selection');
        } else {
            if (card.classList.contains('active-selection')) card.classList.remove('active-selection');
        }

        const deviceData = managedUsersDeviceCache[email] || [];
        let activeDevices = 0;
        let activeUsernames = new Set();

        deviceData.forEach(d => {
            if (now - d.lastSeen < 30000) {
                activeDevices++;
                if (d.username && d.username !== 'unknown') activeUsernames.add(d.username);
            }
        });

        const isOnline = activeDevices > 0;
        const statusEl = card.querySelector(`[data-status-target="${email}"]`);
        
        let statusText = 'Offline';
        if (isOnline) {
            const count = activeUsernames.size;
            statusText = `<span class="status-dot-pulse"></span><span>${count} Active</span>`;
        } else {
            const lastSeenTime = Math.max(...deviceData.map(d => d.lastSeen || 0));
            if (lastSeenTime > 0) {
                const diff = now - lastSeenTime;
                const timeStr = diff < 3600000 ? Math.floor(diff / 60000) + 'm ago' : Math.floor(diff / 3600000) + 'h ago';
                statusText = `Offline <span style="font-size:0.7em; opacity:0.6; margin-left:3px;">(${timeStr})</span>`;
            }
        }
        
        if (isOnline && !statusEl.classList.contains('online')) statusEl.classList.add('online');
        if (!isOnline && statusEl.classList.contains('online')) statusEl.classList.remove('online');
        if (statusEl.innerHTML !== statusText) statusEl.innerHTML = statusText;
    });
}

// -------------------------------------------------------------
// USERNAME FETCHING AND SELECTION LOGIC
// -------------------------------------------------------------

window.selectUserForConfig = async function(email) {
    selectedUserForConfig = email;
    selectedUserEmailSpan.textContent = email;
    userLockConfigArea.style.display = 'block';
    renderManagedUsersList(); 
    remoteLockCheckboxes.forEach(cb => cb.checked = false);
    selectedUsernamesForLock.clear();
    currentLockData = null;

    // Reset Reason UI to defaults initially
    resetLockReasonUI();

    await fetchAndRenderUsernames(email);

    try {
        triggerBtnText.textContent = "Loading...";
        triggerLockModalBtn.disabled = true;

        const lockDoc = await getDoc(doc(db, 'global_locks', email));
        if (lockDoc.exists()) {
            currentLockData = lockDoc.data();
        }

        updateAdminLockButtonState();
    } catch (error) {
        console.error("Error fetching user locks:", error);
        showToast("Error", "Could not fetch current lock status.");
    } finally {
        triggerLockModalBtn.disabled = false;
    }
};

// HELPER: Reset Reason UI
function resetLockReasonUI() {
    const basicRadio = document.querySelector('input[name="lockReason"][value="basic"]');
    if(basicRadio) {
        basicRadio.checked = true;
        reasonOptions.forEach(o => o.classList.remove('selected'));
        basicRadio.closest('.reason-option').classList.add('selected');
    }
    if(maintenanceTimeInput) {
        maintenanceTimeInput.style.display = 'none';
        if(maintHours) maintHours.value = '';
        if(maintMins) maintMins.value = '';
    }
    updateLockPreview('basic');
}

async function fetchAndRenderUsernames(email) {
    if (!usernameListContainer.hasChildNodes()) {
         usernameListContainer.innerHTML = '<span style="color:#666; font-size: 0.8rem;">Loading associated usernames...</span>';
    }
    
    try {
        const q = query(collection(db, 'allowed_usernames'), where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        usernameListContainer.innerHTML = '';
        if (querySnapshot.empty) {
            usernameListContainer.innerHTML = '<span style="color:#888; font-style: italic;">No specific usernames found. Create via console.</span>';
            return;
        }

        const now = Date.now();
        const deviceData = managedUsersDeviceCache[email] || [];
        const onlineUsernames = new Set();
        
        deviceData.forEach(d => {
            if (now - d.lastSeen < 30000) { 
                if (d.username && d.username !== 'unknown') {
                    onlineUsernames.add(d.username);
                }
            }
        });

        let userArray = [];
        querySnapshot.forEach((doc) => {
            userArray.push({
                username: doc.id,
                isOnline: onlineUsernames.has(doc.id)
            });
        });
        
        userArray.sort((a, b) => {
            if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1; 
            return a.username.localeCompare(b.username);
        });

        userArray.forEach(userObj => {
            const { username, isOnline } = userObj;
            const chip = document.createElement('div');
            chip.className = `username-chip ${isOnline ? 'online' : ''}`;
            if (selectedUsernamesForLock.has(username)) chip.classList.add('selected');
            chip.dataset.username = username;
            const iconClass = isOnline ? 'fa-solid fa-user-check' : 'fa-solid fa-user';
            chip.innerHTML = `<i class="${iconClass}"></i> ${username}`;
            
            // --- UPDATED CHIP CLICK HANDLER ---
            chip.addEventListener('click', () => {
                if (selectedUsernamesForLock.has(username)) {
                    selectedUsernamesForLock.delete(username);
                    chip.classList.remove('selected');
                } else {
                    selectedUsernamesForLock.add(username);
                    chip.classList.add('selected');
                }
                
                // Smart UI Update based on Selection
                if (selectedUsernamesForLock.size === 1 && currentLockData) {
                    const [singleUser] = selectedUsernamesForLock;
                    
                    // 1. Set Checkboxes
                    const locks = (currentLockData.userSpecificLocks && currentLockData.userSpecificLocks[singleUser]) || [];
                    remoteLockCheckboxes.forEach(cb => {
                        cb.checked = locks.includes(cb.value);
                    });

                    // 2. Set Reason & Duration (NEW Logic)
                    if (currentLockData.lockMetadata && currentLockData.lockMetadata[singleUser]) {
                        const meta = currentLockData.lockMetadata[singleUser];
                        
                        // Select Radio
                        const radioToSelect = document.querySelector(`input[name="lockReason"][value="${meta.type}"]`);
                        if (radioToSelect) {
                            radioToSelect.checked = true;
                            // Update Visuals
                            reasonOptions.forEach(o => o.classList.remove('selected'));
                            radioToSelect.closest('.reason-option').classList.add('selected');
                            
                            // Show/Hide Maintenance Inputs & Fill Data
                            if (meta.type === 'maintenance') {
                                maintenanceTimeInput.style.display = 'block';
                                // Simple parser for "2 hr 30 min" string
                                const hMatch = meta.duration ? meta.duration.match(/(\d+)\s*hr/) : null;
                                const mMatch = meta.duration ? meta.duration.match(/(\d+)\s*min/) : null;
                                if(maintHours) maintHours.value = hMatch ? hMatch[1] : '';
                                if(maintMins) maintMins.value = mMatch ? mMatch[1] : '';
                            } else {
                                maintenanceTimeInput.style.display = 'none';
                                if(maintHours) maintHours.value = '';
                                if(maintMins) maintMins.value = '';
                            }
                            
                            // Update Preview
                            updateLockPreview(meta.type);
                        }
                    } else {
                        // Default reset if no metadata for this user
                        resetLockReasonUI(); 
                    }
                } else {
                    // Multiple or zero selected
                    if (selectedUsernamesForLock.size === 0) {
                         remoteLockCheckboxes.forEach(cb => cb.checked = false);
                         resetLockReasonUI();
                    }
                }
                updateAdminLockButtonState();
            });
            usernameListContainer.appendChild(chip);
        });

    } catch (e) {
        console.error("Error fetching usernames:", e);
        usernameListContainer.innerHTML = '<span style="color: #ef4444;">Error loading usernames.</span>';
    }
}

if(selectAllUsernamesBtn) {
    selectAllUsernamesBtn.addEventListener('click', () => {
        const chips = usernameListContainer.querySelectorAll('.username-chip');
        const allSelected = Array.from(chips).every(c => c.classList.contains('selected'));

        chips.forEach(chip => {
            const username = chip.dataset.username;
            if (allSelected) {
                chip.classList.remove('selected');
                selectedUsernamesForLock.delete(username);
            } else {
                if (!chip.classList.contains('selected')) {
                    chip.classList.add('selected');
                    selectedUsernamesForLock.add(username);
                }
            }
        });
        
        // If selecting all, we generally reset the UI to force a fresh "Group" config
        remoteLockCheckboxes.forEach(cb => cb.checked = false);
        resetLockReasonUI();
        updateAdminLockButtonState();
    });
}

function updateAdminLockButtonState() {
    const userCount = selectedUsernamesForLock.size;
    if (userCount > 0) {
        triggerLockModalBtn.disabled = false;
        triggerBtnText.textContent = `Sync Locks for ${userCount} User${userCount > 1 ? 's' : ''}`;
    } else {
        triggerBtnText.textContent = "Select Users to Configure";
    }
    
    const anyChecked = Array.from(remoteLockCheckboxes).some(cb => cb.checked);
    if(anyChecked) {
        triggerLockModalBtn.classList.remove('success-mode');
        triggerLockModalBtn.classList.add('danger-mode');
    } else {
        triggerLockModalBtn.classList.remove('danger-mode');
        triggerLockModalBtn.classList.add('success-mode');
    }
}


triggerLockModalBtn.addEventListener('click', () => {
    if (!selectedUserForConfig) return;
    if (selectedUsernamesForLock.size === 0) {
        alert("Please select at least one username to configure.");
        return;
    }
    
    lockTargetEmailSpan.textContent = `${selectedUserForConfig} (${selectedUsernamesForLock.size} users)`;
    adminLockModal.style.display = 'flex';
    
    // Reset inputs
    adminLockPassword.value = '';
    
    // Note: We do NOT reset reason options here anymore, 
    // because `chip.addEventListener` might have set them up for us based on existing data.
    // If checkboxes are empty (unlock mode), maybe defaulting to Basic is fine, 
    // but preserving the state is better UX.

    adminLockPassword.focus();
});

cancelAdminLock.addEventListener('click', () => {
    adminLockModal.style.display = 'none';
});

// --- ADMIN: Lock Reason Selection Logic ---
reasonOptions.forEach(opt => {
    opt.addEventListener('click', () => {
        // Visual Selection
        reasonOptions.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        
        // Radio Selection
        const radio = opt.querySelector('input[type="radio"]');
        radio.checked = true;

        // Toggle Duration Input
        const val = radio.value;
        if(val === 'maintenance') {
            maintenanceTimeInput.style.display = 'block';
        } else {
            maintenanceTimeInput.style.display = 'none';
        }

        updateLockPreview(val);
    });
});

// Update preview text when time changes
if(maintHours) maintHours.addEventListener('input', () => updateLockPreview('maintenance'));
if(maintMins) maintMins.addEventListener('input', () => updateLockPreview('maintenance'));

function updateLockPreview(type) {
    if(!lockPreviewBox) return;

    lockPreviewBox.className = 'lock-preview-card';
    lockPreviewBox.classList.add(type);

    let title = "Role Update";
    let msg = "Certain tabs are restricted for your current role.";

    if (type === 'maintenance') {
        title = "Maintenance Mode";
        const h = maintHours.value || 0;
        const m = maintMins.value || 0;
        let timeStr = "";
        if(h > 0) timeStr += `${h} hr `;
        if(m > 0) timeStr += `${m} min`;
        
        msg = `System maintenance in progress.${timeStr ? ' Est. duration: ' + timeStr : ''}`;
    } else if (type === 'suspension') {
        title = "Access Review";
        msg = "Access flagged for review. Contact admin.";
    }

    lockPreviewBox.innerHTML = `
        <div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 4px;">${title}</div>
        <div style="font-size: 0.8rem; opacity: 0.8;">${msg}</div>
    `;
}

// -------------------------------------------------------------
// UPDATED: Confirm Lock with Robust Fallback & Reason
// -------------------------------------------------------------
confirmAdminLock.addEventListener('click', async () => {
    const inputPwd = adminLockPassword.value;
    if (!inputPwd) {
        alert("Please enter a password to secure this lock.");
        return;
    }
    
    const originalText = confirmAdminLock.textContent;
    confirmAdminLock.textContent = "Verifying...";
    confirmAdminLock.disabled = true;

    try {
        const secRef = doc(db, 'admin_settings', 'security');
        const docSnap = await getDoc(secRef);
        
        let storedPassword = 'admin123'; 
        if (docSnap.exists() && docSnap.data().remoteLockPassword) {
            storedPassword = docSnap.data().remoteLockPassword;
        }
        
        if (inputPwd !== storedPassword) {
            alert("INCORRECT PASSWORD. Access modification denied.");
            confirmAdminLock.textContent = originalText;
            confirmAdminLock.disabled = false;
            return;
        }

        // 1. Get Selected Tabs
        const lockedTabs = [];
        remoteLockCheckboxes.forEach(cb => {
            if (cb.checked) lockedTabs.push(cb.value);
        });

        // 2. Get Metadata (Reason & Duration)
        const selectedReasonEl = document.querySelector('input[name="lockReason"]:checked');
        const reasonType = selectedReasonEl ? selectedReasonEl.value : 'basic';
        
        let durationStr = '';
        if (reasonType === 'maintenance') {
            const h = maintHours.value;
            const m = maintMins.value;
            if(h > 0) durationStr += `${h} hr `;
            if(m > 0) durationStr += `${m} min`;
            if(!durationStr) durationStr = "Unknown";
        }

        const metaObj = {
            type: reasonType,
            duration: durationStr,
            updatedAt: Date.now()
        };

        // 3. Prepare Updates
        const lockRef = doc(db, 'global_locks', selectedUserForConfig);
        confirmAdminLock.textContent = "Syncing...";

        const updates = {};
        
        selectedUsernamesForLock.forEach(username => {
            updates[`userSpecificLocks.${username}`] = lockedTabs;
            updates[`lockMetadata.${username}`] = metaObj; // Save per-user metadata
        });
        
        updates.updatedAt = Date.now();

        await updateDoc(lockRef, updates).catch(async (err) => {
            if (err.code === 'not-found') {
                const initialData = { userSpecificLocks: {}, lockMetadata: {} };
                selectedUsernamesForLock.forEach(username => {
                    initialData.userSpecificLocks[username] = lockedTabs;
                    initialData.lockMetadata[username] = metaObj;
                });
                initialData.updatedAt = Date.now();
                await setDoc(lockRef, initialData);
            } else {
                throw err;
            }
        });
        
        // LOGGING UPDATED
        const usernameList = Array.from(selectedUsernamesForLock).join(', ');
        logAction("LOCK_ACTION", `Locked tabs (${lockedTabs.join(', ') || 'none'}) for [${usernameList}]. Reason: ${reasonType.toUpperCase()}`);

        // --- NEW TOAST NOTIFICATION LOGIC ---
        const isLocking = lockedTabs.length > 0;
        let toastTitle = isLocking ? "Lock Applied" : "Access Restored";
        let toastMsg = "";
        
        if (isLocking) {
            toastMsg = `Locked ${lockedTabs.length} tabs for ${selectedUsernamesForLock.size} user(s). Reason: ${reasonType.toUpperCase()}`;
        } else {
            toastMsg = `Unlocked all tabs for ${selectedUsernamesForLock.size} user(s).`;
        }
        
        showToast(toastTitle, toastMsg);
        adminLockModal.style.display = 'none';
        
        // Reset selection
        selectedUsernamesForLock.clear();
        document.querySelectorAll('.username-chip.selected').forEach(c => c.classList.remove('selected'));
        remoteLockCheckboxes.forEach(cb => cb.checked = false);
        resetLockReasonUI(); // Reset UI back to defaults after action
        updateAdminLockButtonState();

    } catch (e) {
        console.error("Lock sync failed:", e);
        alert("Failed to sync locks. Check permissions.");
    } finally {
        confirmAdminLock.textContent = originalText;
        confirmAdminLock.disabled = false;
    }
});


if (toggleAdminLockPassword && adminLockPassword) {
    toggleAdminLockPassword.addEventListener('click', function () {
        const type = adminLockPassword.getAttribute('type') === 'password' ? 'text' : 'password';
        adminLockPassword.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
}

// ========================================================
// SECURITY INITIALIZATION & FACTORY RESET
// ========================================================

async function initGlobalSecurity() {
    try {
        const secRef = doc(db, 'admin_settings', 'security');
        const docSnap = await getDoc(secRef);
        
        const updates = {};
        let needsUpdate = false;

        if (!docSnap.exists() || !docSnap.data().factoryResetPassword) {
            updates.factoryResetPassword = 'admin123';
            needsUpdate = true;
        }
        if (!docSnap.exists() || !docSnap.data().remoteLockPassword) {
            updates.remoteLockPassword = 'admin123';
            needsUpdate = true;
        }

        if (needsUpdate) {
            await setDoc(secRef, updates, { merge: true });
            console.log("Initialized global security passwords to 'admin123'");
        }
    } catch (e) {
        console.error("Failed to init security settings:", e);
    }
}

if (factoryResetBtn) {
    factoryResetBtn.addEventListener('click', () => {
        factoryResetModal.style.display = 'flex';
        factoryResetPasswordInput.value = '';
        factoryResetPasswordInput.focus();
    });
}

if (cancelFactoryReset) {
    cancelFactoryReset.addEventListener('click', () => {
        factoryResetModal.style.display = 'none';
    });
}

if (toggleFactoryPassword && factoryResetPasswordInput) {
    toggleFactoryPassword.addEventListener('click', function () {
        const type = factoryResetPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        factoryResetPasswordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
}

if (confirmFactoryReset) {
    confirmFactoryReset.addEventListener('click', async () => {
        const inputPwd = factoryResetPasswordInput.value;
        if (!inputPwd) {
            alert("Please enter the reset password.");
            return;
        }

        const originalText = confirmFactoryReset.innerText;
        confirmFactoryReset.textContent = "Verifying...";
        confirmFactoryReset.disabled = true;

        try {
            const secRef = doc(db, 'admin_settings', 'security');
            const docSnap = await getDoc(secRef);
            let storedPassword = docSnap.exists() && docSnap.data().factoryResetPassword ? docSnap.data().factoryResetPassword : 'admin123';
            
            if (inputPwd !== storedPassword) {
                alert("INCORRECT PASSWORD. Reset aborted.");
                confirmFactoryReset.textContent = originalText;
                confirmFactoryReset.disabled = false;
                return;
            }

            confirmFactoryReset.textContent = "WIPING DATABASE...";
            logAction("FACTORY_RESET", `Admin (${currentUsername || currentUser.email}) initiated FACTORY RESET. All data wiped.`);

            const ticketsQ = query(collection(db, APP_COLLECTION_ROOT, SHARED_DATA_ID, 'tickets'));
            const tSnap = await getDocs(ticketsQ);
            const tPromises = tSnap.docs.map(d => deleteDoc(d.ref));
            await Promise.all(tPromises);

            await deleteDoc(doc(db, APP_COLLECTION_ROOT, SHARED_DATA_ID, 'settings', 'config'));

            const locksQ = query(collection(db, 'global_locks'));
            const lSnap = await getDocs(locksQ);
            const lPromises = lSnap.docs.map(d => deleteDoc(d.ref));
            await Promise.all(lPromises);
            
            await deleteDoc(doc(db, 'admin_settings', 'security'));
            
            const logsQ = query(collection(db, 'activity_logs'));
            const logSnap = await getDocs(logsQ);
            const lPromisesLogs = logSnap.docs.map(d => deleteDoc(d.ref));
            await Promise.all(lPromisesLogs);

            showToast("SYSTEM RESET", "Database has been completely erased.");
            setTimeout(() => window.location.reload(), 2000);

        } catch (e) {
            console.error(e);
            alert("Reset Error: " + e.message);
            confirmFactoryReset.textContent = originalText;
            confirmFactoryReset.disabled = false;
        }
    });
}


// ==========================================
// 8. USER REMOTE LOCK LISTENER & POPUP
// ==========================================

function listenForRemoteLocks(userEmail) {
    const lockRef = doc(db, 'global_locks', userEmail);
    if (lockUnsubscribe) lockUnsubscribe();
    
    lockUnsubscribe = onSnapshot(lockRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            let tabsToLock = [];
            let lockMeta = null;

            if (data.userSpecificLocks && currentUsername && data.userSpecificLocks[currentUsername] !== undefined) {
                tabsToLock = data.userSpecificLocks[currentUsername];
                // Check if metadata exists for this user
                if(data.lockMetadata && data.lockMetadata[currentUsername]) {
                    lockMeta = data.lockMetadata[currentUsername];
                }
            } else {
                tabsToLock = data.lockedTabs || [];
            }
            
            applyRemoteLocks(tabsToLock, lockMeta);
        } else {
            applyRemoteLocks([], null); 
        }
    }, (error) => {
        console.warn("Lock listener failed:", error);
    });
}

function applyRemoteLocks(tabsToLock, lockMeta) {
    remoteLockedTabs = tabsToLock;
    const allNavs = document.querySelectorAll('.nav-btn');
    
    // 1. Reset visual locks
    allNavs.forEach(btn => btn.classList.remove('locked'));

    // 2. Apply visual locks
    tabsToLock.forEach(tabName => {
        const btn = document.querySelector(`[data-tab="${tabName}"]`);
        if(btn) btn.classList.add('locked');
    });

    // 3. Handle Active Tab Locking
    const currentActive = document.querySelector('.nav-btn.active');
    if (currentActive && tabsToLock.includes(currentActive.dataset.tab)) {
        const allTabs = ['create', 'booked', 'scanner', 'settings'];
        const safeTab = allTabs.find(t => !tabsToLock.includes(t));
        
        if (safeTab) {
            document.querySelector(`[data-tab="${safeTab}"]`).click();
            // We do NOT show a toast here if we are about to show the big popup
        } else {
             document.querySelector('[data-tab="settings"]').click();
        }
    }

    // 4. TRIGGER POPUP IF LOCKS EXIST AND METADATA IS PRESENT
    if(tabsToLock.length > 0 && lockMeta) {
        // Record that we are in maintenance mode if applicable
        if (lockMeta.type === 'maintenance') {
            localStorage.setItem('was_in_maintenance', 'true');
        }
        checkAndShowLockPopup(lockMeta);
    } else {
        // --- NEW: CHECK IF WE JUST EXITED MAINTENANCE ---
        // If no locks (or empty list), check if we were previously in maintenance
        if (localStorage.getItem('was_in_maintenance') === 'true') {
            localStorage.removeItem('was_in_maintenance'); // Clear flag immediately
            showMaintenanceOverPopup();
        } else {
            // Normal unlock: ensure modal is hidden
            lockReasonModal.style.display = 'none';
        }
    }
}

// --- NEW: MAINTENANCE OVER POPUP ---
function showMaintenanceOverPopup() {
    const modalContent = lockReasonModal.querySelector('.lock-popup-content');
    modalContent.className = 'modal-box lock-popup-content theme-maintenance-over'; // Apply GREEN theme
    
    lockPopupIcon.className = 'fa-solid fa-check-circle';
    lockPopupTitle.textContent = "System Updated";
    lockPopupMessage.textContent = "Maintenance is complete. Please refresh to load new changes.";
    
    lockPopupDuration.style.display = 'none';
    
    // Hide 'Don't show again' for this positive message? 
    // Or keep it. Usually good to hide it for a 'Success' message that requires action.
    const checkboxWrapper = lockReasonModal.querySelector('.lock-popup-checkbox-wrapper');
    if(checkboxWrapper) checkboxWrapper.style.display = 'none';

    // Show Modal
    lockReasonModal.style.display = 'flex';
}

function checkAndShowLockPopup(meta) {
    // Check LocalStorage for "Don't show again"
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const suppressedDate = localStorage.getItem('lock_notification_suppress_date');
    
    if (suppressedDate === today) {
        return; // Don't show
    }

    // Configure Popup Content based on Reason Type
    const modalContent = lockReasonModal.querySelector('.lock-popup-content');
    modalContent.className = 'modal-box lock-popup-content'; // Reset classes
    lockPopupDuration.style.display = 'none';
    
    // Ensure checkbox wrapper is visible (might have been hidden by success popup)
    const checkboxWrapper = lockReasonModal.querySelector('.lock-popup-checkbox-wrapper');
    if(checkboxWrapper) checkboxWrapper.style.display = 'block';

    if (meta.type === 'maintenance') {
        modalContent.classList.add('theme-maintenance');
        lockPopupIcon.className = 'fa-solid fa-screwdriver-wrench';
        lockPopupTitle.textContent = "Maintenance Mode";
        lockPopupMessage.textContent = "Admin is performing updates. Some tabs are temporarily locked.";
        
        if(meta.duration) {
            lockPopupDuration.style.display = 'inline-block';
            lockDurationText.textContent = meta.duration;
        }
    } 
    else if (meta.type === 'suspension') {
        modalContent.classList.add('theme-suspension');
        lockPopupIcon.className = 'fa-solid fa-triangle-exclamation';
        lockPopupTitle.textContent = "Access Review";
        lockPopupMessage.textContent = "Your access to certain features has been flagged for review. Please contact support.";
    } 
    else {
        // Basic / Default
        modalContent.classList.add('theme-basic');
        lockPopupIcon.className = 'fa-solid fa-circle-info';
        lockPopupTitle.textContent = "Role Update";
        lockPopupMessage.textContent = "Access to these tabs is currently restricted for your role.";
    }

    // Show Modal
    lockReasonModal.style.display = 'flex';
}

// Popup Button Logic
if(lockPopupRefreshBtn) {
    lockPopupRefreshBtn.addEventListener('click', () => {
        window.location.reload();
    });
}

if(closeLockPopupBtn) {
    closeLockPopupBtn.addEventListener('click', () => {
        const checkbox = document.getElementById('dontShowLockPopupAgain');
        // Only save suppression if checkbox exists and is visible (not for maintenance over)
        if (checkbox && checkbox.offsetParent !== null && checkbox.checked) {
            const today = new Date().toISOString().slice(0, 10);
            localStorage.setItem('lock_notification_suppress_date', today);
        }
        lockReasonModal.style.display = 'none';
    });
}


// ==========================================
// 9. VISUALS & UTILITIES
// ==========================================

function createStars() {
    const container = document.getElementById('star-container');
    const numberOfStars = 100;
    for (let i = 0; i < numberOfStars; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        const size = Math.random() * 3 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${Math.random() * 100}vw`;
        star.style.top = `${Math.random() * 100}vh`;
        star.style.animationDuration = `${Math.random() * 2 + 1}s`;
        container.appendChild(star);
    }
}
createStars();

function showToast(title, msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <div class="toast-title">${title}</div>
        <div class="toast-msg">${msg}</div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 400);
    }, 5000);
}

function playBeep() {
    const audio = new Audio('success.mp3');
    audio.play().catch(() => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.frequency.value = 800;
        osc.start();
        setTimeout(() => osc.stop(), 100);
    });
}

function playError() {
    const audio = new Audio('error.mp3');
    audio.play().catch(() => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.connect(ctx.destination);
        osc.frequency.value = 150;
        osc.start();
        setTimeout(() => osc.stop(), 300);
    });
}

// -------------------------------------------------------------
// EASTER EGG TOGGLE FUNCTION
// -------------------------------------------------------------
function toggleEasterEggMusic(element) {
    if (easterEggAudio.paused) {
        easterEggAudio.play().catch(e => console.warn("Music file not found or interaction required."));
        element.classList.add('playing');
        showToast("Easter Egg Found! 🎵", "Playing music...");
    } else {
        easterEggAudio.pause();
        easterEggAudio.currentTime = 0;
        document.querySelectorAll('.easter-egg-trigger').forEach(el => el.classList.remove('playing'));
    }
}


// ==========================================
// 10. APP NAVIGATION & DATA SYNC
// ==========================================

navButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        const targetTab = button.dataset.tab;

        if (remoteLockedTabs.includes(targetTab)) {
            e.preventDefault();
            // Don't show toast if main popup is likely visible/suppressed
            // But if user manually clicks, we should probably remind them
            showToast("Access Denied", "This tab is currently locked by the Administrator.");
            playError();
            return;
        }

        if (scannerVideo.srcObject && button.dataset.tab !== 'scanner') {
            stopScan();
        }

        if (targetTab === 'logs') {
            fetchAndRenderLogs();
        }

        navButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        tabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.id === button.dataset.tab) {
                tab.classList.add('active');
            }
        });
    });
});

function setupRealtimeListeners() {
    if (!navigator.onLine) return; 

    const ticketsRef = collection(db, APP_COLLECTION_ROOT, SHARED_DATA_ID, 'tickets');
    const q = query(ticketsRef);
    
    if(ticketsUnsubscribe) ticketsUnsubscribe();

    ticketsUnsubscribe = onSnapshot(q, (snapshot) => {
        bookedTickets = [];
        snapshot.forEach((doc) => {
            bookedTickets.push({ id: doc.id, ...doc.data() });
        });
        renderBookedTickets();
    }, (error) => {
        console.error("Ticket listener failed:", error);
        if (error.code !== 'unavailable') {
             showToast("Database Permission Error", "Update Firestore Rules to allow access.");
        }
    });

    const settingsRef = doc(db, APP_COLLECTION_ROOT, SHARED_DATA_ID, 'settings', 'config');
    
    if(settingsUnsubscribe) settingsUnsubscribe();

    settingsUnsubscribe = onSnapshot(settingsRef, (docSnap) => {
        if (docSnap.exists()) {
            eventSettings = docSnap.data();
            updateSettingsDisplay();
        }
    }, (error) => {
        console.error("Settings listener failed:", error);
    });
}

async function performSync() {
    if(!currentUser || !navigator.onLine) return;
    
    const icon = refreshStatusIndicator.querySelector('i');
    if(icon) {
        icon.classList.add('fa-spin');
        icon.style.color = 'var(--accent-secondary)'; 
    }
    const startTime = Date.now();
    try {
        setupRealtimeListeners();

        const ticketsRef = collection(db, APP_COLLECTION_ROOT, SHARED_DATA_ID, 'tickets');
        const q = query(ticketsRef);
        const snapshot = await getDocs(q);
        bookedTickets = [];
        snapshot.forEach((doc) => {
            bookedTickets.push({ id: doc.id, ...doc.data() });
        });
        
        if (eventSettings.deadline) {
            const deadlineTimestamp = new Date(eventSettings.deadline).getTime();
            const now = Date.now();
            
            if (now > deadlineTimestamp) {
                const pendingAbsentees = bookedTickets.filter(t => t.status === 'coming-soon');
                if (pendingAbsentees.length > 0) {
                    const updatePromises = pendingAbsentees.map(t => {
                        const tRef = doc(db, APP_COLLECTION_ROOT, SHARED_DATA_ID, 'tickets', t.id);
                        return updateDoc(tRef, { status: 'absent' });
                    });
                    await Promise.all(updatePromises);
                    showToast("Deadline Passed", `Marked ${pendingAbsentees.length} guests as Absent.`);
                }
            }
        }

        renderBookedTickets();
    } catch (err) {
        console.error("Auto-sync error:", err);
    } finally {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 1000 - elapsed);
        setTimeout(() => {
            if(icon) {
                icon.classList.remove('fa-spin');
                icon.style.color = ''; 
            }
        }, remaining);
    }
}
refreshStatusIndicator.addEventListener('click', performSync);


// ==========================================
// 11. TICKET CREATION & PREVIEW
// ==========================================

ticketForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!navigator.onLine) return showToast("Offline", "Cannot create tickets while offline.");

    const name = document.getElementById('name').value;
    const gender = document.getElementById('gender').value;
    const age = document.getElementById('age').value;
    const phone = document.getElementById('phone').value;
    // NEW: Capture Ticket Type
    const ticketType = document.getElementById('ticketType').value; 

    const newTicket = {
        name,
        gender,
        age,
        phone: '+91' + phone,
        ticketType: ticketType, // NEW: Save to DB
        status: 'coming-soon',
        scanned: false,
        createdBy: currentUsername || currentUser.email, // Log username
        createdAt: Date.now()
    };

    try {
        const docRef = await addDoc(collection(db, APP_COLLECTION_ROOT, SHARED_DATA_ID, 'tickets'), newTicket);
        
        // LOGGING UPDATED: Explicitly state issuer
        logAction("TICKET_CREATE", `Issued by ${currentUsername || 'Admin'}: ticket ${docRef.id.substring(0,6)}... for guest: ${name}`);

        updateTicketPreview({ ...newTicket, id: docRef.id });
        ticketForm.reset();
        showToast("Success", "Ticket generated in Shared Database.");
    } catch (err) {
        console.error("Create ticket failed:", err);
        alert("Error creating ticket. Check database rules.");
    }
});

function updateTicketPreview(ticket) {
    document.getElementById('ticketName').textContent = ticket.name;
    document.getElementById('ticketAgeGender').textContent = `${ticket.age} / ${ticket.gender}`;
    document.getElementById('ticketPhone').textContent = ticket.phone;
    document.getElementById('ticketSerial').textContent = `ID: ${ticket.id}`;
    
    // NEW: Update Header Text (with safe fallback)
    const typeText = ticket.ticketType ? ticket.ticketType.toUpperCase() : 'CLASSIC';
    document.getElementById('ticketTitleHeader').textContent = `ENTRY PASS - ${typeText}`;

    // NEW: Apply Theme Class
    // Ensure we handle 'Gold' and 'Diamond' correctly based on select values
    const template = document.getElementById('ticketTemplate');
    template.className = ''; // Reset classes
    // Add theme class. Default to 'Classic' if empty.
    template.classList.add(`ticket-theme-${ticket.ticketType || 'Classic'}`);

    const qrcodeContainer = document.getElementById('qrcode');
    qrcodeContainer.innerHTML = '';
    new QRCode(qrcodeContainer, {
        text: ticket.id,
        width: 100,
        height: 100,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    
    whatsappBtn.disabled = false;
}

whatsappBtn.addEventListener('click', () => {
    const btn = whatsappBtn;
    const originalText = btn.textContent;
    btn.textContent = "Processing...";
    btn.disabled = true;

    const ticketTemplate = document.getElementById('ticketTemplate');
    const originalBorder = ticketTemplate.style.border;
    ticketTemplate.style.border = 'none';

    html2canvas(ticketTemplate, {
        scale: 3,
        backgroundColor: null, 
        useCORS: true
    }).then(canvas => {
        ticketTemplate.style.border = originalBorder;
        const now = new Date();
        const pad = (num) => String(num).padStart(2, '0');
        const timestamp = `${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        const link = document.createElement('a');
        link.download = `ticket-${timestamp}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => {
            const phone = document.getElementById('ticketPhone').textContent.replace(/\D/g,'');
            const name = document.getElementById('ticketName').textContent;
            const message = encodeURIComponent(`Hello ${name}, here is your Entry Pass 🎫.\n*Keep this QR code ready at the entrance.*`);
            window.location.href = `https://wa.me/${phone}?text=${message}`;
            
            btn.textContent = originalText;
            btn.disabled = true;
            document.getElementById('ticketName').textContent = '--';
            document.getElementById('qrcode').innerHTML = '';
        }, 1500);
    }).catch(err => {
        console.error(err);
        btn.textContent = originalText;
        btn.disabled = false;
        alert("Error processing ticket.");
    });
});


// ==========================================
// 12. GUEST LIST LOGIC
// ==========================================

function renderBookedTickets() {
    bookedTicketsTable.innerHTML = '';
    
    const checkHeader = document.querySelector('.tickets-table thead th:first-child');
    if(checkHeader) {
        checkHeader.style.display = isSelectionMode ? 'table-cell' : 'none';
    }

    let displayTickets = bookedTickets.filter(ticket => {
        const matchesSearch = ticket.name.toLowerCase().includes(searchTerm) || ticket.phone.includes(searchTerm);
        if (!matchesSearch) return false;
        if (currentFilter !== 'all' && ticket.status !== currentFilter) return false;
        if (currentGenderFilter !== 'all' && ticket.gender !== currentGenderFilter) return false;
        return true;
    });

    displayTickets.sort((a, b) => {
        if (currentSort === 'newest') return b.createdAt - a.createdAt;
        if (currentSort === 'oldest') return a.createdAt - b.createdAt;
        if (currentSort === 'name-asc') return a.name.localeCompare(b.name);
        return 0;
    });

    currentFilteredTickets = displayTickets;

    if(displayTickets.length === 0) {
        bookedTicketsTable.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 30px; color: #666;">No matching guests found.</td></tr>';
        return;
    }

    const checkboxDisplayStyle = isSelectionMode ? 'table-cell' : 'none';

    displayTickets.forEach((ticket, index) => {
        const tr = document.createElement('tr');
        tr.dataset.id = ticket.id;
        
        let statusHtml = `<span class="status-badge status-${ticket.status}">${ticket.status.replace('-', ' ')}</span>`;
        if(ticket.status === 'arrived' && ticket.scannedAt) {
            const dateObj = new Date(ticket.scannedAt);
            const dateStr = dateObj.toLocaleDateString();
            const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            statusHtml += `<div style="font-size: 0.6rem; color: #888; margin-top: 3px; white-space: nowrap;">${dateStr}</div>`;
            statusHtml += `<div style="font-size: 0.6rem; color: #888; white-space: nowrap;">${timeStr}</div>`;
        }

        const isChecked = selectedTicketIds.has(ticket.id) ? 'checked' : '';
        
        // NEW: Add visual indicator for ticket type in list if desired, 
        // or just keep standard. For now, standard list view.

        tr.innerHTML = `
            <td style="display: ${checkboxDisplayStyle};"><input type="checkbox" class="ticket-checkbox" style="transform: scale(1.2);" ${isChecked}></td>
            <td style="text-align: center; color: var(--accent-secondary); font-weight: bold;">${index + 1}</td>
            <td style="font-weight: 500; color: white;">${ticket.name}</td>
            <td>${ticket.age} / ${ticket.gender}</td>
            <td>${ticket.phone}</td>
            <td style="font-family: monospace;">${ticket.id.substring(0, 8)}...</td>
            <td>${statusHtml}</td>
            <td><button class="action-btn-small view-ticket-btn" data-id="${ticket.id}">View</button></td>
        `;
        bookedTicketsTable.appendChild(tr);
    });

    document.querySelectorAll('.view-ticket-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ticket = bookedTickets.find(t => t.id === e.target.dataset.id);
            if(ticket) openTicketModal(ticket);
        });
    });

    document.querySelectorAll('.ticket-checkbox').forEach(box => {
        box.addEventListener('change', (e) => {
            const rowId = e.target.closest('tr').dataset.id;
            if(e.target.checked) selectedTicketIds.add(rowId);
            else selectedTicketIds.delete(rowId);
            updateSelectionCount();
        });
    });
}

searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value.toLowerCase().trim();
    renderBookedTickets();
});

filterSortBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    filterDropdown.classList.toggle('show');
});

window.addEventListener('click', () => {
    filterDropdown.classList.remove('show');
});

document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = item.dataset.type;
        const val = item.dataset.val;
        
        // Log Filter Dropdown Handling
        if (type === 'log-filter') {
            document.querySelectorAll(`.dropdown-item[data-type="log-filter"]`).forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');
            currentLogFilter = val;
            renderLogsTable(); 
            filterLogsDropdown.classList.remove('show');
            return;
        }

        document.querySelectorAll(`.dropdown-item[data-type="${type}"]`).forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
        if(type === 'filter') currentFilter = val;
        if(type === 'filter-gender') currentGenderFilter = val;
        if(type === 'sort') currentSort = val;
        renderBookedTickets();
        filterDropdown.classList.remove('show');
    });
});


// ==========================================
// 13. SELECTION, DELETE & EXPORT
// ==========================================

function updateSelectionCount() {
    const count = selectedTicketIds.size;
    selectionCountSpan.textContent = `(${count} selected)`;
    exportTriggerBtn.disabled = count === 0;
    
    const allVisibleSelected = currentFilteredTickets.length > 0 && 
                               currentFilteredTickets.every(t => selectedTicketIds.has(t.id));
    
    if(currentFilteredTickets.length === 0) selectAllCheckbox.checked = false;
    else selectAllCheckbox.checked = allVisibleSelected;
}

selectBtn.addEventListener('click', () => {
    isSelectionMode = !isSelectionMode;
    deleteBtn.style.display = isSelectionMode ? 'inline-block' : 'none';
    selectAllContainer.style.display = isSelectionMode ? 'flex' : 'none'; 
    selectBtn.textContent = isSelectionMode ? 'Cancel' : 'Select';
    if(!isSelectionMode) {
        selectedTicketIds.clear(); 
        selectAllCheckbox.checked = false;
        updateSelectionCount();
    }
    renderBookedTickets(); 
});

selectAllCheckbox.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    currentFilteredTickets.forEach(t => {
        if(isChecked) selectedTicketIds.add(t.id);
        else selectedTicketIds.delete(t.id);
    });
    renderBookedTickets();
    updateSelectionCount();
});

deleteBtn.addEventListener('click', () => {
    const selectedIds = Array.from(selectedTicketIds);
    if(selectedIds.length === 0) return alert('Select tickets to delete');
    pendingDeleteIds = selectedIds;
    deleteCountSpan.textContent = selectedIds.length;
    confirmModal.style.display = 'flex';
});

cancelDeleteBtn.addEventListener('click', () => {
    confirmModal.style.display = 'none';
    pendingDeleteIds = [];
});

confirmDeleteBtn.addEventListener('click', async () => {
    if (!navigator.onLine) return showToast("Offline", "Cannot delete while offline.");
    if(pendingDeleteIds.length > 0) {
        confirmDeleteBtn.textContent = "Deleting...";
        for(const id of pendingDeleteIds) {
            await deleteDoc(doc(db, APP_COLLECTION_ROOT, SHARED_DATA_ID, 'tickets', id));
        }
        
        logAction("TICKET_DELETE", `Deleted ${pendingDeleteIds.length} tickets from guest list.`);

        confirmModal.style.display = 'none';
        confirmDeleteBtn.textContent = "Delete";
        pendingDeleteIds = [];
        selectedTicketIds.clear(); 
        selectBtn.click(); 
    }
});

// Export Logic
exportTriggerBtn.addEventListener('click', () => {
    const count = selectedTicketIds.size;
    if(count === 0) return; 
    exportCountMsg.textContent = `Ready to export ${count} item${count !== 1 ? 's' : ''}.`;
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
    exportFileName.value = `guest_list_${today}`;
    exportModal.style.display = 'flex';
});

cancelExportBtn.addEventListener('click', () => {
    exportModal.style.display = 'none';
});

confirmExportBtn.addEventListener('click', () => {
    const filename = exportFileName.value || 'guest_list';
    const format = exportFormat.value;
    
    let listToExport = [];
    if (selectedTicketIds.size > 0) {
        listToExport = currentFilteredTickets.filter(t => selectedTicketIds.has(t.id));
    } else {
        exportModal.style.display = 'none';
        return alert("No data selected to export.");
    }
    
    switch(format) {
        case 'csv': exportCSV(listToExport, filename); break;
        case 'xlsx': exportXLSX(listToExport, filename); break;
        case 'pdf': exportPDF(listToExport, filename); break;
        case 'txt': exportTXT(listToExport, filename); break;
        case 'json': exportJSON(listToExport, filename); break;
        case 'doc': exportDOC(listToExport, filename); break;
    }
    
    logAction("EXPORT_DATA", `Exported ${listToExport.length} records as ${format.toUpperCase()}`);

    exportModal.style.display = 'none';
    showToast("Export Complete", `${listToExport.length} records saved.`);
});

function downloadFile(uri, filename) {
    const link = document.createElement("a");
    link.href = uri;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportCSV(data, filename) {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "S.No.,Guest Name,Age,Gender,Phone,Status,Ticket ID,Entry Time\n";
    data.forEach((row, index) => {
        const scannedTime = row.scannedAt ? new Date(row.scannedAt).toLocaleTimeString() : "";
        const cleanName = row.name.replace(/,/g, ""); 
        const rowStr = `${index + 1},${cleanName},${row.age},${row.gender},${row.phone},${row.status},${row.id},${scannedTime}`;
        csvContent += rowStr + "\n";
    });
    downloadFile(encodeURI(csvContent), `${filename}.csv`);
}

function exportXLSX(data, filename) {
    const worksheetData = data.map((row, index) => ({
        "S.No.": index + 1,
        "Guest Name": row.name,
        "Age": row.age,
        "Gender": row.gender,
        "Phone": row.phone,
        "Status": row.status,
        "Ticket ID": row.id,
        "Entry Time": row.scannedAt ? new Date(row.scannedAt).toLocaleTimeString() : ""
    }));
    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Guests");
    XLSX.writeFile(wb, `${filename}.xlsx`);
}

function exportPDF(data, filename) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Event Guest List", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
    const tableColumn = ["#", "Name", "Age", "Gender", "Phone", "Status", "Entry Time"];
    const tableRows = [];
    data.forEach((row, index) => {
        tableRows.push([
            index + 1,
            row.name,
            row.age,
            row.gender,
            row.phone,
            row.status.toUpperCase(),
            row.scannedAt ? new Date(row.scannedAt).toLocaleTimeString() : "--"
        ]);
    });
    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 32 });
    doc.save(`${filename}.pdf`);
}

function exportTXT(data, filename) {
    let content = `GUEST LIST EXPORT - ${new Date().toLocaleString()}\n\n`;
    data.forEach((row, i) => {
        content += `${i+1}. ${row.name.toUpperCase()} \n`;
        content += `   Details: ${row.age} / ${row.gender}\n`;
        content += `   Phone: ${row.phone}\n`;
        content += `   Status: ${row.status.toUpperCase()}\n`;
        if(row.scannedAt) content += `   Entry: ${new Date(row.scannedAt).toLocaleTimeString()}\n`;
        content += `   ID: ${row.id}\n`;
        content += "----------------------------------------\n";
    });
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, `${filename}.txt`);
}

function exportJSON(data, filename) {
    const jsonWithSerial = data.map((item, index) => ({ s_no: index + 1, ...item }));
    const jsonStr = JSON.stringify(jsonWithSerial, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, `${filename}.json`);
}

function exportDOC(data, filename) {
    let htmlBody = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Guest List</title></head><body>
        <h2>Guest List Export</h2>
        <table border="1" style="border-collapse: collapse; width: 100%;">
            <tr style="background: #eee;">
                <th>S.No.</th><th>Name</th><th>Age/Gender</th><th>Phone</th><th>Status</th>
            </tr>
    `;
    data.forEach((row, index) => {
        htmlBody += `<tr><td>${index + 1}</td><td>${row.name}</td><td>${row.age} / ${row.gender}</td><td>${row.phone}</td><td>${row.status}</td></tr>`;
    });
    htmlBody += "</table></body></html>";
    const blob = new Blob(['\ufeff', htmlBody], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, `${filename}.doc`);
}


// ==========================================
// 14. TICKET VIEW MODAL
// ==========================================

function openTicketModal(ticket) {
    document.getElementById('modalTicketName').textContent = ticket.name;
    document.getElementById('modalTicketAgeGender').textContent = `${ticket.age} / ${ticket.gender}`;
    document.getElementById('modalTicketPhone').textContent = ticket.phone;
    document.getElementById('modalTicketSerial').textContent = `ID: ${ticket.id}`;
    
    // NEW: Update Header Text in Modal (with safe fallback)
    const typeText = ticket.ticketType ? ticket.ticketType.toUpperCase() : 'CLASSIC';
    document.getElementById('modalTicketTitleHeader').textContent = `ENTRY PASS - ${typeText}`;

    // NEW: Apply Theme Class in Modal
    const modalTemplate = document.getElementById('modalTicketTemplate');
    modalTemplate.className = ''; // Reset
    // Add theme class (handles 'Gold', 'Diamond' or defaults to 'Classic')
    modalTemplate.classList.add(`ticket-theme-${ticket.ticketType || 'Classic'}`);

    const modalQrcodeContainer = document.getElementById('modalQrcode');
    modalQrcodeContainer.innerHTML = '';
    new QRCode(modalQrcodeContainer, {
        text: ticket.id,
        width: 100,
        height: 100,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    ticketViewModal.style.display = 'flex';
}

closeTicketModal.addEventListener('click', () => {
    ticketViewModal.style.display = 'none';
});

modalWhatsAppBtn.addEventListener('click', () => {
    const btn = modalWhatsAppBtn;
    const originalContent = btn.innerHTML;
    btn.textContent = "Processing...";
    btn.disabled = true;

    const ticketTemplate = document.getElementById('modalTicketTemplate');
    const originalBorder = ticketTemplate.style.border;
    ticketTemplate.style.border = 'none';

    html2canvas(ticketTemplate, {
        scale: 3,
        backgroundColor: null, 
        useCORS: true
    }).then(canvas => {
        ticketTemplate.style.border = originalBorder;
        
        const now = new Date();
        const pad = (num) => String(num).padStart(2, '0');
        const timestamp = `${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        
        const link = document.createElement('a');
        link.download = `ticket-${timestamp}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => {
            const phone = document.getElementById('modalTicketPhone').textContent.replace(/\D/g,'');
            const name = document.getElementById('modalTicketName').textContent;
            const message = encodeURIComponent(`Hello ${name}, here is your Entry Pass 🎫.\n*Keep this QR code ready at the entrance.*`);
            window.location.href = `https://wa.me/${phone}?text=${message}`;
            
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }, 1500);

    }).catch(err => {
        console.error(err);
        alert("Error generating ticket image");
        btn.innerHTML = originalContent;
        btn.disabled = false;
    });
});


// ==========================================
// 15. SCANNER LOGIC
// ==========================================

startScanBtn.addEventListener('click', () => {
    if (scannerVideo.srcObject) stopScan();
    else startScan();
});

function startScan() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
            scannerVideo.srcObject = stream;
            scannerVideo.setAttribute("playsinline", true); 
            scannerVideo.play();
            startScanBtn.textContent = 'Deactivate Camera';
            scanResult.style.display = 'block';
            scanResult.style.background = 'rgba(255,255,255,0.1)';
            scanResult.style.color = 'white';
            scanResult.textContent = 'Searching for QR Code...';
            // NEW: Ensure result is fully visible (not faded) when starting
            scanResult.classList.remove('hiding-result');
            requestAnimationFrame(tick);
        }).catch(err => {
            alert("Camera error: " + err);
        });
}

function stopScan() {
    if (scannerVideo.srcObject) scannerVideo.srcObject.getTracks().forEach(t => t.stop());
    scannerVideo.srcObject = null;
    startScanBtn.textContent = 'Activate Camera';
}

function tick() {
    if (!scannerVideo.srcObject) return;
    if (scannerVideo.readyState === scannerVideo.HAVE_ENOUGH_DATA) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = scannerVideo.videoWidth;
        canvas.height = scannerVideo.videoHeight;
        ctx.drawImage(scannerVideo, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0,0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
        
        if(code && !isCooldown) {
            isCooldown = true;
            
            scanResult.classList.remove('hiding-result'); 
            validateTicket(code.data);
            
            setTimeout(() => {
                scanResult.classList.add('hiding-result');
            }, 3000);

            setTimeout(() => {
                scanResult.style.display = 'none';
                scanResult.classList.remove('hiding-result'); 
                isCooldown = false; 
            }, 4000);
        }
    }
    if (scannerVideo.srcObject) {
        requestAnimationFrame(tick);
    }
}

async function validateTicket(ticketId) {
    if (!navigator.onLine) return showToast("Offline", "Cannot validate tickets while offline.");
    
    const ticket = bookedTickets.find(t => t.id === ticketId);
    
    scanResult.style.display = 'block';
    scanResult.className = ''; 
    
    if(ticket) {
        if(ticket.status === 'coming-soon' && !ticket.scanned) {
            await updateDoc(doc(db, APP_COLLECTION_ROOT, SHARED_DATA_ID, 'tickets', ticketId), {
                status: 'arrived',
                scanned: true,
                scannedAt: Date.now(),
                scannedBy: currentUsername || 'Admin' 
            });
            
            logAction("SCAN_ENTRY", `Scanned by ${currentUsername || 'Admin'}: Guest ${ticket.name} (ID: ${ticketId.substring(0,6)})`);

            scanResult.style.background = 'rgba(16, 185, 129, 0.2)';
            scanResult.style.color = '#10b981';
            scanResult.style.border = '1px solid #10b981';
            scanResult.innerHTML = `
                <div style="font-size: 1.1rem; font-weight: bold;">✅ ACCESS GRANTED</div>
                <div style="color: white; margin-top: 5px;">${ticket.name}</div>
                <div style="font-size: 0.8rem; color: #ccc; margin-top: 2px;">ID: ${ticket.id}</div>
            `;
            playBeep();
        } else {
            scanResult.style.background = 'rgba(245, 158, 11, 0.2)'; 
            scanResult.style.color = '#f59e0b';
            scanResult.style.border = '1px solid #f59e0b';
            
            let statusText = ticket.scanned ? "ALREADY SCANNED" : "INVALID STATUS";
            
            scanResult.innerHTML = `
                <div style="font-size: 1.1rem; font-weight: bold;">⚠️ ${statusText}</div>
                <div style="color: white; margin-top: 5px;">${ticket.name}</div>
                <div style="font-size: 0.8rem; color: #ccc; margin-top: 2px;">ID: ${ticket.id}</div>
                <div style="font-size: 0.75rem; color: #aaa; margin-top: 2px;">Current Status: ${ticket.status}</div>
            `;
            playError();
        }
    } else {
        scanResult.style.background = 'rgba(239, 68, 68, 0.2)';
        scanResult.style.color = '#ef4444';
        scanResult.style.border = '1px solid #ef4444';
        
        scanResult.innerHTML = `
            <div style="font-size: 1.1rem; font-weight: bold;">❌ INVALID TICKET</div>
            <div style="font-size: 0.8rem; color: #ccc; margin-top: 5px;">ID: ${ticketId}</div>
            <div style="font-size: 0.75rem; color: #aaa; margin-top: 2px;">Not found in database</div>
        `;
        playError();
    }
}


// ==========================================
// 16. SETTINGS FORM
// ==========================================

eventSettingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!navigator.onLine) return showToast("Offline", "Cannot save settings while offline.");

    const newName = document.getElementById('eventName').value;
    const newPlace = document.getElementById('eventPlace').value;
    const newDeadline = document.getElementById('arrivalDeadline').value;

    const newSettings = {
        name: newName,
        place: newPlace,
        deadline: newDeadline
    };

    await setDoc(doc(db, APP_COLLECTION_ROOT, SHARED_DATA_ID, 'settings', 'config'), newSettings, { merge: true });
    
    logAction("CONFIG_CHANGE", `Event details updated: ${newName || 'Untitled'} @ ${newPlace || 'No Loc'}`);

    showToast("Settings Saved", "Event details updated for everyone.");
});

function updateSettingsDisplay() {
    document.getElementById('currentEventName').textContent = eventSettings.name || 'Not set';
    document.getElementById('currentEventPlace').textContent = eventSettings.place || 'Not set';
    document.getElementById('currentDeadline').textContent = eventSettings.deadline ? new Date(eventSettings.deadline).toLocaleString() : 'Not set';
    document.getElementById('eventNamePlace').textContent = eventSettings.name && eventSettings.place ? `${eventSettings.name} | ${eventSettings.place}` : 'EVENT DETAILS';
    
    document.getElementById('eventName').value = eventSettings.name || '';
    document.getElementById('eventPlace').value = eventSettings.place || '';
    document.getElementById('arrivalDeadline').value = eventSettings.deadline || '';
    
    document.getElementById('modalEventNamePlace').textContent = eventSettings.name && eventSettings.place ? `${eventSettings.name} | ${eventSettings.place}` : 'EVENT DETAILS';
}


// ==========================================
// 17. SIDE TRAY & PWA
// ==========================================

if (trayToggle && contactTray) {
    trayToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        contactTray.classList.toggle('open');
        
        if (contactTray.classList.contains('open')) {
            trayIcon.classList.remove('fa-chevron-left');
            trayIcon.classList.add('fa-chevron-right');
            document.getElementById('appContent').classList.add('content-blur');
            document.getElementById('star-container').classList.add('content-blur');
        } else {
            trayIcon.classList.remove('fa-chevron-right');
            trayIcon.classList.add('fa-chevron-left');
            document.getElementById('appContent').classList.remove('content-blur');
            document.getElementById('star-container').classList.remove('content-blur');
        }
    });

    document.addEventListener('click', (e) => {
        if (contactTray.classList.contains('open') && 
            !contactTray.contains(e.target) && 
            !trayToggle.contains(e.target)) {
            
            contactTray.classList.remove('open');
            trayIcon.classList.remove('fa-chevron-right');
            trayIcon.classList.add('fa-chevron-left');
            document.getElementById('appContent').classList.remove('content-blur');
            document.getElementById('star-container').classList.remove('content-blur');
        }
    });

    // HELP TRAY LOGGING
    const helpButtons = contactTray.querySelectorAll('a');
    helpButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = btn.closest('.contact-card');
            const contactName = card ? card.querySelector('.contact-name').textContent : "Unknown";
            const method = btn.classList.contains('whatsapp-btn-small') ? "WhatsApp" : "Call";
            
            logAction("HELP_CALL", `Contacted ${contactName} via ${method}`);
        });
    });
}

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js").catch(err => console.log("SW failed:", err));
    });
}

// ==========================================
// 18. CONNECTION STATUS MONITORING
// ==========================================

function updateNetworkStatus() {
    if (navigator.onLine) {
        if(syncStatusDot) syncStatusDot.classList.remove('offline');
        if(currentUser) performSync();
    } else {
        if(syncStatusDot) syncStatusDot.classList.add('offline');
        showToast("Connection Lost", "You are currently working offline.");
    }
}

window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

if (!navigator.onLine) {
    if(syncStatusDot) syncStatusDot.classList.add('offline');
}

// ==========================================
// 19. LOGS UI LOGIC (ADMIN ONLY)
// ==========================================

if (refreshLogsBtn) {
    refreshLogsBtn.addEventListener('click', () => {
        const icon = refreshLogsBtn.querySelector('i');
        icon.classList.add('fa-spin');
        fetchAndRenderLogs().finally(() => {
            setTimeout(() => icon.classList.remove('fa-spin'), 500);
        });
    });
}

if (filterLogsTypeBtn) {
    filterLogsTypeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        filterLogsDropdown.classList.toggle('show');
    });
}

if (searchLogsInput) {
    searchLogsInput.addEventListener('input', () => {
        renderLogsTable(); 
    });
}

async function fetchAndRenderLogs() {
    if(!currentUser) return;
    activityLogsTable.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#666;">Syncing logs...</td></tr>';
    
    try {
        const q = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        
        allActivityLogs = [];
        snapshot.forEach(doc => {
            allActivityLogs.push({ id: doc.id, ...doc.data() });
        });
        
        renderLogsTable();
        
    } catch (e) {
        console.error("Error fetching logs:", e);
        activityLogsTable.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#ef4444;">Error loading logs. Check permissions.</td></tr>';
    }
}

function updateLogSelectionCount() {
    const count = selectedLogIds.size;
    if (logsSelectionCountSpan) logsSelectionCountSpan.textContent = `(${count} selected)`;
    
    if (deleteLogsBtn) deleteLogsBtn.disabled = count === 0;

    const allVisibleSelected = currentFilteredLogs.length > 0 && 
                               currentFilteredLogs.every(l => selectedLogIds.has(l.id));
    
    if(currentFilteredLogs.length === 0) selectAllLogsCheckbox.checked = false;
    else selectAllLogsCheckbox.checked = allVisibleSelected;
}

selectLogsBtn.addEventListener('click', () => {
    isLogSelectionMode = !isLogSelectionMode;
    deleteLogsBtn.style.display = isLogSelectionMode ? 'inline-block' : 'none';
    logsSelectAllContainer.style.display = isLogSelectionMode ? 'flex' : 'none';
    selectLogsBtn.textContent = isLogSelectionMode ? 'Cancel' : 'Select';
    if(!isLogSelectionMode) {
        selectedLogIds.clear();
        selectAllLogsCheckbox.checked = false;
        updateLogSelectionCount();
    }
    renderLogsTable();
});

selectAllLogsCheckbox.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    currentFilteredLogs.forEach(l => {
        if(isChecked) selectedLogIds.add(l.id);
        else selectedLogIds.delete(l.id);
    });
    renderLogsTable();
    updateLogSelectionCount();
});

deleteLogsBtn.addEventListener('click', () => {
    const selectedIds = Array.from(selectedLogIds);
    if(selectedIds.length === 0) return alert('Select logs to delete');
    pendingLogDeleteIds = selectedIds;
    deleteLogCountSpan.textContent = selectedIds.length;
    confirmLogDeleteModal.style.display = 'flex';
});

cancelLogDeleteBtn.addEventListener('click', () => {
    confirmLogDeleteModal.style.display = 'none';
    pendingLogDeleteIds = [];
});

confirmLogDeleteBtn.addEventListener('click', async () => {
    if (!navigator.onLine) return showToast("Offline", "Cannot delete logs while offline.");
    if(pendingLogDeleteIds.length > 0) {
        confirmLogDeleteBtn.textContent = "Deleting...";
        try {
            for(const id of pendingLogDeleteIds) {
                await deleteDoc(doc(db, 'activity_logs', id));
            }
            
            logAction("LOG_DELETE", `Admin deleted ${pendingLogDeleteIds.length} activity records.`);

            allActivityLogs = allActivityLogs.filter(l => !selectedLogIds.has(l.id));
            
            showToast("Logs Deleted", `Removed ${pendingLogDeleteIds.length} entries.`);
            
        } catch(e) {
            console.error("Delete logs error:", e);
            alert("Error deleting logs. Check permissions.");
        } finally {
            confirmLogDeleteModal.style.display = 'none';
            confirmLogDeleteBtn.textContent = "Delete";
            pendingLogDeleteIds = [];
            selectedLogIds.clear(); 
            selectLogsBtn.click(); 
        }
    }
});


function renderLogsTable() {
    const term = searchLogsInput.value.toLowerCase().trim();
    
    const headerCheck = document.querySelector('.log-check-header');
    if(headerCheck) headerCheck.style.display = isLogSelectionMode ? 'table-cell' : 'none';

    currentFilteredLogs = allActivityLogs.filter(log => {
        if (currentLogFilter !== 'all' && log.action !== currentLogFilter) return false;
        const combinedString = `${log.username} ${log.action} ${log.details}`.toLowerCase();
        if (!combinedString.includes(term)) return false;
        return true;
    });
    
    activityLogsTable.innerHTML = '';
    
    if (currentFilteredLogs.length === 0) {
        activityLogsTable.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#666;">No matching records found.</td></tr>';
        return;
    }
    
    const checkboxDisplayStyle = isLogSelectionMode ? 'table-cell' : 'none';

    currentFilteredLogs.forEach(log => {
        const tr = document.createElement('tr');
        tr.dataset.id = log.id;
        
        const dateObj = new Date(log.timestamp);
        const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const badgeClass = `log-action-${log.action}` in getClassMap() ? `log-action-${log.action}` : 'log-action-DEFAULT';
        
        const easterEggClass = log.action === 'EXPORT_DATA' ? 'easter-egg-trigger' : '';
        
        const isChecked = selectedLogIds.has(log.id) ? 'checked' : '';

        tr.innerHTML = `
            <td style="display: ${checkboxDisplayStyle}; text-align: center;">
                <input type="checkbox" class="log-checkbox" style="transform: scale(1.2);" ${isChecked}>
            </td>
            <td style="font-size: 0.8rem; color: #888; white-space: nowrap;">${dateStr}</td>
            <td style="font-weight: 500; color: white;">${log.username}</td>
            <td><span class="log-action-badge ${badgeClass} ${easterEggClass}">${log.action.replace('_', ' ')}</span></td>
            <td style="font-size: 0.85rem; color: #ccc;">${log.details}</td>
        `;
        activityLogsTable.appendChild(tr);
    });

    document.querySelectorAll('.log-checkbox').forEach(box => {
        box.addEventListener('change', (e) => {
            const rowId = e.target.closest('tr').dataset.id;
            if(e.target.checked) selectedLogIds.add(rowId);
            else selectedLogIds.delete(rowId);
            updateLogSelectionCount();
        });
    });

    document.querySelectorAll('.easter-egg-trigger').forEach(badge => {
        badge.addEventListener('click', (e) => {
            e.stopPropagation(); 
            toggleEasterEggMusic(badge);
        });
    });
}

function getClassMap() {
    return {
        'log-action-LOGIN': true,
        'log-action-TICKET_CREATE': true,
        'log-action-SCAN_ENTRY': true,
        'log-action-CONFIG_CHANGE': true,
        'log-action-HELP_CALL': true,
        'log-action-TICKET_DELETE': true,
        'log-action-FACTORY_RESET': true,
        'log-action-LOCK_ACTION': true,
        'log-action-LOG_DELETE': true,
        'log-action-EXPORT_DATA': true
    };
}


// ==========================================
// 20. ADMIN HELPER FUNCTION (For Console)
// ==========================================
window.createStaffUser = async function(username, realName, role) {
    if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
        console.error("Only Admin can create users.");
        return;
    }
    
    let targetEmail = "";
    if (role.toLowerCase().includes('event')) targetEmail = "eveman.test@gmail.com";
    else if (role.toLowerCase().includes('reg')) targetEmail = "regdesk.test@gmail.com";
    else if (role.toLowerCase().includes('sec')) targetEmail = "sechead.test@gmail.com";
    else return console.error("Unknown role. Use 'Event Manager', 'Registration Desk', or 'Security Head'");

    try {
        await setDoc(doc(db, 'allowed_usernames', username), {
            realName: realName,
            role: role,
            email: targetEmail,
            createdAt: Date.now()
        });
        console.log(`%c SUCCESS: User '${username}' created for ${targetEmail}`, "color: #10b981; font-weight: bold;");
    } catch (e) {
        console.error("Error creating user:", e);
    }
};
