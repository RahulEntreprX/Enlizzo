
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Users, ShoppingBag, Flag, Activity, Settings, 
  LogOut, Search, ChevronRight, Bell, Moon, Sun, Check, X, 
  ShieldCheck, AlertTriangle, Trash2, Ban, User, Lock
} from 'lucide-react';
import { 
  fetchAdminStats, fetchAllUsers, fetchListings, fetchReports, 
  fetchSystemLogs, fetchSystemSettings, updateSystemSettings, 
  deleteListing, banUser, dismissReport, createLog 
} from '../services/db';
import { User as UserType, Product, Report, AdminLog, SystemSettings } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface AdminPanelProps {
  isDemo: boolean;
}

// Reusable Admin UI Components
const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-xl border border-admin-border bg-admin-panel shadow-sm backdrop-blur-xl transition-all duration-300 ${className}`}>
    {children}
  </div>
);

const Badge: React.FC<{ children: React.ReactNode, variant?: 'success' | 'danger' | 'warning' | 'neutral' }> = ({ children, variant = 'neutral' }) => {
  const styles = {
    success: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900/50',
    danger: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50',
    warning: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/50',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${styles[variant]}`}>
      {children}
    </span>
  );
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ isDemo }) => {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState<'dashboard' | 'products' | 'users' | 'reports' | 'logs' | 'settings'>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [adminTheme, setAdminTheme] = useState<'light' | 'dark'>('light');
  
  // Data State
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [s, u, p, r, l, cfg] = await Promise.all([
          fetchAdminStats(isDemo),
          fetchAllUsers(isDemo),
          fetchListings(isDemo),
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
  }, [isDemo, activeView]); // Reload when view changes to keep fresh

  // Apply Admin Theme Logic (Overrides Main App Theme locally for Admin)
  useEffect(() => {
    const root = document.documentElement;
    if (adminTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [adminTheme]);

  // Handlers
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

  // --- VIEWS ---

  const DashboardView = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500' },
          { label: 'Active Listings', value: stats?.activeProducts || 0, icon: ShoppingBag, color: 'text-purple-500' },
          { label: 'Pending Reports', value: stats?.pendingReports || 0, icon: Flag, color: 'text-red-500' },
          { label: 'Total Value', value: `₹${(stats?.totalValue || 0).toLocaleString()}`, icon: Activity, color: 'text-green-500' },
        ].map((stat, idx) => (
          <Card key={idx} className="p-6 flex items-center justify-between group hover:border-admin-primary/50">
            <div>
              <p className="text-sm font-medium text-admin-muted uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-3xl font-bold text-admin-text mt-2">{stat.value}</h3>
            </div>
            <div className={`p-3 rounded-full bg-gray-100 dark:bg-white/5 ${stat.color}`}>
              <stat.icon size={24} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 h-96">
           <h3 className="font-bold text-lg text-admin-text mb-4">Recent Activity</h3>
           <div className="space-y-4 overflow-y-auto h-80 no-scrollbar">
              {logs.slice(0, 8).map(log => (
                 <div key={log.id} className="flex items-start gap-3 text-sm border-b border-admin-border pb-2 last:border-0">
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${log.type === 'DANGER' ? 'bg-red-500' : log.type === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                    <div>
                       <div className="font-medium text-admin-text">{log.action} <span className="text-admin-muted font-normal">by {log.actorName}</span></div>
                       <div className="text-xs text-admin-muted">{log.target} • {new Date(log.timestamp).toLocaleTimeString()}</div>
                    </div>
                 </div>
              ))}
           </div>
        </Card>
        
        <Card className="p-6 h-96">
           <h3 className="font-bold text-lg text-admin-text mb-4">New Users</h3>
           <div className="space-y-3">
              {stats?.recentUsers?.map((u: any) => (
                 <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-admin-bg border border-admin-border">
                    <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded-full bg-admin-primary/20 flex items-center justify-center text-admin-primary font-bold">
                          {u.name[0]}
                       </div>
                       <div>
                          <div className="text-sm font-bold text-admin-text">{u.name}</div>
                          <div className="text-xs text-admin-muted">{u.email}</div>
                       </div>
                    </div>
                    <div className="text-xs text-admin-muted">{u.hostel}</div>
                 </div>
              ))}
           </div>
        </Card>
      </div>
    </div>
  );

  const ProductsView = () => (
    <Card className="overflow-hidden animate-fade-in">
       <div className="p-4 border-b border-admin-border flex justify-between items-center bg-admin-bg/50">
          <h2 className="font-bold text-lg text-admin-text">Product Management</h2>
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted h-4 w-4" />
             <input type="text" placeholder="Search products..." className="pl-9 pr-4 py-2 rounded-lg bg-admin-bg border border-admin-border text-sm text-admin-text outline-none focus:border-admin-primary w-64" />
          </div>
       </div>
       <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
             <thead className="bg-admin-bg border-b border-admin-border text-xs uppercase text-admin-muted">
                <tr>
                   <th className="px-6 py-4 font-semibold">Product</th>
                   <th className="px-6 py-4 font-semibold">Seller</th>
                   <th className="px-6 py-4 font-semibold">Price</th>
                   <th className="px-6 py-4 font-semibold">Status</th>
                   <th className="px-6 py-4 font-semibold">Date</th>
                   <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-admin-border">
                {products.map(p => (
                   <tr key={p.id} className="hover:bg-admin-bg/50 transition-colors text-sm">
                      <td className="px-6 py-4">
                         <div className="font-medium text-admin-text">{p.title}</div>
                         <div className="text-xs text-admin-muted">{p.category}</div>
                      </td>
                      <td className="px-6 py-4 text-admin-text">{p.sellerName}</td>
                      <td className="px-6 py-4 font-mono text-admin-text">₹{p.price}</td>
                      <td className="px-6 py-4">
                         <Badge variant={p.status === 'ACTIVE' ? 'success' : p.status === 'FLAGGED' ? 'danger' : 'neutral'}>
                           {p.status || (p.isSold ? 'SOLD' : 'ACTIVE')}
                         </Badge>
                      </td>
                      <td className="px-6 py-4 text-admin-muted">{p.createdAt}</td>
                      <td className="px-6 py-4 text-right">
                         <button onClick={() => handleDeleteProduct(p.id)} className="text-admin-danger hover:underline">Delete</button>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </Card>
  );

  const UsersView = () => (
    <Card className="overflow-hidden animate-fade-in">
       <div className="p-4 border-b border-admin-border flex justify-between items-center bg-admin-bg/50">
          <h2 className="font-bold text-lg text-admin-text">User Management</h2>
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted h-4 w-4" />
             <input type="text" placeholder="Search users..." className="pl-9 pr-4 py-2 rounded-lg bg-admin-bg border border-admin-border text-sm text-admin-text outline-none focus:border-admin-primary w-64" />
          </div>
       </div>
       <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
             <thead className="bg-admin-bg border-b border-admin-border text-xs uppercase text-admin-muted">
                <tr>
                   <th className="px-6 py-4 font-semibold">User</th>
                   <th className="px-6 py-4 font-semibold">Hostel</th>
                   <th className="px-6 py-4 font-semibold">Role</th>
                   <th className="px-6 py-4 font-semibold">Status</th>
                   <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-admin-border">
                {users.map(u => (
                   <tr key={u.id} className="hover:bg-admin-bg/50 transition-colors text-sm">
                      <td className="px-6 py-4 flex items-center gap-3">
                         <img src={u.avatarUrl} className="h-8 w-8 rounded-full bg-gray-200" alt="" />
                         <div>
                            <div className="font-medium text-admin-text">{u.name}</div>
                            <div className="text-xs text-admin-muted">{u.email}</div>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-admin-text">{u.hostel}</td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-admin-primary">{u.role}</span>
                      </td>
                      <td className="px-6 py-4">
                         <Badge variant={u.isBanned ? 'danger' : 'success'}>{u.isBanned ? 'BANNED' : 'ACTIVE'}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                         {!u.isBanned && u.role !== 'SUPER_ADMIN' && (
                            <button onClick={() => handleBanUser(u.id)} className="text-admin-danger hover:underline flex items-center justify-end gap-1 ml-auto">
                               <Ban size={14} /> Ban
                            </button>
                         )}
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </Card>
  );

  const ReportsView = () => (
     <div className="space-y-4 animate-fade-in">
        {reports.length === 0 ? (
           <div className="text-center py-20 text-admin-muted">No active reports. Good job!</div>
        ) : (
           reports.map(report => (
              <Card key={report.id} className="p-6 border-l-4 border-l-admin-danger">
                 <div className="flex justify-between items-start">
                    <div>
                       <div className="flex items-center gap-2 mb-2">
                          <Badge variant="danger">REPORTED</Badge>
                          <span className="text-xs text-admin-muted">{new Date(report.createdAt).toLocaleString()}</span>
                       </div>
                       <h3 className="text-lg font-bold text-admin-text mb-1">Reason: {report.reason}</h3>
                       <div className="text-sm text-admin-muted">
                          Reported by <span className="font-medium text-admin-text">{report.reporter?.name}</span> against Listing <span className="font-medium text-admin-text">"{report.listing?.title}"</span>
                       </div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => handleDismissReport(report.id)} className="px-4 py-2 rounded-lg border border-admin-border hover:bg-admin-bg text-sm font-medium text-admin-text">Dismiss</button>
                       <button onClick={() => handleDeleteProduct(report.listingId)} className="px-4 py-2 rounded-lg bg-admin-danger text-white text-sm font-medium shadow-lg shadow-red-500/30">Delete Item</button>
                    </div>
                 </div>
              </Card>
           ))
        )}
     </div>
  );

  const SettingsView = () => (
    <div className="max-w-2xl animate-fade-in space-y-8">
       <Card className="p-8">
          <h2 className="text-xl font-bold text-admin-text mb-6 flex items-center gap-2"><Settings size={20} /> System Configuration</h2>
          
          <div className="space-y-6">
             <div className="flex items-center justify-between pb-6 border-b border-admin-border">
                <div>
                   <div className="font-bold text-admin-text">Maintenance Mode</div>
                   <div className="text-sm text-admin-muted">Disable marketplace for all users</div>
                </div>
                <button 
                  onClick={() => handleUpdateSettings('maintenanceMode', !settings?.maintenanceMode)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings?.maintenanceMode ? 'bg-admin-primary' : 'bg-gray-300 dark:bg-gray-700'}`}
                >
                   <div className={`absolute top-1 left-1 h-4 w-4 bg-white rounded-full transition-transform ${settings?.maintenanceMode ? 'translate-x-6' : ''}`} />
                </button>
             </div>

             <div className="flex items-center justify-between pb-6 border-b border-admin-border">
                <div>
                   <div className="font-bold text-admin-text">Allow Signups</div>
                   <div className="text-sm text-admin-muted">New users can register</div>
                </div>
                <button 
                  onClick={() => handleUpdateSettings('allowNewSignups', !settings?.allowNewSignups)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings?.allowNewSignups ? 'bg-admin-primary' : 'bg-gray-300 dark:bg-gray-700'}`}
                >
                   <div className={`absolute top-1 left-1 h-4 w-4 bg-white rounded-full transition-transform ${settings?.allowNewSignups ? 'translate-x-6' : ''}`} />
                </button>
             </div>

             <div>
                <label className="block text-sm font-bold text-admin-text mb-2">Price Cap Percentage (%)</label>
                <div className="flex gap-4">
                   <input 
                      type="number" 
                      value={settings?.priceCapPercentage || 0} 
                      onChange={(e) => handleUpdateSettings('priceCapPercentage', Number(e.target.value))}
                      className="w-full p-3 rounded-lg bg-admin-bg border border-admin-border text-admin-text outline-none focus:border-admin-primary" 
                   />
                </div>
                <p className="text-xs text-admin-muted mt-2">Maximum selling price relative to original MRP.</p>
             </div>
          </div>
       </Card>

       <Card className="p-8 border-admin-danger/30">
          <h2 className="text-xl font-bold text-admin-danger mb-4 flex items-center gap-2"><AlertTriangle size={20} /> Danger Zone</h2>
          <p className="text-sm text-admin-muted mb-6">Irreversible actions for the platform.</p>
          
          <div className="flex gap-4">
             <button className="px-4 py-2 bg-admin-danger/10 text-admin-danger border border-admin-danger/20 rounded-lg hover:bg-admin-danger/20 transition-colors font-medium">Purge Deleted Items</button>
             <button className="px-4 py-2 bg-admin-danger/10 text-admin-danger border border-admin-danger/20 rounded-lg hover:bg-admin-danger/20 transition-colors font-medium">Reset Logs</button>
          </div>
       </Card>
    </div>
  );

  if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
    return (
       <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
             <Lock size={48} className="mx-auto mb-4 text-red-500" />
             <h1 className="text-2xl font-bold">Access Denied</h1>
             <p className="text-gray-400 mt-2">You do not have permission to view this portal.</p>
             <button onClick={logout} className="mt-6 px-6 py-2 bg-white text-black rounded-full font-bold">Logout</button>
          </div>
       </div>
    );
  }

  return (
    <div className={`min-h-screen bg-admin-bg text-admin-text font-sans transition-colors duration-300 flex ${adminTheme}`}>
       
       {/* Sidebar */}
       <aside className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-admin-panel border-r border-admin-border backdrop-blur-xl transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
          <div className="h-16 flex items-center px-6 border-b border-admin-border">
             <ShieldCheck className="text-admin-primary mr-3" size={24} />
             <span className="font-bold text-xl tracking-tight">Admin<span className="text-admin-primary">Portal</span></span>
          </div>

          <nav className="p-4 space-y-1">
             {[
                { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
                { id: 'products', label: 'Products', icon: ShoppingBag },
                { id: 'users', label: 'Users', icon: Users },
                { id: 'reports', label: 'Moderation', icon: Flag },
                { id: 'logs', label: 'System Logs', icon: Activity },
                { id: 'settings', label: 'Settings', icon: Settings },
             ].map(item => (
                <button
                   key={item.id}
                   onClick={() => { setActiveView(item.id as any); if(window.innerWidth < 1024) setSidebarOpen(false); }}
                   className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${activeView === item.id ? 'bg-admin-primary text-white shadow-lg shadow-admin-primary/30' : 'text-admin-muted hover:bg-admin-bg hover:text-admin-text'}`}
                >
                   <item.icon size={18} className="mr-3" />
                   <span className="font-medium">{item.label}</span>
                   {item.id === 'reports' && stats?.pendingReports > 0 && (
                      <span className="ml-auto bg-admin-danger text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{stats.pendingReports}</span>
                   )}
                </button>
             ))}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-admin-border">
             <button onClick={logout} className="w-full flex items-center px-4 py-3 rounded-xl text-admin-danger hover:bg-admin-danger/10 transition-colors">
                <LogOut size={18} className="mr-3" />
                <span className="font-medium">Logout</span>
             </button>
          </div>
       </aside>

       {/* Main Content */}
       <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : ''}`}>
          {/* Header */}
          <header className="h-16 sticky top-0 z-40 bg-admin-panel/80 backdrop-blur-md border-b border-admin-border px-4 sm:px-8 flex justify-between items-center">
             <div className="flex items-center">
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 mr-4 rounded-lg hover:bg-admin-bg text-admin-muted">
                   <ChevronRight />
                </button>
                <h1 className="text-xl font-bold capitalize text-admin-text">{activeView}</h1>
             </div>

             <div className="flex items-center gap-4">
                <button 
                   onClick={() => setAdminTheme(adminTheme === 'light' ? 'dark' : 'light')} 
                   className="p-2 rounded-full bg-admin-bg border border-admin-border text-admin-muted hover:text-admin-primary transition-colors"
                   title={`Switch to ${adminTheme === 'light' ? 'Dark' : 'Light'} Theme`}
                >
                   {adminTheme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </button>
                <div className="h-8 w-px bg-admin-border mx-2"></div>
                <div className="flex items-center gap-3">
                   <div className="text-right hidden sm:block">
                      <div className="text-sm font-bold text-admin-text">{user.name}</div>
                      <div className="text-[10px] font-mono text-admin-primary uppercase tracking-wide">{user.role}</div>
                   </div>
                   <div className="h-10 w-10 rounded-full bg-admin-primary text-white flex items-center justify-center font-bold shadow-lg shadow-admin-primary/20">
                      {user.name[0]}
                   </div>
                </div>
             </div>
          </header>

          {/* View Container */}
          <div className="p-4 sm:p-8 max-w-7xl mx-auto">
             {loading ? (
                <div className="flex items-center justify-center h-64">
                   <div className="animate-spin h-8 w-8 border-4 border-admin-primary border-t-transparent rounded-full"></div>
                </div>
             ) : (
                <>
                   {activeView === 'dashboard' && <DashboardView />}
                   {activeView === 'products' && <ProductsView />}
                   {activeView === 'users' && <UsersView />}
                   {activeView === 'reports' && <ReportsView />}
                   {activeView === 'logs' && <DashboardView />} 
                   {/* Logs reused dashboard snippet for simplicity in this example, real would be full table */}
                   {activeView === 'settings' && <SettingsView />}
                </>
             )}
          </div>
       </main>
    </div>
  );
};
