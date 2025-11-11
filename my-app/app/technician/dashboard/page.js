"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Briefcase, MapPin, Star, CreditCard, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

// Star rating dikhane ke liye component
const StarRatingDisplay = ({ rating }) => {
    if (!rating) return null; // Agar rating nahi hai to kuch na dikhayein
    return (
        <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-slate-600">{rating}.0</span>
            <Star size={16} className="text-amber-400" fill="currentColor"/>
        </div>
    );
};

export default function TechnicianDashboard() {
    const [user, setUser] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const userDataString = localStorage.getItem('user');
        if(userDataString){
            const userData = JSON.parse(userDataString);
            setUser(userData);
        }

        const token = localStorage.getItem('token');
        const fetchJobs = async () => {
            try {
                const { data } = await axios.get('/api/bookings', { headers: { Authorization: `Bearer ${token}` }});
                setJobs(data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            } catch (error) {
                toast.error("Could not fetch assigned jobs.");
            }
        };
        if (token) fetchJobs();
        else router.push('/login');
    }, [router]);

    const handleUpdateStatus = async (jobId, status) => {
        const token = localStorage.getItem('token');
        const loadingToast = toast.loading('Updating status...');
        try {
            await axios.put(`/api/bookings/${jobId}`, { status }, { headers: { Authorization: `Bearer ${token}` }});
            setJobs(jobs.map(j => j._id === jobId ? {...j, status} : j));
            if (selectedJob?._id === jobId) {
                setSelectedJob({...selectedJob, status});
            }
            toast.success('Status updated!', { id: loadingToast });
        } catch (error) {
            toast.error('Update failed.', { id: loadingToast });
        }
    };

    const getStatusChip = (status) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-800';
            case 'In Progress': return 'bg-blue-100 text-blue-800';
            case 'Pending': case 'Assigned': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPaymentStatusInfo = (payment) => {
        if (!payment || !payment.method) {
            return { text: 'Payment Not Selected', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: AlertCircle };
        }
        
        if (payment.status === 'Paid') {
            if (payment.method === 'Easypaisa/Jazzcash' || payment.method === 'Easypaisa' || payment.method === 'Jazzcash') {
                return { text: 'Already Paid (Online)', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle };
            } else {
                return { text: 'Already Paid', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle };
            }
        }
        
        if (payment.method === 'Cash on Delivery') {
            return { text: 'Collect Payment (COD)', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: DollarSign };
        }
        
        return { text: `Pending - ${payment.method}`, color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: CreditCard };
    };

    const handleConfirmPayment = async (jobId) => {
        const token = localStorage.getItem('token');
        const loadingToast = toast.loading('Confirming payment receipt...');
        try {
            await axios.put(`/api/bookings/${jobId}`, 
                { 
                    payment: { status: 'Paid' },
                    paymentReceivedBy: 'technician'
                }, 
                { headers: { Authorization: `Bearer ${token}` }}
            );
            // Refresh jobs
            const { data } = await axios.get('/api/bookings', { headers: { Authorization: `Bearer ${token}` }});
            setJobs(data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            
            // Update selected job if it's the same one
            if (selectedJob?._id === jobId) {
                const updatedJob = data.data.find(j => j._id === jobId);
                if (updatedJob) setSelectedJob(updatedJob);
            }
            
            toast.success('Payment confirmed! Admin has been notified.', { id: loadingToast });
        } catch (error) {
            toast.error('Failed to confirm payment.', { id: loadingToast });
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-800">Welcome, {user?.name}!</h2>
                <p className="text-slate-500 mt-1">Here are the jobs assigned to you.</p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
                <h3 className="text-2xl font-bold text-slate-800 mb-6">My Assigned Jobs</h3>
                <div className="space-y-4">
                    {jobs.length > 0 ? jobs.map(job => {
                        const paymentInfo = getPaymentStatusInfo(job.payment);
                        const PaymentIcon = paymentInfo.icon;
                        return (
                        <div key={job._id} className="p-4 border border-slate-200 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                            <div className="flex-grow">
                                <p className="font-bold text-slate-700 text-lg">{job.serviceType}</p>
                                <p className="text-sm text-slate-500 mt-1">Customer: <span className="font-medium">{job.customer?.name || 'N/A'}</span></p>
                                <p className="text-sm text-slate-500">Date: {new Date(job.bookingDate).toLocaleString()}</p>
                                <div className="mt-2 flex items-center gap-2 flex-wrap">
                                    <PaymentIcon className={`h-4 w-4 ${paymentInfo.color}`} />
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${paymentInfo.bgColor} ${paymentInfo.color}`}>
                                        {paymentInfo.text}
                                    </span>
                                    {job.amountDue && (
                                        <span className="px-2 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800">
                                            Amount: Rs {job.amountDue.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                {/* Rating yahan dikhayein */}
                                {job.status === 'Completed' && <StarRatingDisplay rating={job.rating} />}
                                <span className={`px-4 py-1 text-sm font-semibold rounded-full ${getStatusChip(job.status)}`}>{job.status}</span>
                                <button onClick={() => setSelectedJob(job)} className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center">
                                    View Details <MapPin className="ml-2 h-4 w-4"/>
                                </button>
                            </div>
                        </div>
                    )}) : 
                    <div className="text-center py-10"><Briefcase className="mx-auto h-12 w-12 text-slate-300" /><p className="mt-4 text-slate-500">You have no jobs assigned yet.</p></div>
                    }
                </div>
            </div>

            {selectedJob && (() => {
                const paymentInfo = getPaymentStatusInfo(selectedJob.payment);
                const PaymentIcon = paymentInfo.icon;
                const isCOD = selectedJob.payment?.method === 'Cash on Delivery';
                const isPaymentPending = selectedJob.payment?.status === 'Pending';
                const canConfirmPayment = isCOD && isPaymentPending;
                
                return (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-bold mb-4">Job Details ({selectedJob.status})</h3>
                        
                        {/* Payment Information Section */}
                        <div className={`mb-6 p-4 border-2 rounded-lg ${
                            paymentInfo.color.includes('green') ? 'border-green-300' : 
                            paymentInfo.color.includes('orange') ? 'border-orange-300' : 
                            'border-yellow-300'
                        }`}>
                            <div className="flex items-center gap-3 mb-2">
                                <PaymentIcon className={`h-5 w-5 ${paymentInfo.color}`} />
                                <h4 className="font-bold text-slate-800">Payment Information</h4>
                            </div>
                            <div className="space-y-1 text-slate-700">
                                {selectedJob.amountDue && (
                                    <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                        <p className="text-lg font-bold text-purple-900">
                                            Amount: <span className="text-2xl">Rs {selectedJob.amountDue.toLocaleString()}</span>
                                        </p>
                                        {selectedJob.isSubscriptionBooking && (
                                            <p className="text-xs text-purple-700 mt-1">Includes Annual Subscription</p>
                                        )}
                                    </div>
                                )}
                                <p><strong>Payment Method:</strong> {selectedJob.payment?.method || 'Not Selected'}</p>
                                <p><strong>Payment Status:</strong> 
                                    <span className={`ml-2 px-2 py-1 text-sm font-medium rounded ${paymentInfo.bgColor} ${paymentInfo.color}`}>
                                        {paymentInfo.text}
                                    </span>
                                </p>
                                {selectedJob.payment?.paymentId && (
                                    <p><strong>Transaction ID:</strong> {selectedJob.payment.paymentId}</p>
                                )}
                                {selectedJob.payment?.method === 'Easypaisa/Jazzcash' && selectedJob.payment?.status === 'Paid' && (
                                    <p className="text-sm text-green-700 font-semibold mt-2">✓ Payment received via online gateway (Approved by Admin)</p>
                                )}
                                {isCOD && isPaymentPending && (
                                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                                        <p className="text-sm font-semibold text-orange-800">⚠ Please collect payment from customer</p>
                                        {selectedJob.amountDue && (
                                            <p className="text-base font-bold text-orange-900 mt-2">
                                                Collect: <span className="text-xl">Rs {selectedJob.amountDue.toLocaleString()}</span>
                                            </p>
                                        )}
                                        <p className="text-xs text-orange-700 mt-1">Click &quot;Confirm Payment Received&quot; after collecting cash</p>
                                    </div>
                                )}
                                {selectedJob.payment?.method === 'Easypaisa/Jazzcash' && selectedJob.payment?.status === 'Pending' && selectedJob.amountDue && (
                                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                                        <p className="text-sm font-semibold text-blue-800">Payment Instructions:</p>
                                        <p className="text-sm text-blue-700 mt-1">
                                            Customer should send <strong>Rs {selectedJob.amountDue.toLocaleString()}</strong> to the payment number
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mb-4 space-y-1 text-slate-600">
                            <p><strong>Customer:</strong> {selectedJob.customer?.name || 'N/A'}</p>
                            <p><strong>Phone:</strong> {selectedJob.customer?.profile?.phone || 'N/A'}</p>
                            <p><strong>Email:</strong> {selectedJob.customer?.email || 'N/A'}</p>
                            <p><strong>Service Type:</strong> {selectedJob.serviceType}</p>
                            <p><strong>Address:</strong> {selectedJob.address}</p>
                            <p><strong>Booking Date:</strong> {new Date(selectedJob.bookingDate).toLocaleString()}</p>
                        </div>
                        <div className="h-64 bg-slate-200 rounded-lg flex items-center justify-center mb-4">
                            <MapPin className="h-16 w-16 text-slate-400"/>
                            <p className="ml-4 text-slate-500">Google Map would be here.</p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-4 flex-wrap">
                                {selectedJob.status === 'Assigned' && <button onClick={() => handleUpdateStatus(selectedJob._id, 'In Progress')} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 font-semibold">Start Job</button>}
                                {selectedJob.status === 'In Progress' && <button onClick={() => handleUpdateStatus(selectedJob._id, 'Completed')} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 font-semibold">Mark as Completed</button>}
                            </div>
                            {canConfirmPayment && (
                                <button 
                                    onClick={() => handleConfirmPayment(selectedJob._id)} 
                                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 font-semibold flex items-center justify-center gap-2"
                                >
                                    <DollarSign className="h-5 w-5" />
                                    Confirm Payment Received (COD) - Rs {selectedJob.amountDue?.toLocaleString() || '0'}
                                </button>
                            )}
                        </div>
                        <button onClick={() => setSelectedJob(null)} className="mt-6 w-full bg-slate-100 text-slate-700 py-2 rounded-lg hover:bg-slate-200 font-semibold">Close</button>
                    </div>
                </div>
                );
            })()}
        </div>
    );
}