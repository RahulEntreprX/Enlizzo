
import React from 'react';
import { ShieldCheck, Search, MapPin, MessageCircle, ChevronRight, Wallet, Zap, Globe, Lock, ScanLine, Github, Twitter, Linkedin, Instagram, Heart } from 'lucide-react';
import { Button } from '../components/Button';

interface LandingPageProps {
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden transition-colors duration-300 bg-transparent animate-fade-in">
      
      {/* ================= CONTENT LAYER ================= */}

      <div className="relative z-10 flex-grow flex flex-col">
        {/* === SECTION 1: HERO === */}
        <section className="relative pt-32 pb-32 md:pt-48 md:pb-48 overflow-hidden">
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10 flex flex-col items-center">
            
            {/* TOP TAG */}
            <div className="flex flex-col items-center gap-2 mb-2 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs font-mono tracking-widest backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                IIT DELHI EXCLUSIVE <span className="text-indigo-400 dark:text-indigo-500/50">|</span> V1.0
              </div>
            </div>

            {/* LOGO */}
            <div className="relative inline-flex flex-col items-center mt-6 mb-2 animate-slide-up">
               <div className="h-24 w-24 mb-4 text-slate-900 dark:text-white drop-shadow-2xl">
                  <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 1L3 5l4 4" />
                    <path d="M21 11V9a4 4 0 0 0-4-4H3" />
                    <path d="M17 23l4-4-4-4" />
                    <path d="M3 13v2a4 4 0 0 0 4 4h14" />
                  </svg>
               </div>
               
               <h1 className="font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-cyan-400 dark:via-indigo-400 dark:to-purple-500 z-10 mt-4 flex items-baseline gap-1 justify-center">
                 <span className="text-6xl md:text-8xl">E</span>
                 <span className="text-4xl md:text-6xl tracking-widest">NLIZZO</span>
               </h1>
               
               {/* Curved Underline */}
               <div className="w-[120%] h-4 -mt-2 opacity-80">
                 <svg width="100%" height="100%" viewBox="0 0 200 20" preserveAspectRatio="none">
                   <path d="M10,10 Q100,20 190,10" stroke="url(#grad1)" strokeWidth="2" fill="none" strokeLinecap="round" />
                   <defs>
                     <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                       <stop offset="0%" style={{stopColor:'#4f46e5', stopOpacity:1}} />
                       <stop offset="100%" style={{stopColor:'#6366f1', stopOpacity:1}} />
                     </linearGradient>
                   </defs>
                 </svg>
               </div>
            </div>

            {/* MAIN HEADING */}
            <h1 className="text-7xl md:text-9xl font-bold tracking-tighter text-slate-900 dark:text-white mb-8 animate-slide-up leading-tight" style={{ animationDelay: '0.1s' }}>
              MARKET
            </h1>
            
            <p className="max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-400 mb-12 leading-relaxed animate-slide-up font-light" style={{ animationDelay: '0.2s' }}>
              The trusted platform for IIT Delhi students to buy, sell, and donate used items.
              <span className="text-slate-900 dark:text-white font-normal"> Safe. Simple. Within Campus.</span>
            </p>
            
            {/* PRIMARY CTA */}
            <div className="flex justify-center mt-10 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <button
                onClick={onLogin}
                className="group relative inline-flex h-[64px] items-center justify-center overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-50 shadow-[0_0_50px_-12px_rgba(79,70,229,0.5)] hover:shadow-[0_0_80px_-15px_rgba(79,70,229,0.7)] transition-all duration-300 hover:scale-105"
              >
                <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2E8F0_0%,#6366f1_50%,#E2E8F0_100%)] dark:bg-[conic-gradient(from_90deg_at_50%_50%,#0F172A_0%,#818cf8_50%,#0F172A_100%)]" />
                <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white dark:bg-slate-950 px-12 text-lg font-bold tracking-wide text-slate-900 dark:text-white backdrop-blur-3xl gap-3 transition-colors group-hover:bg-indigo-50/50 dark:group-hover:bg-slate-900/80">
                  Start Trading
                  <ChevronRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1 text-indigo-600 dark:text-indigo-400" />
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* === SECTION 2: PROCESS === */}
        <section className="py-24 relative border-y border-gray-200 dark:border-white/5 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            
            <div className="text-center mb-20">
              <h2 className="text-sm font-mono text-indigo-600 dark:text-cyan-400 tracking-widest mb-2">THE PROCESS</h2>
              <h3 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">How it Works</h3>
            </div>

            {/* Track Lines */}
            <div className="absolute top-[55%] left-0 w-full h-px bg-gray-200 dark:bg-white/5 hidden md:block"></div>
            <div className="absolute top-[55%] left-0 w-1/3 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 dark:via-cyan-500 to-transparent opacity-0 hidden md:block animate-beam-horizontal"></div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
              {[
                { icon: ShieldCheck, title: 'LOGIN', desc: 'Verify via IITD Email', step: '01' },
                { icon: Search, title: 'FIND', desc: 'Search by Hostel/Category', step: '02' },
                { icon: MessageCircle, title: 'CONNECT', desc: 'Chat with Seller', step: '03' },
                { icon: MapPin, title: 'MEET', desc: 'Exchange at Hostel', step: '04' }
              ].map((item, idx) => (
                <div key={idx} className="relative group">
                  {idx !== 3 && (
                    <div className="absolute left-8 top-16 bottom-[-32px] w-px bg-gradient-to-b from-indigo-500/50 to-transparent md:hidden"></div>
                  )}

                  <div className="tech-border p-8 rounded-sm corner-accent hover:bg-white/80 dark:hover:bg-gray-900/90 transition-all duration-500 h-full bg-white/80 dark:bg-gray-950/90">
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-800 dark:group-hover:text-white group-hover:border-indigo-400 transition-colors">
                          <item.icon size={24} />
                        </div>
                        <span className="font-mono text-4xl font-bold text-gray-200 dark:text-white/5 group-hover:text-gray-300 dark:group-hover:text-white/20 transition-colors">
                          {item.step}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2 tracking-wide">{item.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{item.desc}</p>
                    </div>
                  </div>
                  
                  <div className="absolute top-[50%] left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-gray-900 border border-indigo-500 dark:border-cyan-500 rounded-full hidden md:block z-20 group-hover:bg-indigo-500 dark:group-hover:bg-cyan-500 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.8)] dark:group-hover:shadow-[0_0_15px_rgba(34,211,238,0.8)] transition-all duration-300"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* === SECTION 3: BENTO GRID === */}
        <section className="py-32 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-2 gap-6 h-auto md:h-[600px]">
              
              <div className="md:col-span-2 md:row-span-2 tech-border rounded-xl p-8 relative overflow-hidden group corner-accent bg-white/90 dark:bg-gray-950/90">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 dark:from-indigo-900/10 to-transparent opacity-50"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    {/* Updated Green to Emerald */}
                    <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-500 uppercase">Live Activity</span>
                  </div>
                  <h3 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">Everything you need,<br/>right here on campus.</h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8 text-lg">
                    From course books and cycles to coolers and kettles. 
                    Find items within your own hostel or just a short walk away.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 max-w-md">
                    <div className="bg-white/80 dark:bg-black/60 p-4 border border-gray-200 dark:border-white/10 rounded">
                      <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">2,400+</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">Items Listed</div>
                    </div>
                    <div className="bg-white/80 dark:bg-black/60 p-4 border border-gray-200 dark:border-white/10 rounded">
                      <div className="text-2xl font-mono font-bold text-indigo-600 dark:text-cyan-400">₹12.5L</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">Student Savings</div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute right-[-50px] bottom-[-50px] md:right-[-20px] md:bottom-[-20px] opacity-10 dark:opacity-30 group-hover:opacity-20 dark:group-hover:opacity-50 transition-opacity">
                  <Wallet size={300} strokeWidth={0.5} className="text-indigo-500" />
                </div>
              </div>

              <div className="tech-border rounded-xl p-6 corner-accent flex flex-col justify-between group bg-white/90 dark:bg-gray-950/90">
                 <div>
                   <div className="p-3 w-fit bg-orange-50 dark:bg-orange-500/10 rounded border border-orange-200 dark:border-orange-500/20 text-orange-500 dark:text-orange-400 mb-4">
                     <Zap size={20} />
                   </div>
                   <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Sell Quickly</h4>
                   <p className="text-sm text-gray-500 dark:text-gray-400">Snap a photo, set a price, and you're live. Clear your room clutter in minutes.</p>
                 </div>
                 <div className="h-1 w-full bg-gray-200 dark:bg-gray-800 rounded-full mt-4 overflow-hidden">
                   <div className="h-full bg-orange-500 w-3/4 animate-pulse"></div>
                 </div>
              </div>

              <div className="tech-border rounded-xl p-6 corner-accent flex flex-col justify-between group bg-white/90 dark:bg-gray-950/90">
                 <div>
                   <div className="p-3 w-fit bg-cyan-50 dark:bg-cyan-500/10 rounded border border-cyan-200 dark:border-cyan-500/20 text-cyan-600 dark:text-cyan-400 mb-4">
                     <Globe size={20} />
                   </div>
                   <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Hostel Network</h4>
                   <p className="text-sm text-gray-500 dark:text-gray-400">See which hostel the item is in. Buying from a neighbor is always easier.</p>
                 </div>
                 <div className="mt-4 flex items-center gap-2">
                   <div className="flex -space-x-2">
                     {[1,2,3].map(i => (
                       <div key={i} className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-700 border border-white dark:border-gray-900"></div>
                     ))}
                   </div>
                   <span className="text-xs text-gray-500">Students active now</span>
                 </div>
              </div>

            </div>
          </div>
        </section>

        {/* === SECTION 4: HOLOGRAPHIC PORTAL === */}
        <section className="py-32 relative border-t border-gray-200 dark:border-white/5 overflow-hidden">
          <div className="absolute inset-0 bg-slate-100/50 dark:bg-black/60"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-600/20 blur-[120px] rounded-full"></div>

          <div className="max-w-3xl mx-auto px-4 relative z-10">
            <div className="portal-card rounded-2xl p-1 shadow-[0_0_50px_rgba(99,102,241,0.1)] dark:shadow-[0_0_50px_rgba(79,70,229,0.15)]">
               <div className="bg-white/90 dark:bg-gray-950/90 rounded-xl p-12 md:p-16 text-center relative overflow-hidden">
                  
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent h-full animate-beam-vertical pointer-events-none"></div>
                  
                  <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-indigo-400 dark:border-cyan-500"></div>
                  <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-indigo-400 dark:border-cyan-500"></div>
                  <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-indigo-400 dark:border-cyan-500"></div>
                  <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-indigo-400 dark:border-cyan-500"></div>

                  <div className="flex justify-center mb-6">
                     <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-full border border-indigo-100 dark:border-indigo-400/30 animate-pulse-glow">
                        <Lock size={32} className="text-indigo-600 dark:text-indigo-400" />
                     </div>
                  </div>

                  <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
                    Campus Access Portal
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-8 font-mono text-sm tracking-wide">
                    AUTHENTICATION REQUIRED // IIT DELHI DOMAIN
                  </p>

                  <div className="flex flex-col items-center gap-4">
                    <Button 
                      onClick={onLogin} 
                      size="lg" 
                      className="min-w-[240px] py-4 bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/50 shadow-[0_0_20px_rgba(79,70,229,0.5)] relative overflow-hidden group text-white"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <ScanLine size={18} /> Initiate Session
                      </span>
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    </Button>
                    
                    <span className="text--[10px] text-gray-500 dark:text-gray-600 font-mono uppercase mt-2">
                      Secure Connection • End-to-End Encrypted
                    </span>
                  </div>
               </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
