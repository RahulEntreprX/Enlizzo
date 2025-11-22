
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, ShoppingBag, Flag, Activity, Settings, 
  LogOut, Search, ChevronRight, Moon, Sun, ShieldCheck, AlertTriangle, 
  Ban, Lock, ArrowLeft, Trash2, ExternalLink, CheckCircle, Menu
} from 'lucide-react';
import { 
  fetchAdminStats, fetchAllUsers, fetchAdminListings, fetchReports, 
  fetchSystemLogs, fetchSystemSettings, updateSystemSettings, 
  deleteListing, banUser, dismissReport 
} from '../../services/db';
import { User as UserType, Product, Report, AdminLog, SystemSettings } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';

interface AdminPanelProps {
  isDemo: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                 UI COMPONENTS                              */
/* -------------------------------------------------------------------------- */

// Rounded 16px (2xl), Glass/Matte effect based on theme variables
const AdminCard: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-admin-border bg-admin-panel shadow-lg shadow-admin-shadow backdrop-blur-xl transition-all duration-300 ${className}`}>
    {children}
  </div>
);

const StatusBadge: React.FC<{ children: React.ReactNode, variant?: 'success' | 'danger' | 'warning' | 'neutral' | 'active' }> = ({ children, variant = 'neutral' }) => {
  const styles = {
    success: 'bg-admin-success/10 text-admin-success border-admin-success/20',
    danger: 'bg-admin-danger/10 text-admin-danger border-admin-danger/20',
    warning: 'bg-admin-warning/10 text-admin-warning border-admin-warning/20',
    neutral: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/5',
    active: 'bg-admin-primary/10 text-admin-primary border-admin-primary/20'
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${styles[variant]}`}>
      {children}
    </span>
  );
};

const StatCard: React.FC<{ label: string; value: string | number; icon: any; colorClass: string }> = ({ label, value, icon: Icon, colorClass }) => (
  <AdminCard className="p-6 flex items-center justify-between group hover:border-admin-primary/30 transition-all hover:-translate-y-1">
    <div>
      <p className="text-xs font-bold text-admin-muted uppercase tracking-wider mb-2">{label}</p>
      <h3 className="text-3xl font-bold text-admin-text">{value}</h3>
    </div>
    <div className={`p-4 rounded-2xl ${colorClass} bg-opacity-10`}>
      <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
    </div>
  </AdminCard>
);

/* -------------------------------------------------------------------------- */
/*                                 MAIN PAGE                                  */
/* -------------------------------------------------------------------------- */

export const AdminPanel: React.FC<AdminPanelProps> = ({ isDemo }) => {
  const { user, logout } = useAuth();
  
  // Layout State
  const [activeView, setActiveView] = useState<'dashboard' | 'products' | 'users' | 'reports' | 'logs' | 'settings'>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile, controlled via CSS for desktop
  const [adminTheme, setAdminTheme] = useState<'light' | 'dark'>('dark');
  
  // Data State
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Theme & Data
  useEffect(() => {
    // Sync Admin Theme with Global HTML class
    const root = document.documentElement;
    if (adminTheme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');

    const loadData = async () => {
      setLoading(true);
      try {
        const [s, u, p, r, l, cfg] = await Promise.all([
          fetchAdminStats(isDemo),
          fetchAllUsers(isDemo),
          fetchAdminListings(isDemo), // Use admin-specific fetch
          fetchReports(isDemo),
          fetchSystemLogs(isDemo),
          fetchSystemSettings(isDemo)
        ]);
        setStats(s);
        setUsers(u);
        setProducts(p);
        setReports(r);
        setLogs(l);
        setSettings(cfg);
      } catch (e) {
        console.error("Admin data load failed", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isDemo, activeView, adminTheme]);

  // Actions
  const handleBanUser = async (userId: string) => {
    if (confirm("Are you sure you want to ban this user?")) {
      await banUser(userId, isDemo);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBanned: true } : u));
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm("Delete this listing permanently?")) {
      await deleteListing(productId, isDemo);
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  const handleDismissReport = async (reportId: string) => {
    await dismissReport(reportId, isDemo);
    setReports(prev => prev.filter(r => r.id !== reportId));
  };

  const handleUpdateSettings = async (key: keyof SystemSettings, value: any) => {
    if (!settings) return;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await updateSystemSettings(newSettings, isDemo);
  };

  if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
    return (
       <div className="min-h-screen flex flex-col items-center justify-center bg-[#0D0D0F] text-white p-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 mb-6 border border-red-500/50">
             <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Restricted Access</h1>
          <p className="text-gray-400 mb-8 text-center max-w-md">You do not have sufficient permissions to view the administration portal.</p>
          <button onClick={logout} className="px-8 py-3 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform">Logout</button>
       </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                 SUB-VIEWS                                  */
  /* -------------------------------------------------------------------------- */

  const DashboardView = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Users" value={stats?.totalUsers || 0} icon={Users} colorClass="bg-admin-primary text-admin-primary" />
        <StatCard label="Active Listings" value={stats?.activeProducts || 0} icon={ShoppingBag} colorClass="bg-admin-accent text-admin-accent" />
        <StatCard label="Pending Reports" value={stats?.pendingReports || 0} icon={Flag} colorClass="bg-admin-danger text-admin-danger" />
        <StatCard label="Market Value" value={`₹${(stats?.totalValue || 0).toLocaleString()}`} icon={Activity} colorClass="bg-admin-success text-admin-success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AdminCard className="col-span-1 lg:col-span-2 p-6 min-h-[400px]">
           <h3 className="font-bold text-lg text-admin-text mb-6 flex items-center gap-2"><Activity size={18} /> System Activity</h3>
           <div className="space-y-4">
              {logs.slice(0, 6).map((log) => (
                 <div key={log.id} className="flex items-start gap-4 py-3 border-b border-admin-border last:border-0 group hover:bg-admin-bg/50 -mx-4 px-4 rounded-xl transition-colors">
                    <div className={`mt-2 w-2 h-2 rounded-full flex-shrink-0 ${log.type === 'DANGER' ? 'bg-admin-danger' : log.type === 'WARNING' ? 'bg-admin-warning' : 'bg-admin-primary'}`} />
                    <div className="flex-1">
                       <div className="flex justify-between mb-0.5">
                          <span className="text-sm font-bold text-admin-text">{log.action}</span>
                          <span className="text-[10px] font-mono text-admin-muted">{new Date(log.timestamp).toLocaleTimeString()}</span>
                       </div>
                       <div className="text-xs text-admin-muted flex gap-1">
                          <span className="font-medium text-admin-text opacity-80">{log.actorName}</span>
                          <span className="opacity-50">•</span>
                          <span>{log.details || log.target}</span>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </AdminCard>
        
        <AdminCard className="col-span-1 p-6 min-h-[400px]">
           <h3 className="font-bold text-lg text-admin-text mb-6 flex items-center gap-2"><Users size={18} /> New Members</h3>
           <div className="space-y-3">
              {stats?.recentUsers?.map((u: any) => (
                 <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-admin-bg/50 border border-admin-border hover:border-admin-primary/30 transition-colors">
                    <div className="flex items-center gap-3">
                       <div className="h-10 w-10 rounded-full bg-gradient-to-br from-admin-primary to-admin-accent flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-admin-primary/20">
                          {u.name[0]}
                       </div>
                       <div className="min-w-0">
                          <div className="text-sm font-bold text-admin-text truncate max-w-[120px]">{u.name}</div>
                          <div className="text-xs text-admin-muted truncate max-w-[120px]">{u.email}</div>
                       </div>
                    </div>
                    <StatusBadge variant="neutral">{u.hostel}</StatusBadge>
                 </div>
              ))}
           </div>
        </AdminCard>
      </div>
    </div>
  );

  const ProductsView = () => (
    <AdminCard className="overflow-hidden animate-fade-in h-[calc(100vh-160px)] flex flex-col">
       <div className="p-6 border-b border-admin-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-admin-surface/30">
          <div className="flex items-center gap-3">
              <h2 className="font-bold text-lg text-admin-text">Product Inventory</h2>
              <span className="px-2 py-0.5 rounded-full bg-admin-primary/10 text-admin-primary text-xs font-bold">{products.length}</span>
          </div>
          <div className="relative w-full sm:w-auto">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted h-4 w-4" />
             <input type="text" placeholder="Search inventory..." className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-xl bg-admin-bg border border-admin-border text-sm text-admin-text outline-none focus:border-admin-primary focus:ring-1 focus:ring-admin-primary transition-all placeholder-admin-muted" />
          </div>
       </div>
       <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
             <thead className="bg-admin-bg border-b border-admin-border text-xs font-bold uppercase text-admin-muted tracking-wider sticky top-0 z-10 backdrop-blur-md">
                <tr>
                   <th className="px-6 py-4">Item Details</th>
                   <th className="px-6 py-4">Seller Info</th>
                   <th className="px-6 py-4">Price</th>
                   <th className="px-6 py-4">Status</th>
                   <th className="px-6 py-4 text-right">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-admin-border">
                {products.map(p => (
                   <tr key={p.id} className="group hover:bg-admin-surface/50 transition-colors text-sm">
                      <td className="px-6 py-4">
                         <div className="font-bold text-admin-text mb-0.5 flex items-center gap-2">
                             {p.title}
                             {p.status === 'FLAGGED' && <AlertTriangle size={12} className="text-admin-danger" />}
                         </div>
                         <div className="text-xs text-admin-muted font-mono">{p.category} • {p.createdAt}</div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="text-admin-text font-medium">{p.sellerName}</div>
                         <div className="text-xs text-admin-muted">{p.sellerHostel}</div>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-admin-text">
                         {p.price === 0 ? <span className="text-admin-success">Donation</span> : `₹${p.price}`}
                      </td>
                      <td className="px-6 py-4">
                         <StatusBadge variant={p.status === 'ACTIVE' ? 'active' : p.status === 'FLAGGED' ? 'danger' : 'neutral'}>
                           {p.status || (p.isSold ? 'SOLD' : 'ACTIVE')}
                         </StatusBadge>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <button onClick={() => handleDeleteProduct(p.id)} className="p-2 rounded-lg hover:bg-admin-danger/10 text-admin-muted hover:text-admin-danger transition-colors" title="Delete Listing">
                            <Trash2 size={16} />
                         </button>
                         <a href={`/product/${p.slug || p.id}`} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-admin-primary/10 text-admin-muted hover:text-admin-primary transition-colors inline-block ml-2" title="View Live">
                            <ExternalLink size={16} />
                         </a>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </AdminCard>
  );

  const UsersView = () => (
    <AdminCard className="overflow-hidden animate-fade-in h-[calc(100vh-160px)] flex flex-col">
       <div className="p-6 border-b border-admin-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-admin-surface/30">
          <h2 className="font-bold text-lg text-admin-text">User Directory</h2>
          <div className="relative w-full sm:w-auto">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted h-4 w-4" />
             <input type="text" placeholder="Search users..." className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-xl bg-admin-bg border border-admin-border text-sm text-admin-text outline-none focus:border-admin-primary focus:ring-1 focus:ring-admin-primary transition-all placeholder-admin-muted" />
          </div>
       </div>
       <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
             <thead className="bg-admin-bg border-b border-admin-border text-xs font-bold uppercase text-admin-muted tracking-wider sticky top-0 z-10 backdrop-blur-md">
                <tr>
                   <th className="px-6 py-4">User Profile</th>
                   <th className="px-6 py-4">Role</th>
                   <th className="px-6 py-4">Status</th>
                   <th className="px-6 py-4 text-right">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-admin-border">
                {users.map(u => (
                   <tr key={u.id} className="group hover:bg-admin-surface/50 transition-colors text-sm">
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-admin-surface border border-admin-border overflow-hidden">
                               <img src={u.avatarUrl} className="h-full w-full object-cover" alt="" />
                            </div>
                            <div>
                               <div className="font-bold text-admin-text">{u.name}</div>
                               <div className="text-xs text-admin-muted">{u.email}</div>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${u.role === 'ADMIN' ? 'bg-admin-primary/10 text-admin-primary' : 'text-admin-muted bg-admin-bg'}`}>
                           {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                         <StatusBadge variant={u.isBanned ? 'danger' : 'success'}>{u.isBanned ? 'BANNED' : 'ACTIVE'}</StatusBadge>
                      </td>
                      <td className="px-6 py-4 text-right">
                         {!u.isBanned && u.role !== 'SUPER_ADMIN' && (
                            <button onClick={() => handleBanUser(u.id)} className="text-xs font-bold text-admin-danger hover:underline flex items-center justify-end gap-1 ml-auto">
                               <Ban size={14} /> Ban User
                            </button>
                         )}
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </AdminCard>
  );

  const ReportsView = () => (
     <div className="space-y-4 animate-fade-in max-w-4xl mx-auto">
        {reports.length === 0 ? (
           <div className="text-center py-24 opacity-50">
              <div className="mx-auto w-16 h-16 bg-admin-success/10 rounded-full flex items-center justify-center text-admin-success mb-4">
                 <CheckCircle size={32} />
              </div>
              <h3 className="text-lg font-bold text-admin-text">All Clear</h3>
              <p className="text-admin-muted">No pending reports to review.</p>
           </div>
        ) : (
           reports.map(report => (
              <AdminCard key={report.id} className="p-6 border-l-4 border-l-admin-danger flex flex-col md:flex-row gap-6">
                 <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                       <StatusBadge variant="danger">REPORTED</StatusBadge>
                       <span className="text-xs font-mono text-admin-muted">{new Date(report.createdAt).toLocaleString()}</span>
                    </div>
                    <h3 className="text-lg font-bold text-admin-text mb-2">Reason: {report.reason}</h3>
                    <div className="p-4 rounded-xl bg-admin-bg border border-admin-border mt-4">
                       <div className="text-xs text-admin-muted uppercase tracking-wider mb-1">Offending Item</div>
                       <div className="font-bold text-admin-text text-base flex items-center gap-2">
                           {report.listing?.title}
                           <a href={`/product/${report.listing?.slug || report.listingId}`} target="_blank" rel="noreferrer" className="text-admin-primary"><ExternalLink size={14} /></a>
                       </div>
                       <div className="text-sm text-admin-muted mt-1">Seller: {report.listing?.sellerName}</div>
                    </div>
                 </div>
                 <div className="flex flex-col gap-3 justify-center border-t md:border-t-0 md:border-l border-admin-border pt-4 md:pt-0 md:pl-6">
                    <button onClick={() => handleDeleteProduct(report.listingId)} className="px-4 py-2.5 rounded-xl bg-admin-danger text-white text-sm font-bold shadow-lg shadow-admin-danger/30 hover:shadow-xl transition-all whitespace-nowrap">
                       Ban & Delete
                    </button>
                    <button onClick={() => handleDismissReport(report.id)} className="px-4 py-2.5 rounded-xl border border-admin-border hover:bg-admin-bg text-sm font-bold text-admin-text transition-colors whitespace-nowrap">
                       Dismiss Report
                    </button>
                 </div>
              </AdminCard>
           ))
        )}
     </div>
  );

  const SettingsView = () => (
    <div className="max-w-3xl mx-auto animate-fade-in space-y-8">
       <AdminCard className="p-8">
          <h2 className="text-xl font-bold text-admin-text mb-8 flex items-center gap-3">
             <div className="p-2 bg-admin-primary/10 rounded-lg text-admin-primary"><Settings size={20} /></div>
             System Configuration
          </h2>
          
          <div className="space-y-8">
             {[
               { key: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Disable marketplace access for all users immediately.' },
               { key: 'allowNewSignups', label: 'Allow Registration', desc: 'Permit new users to sign up via IITD email.' }
             ].map((item: any) => (
               <div key={item.key} className="flex items-center justify-between">
                  <div className="pr-8">
                     <div className="font-bold text-admin-text text-base">{item.label}</div>
                     <p className="text-sm text-admin-muted mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                  <button 
                    onClick={() => handleUpdateSettings(item.key, !(settings as any)?.[item.key])}
                    className={`w-14 h-8 rounded-full transition-colors relative flex-shrink-0 border-2 ${
                        (settings as any)?.[item.key] 
                        ? 'bg-admin-primary border-admin-primary' 
                        : 'bg-transparent border-admin-muted/30'
                    }`}
                  >
                     <div className={`absolute top-1 left-1 h-5 w-5 bg-white rounded-full transition-transform shadow-sm ${
                        (settings as any)?.[item.key] ? 'translate-x-6' : ''
                     }`} />
                  </button>
               </div>
             ))}

             <div className="pt-8 border-t border-admin-border">
                <label className="block text-sm font-bold text-admin-text mb-3">Price Cap Threshold (%)</label>
                <div className="flex items-center gap-4">
                   <input 
                      type="number" 
                      value={settings?.priceCapPercentage || 0} 
                      onChange={(e) => handleUpdateSettings('priceCapPercentage', Number(e.target.value))}
                      className="w-32 p-3 rounded-xl bg-admin-bg border border-admin-border text-admin-text font-mono font-bold text-center outline-none focus:border-admin-primary focus:ring-1 focus:ring-admin-primary transition-all" 
                   />
                   <span className="text-sm text-admin-muted">of original MRP</span>
                </div>
             </div>
          </div>
       </AdminCard>

       <AdminCard className="p-8 border-admin-danger/30 bg-admin-danger/5">
          <h2 className="text-xl font-bold text-admin-danger mb-4 flex items-center gap-2"><AlertTriangle size={20} /> Danger Zone</h2>
          <p className="text-sm text-admin-muted mb-6">Irreversible actions. Proceed with caution.</p>
          
          <div className="flex gap-4">
             <button className="px-5 py-2.5 bg-white dark:bg-black border border-admin-danger/20 text-admin-danger rounded-xl hover:bg-admin-danger hover:text-white transition-all font-bold text-sm">Purge Deleted</button>
             <button className="px-5 py-2.5 bg-white dark:bg-black border border-admin-danger/20 text-admin-danger rounded-xl hover:bg-admin-danger hover:text-white transition-all font-bold text-sm">Reset Logs</button>
          </div>
       </AdminCard>
    </div>
  );

  /* -------------------------------------------------------------------------- */
  /*                                 LAYOUT                                     */
  /* -------------------------------------------------------------------------- */

  return (
    <div className={`min-h-screen bg-admin-bg text-admin-text font-sans transition-colors duration-500 flex selection:bg-admin-primary/30 selection:text-admin-primary overflow-x-hidden`}>
       
       {/* --- SIDEBAR --- */}
       <aside className={`fixed top-0 left-0 bottom-0 z-50 w-[280px] bg-admin-panel border-r border-admin-border backdrop-blur-xl transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:block`}>
          <div className="h-20 flex items-center px-8 border-b border-admin-border">
             <ShieldCheck className="text-admin-primary mr-3" size={28} />
             <span className="font-extrabold text-xl tracking-tight text-admin-text">Admin<span className="text-admin-primary">Portal</span></span>
          </div>

          <nav className="p-6 space-y-2 overflow-y-auto h-[calc(100%-180px)]">
             {[
                { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
                { id: 'products', label: 'Products', icon: ShoppingBag },
                { id: 'users', label: 'Users', icon: Users },
                { id: 'reports', label: 'Moderation', icon: Flag },
                { id: 'settings', label: 'Settings', icon: Settings },
             ].map(item => (
                <button
                   key={item.id}
                   onClick={() => { setActiveView(item.id as any); if(window.innerWidth < 1024) setSidebarOpen(false); }}
                   className={`w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                      activeView === item.id 
                      ? 'bg-admin-primary text-admin-primary-fg shadow-lg shadow-admin-primary/25 font-bold' 
                      : 'text-admin-muted hover:bg-admin-surface hover:text-admin-text font-medium'
                   }`}
                >
                   <item.icon size={20} className={`mr-4 relative z-10 ${activeView !== item.id && 'opacity-70 group-hover:opacity-100'}`} />
                   <span className="relative z-10">{item.label}</span>
                   {item.id === 'reports' && stats?.pendingReports > 0 && (
                      <span className="ml-auto bg-admin-danger text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm relative z-10">{stats.pendingReports}</span>
                   )}
                </button>
             ))}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-admin-border bg-admin-panel/50 backdrop-blur-md">
             <div className="flex items-center gap-3 mb-6 px-2">
                <div className="h-10 w-10 rounded-full bg-admin-surface border border-admin-border flex items-center justify-center text-admin-text font-bold shadow-sm overflow-hidden">
                   {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : user.name[0]}
                </div>
                <div className="overflow-hidden min-w-0">
                   <div className="text-sm font-bold text-admin-text truncate">{user.name}</div>
                   <div className="text-[10px] text-admin-muted font-mono truncate">{user.email}</div>
                </div>
             </div>
             <button onClick={() => { window.location.href = '/market'; }} className="w-full flex items-center justify-center px-4 py-3 rounded-xl border border-admin-border text-admin-muted hover:text-admin-primary hover:border-admin-primary hover:bg-admin-surface transition-all font-bold text-sm mb-3">
                <ArrowLeft size={16} className="mr-2" /> Back to App
             </button>
          </div>
       </aside>

       {/* --- MAIN CONTENT --- */}
       <main className={`flex-1 transition-all duration-300 lg:ml-[280px] min-h-screen flex flex-col w-full`}>
          
          {/* Top Bar */}
          <header className="h-20 sticky top-0 z-40 bg-admin-bg/80 backdrop-blur-xl border-b border-admin-border px-6 sm:px-8 flex justify-between items-center">
             <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-admin-surface text-admin-muted">
                   <Menu size={24} />
                </button>
                <div>
                   <h1 className="text-xl font-extrabold capitalize text-admin-text tracking-tight">{activeView}</h1>
                   <p className="text-xs text-admin-muted hidden sm:block font-mono mt-0.5">ADMINISTRATION CONSOLE</p>
                </div>
             </div>

             <div className="flex items-center gap-4">
                <button 
                   onClick={() => setAdminTheme(adminTheme === 'light' ? 'dark' : 'light')} 
                   className="group relative p-2.5 rounded-full bg-admin-surface border border-admin-border text-admin-muted hover:text-admin-primary hover:border-admin-primary transition-all"
                   title="Toggle Admin Theme"
                >
                   <div className="absolute inset-0 bg-admin-primary/10 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300" />
                   {adminTheme === 'light' ? <Moon size={20} className="relative z-10" /> : <Sun size={20} className="relative z-10" />}
                </button>
             </div>
          </header>

          {/* Content Area */}
          <div className="p-6 sm:p-8 max-w-[1600px] mx-auto w-full flex-1">
             {loading ? (
                <div className="flex items-center justify-center h-[60vh]">
                   <div className="relative">
                      <div className="h-16 w-16 rounded-full border-4 border-admin-border opacity-30"></div>
                      <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-t-admin-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                   </div>
                </div>
             ) : (
                <div className="animate-slide-up">
                   {activeView === 'dashboard' && <DashboardView />}
                   {activeView === 'products' && <ProductsView />}
                   {activeView === 'users' && <UsersView />}
                   {activeView === 'reports' && <ReportsView />}
                   {activeView === 'logs' && <DashboardView />} 
                   {activeView === 'settings' && <SettingsView />}
                </div>
             )}
          </div>
       </main>

       {/* Mobile Sidebar Overlay */}
       {isSidebarOpen && (
         <div 
           className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
           onClick={() => setSidebarOpen(false)}
         />
       )}
    </div>
  );
};
