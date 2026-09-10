import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useData } from '../context/DataContext';
import { formatCurrency, type ProjectMaster } from '../data/projectData';
import { StatusBadge } from './ui/StatusBadge';
import { KPICard } from './ui/KPICard';
import { ProjectList } from './projects/ProjectList';
import { ProjectManagerCard } from './ProjectManagerCard';
import { SyncExcelButton } from './ui/SyncExcelButton';
import {
  FolderKanban, CheckCircle2, AlertTriangle, TrendingUp,
  DollarSign, Truck, ChevronRight, ArrowRight, Search, X,
  LayoutList, LayoutGrid
} from 'lucide-react';

const darkCountryColorsMap: Record<string, { bar: string; text: string; bg: string; border: string }> = {
  india: { bar: 'bg-[#C9A86A]', text: 'text-[#E8D6AE]', bg: 'bg-[#2A2419]', border: 'border-[#55462C]' },
  malaysia: { bar: 'bg-[#4BA7A7]', text: 'text-[#83CACA]', bg: 'bg-[#172A2A]', border: 'border-[#294949]' },
  maldives: { bar: 'bg-[#9A82D4]', text: 'text-[#BBA8E8]', bg: 'bg-[#251F32]', border: 'border-[#42375A]' },
};

const lightCountryColorsMap: Record<string, { bar: string; text: string; bg: string; border: string }> = {
  india: { bar: 'bg-[#1688D4]', text: 'text-[#0284C7]', bg: 'bg-[#E0F2FE]', border: 'border-[#BAE6FD]' },
  malaysia: { bar: 'bg-[#0D9488]', text: 'text-[#0F766E]', bg: 'bg-[#CCFBF1]', border: 'border-[#99F6E4]' },
  maldives: { bar: 'bg-[#7C3AED]', text: 'text-[#6D28D9]', bg: 'bg-[#F3E8FF]', border: 'border-[#DDD6FE]' },
};

function AttentionAlert({ project }: { project: ProjectMaster }) {
  const { navigate, theme } = useApp();
  const isDark = theme === 'dark';
  const { shipments } = useData();
  const issues: string[] = [];
  const balance = project.balanceUSD || 0;
  if (balance > 0) issues.push(`Outstanding balance: $${balance.toLocaleString()}`);
  if (project.paymentStatus && !project.paymentStatus.toLowerCase().includes('100%')) {
    issues.push(`Payment: ${project.paymentStatus || '—'}`);
  }
  const shipment = shipments.find(s => s.projectId === project.projectId);
  if (shipment?.status === 'In Transit') issues.push('Shipment currently in transit');
  if (shipment?.status === 'Planned') issues.push('Shipment pending');

  if (issues.length === 0) return null;

  return (
    <div
      className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-colors shadow-2xs group ${
        isDark
          ? 'bg-[#34191B]/60 border-[#5A292B] border-l-4 border-l-[#E05A5A] hover:border-[#E05A5A] hover:bg-[#34191B]'
          : 'bg-[#FEF2F2] border-[#FCA5A5] border-l-4 border-l-[#EF4444] hover:border-[#EF4444] hover:bg-[#FEE2E2]'
      }`}
      onClick={() => navigate('project-detail', project.projectId)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate('project-detail', project.projectId)}
    >
      <AlertTriangle size={16} className={`${isDark ? 'text-[#E05A5A]' : 'text-[#DC2626]'} mt-0.5 flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
            isDark ? 'text-[#F5F5F3] bg-[#18181B] border border-[#303035]' : 'text-[#0F172A] bg-[#F1F5F9] border border-[#CBD5E1]'
          }`}>
            {project.projectId}
          </span>
          <span className={`font-bold text-sm ${isDark ? 'text-[#FFFFFF]' : 'text-[#0F172A]'}`}>{project.project}</span>
          <StatusBadge status={project.contractStatus} />
        </div>
        <ul className="space-y-0.5">
          {issues.map((issue, i) => (
            <li key={i} className={`text-xs font-medium ${isDark ? 'text-[#F08A8A]' : 'text-[#B91C1C]'}`}>· {issue}</li>
          ))}
        </ul>
      </div>
      <ArrowRight size={14} className={`${isDark ? 'text-[#E05A5A]' : 'text-[#DC2626]'} opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5`} />
    </div>
  );
}

function ExecutiveMetricsSection() {
  const { selectedCountry, setSelectedCountry, setSelectedFolder, theme } = useApp();
  const isDark = theme === 'dark';
  const { projects } = useData();

  // Aggregate real portfolio data by country
  const countryData = projects.reduce((acc, p) => {
    const c = p.country || 'Other';
    if (!acc[c]) acc[c] = { count: 0, areaM2: 0 };
    acc[c].count += 1;
    acc[c].areaM2 += (p.actualDesignQtyM2 || p.contractQtyM2 || 0);
    return acc;
  }, {} as Record<string, { count: number; areaM2: number }>);

  const countryEntries = Object.entries(countryData);
  const maxCount = Math.max(...countryEntries.map(([, d]) => d.count), 1);
  const countryMap = isDark ? darkCountryColorsMap : lightCountryColorsMap;

  return (
    <>
      {!selectedCountry ? (
        <div className="space-y-6 my-2">
          {/* Row 1: Country Footprint Stacking Cards & Drawing Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* 1. PORTFOLIO BY COUNTRY (STICKY STACKING CARDS DECK) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 px-1">
                <div>
                  <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-[#85858B]' : 'text-[#64748B]'}`}>
                    PORTFOLIO BY COUNTRY · DECK SCROLL
                  </p>
                  <h3 className={`text-lg font-extrabold tracking-tight ${isDark ? 'text-[#FFFFFF]' : 'text-[#0F172A]'}`}>
                    Country Project Deck
                  </h3>
                </div>
                <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                  isDark ? 'text-[#E8D6AE] bg-[#2A2419] border border-[#55462C]' : 'text-[#0284C7] bg-[#E0F2FE] border border-[#BAE6FD]'
                }`}>
                  {countryEntries.length} Country Layers
                </span>
              </div>

              {/* Stacking Cards Deck Container */}
              <div className="relative space-y-4 pb-8 min-h-[320px]">
                {countryEntries.map(([country, data], i) => {
                  const percentage = Math.round((data.count / maxCount) * 100);
                  const cTheme = countryMap[country.toLowerCase()] || (
                    isDark
                      ? { bar: 'bg-[#C9A86A]', text: 'text-[#E8D6AE]', bg: 'bg-[#2A2419]', border: 'border-[#55462C]' }
                      : { bar: 'bg-[#1688D4]', text: 'text-[#0284C7]', bg: 'bg-[#E0F2FE]', border: 'border-[#BAE6FD]' }
                  );
                  
                  // Sticky top offset & z-index layering for stacking deck effect
                  const stickyTop = 80 + Math.min(i, 6) * 16;

                  return (
                    <motion.div
                      key={country}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                      onClick={() => { setSelectedCountry(country); setSelectedFolder(null); }}
                      style={{
                        position: 'sticky',
                        top: `${stickyTop}px`,
                        zIndex: 10 + i,
                      }}
                      className={`
                        rounded-xl p-5 lg:p-6 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between
                        ${isDark 
                          ? 'bg-[#151517] border border-[#262629] shadow-card hover:bg-[#1B1B1F] hover:border-[#3A3A40]' 
                          : 'bg-[#FFFFFF] border border-[#DCE5EE] shadow-sm hover:border-[#CBD5E1] hover:shadow-md'
                        }
                      `}
                      title={`Click to view all project folders for ${country}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-3 h-3 rounded-full ${cTheme.bar}`} />
                          <h4 className={`text-base font-extrabold transition-colors ${
                            isDark ? 'text-[#FFFFFF] group-hover:text-[#C9A86A]' : 'text-[#0F172A] group-hover:text-[#1688D4]'
                          }`}>
                            {country}
                          </h4>
                          <span className={`text-xs font-extrabold ${cTheme.text} ${cTheme.bg} border ${cTheme.border} px-2.5 py-0.5 rounded-full`}>
                            {data.count} Projects
                          </span>
                        </div>

                        <span className={`text-xs font-semibold ${isDark ? 'text-[#B4B4B8]' : 'text-[#475569]'}`}>
                          Area: <strong className={isDark ? 'text-[#FFFFFF]' : 'text-[#0F172A]'}>{data.areaM2.toLocaleString(undefined, { maximumFractionDigits: 1 })} m²</strong>
                        </span>
                      </div>

                      <div className="space-y-1.5 mb-4">
                        <div className={`flex items-center justify-between text-xs font-semibold ${isDark ? 'text-[#B4B4B8]' : 'text-[#475569]'}`}>
                          <span>Portfolio Share</span>
                          <span className={cTheme.text}>{percentage}% of max footprint</span>
                        </div>
                        <div className={`w-full rounded-full h-3 overflow-hidden p-0.5 ${
                          isDark ? 'bg-[#111113] border border-[#262629]' : 'bg-[#F1F5F9] border border-[#CBD5E1]'
                        }`}>
                          <div
                            className={`${cTheme.bar} h-full rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>

                      <div className={`flex items-center justify-between pt-3 border-t ${isDark ? 'border-[#262629]' : 'border-[#E2E8F0]'}`}>
                        <span className={`text-xs font-semibold ${isDark ? 'text-[#85858B]' : 'text-[#64748B]'}`}>
                          Click to view all {country} project folders
                        </span>
                        <span className={`text-xs font-extrabold ${cTheme.text} flex items-center gap-1 group-hover:translate-x-1 transition-transform`}>
                          Open {country} <ArrowRight size={13} />
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* 2. PORTFOLIO DRAWING PROGRESS (Sticky aligned) */}
            <div className={`sticky top-20 rounded-xl p-5 lg:p-6 flex flex-col justify-between transition-all ${
              isDark ? 'bg-[#151517] border border-[#262629] shadow-card' : 'bg-[#FFFFFF] border border-[#DCE5EE] shadow-sm'
            }`}>
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-[#85858B]' : 'text-[#64748B]'}`}>
                    DRAWING STATUS
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    isDark ? 'text-[#E5C47A] bg-[#322917] border border-[#5B4724]' : 'text-[#B06000] bg-[#FEF7E0] border border-[#FDE293]'
                  }`}>
                    1 active
                  </span>
                </div>
                <h3 className={`text-lg font-extrabold mb-4 tracking-tight ${isDark ? 'text-[#FFFFFF]' : 'text-[#0F172A]'}`}>
                  Portfolio Drawing Progress
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className={`rounded-xl p-4 border ${isDark ? 'bg-[#111113] border-[#262629]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                    <p className={`text-3xl font-extrabold ${isDark ? 'text-[#FFFFFF]' : 'text-[#0F172A]'}`}>47</p>
                    <p className={`text-xs font-bold mt-1 ${isDark ? 'text-[#85858B]' : 'text-[#64748B]'}`}>Completed projects</p>
                  </div>
                  <div className={`rounded-xl p-4 border ${isDark ? 'bg-[#322917]/40 border-[#5B4724]' : 'bg-[#FEF7E0]/60 border-[#FDE293]'}`}>
                    <p className={`text-3xl font-extrabold ${isDark ? 'text-[#E5C47A]' : 'text-[#B06000]'}`}>1</p>
                    <p className={`text-xs font-bold mt-1 ${isDark ? 'text-[#E5C47A]' : 'text-[#B06000]'}`}>Projects requiring follow-up</p>
                  </div>
                </div>

                <div className="space-y-1.5 mb-6">
                  <div className={`w-full rounded-full h-3 overflow-hidden p-0.5 ${
                    isDark ? 'bg-[#111113] border border-[#262629]' : 'bg-[#F1F5F9] border border-[#CBD5E1]'
                  }`}>
                    <div className={`${isDark ? 'bg-[#C9A86A]' : 'bg-[#1688D4]'} h-full rounded-full`} style={{ width: '96%' }} />
                  </div>
                </div>
              </div>

              <div className={`pt-4 border-t ${isDark ? 'border-[#262629]' : 'border-[#E2E8F0]'}`}>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                  isDark ? 'text-[#E5C47A] bg-[#322917] border border-[#5B4724]' : 'text-[#B06000] bg-[#FEF7E0] border border-[#FDE293]'
                }`}>
                  Kitisuru Grove • Under drawing verification
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function Dashboard() {
  const { navigate, theme } = useApp();
  const isDark = theme === 'dark';
  const {
    projects, shipments, getDashboardKPIs, getAttentionProjects,
    getDelayedProjects, getTotalOutstandingBalance
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const kpis = getDashboardKPIs();
  const attentionProjects = getAttentionProjects();
  const delayedProjects = getDelayedProjects();
  const outstandingBalance = getTotalOutstandingBalance();

  const paymentPendingCount = projects.filter(
    p => (p.balanceUSD || 0) > 0 && p.paymentStatus && !p.paymentStatus.toLowerCase().includes('100%')
  ).length;

  const drawingActionCount = projects.filter(
    p => p.designProgressPercent != null && p.designProgressPercent < 100 && p.contractStatus === 'Signed'
  ).length;

  const inTransitShipments = shipments.filter(s => s.status === 'In Transit').length;
  const deliveredShipments = shipments.filter(s => s.status === 'Delivered').length;
  const hasFilters = filterStatus !== 'all' || filterCountry !== 'all' || searchQuery.length > 0;

  return (
    <div className="space-y-6">
      {/* Executive Brief Header */}
      <div className={`flex flex-wrap items-center justify-between gap-3 border border-l-4 rounded-xl p-4 sm:p-5 shadow-2xs ${
        isDark 
          ? 'bg-[#151517] border-[#262629] border-l-[#C9A86A]' 
          : 'bg-[#FFFFFF] border-[#DCE5EE] border-l-[#1688D4]'
      }`}>
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-[#85858B]' : 'text-[#64748B]'}`}>
              PROJECT CONTROL CENTER · LIVE MANAGEMENT DASHBOARD
            </p>
            {/* Kumgang Signature Motion Signature: Data Flow Indicator */}
            <div className={`flex items-center gap-1 px-2.5 py-0.5 border rounded-full text-[10px] font-bold shadow-2xs ${
              isDark ? 'bg-[#111113] border-[#262629] text-[#B4B4B8]' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDark ? 'bg-[#C9A86A]' : 'bg-[#1688D4]'}`} />
              <span className={`tracking-wider text-[9px] uppercase font-extrabold ${isDark ? 'text-[#FFFFFF]' : 'text-[#0F172A]'}`}>DATA FLOW:</span>
              <span className={`font-mono ${isDark ? 'text-[#E8D6AE]' : 'text-[#0284C7]'}`}>Excel</span>
              <span className={`text-[9px] ${isDark ? 'text-[#85858B]' : 'text-[#94A3B8]'}`}>➔</span>
              <span className={`font-mono ${isDark ? 'text-[#E8D6AE]' : 'text-[#0284C7]'}`}>Data</span>
              <span className={`text-[9px] ${isDark ? 'text-[#85858B]' : 'text-[#94A3B8]'}`}>➔</span>
              <span className={`font-mono ${isDark ? 'text-[#E8D6AE]' : 'text-[#0284C7]'}`}>Projects</span>
              <span className={`text-[9px] ${isDark ? 'text-[#85858B]' : 'text-[#94A3B8]'}`}>➔</span>
              <span className={`font-mono font-extrabold ${isDark ? 'text-[#70D0A8]' : 'text-[#16A36A]'}`}>Live Dashboard</span>
            </div>
          </div>
          <h1 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${isDark ? 'text-[#FFFFFF]' : 'text-[#0F172A]'}`}>
            Executive Brief
          </h1>
          <p className={`text-xs mt-0.5 max-w-2xl ${isDark ? 'text-[#B4B4B8]' : 'text-[#475569]'}`}>
            Operational portfolio, management actions, progress tracking, and live status across all projects.
          </p>
        </div>
        <SyncExcelButton variant="primary" />
      </div>

      <ProjectManagerCard />

      {/* 1. PORTFOLIO STATUS (5 High-Value KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard label="Total Projects" value={kpis.totalProjects} description="All portfolio contracts" icon={FolderKanban} index={0} onClick={() => navigate('projects')} />
        <KPICard label="Signed / Active" value={kpis.signedProjects} description="Active project execution" icon={CheckCircle2} variant="highlight" index={1} />
        <KPICard label="At Risk" value={delayedProjects.length} description={delayedProjects.length > 0 ? `${delayedProjects.length} critical issues` : 'No active risks'} icon={AlertTriangle} variant={delayedProjects.length > 0 ? 'danger' : 'default'} index={2} onClick={() => navigate('delays')} />
        <KPICard label="Contract Value" value={formatCurrency(kpis.totalContractValueUSD)} description="Signed contracts total" icon={TrendingUp} variant="highlight" index={3} />
        <KPICard label="Outstanding" value={formatCurrency(outstandingBalance)} description="Total balance due" icon={DollarSign} variant={outstandingBalance > 0 ? 'attention' : 'highlight'} index={4} onClick={() => navigate('payments')} />
      </div>

      {/* 2. ATTENTION REQUIRED SUMMARY (Operational Issue Summary) */}
      <div className={`border border-l-4 rounded-xl shadow-card p-5 ${
        isDark 
          ? 'bg-[#151517] border-[#262629] border-l-[#E05A5A]' 
          : 'bg-[#FFFFFF] border-[#DCE5EE] border-l-[#EF4444]'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className={isDark ? 'text-[#E05A5A]' : 'text-[#DC2626]'} />
            <h2 className={`text-sm font-extrabold uppercase tracking-wider ${isDark ? 'text-[#FFFFFF]' : 'text-[#0F172A]'}`}>
              Attention Required Summary
            </h2>
            <span className="text-xs font-extrabold text-white bg-[#E05A5A] rounded-full px-2.5 py-0.5">
              {attentionProjects.length}
            </span>
          </div>
          <button
            onClick={() => navigate('delays')}
            className={`text-xs font-extrabold hover:underline flex items-center gap-1 cursor-pointer ${
              isDark ? 'text-[#F08A8A] hover:text-[#FFFFFF]' : 'text-[#DC2626] hover:text-[#0F172A]'
            }`}
          >
            View all risks <ArrowRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className={`flex items-center gap-3 p-3 rounded-lg border ${
            isDark ? 'bg-[#34191B]/60 border-[#5A292B]' : 'bg-[#FEF2F2] border-[#FCA5A5]'
          }`}>
            <span className={`w-3 h-3 rounded-full flex-shrink-0 animate-pulse ${isDark ? 'bg-[#E05A5A]' : 'bg-[#EF4444]'}`} />
            <div>
              <p className={`text-base font-extrabold ${isDark ? 'text-[#F08A8A]' : 'text-[#991B1B]'}`}>{delayedProjects.length} Delayed</p>
              <p className={`text-[11px] font-semibold ${isDark ? 'text-[#F08A8A]/80' : 'text-[#B91C1C]'}`}>Critical schedule delay</p>
            </div>
          </div>

          <div className={`flex items-center gap-3 p-3 rounded-lg border ${
            isDark ? 'bg-[#322917]/60 border-[#5B4724]' : 'bg-[#FEF7E0] border-[#FDE293]'
          }`}>
            <span className={`w-3 h-3 rounded-full flex-shrink-0 ${isDark ? 'bg-[#D6A84F]' : 'bg-[#F59E0B]'}`} />
            <div>
              <p className={`text-base font-extrabold ${isDark ? 'text-[#E5C47A]' : 'text-[#B06000]'}`}>{paymentPendingCount} Payment Pending</p>
              <p className={`text-[11px] font-semibold ${isDark ? 'text-[#E5C47A]/80' : 'text-[#B06000]'}`}>Outstanding balance due</p>
            </div>
          </div>

          <div className={`flex items-center gap-3 p-3 rounded-lg border ${
            isDark ? 'bg-[#251F32]/60 border-[#42375A]' : 'bg-[#F3E8FF] border-[#E9D5FF]'
          }`}>
            <span className={`w-3 h-3 rounded-full flex-shrink-0 ${isDark ? 'bg-[#9A82D4]' : 'bg-[#8B5CF6]'}`} />
            <div>
              <p className={`text-base font-extrabold ${isDark ? 'text-[#BBA8E8]' : 'text-[#6D28D9]'}`}>{drawingActionCount} Active Drawing</p>
              <p className={`text-[11px] font-semibold ${isDark ? 'text-[#BBA8E8]/80' : 'text-[#6D28D9]'}`}>Under verification/submission</p>
            </div>
          </div>
        </div>

        {/* Top 3 Urgent Attention List Preview */}
        {attentionProjects.length > 0 && (
          <div className={`space-y-2 pt-2 border-t ${isDark ? 'border-[#262629]' : 'border-[#E2E8F0]'}`}>
            <p className={`text-[10px] font-extrabold uppercase tracking-widest mb-1 ${isDark ? 'text-[#85858B]' : 'text-[#64748B]'}`}>
              Top Priority Attention Items:
            </p>
            <div className="space-y-2">
              {attentionProjects.slice(0, 3).map(p => (
                <AttentionAlert key={p.projectId} project={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. COUNTRY DISTRIBUTION & DRAWING STATUS */}
      <ExecutiveMetricsSection />

      {/* Shipment snapshots */}
      {(inTransitShipments > 0 || deliveredShipments > 0) && (
        <div className="flex flex-wrap gap-3">
          {inTransitShipments > 0 && (
            <div
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl cursor-pointer transition-colors shadow-2xs ${
                isDark ? 'bg-[#17272E] border-[#294651] hover:border-[#56A9C7]' : 'bg-[#E7F7F9] border-[#159AAB]/30 hover:border-[#159AAB]'
              }`}
              onClick={() => navigate('shipment')}
            >
              <Truck size={14} className={isDark ? 'text-[#89C9DF]' : 'text-[#087583]'} />
              <span className={`text-sm font-semibold ${isDark ? 'text-[#89C9DF]' : 'text-[#087583]'}`}>
                {inTransitShipments} shipment{inTransitShipments > 1 ? 's' : ''} in transit
              </span>
              <ChevronRight size={13} className={isDark ? 'text-[#89C9DF]' : 'text-[#159AAB]'} />
            </div>
          )}
          {deliveredShipments > 0 && (
            <div
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl cursor-pointer transition-colors shadow-2xs ${
                isDark ? 'bg-[#163127] border-[#28523F] hover:border-[#3FB984]' : 'bg-[#E8F7F0] border-[#16A36A]/30 hover:border-[#16A36A]'
              }`}
              onClick={() => navigate('shipment')}
            >
              <Truck size={14} className={isDark ? 'text-[#70D0A8]' : 'text-[#087A4D]'} />
              <span className={`text-sm font-semibold ${isDark ? 'text-[#70D0A8]' : 'text-[#16A36A]'}`}>
                {deliveredShipments} delivered
              </span>
              <ChevronRight size={13} className={isDark ? 'text-[#70D0A8]' : 'text-[#3FB984]'} />
            </div>
          )}
        </div>
      )}

      {/* 4. PROJECT STATUS REGISTER & SCANNING REPORT TABLE */}
      <section className={`rounded-xl p-5 lg:p-6 shadow-2xs border ${
        isDark ? 'bg-[#151517] border-[#262629]' : 'bg-[#FFFFFF] border-[#DCE5EE]'
      }`}>
        <div className={`flex flex-wrap items-center justify-between gap-3 mb-4 border-b pb-3 ${isDark ? 'border-[#202023]' : 'border-[#E2E8F0]'}`}>
          <div>
            <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-[#85858B]' : 'text-[#64748B]'}`}>Live Operational Report</p>
            <h2 className={`text-base font-extrabold tracking-tight flex items-center gap-2 ${isDark ? 'text-[#FFFFFF]' : 'text-[#0F172A]'}`}>
              <FolderKanban size={16} className={isDark ? 'text-[#C9A86A]' : 'text-[#1688D4]'} />
              Project Status Register & Report
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Switcher */}
            <div className={`flex items-center p-0.5 rounded-lg border ${
              isDark ? 'bg-[#111113] border-[#262629]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
            }`}>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  viewMode === 'table' 
                    ? (isDark ? 'bg-[#C9A86A] text-[#111111] shadow-2xs' : 'bg-[#1688D4] text-white shadow-2xs')
                    : (isDark ? 'text-[#85858B] hover:text-[#FFFFFF]' : 'text-[#64748B] hover:text-[#0F172A]')
                }`}
                title="Table View (Full Report)"
              >
                <LayoutList size={13} />
                <span>Table View</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  viewMode === 'grid' 
                    ? (isDark ? 'bg-[#C9A86A] text-[#111111] shadow-2xs' : 'bg-[#1688D4] text-white shadow-2xs')
                    : (isDark ? 'text-[#85858B] hover:text-[#FFFFFF]' : 'text-[#64748B] hover:text-[#0F172A]')
                }`}
                title="Grid View (Cards)"
              >
                <LayoutGrid size={13} />
                <span>Grid View</span>
              </button>
            </div>

            <button onClick={() => navigate('projects')} className={`text-xs font-bold hover:underline flex items-center gap-1 ${
              isDark ? 'text-[#C9A86A] hover:text-[#D7B97C]' : 'text-[#1688D4] hover:text-[#0284C7]'
            }`}>
              All Projects <ArrowRight size={12} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 mb-5">
          <div className="relative flex-1 min-w-[220px] max-w-xs">
            <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-[#66666C]' : 'text-[#94A3B8]'}`} />
            <input
              type="text"
              placeholder="Search projects, client or location..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 font-medium ${
                isDark 
                  ? 'border-[#303035] bg-[#111113] focus:ring-[#C9A86A] text-[#F5F5F3] placeholder-[#66666C]' 
                  : 'border-[#CBD5E1] bg-[#FFFFFF] focus:ring-[#1688D4] text-[#0F172A] placeholder-[#94A3B8]'
              }`}
              aria-label="Search projects"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X size={13} className={isDark ? 'text-[#66666C]' : 'text-[#94A3B8]'} />
              </button>
            )}
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className={`text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 font-medium ${
              isDark 
                ? 'border-[#303035] bg-[#111113] focus:ring-[#C9A86A] text-[#F5F5F3]' 
                : 'border-[#CBD5E1] bg-[#FFFFFF] focus:ring-[#1688D4] text-[#0F172A]'
            }`}
            aria-label="Filter by status"
          >
            <option value="all">Status: All</option>
            <option value="Signed">Signed</option>
            <option value="Not Signed">Not Signed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select
            value={filterCountry}
            onChange={e => setFilterCountry(e.target.value)}
            className={`text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 font-medium ${
              isDark 
                ? 'border-[#303035] bg-[#111113] focus:ring-[#C9A86A] text-[#F5F5F3]' 
                : 'border-[#CBD5E1] bg-[#FFFFFF] focus:ring-[#1688D4] text-[#0F172A]'
            }`}
            aria-label="Filter by country"
          >
            <option value="all">Country: All</option>
            <option value="India">India</option>
            <option value="Malaysia">Malaysia</option>
            <option value="Maldives">Maldives</option>
          </select>
          {hasFilters && (
            <button
              onClick={() => { setFilterStatus('all'); setFilterCountry('all'); setSearchQuery(''); }}
              className={`text-xs font-semibold border rounded-lg px-3 py-2 flex items-center gap-1 ${
                isDark 
                  ? 'text-[#B4B4B8] hover:text-[#FFFFFF] border-[#303035] hover:bg-[#1B1B1F]' 
                  : 'text-[#64748B] hover:text-[#0F172A] border-[#CBD5E1] hover:bg-[#F8FAFC]'
              }`}
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>

        <ProjectList
          filterStatus={filterStatus !== 'all' ? filterStatus : undefined}
          filterCountry={filterCountry !== 'all' ? filterCountry : undefined}
          searchQuery={searchQuery}
          viewMode={viewMode}
        />
      </section>
    </div>
  );
}

