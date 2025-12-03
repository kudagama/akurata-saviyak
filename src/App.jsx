import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';
import { 
  Heart, Users, Send, School, Loader2, Phone, MapPin, 
  Package, DollarSign, CheckCircle2, Clock, Lock, Trash2, X, HelpCircle, Info, MessageCircle, Printer
} from 'lucide-react';

/* --- FIREBASE CONFIGURATION --- 
   Paste your actual Firebase config object here replacing the block below 
*/
const firebaseConfig = {

  apiKey: "AIzaSyBoqMYivqXqgX2o_Bbxrbo4teQbboJEdgk",

  authDomain: "akurata-saviyak.firebaseapp.com",

  projectId: "akurata-saviyak",

  storageBucket: "akurata-saviyak.firebasestorage.app",

  messagingSenderId: "694622597668",

  appId: "1:694622597668:web:460190df2afba72f149eb1"

};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'school-batch-donations-v2';

export default function App() {
  const [user, setUser] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [showClarifications, setShowClarifications] = useState(false);
  const [showReceiptPopup, setShowReceiptPopup] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');

  // Form State
  const [donationType, setDonationType] = useState('money'); // 'money' or 'item'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [notification, setNotification] = useState(null);

  // 1. Authentication
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth failed:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. Data Fetching
  useEffect(() => {
    if (!user) return;
    const donationsRef = collection(db, 'artifacts', appId, 'public', 'data', 'donations');
    
    const unsubscribe = onSnapshot(donationsRef, (snapshot) => {
        const fetchedDonations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort: Newest first
        fetchedDonations.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setDonations(fetchedDonations);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  // 3. Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (donationType === 'money' && !amount) return;
    if (donationType === 'item' && !itemDescription) return;
    
    setSubmitting(true);
    try {
      const donationsRef = collection(db, 'artifacts', appId, 'public', 'data', 'donations');
      
      // LOGIC: Money = Pending, Items = Booked
      const initialStatus = donationType === 'money' ? 'pending' : 'booked';
      const itemText = donationType === 'money' ? 'Cash Donation' : itemDescription;

      await addDoc(donationsRef, {
        name: name.trim(),
        email: email.trim(),
        mobileNumber: mobileNumber.trim(),
        type: donationType,
        amount: donationType === 'money' ? parseFloat(amount) : 0,
        item: itemText.trim(),
        message: message.trim(),
        status: initialStatus, // 'pending', 'confirmed', 'booked'
        createdAt: serverTimestamp(),
        userId: user.uid 
      });

      // Reset Form
      setName('');
      setEmail('');
      setMobileNumber('');
      setItemDescription('');
      setMessage('');
      
      // Show receipt popup for money donations
      if (donationType === 'money') {
        setDonationAmount(amount);
        setShowReceiptPopup(true);
        setAmount('');
      } else {
        showNotification('Items successfully booked!');
        setAmount('');
      }
    } catch (error) {
      console.error("Error adding document: ", error);
      showNotification('Failed to save. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Admin Actions
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPin === '2024') { // <--- CHANGE THIS PIN
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPin('');
      showNotification("Admin Mode Enabled");
    } else {
      showNotification("Incorrect PIN", 'error');
    }
  };

  const verifyDonation = async (id) => {
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'donations', id);
      await updateDoc(docRef, { status: 'confirmed' });
      showNotification("Donation Verified!");
    } catch (e) {
      console.error(e);
      showNotification("Error verifying", 'error');
    }
  };

  const deleteDonation = async (id) => {
    if(!confirm("Are you sure you want to delete this entry?")) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'donations', id);
      await deleteDoc(docRef);
      showNotification("Entry deleted");
    } catch (e) {
      console.error(e);
      showNotification("Error deleting", 'error');
    }
  };

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Print Report Function
  const printReport = () => {
    const printWindow = window.open('', '_blank');
    const printDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Calculate totals
    const totalMoney = donations
      .filter(d => d.type === 'money')
      .reduce((sum, d) => sum + (d.amount || 0), 0);
    
    const totalConfirmed = donations
      .filter(d => d.type === 'money' && d.status === 'confirmed')
      .reduce((sum, d) => sum + (d.amount || 0), 0);
    
    const totalPending = donations
      .filter(d => d.type === 'money' && d.status === 'pending')
      .reduce((sum, d) => sum + (d.amount || 0), 0);
    
    const itemCount = donations.filter(d => d.type === 'item').length;
    const moneyCount = donations.filter(d => d.type === 'money').length;

    const moneyDonations = donations.filter(d => d.type === 'money');
    const itemDonations = donations.filter(d => d.type === 'item');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Donation Report - ${printDate}</title>
          <style>
            @media print {
              @page {
                margin: 1cm;
              }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #1f2937;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #059669;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #059669;
              margin: 0;
              font-size: 24px;
            }
            .header p {
              color: #6b7280;
              margin: 5px 0;
            }
            .summary {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin-bottom: 30px;
            }
            .summary-card {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 15px;
              background: #f9fafb;
            }
            .summary-card h3 {
              margin: 0 0 10px 0;
              font-size: 14px;
              color: #6b7280;
              text-transform: uppercase;
            }
            .summary-card .value {
              font-size: 20px;
              font-weight: bold;
              color: #059669;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              font-size: 12px;
            }
            th {
              background-color: #059669;
              color: white;
              padding: 10px;
              text-align: left;
              font-weight: bold;
            }
            td {
              padding: 8px 10px;
              border-bottom: 1px solid #e5e7eb;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .status {
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: bold;
              display: inline-block;
            }
            .status-pending {
              background-color: #fef3c7;
              color: #92400e;
            }
            .status-confirmed {
              background-color: #d1fae5;
              color: #065f46;
            }
            .status-booked {
              background-color: #dbeafe;
              color: #1e40af;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #059669;
              margin: 30px 0 15px 0;
              padding-bottom: 5px;
              border-bottom: 2px solid #059669;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 11px;
            }
            .amount {
              font-weight: bold;
              color: #059669;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>අකුරට සවියක් - Donation Report</h1>
            <p>Galle St. Aloysius College</p>
            <p>2018 O/L and 2021 A/L Batch Support</p>
            <p><strong>Generated:</strong> ${printDate}</p>
          </div>

          <div class="summary">
            <div class="summary-card">
              <h3>Total Money Donations</h3>
              <div class="value">Rs. ${totalMoney.toLocaleString()}</div>
            </div>
            <div class="summary-card">
              <h3>Confirmed Amount</h3>
              <div class="value">Rs. ${totalConfirmed.toLocaleString()}</div>
            </div>
            <div class="summary-card">
              <h3>Pending Amount</h3>
              <div class="value">Rs. ${totalPending.toLocaleString()}</div>
            </div>
            <div class="summary-card">
              <h3>Item Donations</h3>
              <div class="value">${itemCount} donations</div>
            </div>
            <div class="summary-card">
              <h3>Total Money Donations</h3>
              <div class="value">${moneyCount} donations</div>
            </div>
            <div class="summary-card">
              <h3>Total Records</h3>
              <div class="value">${donations.length} donations</div>
            </div>
          </div>

          <div class="section-title">Money Donations</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${moneyDonations.map((d, index) => {
                const date = d.createdAt?.seconds 
                  ? new Date(d.createdAt.seconds * 1000).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'N/A';
                const statusClass = d.status === 'confirmed' ? 'status-confirmed' : 'status-pending';
                const statusText = d.status === 'confirmed' ? 'Confirmed' : 'Pending';
                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${d.name || 'N/A'}</td>
                    <td>${d.email || 'N/A'}</td>
                    <td>${d.mobileNumber || 'N/A'}</td>
                    <td class="amount">Rs. ${(d.amount || 0).toLocaleString()}</td>
                    <td><span class="status ${statusClass}">${statusText}</span></td>
                    <td>${date}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="section-title">Item Donations</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Items</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${itemDonations.map((d, index) => {
                const date = d.createdAt?.seconds 
                  ? new Date(d.createdAt.seconds * 1000).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'N/A';
                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${d.name || 'N/A'}</td>
                    <td>${d.email || 'N/A'}</td>
                    <td>${d.mobileNumber || 'N/A'}</td>
                    <td>${d.item || 'N/A'}</td>
                    <td>${date}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>This report was generated from the Akurata Saviyak Donation System</p>
            <p>For inquiries, contact: Saveen - 076 608 8374</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Calculate Total (Only Confirmed Money)
  const totalVerified = donations
    .filter(d => d.type === 'money' && d.status === 'confirmed')
    .reduce((sum, item) => sum + (item.amount || 0), 0);

  // Calculate Item Donations Count
  const itemDonationsCount = donations.filter(d => d.type === 'item').length;

  // Admin Statistics
  const totalMoneyDonations = donations.filter(d => d.type === 'money').length;
  const pendingDonations = donations.filter(d => d.type === 'money' && d.status === 'pending').length;
  const confirmedDonations = donations.filter(d => d.type === 'money' && d.status === 'confirmed').length;
  const totalMoneyAmount = donations
    .filter(d => d.type === 'money')
    .reduce((sum, item) => sum + (item.amount || 0), 0);
  const pendingAmount = donations
    .filter(d => d.type === 'money' && d.status === 'pending')
    .reduce((sum, item) => sum + (item.amount || 0), 0);

  if (!user && loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800">
      
      {/* HEADER */}
      <header className="bg-emerald-900 text-white shadow-xl border-b-4 border-yellow-500 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
            <div className="flex-1">
              <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-2">
                <School className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400 flex-shrink-0 mt-1 sm:mt-0" />
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-wide text-yellow-400 leading-tight break-words">
                    අකුරට සවියක් - 2018 O/L AND 2021 A/L BATCH SUPPORT
                  </h1>
                  <p className="text-emerald-200 text-xs sm:text-sm font-medium tracking-wider uppercase mt-1">Galle St. Aloysius College</p>
                </div>
              </div>
              <p className="text-emerald-100 max-w-xl mt-3 sm:mt-4 leading-relaxed text-sm sm:text-base">
                This website is made for marking the <strong className="text-yellow-300">2018 O/L and 2021 A/L Batch Support</strong> to the 
                <strong className="text-yellow-300"> අකුරට සවියක්</strong> project in Galle St. Aloysius College. 
                Your contributions help provide essential school supplies and financial assistance to students in need.
                {isAdmin && <span className="ml-2 bg-red-600 text-white text-xs px-2 py-1 rounded font-bold">ADMIN MODE ACTIVE</span>}
              </p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              <button
                onClick={() => setShowClarifications(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors text-white font-medium text-sm sm:text-base touch-manipulation"
                title="Need Help?"
              >
                <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Help & Info</span>
                <span className="sm:hidden">Help</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ADMIN PANEL */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg border-b-4 border-red-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
                <h2 className="text-xl sm:text-2xl font-bold">Admin Panel</h2>
              </div>
              <button
                onClick={printReport}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white text-red-600 rounded-lg font-semibold text-xs sm:text-sm transition-colors hover:bg-red-50 touch-manipulation active:scale-95"
                title="Print Report"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print Report</span>
                <span className="sm:hidden">Print</span>
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {/* Total Donations */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/20">
                <p className="text-xs text-red-100 mb-1">Total Records</p>
                <p className="text-xl sm:text-2xl font-bold">{donations.length}</p>
              </div>
              
              {/* Money Donations */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/20">
                <p className="text-xs text-red-100 mb-1">Money Donations</p>
                <p className="text-xl sm:text-2xl font-bold">{totalMoneyDonations}</p>
              </div>
              
              {/* Pending */}
              <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-yellow-300/30">
                <p className="text-xs text-yellow-100 mb-1">Pending</p>
                <p className="text-xl sm:text-2xl font-bold">{pendingDonations}</p>
                <p className="text-xs text-yellow-200 mt-1">Rs. {pendingAmount.toLocaleString()}</p>
              </div>
              
              {/* Confirmed */}
              <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-green-300/30">
                <p className="text-xs text-green-100 mb-1">Confirmed</p>
                <p className="text-xl sm:text-2xl font-bold">{confirmedDonations}</p>
                <p className="text-xs text-green-200 mt-1">Rs. {totalVerified.toLocaleString()}</p>
              </div>
              
              {/* Item Donations */}
              <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-blue-300/30">
                <p className="text-xs text-blue-100 mb-1">Item Donations</p>
                <p className="text-xl sm:text-2xl font-bold">{itemDonationsCount}</p>
              </div>
              
              {/* Total Amount */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/20">
                <p className="text-xs text-red-100 mb-1">Total Amount</p>
                <p className="text-lg sm:text-xl font-bold">Rs. {totalMoneyAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* LEFT COLUMN: INFO & STATS */}
        <div className="space-y-4 sm:space-y-6 lg:col-span-1">
          {/* Stats Card */}
          <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 p-4 sm:p-6 rounded-xl shadow-lg text-white">
            <h3 className="text-emerald-200 font-medium mb-1 uppercase text-xs tracking-wider">Total Verified Funds</h3>
            <div className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-yellow-400 break-words">
              Rs. {totalVerified.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 text-emerald-200 text-xs sm:text-sm">
              <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>Only confirmed donations shown</span>
            </div>
          </div>

          {/* Item Donations Count Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 sm:p-6 rounded-xl shadow-lg text-white">
            <h3 className="text-blue-200 font-medium mb-1 uppercase text-xs tracking-wider">Item Donations</h3>
            <div className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-yellow-400">
              {itemDonationsCount}
            </div>
            <div className="flex items-center gap-2 text-blue-200 text-xs sm:text-sm">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>People donated items</span>
            </div>
          </div>

           {/* Items Needed */}
           <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border-t-4 border-emerald-600">
            <h3 className="font-bold text-base sm:text-lg text-emerald-900 mb-3 sm:mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
              Accepted Items
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-stone-600">
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0"></span>School Uniform Material</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0"></span>School Bags & Books</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0"></span>Stationery</li>
            </ul>
          </div>

          {/* Quick Info Card */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border-t-4 border-blue-600">
            <h3 className="font-bold text-base sm:text-lg text-emerald-900 mb-3 sm:mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 sm:w-5 sm:h-5" />
              Quick Guide
            </h3>
            <div className="space-y-3 text-xs sm:text-sm text-stone-600">
              <div>
                <p className="font-semibold text-stone-800 mb-1">Money Donations:</p>
                <p className="text-xs">Status shows "Verifying" until admin confirms receipt.</p>
              </div>
              <div>
                <p className="font-semibold text-stone-800 mb-1">Item Donations:</p>
                <p className="text-xs">Items are marked as "Booked" immediately.</p>
              </div>
              <button
                onClick={() => setShowClarifications(true)}
                className="w-full mt-3 text-xs text-blue-600 hover:text-blue-700 font-semibold underline touch-manipulation"
              >
                View Full Instructions →
              </button>
            </div>
          </div>
        </div>

        {/* MIDDLE & RIGHT: FORM & LIST */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          
          {/* DONATION FORM */}
          {!isAdmin && (
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-stone-200">
            <div className="flex items-center gap-2 mb-4 sm:mb-6 text-emerald-800">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 fill-current text-yellow-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold">Add Your Contribution</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Project Description */}
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-4 sm:p-5 rounded-lg border border-emerald-200 mb-4">
                <h3 className="text-base sm:text-lg font-bold text-emerald-900 mb-2">
                  Select Your Donation Method
                </h3>
               
              </div>

              {/* Donation Type Selector */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setDonationType('money')}
                  className={`p-3 sm:p-4 rounded-lg border-2 flex flex-col items-center gap-2 font-bold transition-all text-sm sm:text-base touch-manipulation
                    ${donationType === 'money' 
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800' 
                      : 'border-stone-200 text-stone-400 hover:border-emerald-200'}`}
                >
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-center">Money Donation</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDonationType('item')}
                  className={`p-3 sm:p-4 rounded-lg border-2 flex flex-col items-center gap-2 font-bold transition-all text-sm sm:text-base touch-manipulation
                    ${donationType === 'item' 
                      ? 'border-blue-600 bg-blue-50 text-blue-800' 
                      : 'border-stone-200 text-stone-400 hover:border-blue-200'}`}
                >
                  <Package className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-center">Items / Material</span>
                </button>
              </div>

              {/* Common Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-stone-600 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-stone-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="contact@email.com"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-stone-600 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="0771234567"
                  />
                </div>
              </div>

              {/* Dynamic Fields */}
              {donationType === 'money' ? (
                <div className="bg-emerald-50 p-3 sm:p-4 rounded-lg border border-emerald-100">
                  <label className="block text-xs sm:text-sm font-bold text-emerald-800 mb-1">Donation Amount (LKR)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-emerald-600 font-bold text-sm sm:text-base">Rs.</span>
                    <input
                      type="number"
                      min="1"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="5000"
                    />
                  </div>
                  <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3 flex-shrink-0" /> Status will be "Pending" until admin verifies receipt.
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-100">
                  <label className="block text-xs sm:text-sm font-bold text-blue-800 mb-1">Item Description</label>
                  <input
                    type="text"
                    required
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. 20 Exercise Books, 1 School Bag"
                  />
                  <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> These items will be marked as "Booked".
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-bold text-stone-600 mb-1">Message (Optional)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none h-20 resize-none"
                  placeholder="Leave a note..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3 px-4 rounded-lg font-bold text-sm sm:text-base text-white uppercase tracking-wide transition-all shadow-md touch-manipulation
                  ${submitting ? 'bg-stone-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg active:scale-95'}`}
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Submit Donation"}
              </button>
            </form>
          </div>
          )}

          {/* LIST */}
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-emerald-900 flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                Recent Activity
              </h2>
              {isAdmin && (
                <button
                  onClick={printReport}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs sm:text-sm transition-colors touch-manipulation active:scale-95"
                  title="Print Report"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Print Report</span>
                  <span className="sm:hidden">Print</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-stone-400 text-sm sm:text-base">Loading...</div>
              ) : donations.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-xl border border-dashed border-stone-300 text-stone-500 text-sm sm:text-base">
                  No records yet.
                </div>
              ) : (
                donations.map((d) => (
                  <div key={d.id} className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-stone-100 relative group">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                      
                      {/* Left: Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-emerald-900 text-base sm:text-lg break-words">{d.name}</h4>
                          {/* STATUS BADGES */}
                          {d.type === 'money' && d.status === 'pending' && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 whitespace-nowrap">
                              <Clock className="w-3 h-3 flex-shrink-0" /> Verifying
                            </span>
                          )}
                          {d.type === 'money' && d.status === 'confirmed' && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 whitespace-nowrap">
                              <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> Confirmed
                            </span>
                          )}
                          {d.type === 'item' && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 whitespace-nowrap">
                              <Package className="w-3 h-3 flex-shrink-0" /> Booked
                            </span>
                          )}
                        </div>
                        
                        <div className="text-stone-700 font-medium mt-1 text-sm sm:text-base">
                          {d.type === 'money' ? (
                            <span className="text-emerald-700">Rs. {d.amount?.toLocaleString()}</span>
                          ) : (
                            <span className="text-blue-700 break-words">{d.item}</span>
                          )}
                        </div>
                        {d.mobileNumber && (
                          <div className="text-stone-600 text-xs sm:text-sm mt-1 flex items-center gap-1">
                            <Phone className="w-3 h-3 flex-shrink-0" />
                            <span>{d.mobileNumber}</span>
                          </div>
                        )}
                        {d.message && (
                          <p className="text-stone-500 text-xs sm:text-sm mt-1 italic break-words">"{d.message}"</p>
                        )}
                      </div>

                      {/* Right: Admin Actions */}
                      {isAdmin && (
                        <div className="flex gap-2 flex-shrink-0">
                          {d.status === 'pending' && d.type === 'money' && (
                            <button 
                              onClick={() => verifyDonation(d.id)}
                              className="px-3 py-1.5 sm:py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition touch-manipulation active:scale-95"
                            >
                              Approve
                            </button>
                          )}
                          <button 
                            onClick={() => deleteDonation(d.id)}
                            className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition touch-manipulation active:scale-95"
                            title="Delete Entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER & ADMIN TOGGLE */}
      <footer className="bg-emerald-950 text-emerald-400 py-6 sm:py-8 mt-8 sm:mt-12 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <button 
            onClick={() => setShowAdminLogin(true)}
            className="text-emerald-800 hover:text-emerald-600 transition-colors touch-manipulation p-2"
            title="Admin Login"
          >
            <Lock className="w-4 h-4 sm:w-5 sm:h-5 mx-auto" />
          </button>
        </div>
      </footer>

      {/* CLARIFICATIONS MODAL */}
      {showClarifications && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-2xl relative my-4 sm:my-8 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowClarifications(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-stone-400 hover:text-stone-600 touch-manipulation p-1"
              aria-label="Close"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="flex items-center gap-2 mb-4 sm:mb-6 pr-8">
              <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 flex-shrink-0" />
              <h3 className="text-xl sm:text-2xl font-bold text-emerald-900">Help & Information</h3>
            </div>
            
            <div className="space-y-4 sm:space-y-6 text-stone-700">
              {/* About Section */}
              <div>
                <h4 className="font-bold text-base sm:text-lg text-emerald-900 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  About This Initiative
                </h4>
                <p className="text-xs sm:text-sm leading-relaxed">
                  This platform supports students in Aranayaka through the <strong>2018 O/L and 2021 A/L Batch</strong> 
                  of Galle St. Aloysius College. Your contributions help provide essential school supplies and financial 
                  assistance to students in need.
                </p>
              </div>

              {/* How to Donate */}
              <div>
                <h4 className="font-bold text-base sm:text-lg text-emerald-900 mb-3">How to Make a Donation</h4>
                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="bg-emerald-50 p-3 sm:p-4 rounded-lg border border-emerald-100">
                    <p className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 flex-shrink-0" />
                      Money Donations:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-stone-600 ml-2">
                      <li>Select "Money Donation" option</li>
                      <li>Fill in your name, email, and donation amount</li>
                      <li>Submit the form</li>
                      <li>Your donation will show as "Verifying" until admin confirms receipt</li>
                      <li>Once verified, it appears in the "Total Verified Funds"</li>
                    </ol>
                  </div>
                  
                  <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-100">
                    <p className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Package className="w-4 h-4 flex-shrink-0" />
                      Item Donations:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-stone-600 ml-2">
                      <li>Select "Items / Material" option</li>
                      <li>Fill in your details and describe the items you're donating</li>
                      <li>Submit the form</li>
                      <li>Your donation will be marked as "Booked" immediately</li>
                      <li>Contact coordinators to arrange item collection/delivery</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Accepted Items */}
              <div>
                <h4 className="font-bold text-base sm:text-lg text-emerald-900 mb-2">Accepted Items</h4>
                <ul className="space-y-2 text-xs sm:text-sm text-stone-600">
                  <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0"></span>School Uniform Material</li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0"></span>School Bags & Books</li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0"></span>Stationery</li>
                </ul>
              </div>

              {/* Status Explanations */}
              <div>
                <h4 className="font-bold text-base sm:text-lg text-emerald-900 mb-3">Understanding Status</h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold whitespace-nowrap">Verifying</span>
                    <span className="text-stone-600">Money donation pending admin confirmation</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold whitespace-nowrap">Confirmed</span>
                    <span className="text-stone-600">Money donation verified and counted</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold whitespace-nowrap">Booked</span>
                    <span className="text-stone-600">Item donation registered</span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-stone-50 p-3 sm:p-4 rounded-lg border border-stone-200">
                <h4 className="font-bold text-base sm:text-lg text-emerald-900 mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  Need More Help?
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 mb-3">
                  For questions, clarifications, or to coordinate item donations, please contact:
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                  <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-semibold text-stone-800">Saveen:</span>
                  <a href="tel:0766088374" className="text-emerald-600 hover:text-emerald-700 break-all">076 608 8374</a>
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 pt-4 border-t border-stone-200">
              <button
                onClick={() => setShowClarifications(false)}
                className="w-full bg-emerald-600 text-white py-2.5 sm:py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors text-sm sm:text-base touch-manipulation active:scale-95"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT POPUP MODAL */}
      {showReceiptPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-md relative">
            <button 
              onClick={() => setShowReceiptPopup(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-stone-400 hover:text-stone-600 touch-manipulation p-1"
              aria-label="Close"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            
            <div className="text-center mb-4">
              <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-emerald-900 mb-2">Donation Submitted!</h3>
              <p className="text-sm sm:text-base text-stone-600">
                Your donation of <span className="font-bold text-emerald-700">Rs. {donationAmount?.toLocaleString()}</span> has been recorded.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <h4 className="font-bold text-yellow-900 text-sm sm:text-base mb-2">
                    Send Receipt via WhatsApp
                  </h4>
                  <p className="text-xs sm:text-sm text-yellow-800 mb-3">
                    To confirm your donation, please send the payment receipt to:
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <Phone className="w-4 h-4 text-yellow-700" />
                    <span className="font-semibold text-yellow-900">076 608 8374</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const whatsappMessage = `Hello, I have submitted a donation of Rs. ${donationAmount?.toLocaleString()} and here is my receipt.`;
                      window.open(`https://wa.me/94776088374?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
                    }}
                    className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold text-sm sm:text-base transition-colors touch-manipulation active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Open WhatsApp
                  </button>
                </div>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-stone-500 text-center mb-4">
              <p>Your donation status will be updated to "Confirmed" once the receipt is verified.</p>
            </div>

            <button
              onClick={() => setShowReceiptPopup(false)}
              className="w-full bg-emerald-600 text-white py-2.5 sm:py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors text-sm sm:text-base touch-manipulation active:scale-95"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}

      {/* ADMIN LOGIN MODAL */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-sm relative">
            <button 
              onClick={() => setShowAdminLogin(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-stone-400 hover:text-stone-600 touch-manipulation p-1"
              aria-label="Close"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <h3 className="text-lg sm:text-xl font-bold mb-4 text-emerald-900">Admin Access</h3>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-stone-600 mb-1">Enter PIN</label>
                <input 
                  type="password"
                  autoFocus
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 text-base sm:text-lg border border-stone-300 rounded-lg text-center tracking-widest focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="••••"
                />
              </div>
              <button className="w-full bg-emerald-900 text-white py-2.5 sm:py-2 rounded-lg font-bold hover:bg-emerald-800 text-sm sm:text-base touch-manipulation active:scale-95">
                Login
              </button>
            </form>
          </div>
        </div>
      )}

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-xl text-white font-medium animate-bounce z-50
          ${notification.type === 'error' ? 'bg-red-500' : 'bg-emerald-600'}`}>
          {notification.msg}
        </div>
      )}
    </div>
  );
}