
import React, { useEffect, useState } from 'react';
import { fetchReports, dismissReport, banUser, deleteListing } from '../services/db';
import { Report } from '../types';
import { ShieldCheck, Ban, Trash2, Check, X } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
        const data = await fetchReports();
        setReports(data);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleDismiss = async (id: string) => {
    await dismissReport(id);
    setReports(prev => prev.filter(r => r.id !== id));
  };

  const handleDelete = async (listingId: string, listingTitle: string) => {
    if(confirm(`Delete listing "${listingTitle}" permanently?`)) {
        await deleteListing(listingId);
        setReports(prev => prev.filter(r => r.listingId !== listingId)); // Remove all reports for this listing
    }
  };

  const handleBan = async (userId: string, userName: string) => {
      if(confirm(`Are you sure you want to BAN user "${userName}" permanently? This cannot be undone easily.`)) {
          await banUser(userId);
          alert(`User ${userName} has been banned.`);
      }
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
              <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
         <div className="p-6 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
             <h2 className="font-bold text-lg text-slate-900 dark:text-white">Active Reports</h2>
         </div>

         {loading ? (
             <div className="p-8 text-center text-gray-500">Loading reports...</div>
         ) : reports.length === 0 ? (
             <div className="p-12 text-center">
                 <div className="inline-flex justify-center items-center p-4 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 mb-4">
                    <Check size={32} />
                 </div>
                 <p className="text-gray-500 dark:text-gray-400">All clean! No pending reports.</p>
             </div>
         ) : (
             <div className="divide-y divide-gray-200 dark:divide-white/10">
                 {reports.map(report => (
                     <div key={report.id} className="p-6 flex flex-col md:flex-row justify-between gap-4 items-start">
                         <div className="flex-1">
                             <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200">REPORTED</span>
                                <span className="text-sm text-gray-500">{new Date(report.createdAt).toLocaleDateString()}</span>
                             </div>
                             <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">
                                 Reason: {report.reason}
                             </h3>
                             <div className="mt-2 p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/5">
                                <p className="text-sm text-gray-800 dark:text-gray-200 font-semibold">
                                    Listing: {report.listing?.title || 'Unknown'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Seller: <span className="text-indigo-600 dark:text-indigo-400 font-medium">{report.listing?.sellerName}</span> ({report.listing?.sellerEmail})
                                </p>
                             </div>
                             <p className="text-xs text-gray-400 mt-2">
                                 Reported by: {report.reporter?.name || 'Anonymous'}
                             </p>
                         </div>
                         
                         <div className="flex gap-3 flex-wrap justify-end">
                             <button 
                                onClick={() => handleDismiss(report.id)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors text-sm font-medium"
                             >
                                 <X size={16} /> Dismiss
                             </button>
                             <button 
                                onClick={() => handleDelete(report.listingId, report.listing?.title || 'Item')}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-colors text-sm font-medium"
                             >
                                 <Trash2 size={16} /> Delete Item
                             </button>
                             <button 
                                onClick={() => handleBan(report.listing?.sellerId || '', report.listing?.sellerName || 'User')} 
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition-colors text-sm font-medium shadow-lg shadow-slate-900/20"
                                title={`Ban ${report.listing?.sellerName}`}
                             >
                                 <Ban size={16} /> Ban {report.listing?.sellerName?.split(' ')[0] || 'User'}
                             </button>
                         </div>
                     </div>
                 ))}
             </div>
         )}
      </div>
    </div>
  );
};
