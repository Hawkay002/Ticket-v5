import React, { useState } from 'react';
import { 
  Terminal, ShieldCheck, Database, Layout, Smartphone, Zap, 
  FileText, Code, GitCommit, ChevronDown, ChevronUp, Globe,
  Server, Lock, Search, Users, Activity, Cpu, HardDrive,
  Clock, Hash, FileCode, AlertCircle, CheckCircle2
} from 'lucide-react';

// --- Data Configuration ---

const globalStats = [
  { label: "Total Builds", value: "42", icon: <GitCommit size={16} />, color: "text-blue-400" },
  { label: "Major Versions", value: "5", icon: <Hash size={16} />, color: "text-purple-400" },
  { label: "Files Managed", value: "12", icon: <FileCode size={16} />, color: "text-emerald-400" },
  { label: "Uptime", value: "99.9%", icon: <Activity size={16} />, color: "text-rose-400" },
];

const changelogData = [
  {
    majorVersion: "5.0",
    releaseName: "Data Integrity Architecture",
    date: "Dec 31, 2025",
    time: "21:36 IST",
    description: "Complete overhaul of data ingestion pipelines and safety protocols for batch operations.",
    stats: [
      { label: "Import Accuracy", value: "100%", desc: "Regex Parsing" },
      { label: "Deletion Safety", value: "Atomic", desc: "Iterative Loop" },
      { label: "Date Formats", value: "4+", desc: "Excel/ISO/Text" }
    ],
    highlightColor: "text-emerald-400",
    borderColor: "border-emerald-500/20",
    subVersions: [
      {
        version: "5.1.2",
        title: "Iterative Deletion Engine",
        type: "Logic",
        severity: "Critical",
        files: ["script.js", "index.html"],
        icon: <Zap size={16} />,
        changes: [
          {
            tag: "Refactor",
            desc: "Atomic Loop Implementation",
            detail: "Replaced Promise.all() with 'for...of' loop to allow interruptible batch operations."
          },
          {
            tag: "Feature",
            desc: "Safe Stop Mechanism",
            detail: "Introduced 'stopGuestDelete' flag to halt operations without data corruption."
          }
        ]
      },
      {
        version: "5.1.0",
        title: "Advanced File Parsing Core",
        type: "Codebase",
        severity: "Major",
        files: ["script.js"],
        icon: <FileText size={16} />,
        changes: [
          {
            tag: "Algorithm",
            desc: "Regex CSV Parser",
            detail: "Implemented delimiter auto-detection (comma, pipe, tab) and quoted string handling."
          },
          {
            tag: "Logic",
            desc: "Excel Serial Date Conversion",
            detail: "Added math logic to convert Excel dates (e.g., 45657) to JS timestamps."
          }
        ]
      }
    ]
  },
  {
    majorVersion: "4.0",
    releaseName: "Admin & Customization Suite",
    date: "Dec 31, 2025",
    time: "21:25 IST",
    description: "Introduction of tiered ticketing systems, persistent sessions, and granular security controls.",
    stats: [
      { label: "Login Latency", value: "0ms", desc: "Cached Auth" },
      { label: "Ticket Types", value: "3", desc: "Classic/VIP/VVIP" },
      { label: "Lock Types", value: "3", desc: "Basic/Maint/Ban" }
    ],
    highlightColor: "text-indigo-400",
    borderColor: "border-indigo-500/20",
    subVersions: [
      {
        version: "4.8.0",
        title: "Session Persistence Layer",
        type: "Security",
        severity: "Enhancement",
        files: ["script.js", "auth.js"],
        icon: <ShieldCheck size={16} />,
        changes: [
          {
            tag: "Cache",
            desc: "Local Storage Auth",
            detail: "Cached Gatekeeper credentials to bypass 2FA modal on page refresh."
          },
          {
            tag: "UX",
            desc: "Forced Lock Awareness",
            detail: "Popup trigger logic updated to check DB snapshot directly on load."
          }
        ]
      },
      {
        version: "4.7.0",
        title: "Tiered Ticketing System",
        type: "Feature",
        severity: "Major",
        files: ["style.css", "index.html"],
        icon: <Code size={16} />,
        changes: [
          {
            tag: "Schema",
            desc: "Ticket Type Field",
            detail: "Added 'ticketType' to Firestore schema supporting Diamond & Gold tiers."
          },
          {
            tag: "UI",
            desc: "Holographic Themes",
            detail: "Implemented CSS gradients for Metallic Gold and Silver ticket rendering."
          }
        ]
      }
    ]
  },
  {
    majorVersion: "3.0",
    releaseName: "Cloud & Security Infrastructure",
    date: "Dec 31, 2025",
    time: "21:10 IST",
    description: "Migration to shared database architecture and real-time remote device management.",
    stats: [
      { label: "Sync Scope", value: "Global", desc: "Shared DB" },
      { label: "Heartbeat", value: "10s", desc: "Presence Check" },
      { label: "Targeting", value: "User", desc: "Granular Locks" }
    ],
    highlightColor: "text-rose-400",
    borderColor: "border-rose-500/20",
    subVersions: [
      {
        version: "3.5.0",
        title: "Shared Database Migration",
        type: "Database",
        severity: "Critical",
        files: ["firestore.rules", "script.js"],
        icon: <Database size={16} />,
        changes: [
          {
            tag: "Migration",
            desc: "Global Schema",
            detail: "Moved from user-specific paths to 'shared_event_db' for instant multi-user sync."
          },
          {
            tag: "Security",
            desc: "Recursive 'Nuke' Logic",
            detail: "Implemented deep-clean factory reset with auto-credential restoration."
          }
        ]
      },
      {
        version: "3.2.0",
        title: "Remote Command Center",
        type: "Feature",
        severity: "Major",
        files: ["script.js", "admin.html"],
        icon: <Server size={16} />,
        changes: [
          {
            tag: "Logic",
            desc: "Presence Heartbeat",
            detail: "Client-side interval writes timestamp to Firestore every 10s."
          },
          {
            tag: "Access",
            desc: "Granular Locking",
            detail: "Updated lock targeting from Email-based to Username-based."
          }
        ]
      }
    ]
  },
  {
    majorVersion: "2.0",
    releaseName: "Performance Core",
    date: "Dec 31, 2025",
    time: "20:55 IST",
    description: "Optimization of scanning engine, hybrid synchronization, and UI responsiveness.",
    stats: [
      { label: "Scan Buffer", value: "4000ms", desc: "Anti-Double Scan" },
      { label: "Sync Rate", value: "15s", desc: "Active Polling" },
      { label: "Debounce", value: "250ms", desc: "UI Optimization" }
    ],
    highlightColor: "text-amber-400",
    borderColor: "border-amber-500/20",
    subVersions: [
      {
        version: "2.5.0",
        title: "Scanner Logic Engine",
        type: "Performance",
        severity: "Enhancement",
        files: ["script.js"],
        icon: <Zap size={16} />,
        changes: [
          {
            tag: "Hardware",
            desc: "Extended Cooldown",
            detail: "Increased camera lock-out to 4s to allow result readability."
          },
          {
            tag: "Feedback",
            desc: "Visual Result States",
            detail: "Implemented Green/Orange/Red overlays for scan outcomes."
          }
        ]
      },
      {
        version: "2.1.0",
        title: "Hybrid Sync Engine",
        type: "Codebase",
        severity: "Major",
        files: ["script.js"],
        icon: <Activity size={16} />,
        changes: [
          {
            tag: "Network",
            desc: "Active Polling",
            detail: "Supplemented WebSocket listeners with 15s 'getDocs' polling."
          },
          {
            tag: "Automation",
            desc: "Auto-Absent Logic",
            detail: "Server-side check marks 'Absent' if deadline passes during sync."
          }
        ]
      }
    ]
  },
  {
    majorVersion: "1.0",
    releaseName: "Foundation",
    date: "Dec 31, 2025",
    time: "20:30 IST",
    description: "Initial release, PWA capabilities, and basic Firebase integration.",
    stats: [
      { label: "Platform", value: "PWA", desc: "Offline Capable" },
      { label: "Database", value: "NoSQL", desc: "Firestore" },
      { label: "Sharing", value: "Native", desc: "WhatsApp API" }
    ],
    highlightColor: "text-blue-400",
    borderColor: "border-blue-500/20",
    subVersions: [
      {
        version: "1.3.0",
        title: "Offline & PWA",
        type: "Feature",
        severity: "Enhancement",
        files: ["manifest.json", "sw.js"],
        icon: <Smartphone size={16} />,
        changes: [
          {
            tag: "Config",
            desc: "App Manifest",
            detail: "Defined standalone display mode and theme colors."
          },
          {
            tag: "Logic",
            desc: "Network Monitoring",
            detail: "Added listeners for navigator.onLine status changes."
          }
        ]
      }
    ]
  }
];

// --- Components ---

const Badge = ({ type }) => {
  const styles = {
    Codebase: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    Algorithm: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    Fix: "bg-red-500/10 text-red-400 border-red-500/20",
    Logic: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    UI: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    UX: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    Feature: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Database: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Security: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    Auth: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    Schema: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Migration: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    Performance: "bg-lime-500/10 text-lime-400 border-lime-500/20",
    Hardware: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    Cache: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    Refactor: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  };

  const defaultStyle = "bg-slate-800 text-slate-300 border-slate-700";

  return (
    <span className={`px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-bold rounded border ${styles[type] || defaultStyle}`}>
      {type}
    </span>
  );
};

const MetricCard = ({ label, value, icon, color }) => (
  <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex items-center gap-4 hover:border-slate-700 transition-colors">
    <div className={`p-2.5 rounded-lg bg-slate-950 border border-slate-800 ${color}`}>
      {icon}
    </div>
    <div>
      <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{label}</div>
    </div>
  </div>
);

const ImpactStat = ({ label, value, desc }) => (
  <div className="flex flex-col">
    <span className="text-xs text-slate-500">{label}</span>
    <span className="text-lg font-mono font-bold text-slate-200">{value}</span>
    <span className="text-[10px] text-slate-600 uppercase tracking-wide">{desc}</span>
  </div>
);

const SubVersionBlock = ({ sub, isLast }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={`relative pl-6 sm:pl-8 ${!isLast ? 'pb-8' : ''}`}>
      {/* Connector Line */}
      {!isLast && (
        <div className="absolute left-[11px] sm:left-[19px] top-8 bottom-0 w-px bg-slate-800/50 border-l border-dashed border-slate-700"></div>
      )}
      
      {/* Node Dot */}
      <div className="absolute left-0 sm:left-2 top-2 w-6 h-6 rounded-full bg-slate-950 border-2 border-slate-700 flex items-center justify-center z-10">
        <div className="w-2 h-2 rounded-full bg-slate-600"></div>
      </div>

      <div className="bg-slate-900/30 border border-slate-800 rounded-lg overflow-hidden transition-all duration-300 hover:border-slate-700 hover:shadow-lg hover:shadow-slate-900/20">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-3 sm:p-4 cursor-pointer hover:bg-slate-800/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-md bg-slate-950 border border-slate-800 text-slate-400`}>
              {sub.icon}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono text-xs font-bold text-indigo-400">v{sub.version}</span>
                <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-800 px-1.5 rounded">{sub.type}</span>
                {sub.severity === 'Critical' && (
                  <span className="text-[10px] uppercase font-bold text-rose-500 bg-rose-500/10 px-1.5 rounded flex items-center gap-1">
                    <AlertCircle size={10} /> Critical
                  </span>
                )}
              </div>
              <h4 className="text-slate-200 font-medium text-sm">{sub.title}</h4>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 font-mono">
               <FileCode size={12} />
               <span>{sub.files.length} files</span>
             </div>
            <div className="text-slate-600">
              {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
        </button>
        
        {isOpen && (
          <div className="px-4 pb-4 pt-0">
             {/* Tech Stack / Files */}
             <div className="mb-4 mt-2 flex flex-wrap gap-2 pl-[3.25rem]">
                {sub.files.map((f, i) => (
                  <span key={i} className="text-[10px] font-mono text-slate-500 bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded">
                    {f}
                  </span>
                ))}
             </div>

            <div className="space-y-3 pl-2 sm:pl-[3.25rem] border-t border-slate-800/50 pt-3">
              {sub.changes.map((change, idx) => (
                <div key={idx} className="group">
                  <div className="flex items-baseline gap-2 mb-1">
                    <Badge type={change.tag} />
                    <span className="text-xs font-semibold text-slate-300 group-hover:text-indigo-300 transition-colors">
                      {change.desc}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 pl-1 border-l-2 border-slate-800 group-hover:border-slate-600 ml-1 transition-colors leading-relaxed">
                    <span className="pl-2 block">{change.detail}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MajorVersionCard = ({ data, isLatest }) => (
  <div className="relative mb-12 sm:mb-20">
    {/* Version Header Card */}
    <div className={`relative z-20 bg-slate-950 border ${isLatest ? 'border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'border-slate-800'} rounded-2xl p-6 sm:p-8 mb-6 overflow-hidden`}>
      {/* Background Decor */}
      <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-transparent to-${data.highlightColor.split('-')[1]}-500/5 opacity-50`}></div>
      
      <div className="relative z-10 flex flex-col lg:flex-row gap-8 lg:items-start justify-between">
        
        {/* Left: Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <h2 className={`text-4xl font-bold font-mono tracking-tighter ${data.highlightColor}`}>
              v{data.majorVersion}
            </h2>
            {isLatest && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-full uppercase tracking-wider">
                <CheckCircle2 size={12} />
                Latest Stable
              </span>
            )}
            <span className="px-2.5 py-1 bg-slate-900 text-slate-500 border border-slate-800 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
               <Clock size={12} />
               {data.time}
            </span>
          </div>
          
          <h3 className="text-xl text-white font-semibold mb-2">{data.releaseName}</h3>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
            {data.description}
          </p>
        </div>

        {/* Right: Stats Grid */}
        <div className="grid grid-cols-3 gap-6 sm:gap-12 lg:border-l lg:border-slate-800 lg:pl-12">
           {data.stats.map((stat, i) => (
             <ImpactStat key={i} {...stat} />
           ))}
        </div>
      </div>
    </div>

    {/* Sub Versions Timeline */}
    <div className="pl-4 sm:pl-8 border-l border-slate-800/50 ml-6 sm:ml-10 space-y-2">
      {data.subVersions.map((sub, idx) => (
        <SubVersionBlock key={idx} sub={sub} isLast={idx === data.subVersions.length - 1} />
      ))}
    </div>
  </div>
);

const App = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Header / Global Stats */}
      <div className="border-b border-slate-900 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
               <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
                 <Terminal size={20} className="text-indigo-400" />
               </div>
               <div>
                 <h1 className="text-white font-bold tracking-tight">System Changelog</h1>
                 <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Event Ticketing System</p>
               </div>
            </div>
            
            <div className="flex items-center gap-6 sm:gap-12 text-xs font-mono text-slate-500">
               <div className="flex items-center gap-2">
                 <Globe size={14} />
                 <span className="text-emerald-400">Production</span>
               </div>
               <div className="flex items-center gap-2">
                 <HardDrive size={14} />
                 <span>v5.1.2</span>
               </div>
               <div className="flex items-center gap-2">
                 <Cpu size={14} />
                 <span>React + Firestore</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        
        {/* Global Metrics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
          {globalStats.map((stat, idx) => (
            <MetricCard key={idx} {...stat} />
          ))}
        </div>

        {/* Main Content */}
        <div className="relative">
          {/* Main Timeline Line */}
          <div className="absolute left-[39px] sm:left-[59px] top-0 bottom-0 w-px bg-slate-900"></div>

          <div className="space-y-4">
            {changelogData.map((version, idx) => (
              <MajorVersionCard key={idx} data={version} isLatest={idx === 0} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-32 pt-12 border-t border-slate-900 flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex items-center gap-2 text-slate-700">
            <Hash size={16} />
            <span className="font-mono text-sm tracking-widest uppercase">End of Log</span>
          </div>
          <p className="text-slate-600 text-xs">
            Generated by Gemini AI • Deployment ID: 8f3a-2b1c • {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
