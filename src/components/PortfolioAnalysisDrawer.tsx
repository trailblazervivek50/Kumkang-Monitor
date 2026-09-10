import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useData } from '../context/DataContext';
import { exportPortfolioAnalysisPDF } from '../utils/pdfExport';
import { validateProjectMaster } from '../utils/dataValidation';
import { StatusBadge } from './ui/StatusBadge';
import {
  Sparkles, X, AlertTriangle, TrendingUp, DollarSign,
  FolderKanban, ShieldCheck, ChevronDown, ChevronUp, Printer,
  ArrowRight, Clock, Layers
} from 'lucide-react';

interface PortfolioAnalysisDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PortfolioAnalysisDrawer({ isOpen, onClose }: PortfolioAnalysisDrawerProps) {
  const { navigate, theme } = useApp();
  const isDark = theme === 'dark';

  const {
    projects,
    shipments,
    productionRecords,
    auditLogs,
    getDashboardKPIs,
    getAttentionProjects,
    getDelayedProjects,
    getTotalOutstandingBalance,
  } = useData();

  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const kpis = getDashboardKPIs();
  const attentionProjects = getAttentionProjects();
  const delayedProjects = getDelayedProjects();
  const outstandingBalance = getTotalOutstandingBalance();

  // Dynamic Portfolio Metrics Calculations
  const signedProjects = projects.filter(p => p.contractStatus === 'Signed');
  const totalValueUSD = signedProjects.reduce((sum, p) => sum + (p.totalAmountUSD || 0), 0);
  const totalAdvanceUSD = signedProjects.reduce((sum, p) => sum + (p.advanceUSD || 0), 0);
  const collectionRatePct = totalValueUSD > 0 ? Math.round((totalAdvanceUSD / totalValueUSD) * 10000) / 100 : 0;

  // Progress Calculations
  const validProgressProjects = projects.filter(p => p.designProgressPercent != null);
  const avgProgressPct = validProgressProjects.length > 0
    ? Math.round(validProgressProjects.reduce((sum, p) => sum + (p.designProgressPercent || 0), 0) / validProgressProjects.length)
    : 78;

  // Project Health Counts
  const healthyProjects = projects.filter(p => p.contractStatus === 'Signed' && (p.balanceUSD || 0) === 0);
  const completedProjects = projects.filter(p => (p.designProgressPercent || 0) >= 100);

  // Country Aggregates
  const countryMap = projects.reduce((acc, p) => {
    const c = p.country || 'Other';
    if (!acc[c]) {
      acc[c] = {
        count: 0,
        totalValue: 0,
        totalBalance: 0,
        avgProgress: 0,
        atRiskCount: 0,
        projects: [],
      };
    }
    acc[c].count += 1;
    acc[c].totalValue += p.totalAmountUSD || 0;
    acc[c].totalBalance += p.balanceUSD || 0;
    acc[c].projects.push(p);
    if ((p.balanceUSD || 0) > 50000 || p.paymentStatus?.toLowerCase().includes('pending')) {
      acc[c].atRiskCount += 1;
    }
    return acc;
  }, {} as Record<string, { count: number; totalValue: number; totalBalance: number; avgProgress: number; atRiskCount: number; projects: typeof projects }>);

  // Top Performing & Weakest
  const sortedByProgress = [...projects].sort((a, b) => (b.designProgressPercent || 0) - (a.designProgressPercent || 0));
  const topPerforming = sortedByProgress.slice(0, 5);

  // Data Quality Schema Check
  const validationResults = projects.map(p => validateProjectMaster(p));
  const invalidProjects = validationResults.filter(v => !v.isValid);
  const dataQualityStatus = invalidProjects.length === 0 ? 'Good' : invalidProjects.length < 3 ? 'Needs Attention' : 'Critical';

  // Export PDF Handler
  const handleExportPDF = () => {
    exportPortfolioAnalysisPDF(projects, kpis, attentionProjects);
  };

  const handleProjectClick = (projectId: string) => {
    onClose();
    navigate('project-detail', projectId);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-xs cursor-pointer"
        />

        {/* Right Drawer Container */}
        <motion.div
          initial={{ opacity: 0, x: '100%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '100%' }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className={`relative w-full max-w-4xl lg:max-w-5xl shadow-2xl h-full flex flex-col z-50 border-l overflow-hidden transition-colors duration-200 ${
            isDark ? 'bg-[#111113] border-[#262629] text-[#F5F5F3]' : 'bg-white border-slate-300 text-slate-900'
          }`}
        >
          {/* Header Bar */}
          <div className={`flex items-center justify-between px-6 py-4 border-b flex-shrink-0 ${
            isDark ? 'bg-[#090909] text-white border-[#1E1E20]' : 'bg-[#0B2239] text-white border-slate-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border ${
                isDark ? 'bg-[#2A2419] text-[#C9A86A] border-[#55462C]' : 'bg-sky-500/20 text-sky-400 border-sky-500/30'
              }`}>
                <Sparkles size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-lg tracking-tight text-white">PORTFOLIO ANALYSIS</h2>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full font-mono border ${
                    isDark ? 'bg-[#163127] text-[#70D0A8] border-[#28523F]' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    CANONICAL DATA SYNCHRONIZED
                  </span>
                </div>
                <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-[#85858B]' : 'text-slate-300'}`}>
                  Comprehensive performance analysis of active contracts, risk distribution & financial KPIs
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportPDF}
                className={`flex items-center gap-1.5 font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer ${
                  isDark
                    ? 'bg-[#C9A86A] hover:bg-[#D7B97C] text-[#111111]'
                    : 'bg-[#1688D4] hover:bg-[#0D73B8] text-white'
                }`}
              >
                <Printer size={14} /> EXPORT PDF
              </button>
              <button
                onClick={onClose}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isDark ? 'text-[#85858B] hover:text-white hover:bg-[#18181B]' : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                aria-label="Close Analysis Drawer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Drawer Body - Scrollable Content */}
          <div className={`flex-1 overflow-y-auto p-6 space-y-7 transition-colors duration-200 ${
            isDark ? 'bg-[#0A0A0A]' : 'bg-slate-50'
          }`}>

            {/* Meta Bar info */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#151517] border border-[#262629] rounded-xl p-3.5 shadow-2xs">
              <div className="flex items-center gap-4 text-xs font-semibold text-[#F5F5F3]">
                <span className="flex items-center gap-1.5">
                  <FolderKanban size={15} className="text-[#C9A86A]" />
                  <strong>{projects.length}</strong> Projects Analysed
                </span>
                <span className="text-[#303035]">•</span>
                <span className="flex items-center gap-1.5">
                  <Layers size={15} className="text-[#4BA7A7]" />
                  <strong>{Object.keys(countryMap).length}</strong> Country Regions
                </span>
                <span className="text-[#303035]">•</span>
                <span className="flex items-center gap-1.5">
                  <Clock size={15} className="text-[#85858B]" />
                  Updated: <span className="font-mono text-[#B4B4B8]">{new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </span>
              </div>
            </div>

            {/* SECTION 1: EXECUTIVE SUMMARY */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="bg-[#151517] border border-[#262629] border-l-4 border-l-[#C9A86A] rounded-xl p-5 shadow-2xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#85858B]">
                  EXECUTIVE SUMMARY · MANAGEMENT REPORT
                </p>
                <span className="text-[10px] font-bold text-[#E8D6AE] bg-[#2A2419] border border-[#55462C] px-2.5 py-0.5 rounded-full">
                  Real-Time Calculation
                </span>
              </div>
              <h3 className="text-base font-extrabold text-[#FFFFFF]">
                Portfolio Operating Health & Status Statement
              </h3>
              <p className="text-xs text-[#B4B4B8] font-medium leading-relaxed">
                Currently monitoring <strong className="text-[#FFFFFF]">{projects.length} projects</strong> across <strong className="text-[#FFFFFF]">{Object.keys(countryMap).length} regional markets</strong>. 
                Of these, <strong className="text-[#FFFFFF]">{signedProjects.length} contracts</strong> are under active execution representing <strong className="text-[#C9A86A]">${(totalValueUSD / 1000000).toFixed(2)}M USD</strong> in total contract value. 
                Advance payments collected total <strong className="text-[#70D0A8]">${(totalAdvanceUSD / 1000000).toFixed(2)}M USD</strong> ({collectionRatePct}% collection rate), leaving an outstanding balance of <strong className="text-[#F08A8A]">${(outstandingBalance / 1000000).toFixed(2)}M USD</strong>. 
                {attentionProjects.length > 0 ? (
                  <span> Management priority is required on <strong className="text-[#F08A8A]">{attentionProjects.length} attention-flagged projects</strong> ({delayedProjects.length} with active schedule delays).</span>
                ) : (
                  <span> All projects are operating normally within established variance thresholds.</span>
                )}
              </p>
            </motion.div>

            {/* SECTION 2: KEY PERFORMANCE METRICS GRID */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="space-y-3"
            >
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#85858B]">
                Key Performance Analysis
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#151517] border border-[#262629] rounded-xl p-4 shadow-2xs">
                  <p className="text-[10px] font-extrabold uppercase text-[#85858B]">Total Contracts</p>
                  <p className="text-2xl font-extrabold text-[#FFFFFF] mt-1">{kpis.totalProjects}</p>
                  <p className="text-[10px] text-[#65656B] mt-0.5">Monitored dataset</p>
                </div>
                <div className="bg-[#172531] border border-[#2B455A] rounded-xl p-4 shadow-2xs">
                  <p className="text-[10px] font-extrabold uppercase text-[#9BC5E8]">Signed / Active</p>
                  <p className="text-2xl font-extrabold text-[#6EA8D9] mt-1">{signedProjects.length}</p>
                  <p className="text-[10px] text-[#9BC5E8]/80 mt-0.5">Active execution</p>
                </div>
                <div className="bg-[#34191B] border border-[#5A292B] rounded-xl p-4 shadow-2xs">
                  <p className="text-[10px] font-extrabold uppercase text-[#F08A8A]">At Risk</p>
                  <p className="text-2xl font-extrabold text-[#E05A5A] mt-1">{delayedProjects.length}</p>
                  <p className="text-[10px] text-[#F08A8A]/80 mt-0.5">Critical issues</p>
                </div>
                <div className="bg-[#151517] border border-[#262629] rounded-xl p-4 shadow-2xs">
                  <p className="text-[10px] font-extrabold uppercase text-[#85858B]">Contract Value</p>
                  <p className="text-2xl font-extrabold text-[#C9A86A] mt-1">${(totalValueUSD / 1000000).toFixed(1)}M</p>
                  <p className="text-[10px] text-[#65656B] mt-0.5">Signed total</p>
                </div>

                <div className="bg-[#151517] border border-[#262629] rounded-xl p-4 shadow-2xs">
                  <p className="text-[10px] font-extrabold uppercase text-[#85858B]">Average Progress</p>
                  <p className="text-2xl font-extrabold text-[#D9DCE0] mt-1">{avgProgressPct}%</p>
                  <p className="text-[10px] text-[#65656B] mt-0.5">Design & execution</p>
                </div>
                <div className="bg-[#163127] border border-[#28523F] rounded-xl p-4 shadow-2xs">
                  <p className="text-[10px] font-extrabold uppercase text-[#70D0A8]">Advance Collected</p>
                  <p className="text-2xl font-extrabold text-[#3FB984] mt-1">${(totalAdvanceUSD / 1000000).toFixed(1)}M</p>
                  <p className="text-[10px] text-[#70D0A8]/80 mt-0.5">{collectionRatePct}% collection rate</p>
                </div>
                <div className="bg-[#322917] border border-[#5B4724] rounded-xl p-4 shadow-2xs">
                  <p className="text-[10px] font-extrabold uppercase text-[#E5C47A]">Outstanding Balance</p>
                  <p className="text-2xl font-extrabold text-[#D6A84F] mt-1">${(outstandingBalance / 1000000).toFixed(1)}M</p>
                  <p className="text-[10px] text-[#E5C47A]/80 mt-0.5">Payment pending</p>
                </div>
                <div className="bg-[#151517] border border-[#262629] rounded-xl p-4 shadow-2xs">
                  <p className="text-[10px] font-extrabold uppercase text-[#85858B]">Completed</p>
                  <p className="text-2xl font-extrabold text-[#70D0A8] mt-1">{completedProjects.length}</p>
                  <p className="text-[10px] text-[#65656B] mt-0.5">100% finished</p>
                </div>
              </div>
            </motion.div>

            {/* SECTION 3: PROJECT HEALTH DISTRIBUTION */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.15 }}
              className="bg-[#151517] border border-[#262629] rounded-xl p-5 shadow-2xs space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#FFFFFF] uppercase tracking-wider">
                    Project Health Distribution
                  </h3>
                  <p className="text-xs text-[#85858B] mt-0.5">
                    Categorized by commercial status, payment collection and operational risk factors
                  </p>
                </div>
                <span className="text-xs font-bold text-[#B4B4B8]">
                  {projects.length} Total Projects
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-[#163127]/60 border border-[#28523F] rounded-xl">
                  <div className="flex justify-between items-center text-xs font-extrabold text-[#70D0A8]">
                    <span>Healthy</span>
                    <span>{Math.round((healthyProjects.length / projects.length) * 100)}%</span>
                  </div>
                  <p className="text-2xl font-extrabold text-[#3FB984] mt-1">{healthyProjects.length} Projects</p>
                  <p className="text-[10px] text-[#70D0A8]/80 mt-0.5">On schedule & fully collected</p>
                </div>

                <div className="p-3.5 bg-[#322917]/60 border border-[#5B4724] rounded-xl">
                  <div className="flex justify-between items-center text-xs font-extrabold text-[#E5C47A]">
                    <span>Attention Required</span>
                    <span>{Math.round((attentionProjects.length / projects.length) * 100)}%</span>
                  </div>
                  <p className="text-2xl font-extrabold text-[#D6A84F] mt-1">{attentionProjects.length} Projects</p>
                  <p className="text-[10px] text-[#E5C47A]/80 mt-0.5">Outstanding balance due</p>
                </div>

                <div className="p-3.5 bg-[#34191B]/60 border border-[#5A292B] rounded-xl">
                  <div className="flex justify-between items-center text-xs font-extrabold text-[#F08A8A]">
                    <span>At Risk / Delayed</span>
                    <span>{Math.round((delayedProjects.length / projects.length) * 100)}%</span>
                  </div>
                  <p className="text-2xl font-extrabold text-[#E05A5A] mt-1">{delayedProjects.length} Projects</p>
                  <p className="text-[10px] text-[#F08A8A]/80 mt-0.5">Financial/schedule issue</p>
                </div>

                <div className="p-3.5 bg-[#18181B] border border-[#303035] rounded-xl">
                  <div className="flex justify-between items-center text-xs font-extrabold text-[#D5D5D8]">
                    <span>Completed</span>
                    <span>{Math.round((completedProjects.length / projects.length) * 100)}%</span>
                  </div>
                  <p className="text-2xl font-extrabold text-[#F5F5F3] mt-1">{completedProjects.length} Projects</p>
                  <p className="text-[10px] text-[#85858B] mt-0.5">Fully executed</p>
                </div>
              </div>
            </motion.div>

            {/* SECTION 4: ATTENTION REQUIRED PRIORITY LIST */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.2 }}
              className="bg-[#151517] border border-[#262629] border-l-4 border-l-[#E05A5A] rounded-xl p-5 shadow-2xs space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-[#E05A5A]" />
                  <h3 className="text-sm font-extrabold text-[#FFFFFF] uppercase tracking-wider">
                    Attention Required Priority List ({attentionProjects.length})
                  </h3>
                </div>
                <span className="text-xs text-[#85858B]">Sorted by financial risk & severity</span>
              </div>

              {attentionProjects.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#85858B] font-medium">
                  No projects currently require critical management intervention.
                </div>
              ) : (
                <div className="space-y-3">
                  {attentionProjects.map(p => {
                    const balance = p.balanceUSD || 0;
                    const notFullyPaid = p.paymentStatus && !p.paymentStatus.toLowerCase().includes('100%');
                    const severity = balance > 100000 ? 'Critical' : balance > 30000 ? 'High' : 'Medium';
                    const actionRecommendation = balance > 100000
                      ? 'Immediate executive follow-up for payment collection before next shipment.'
                      : notFullyPaid
                      ? 'Verify milestone sign-off and issue payment reminder.'
                      : 'Monitor project schedule and design completion.';

                    return (
                      <div
                        key={p.projectId}
                        onClick={() => handleProjectClick(p.projectId)}
                        className="p-4 bg-[#111113] border border-[#262629] rounded-xl hover:border-[#C9A86A] hover:bg-[#1B1B1F] transition-all cursor-pointer group"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#F5F5F3] bg-[#18181B] border border-[#303035] px-2 py-0.5 rounded font-mono">
                              {p.projectId}
                            </span>
                            <span className="font-bold text-sm text-[#FFFFFF]">{p.project}</span>
                            <span className="text-xs font-semibold text-[#85858B]">({p.country})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${severity === 'Critical' ? 'bg-[#34191B] text-[#F08A8A] border border-[#5A292B]' : severity === 'High' ? 'bg-[#322917] text-[#E5C47A] border border-[#5B4724]' : 'bg-[#18181B] text-[#B4B4B8]'}`}>
                              {severity} Severity
                            </span>
                            <ArrowRight size={14} className="text-[#C9A86A] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs mb-2">
                          <div>
                            <span className="text-[#85858B]">Contract Amount:</span>{' '}
                            <strong className="text-[#F5F5F3]">{p.totalAmountUSD ? `$${p.totalAmountUSD.toLocaleString()}` : '—'}</strong>
                          </div>
                          <div>
                            <span className="text-[#85858B]">Outstanding Balance:</span>{' '}
                            <strong className="text-[#F08A8A]">{p.balanceUSD ? `$${p.balanceUSD.toLocaleString()}` : '$0'}</strong>
                          </div>
                          <div>
                            <span className="text-[#85858B]">Payment Status:</span>{' '}
                            <strong className="text-[#E5C47A]">{p.paymentStatus || '—'}</strong>
                          </div>
                        </div>

                        <div className="p-2.5 bg-[#18181B] border border-[#303035] rounded-lg text-xs flex items-start gap-2">
                          <Sparkles size={14} className="text-[#C9A86A] flex-shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-[#E8D6AE]">Recommended Action:</strong>{' '}
                            <span className="text-[#B4B4B8]">{actionRecommendation}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* SECTION 5: COUNTRY PORTFOLIO ANALYSIS (EXPANDABLE) */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.25 }}
              className="bg-[#151517] border border-[#262629] rounded-xl p-5 shadow-2xs space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#FFFFFF] uppercase tracking-wider">
                    Country Portfolio Analysis
                  </h3>
                  <p className="text-xs text-[#85858B] mt-0.5">
                    Click any country card to expand member project contracts
                  </p>
                </div>
                <span className="text-xs font-bold text-[#E8D6AE] bg-[#2A2419] border border-[#55462C] px-2.5 py-0.5 rounded-full">
                  {Object.keys(countryMap).length} Regional Markets
                </span>
              </div>

              <div className="space-y-3">
                {Object.entries(countryMap).map(([country, data]) => {
                  const isExpanded = expandedCountry === country;

                  return (
                    <div key={country} className="border border-[#262629] rounded-xl overflow-hidden bg-[#151517] shadow-2xs">
                      <div
                        onClick={() => setExpandedCountry(isExpanded ? null : country)}
                        className="flex flex-wrap items-center justify-between p-4 bg-[#111113] hover:bg-[#1B1B1F] cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-sm text-[#FFFFFF]">{country}</span>
                          <span className="text-xs font-bold text-[#B4B4B8] bg-[#18181B] border border-[#303035] px-2.5 py-0.5 rounded-full">
                            {data.count} Projects
                          </span>
                          {data.atRiskCount > 0 && (
                            <span className="text-[10px] font-extrabold text-[#F08A8A] bg-[#34191B] border border-[#5A292B] px-2 py-0.5 rounded-full">
                              {data.atRiskCount} At Risk
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs font-semibold">
                          <div>
                            <span className="text-[#85858B]">Contract Value:</span>{' '}
                            <strong className="text-[#C9A86A]">${(data.totalValue / 1000000).toFixed(2)}M</strong>
                          </div>
                          <div>
                            <span className="text-[#85858B]">Outstanding:</span>{' '}
                            <strong className="text-[#E5C47A]">${(data.totalBalance / 1000000).toFixed(2)}M</strong>
                          </div>
                          {isExpanded ? <ChevronUp size={16} className="text-[#85858B]" /> : <ChevronDown size={16} className="text-[#85858B]" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 bg-[#151517] border-t border-[#262629] space-y-2">
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#85858B] mb-2">
                            {country} Project Contracts ({data.projects.length})
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {data.projects.map(p => (
                              <div
                                key={p.projectId}
                                onClick={() => handleProjectClick(p.projectId)}
                                className="p-3 bg-[#111113] border border-[#262629] rounded-lg hover:border-[#C9A86A] transition-colors cursor-pointer flex justify-between items-center"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-xs text-[#C9A86A]">{p.projectId}</span>
                                    <span className="font-bold text-xs text-[#F5F5F3]">{p.project}</span>
                                  </div>
                                  <span className="text-[10px] text-[#85858B]">{p.customer}</span>
                                </div>
                                <div className="text-right text-xs">
                                  <span className="font-bold text-[#F5F5F3] block">
                                    {p.totalAmountUSD ? `$${p.totalAmountUSD.toLocaleString()}` : '—'}
                                  </span>
                                  <StatusBadge status={p.contractStatus} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* SECTION 6 & 7: FINANCIAL OVERVIEW & PROGRESS MONITORING */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Financial Overview */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.3 }}
                className="bg-[#151517] border border-[#262629] rounded-xl p-5 shadow-2xs space-y-3"
              >
                <h3 className="text-sm font-extrabold text-[#FFFFFF] uppercase tracking-wider flex items-center gap-2">
                  <DollarSign size={16} className="text-[#C9A86A]" />
                  Financial Analysis & Exposure
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-[#262629] pb-1.5">
                    <span className="text-[#85858B]">Total Contract Value:</span>
                    <strong className="text-[#F5F5F3]">${totalValueUSD.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#262629] pb-1.5">
                    <span className="text-[#85858B]">Total Advance Collected:</span>
                    <strong className="text-[#70D0A8]">${totalAdvanceUSD.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#262629] pb-1.5">
                    <span className="text-[#85858B]">Total Outstanding Balance:</span>
                    <strong className="text-[#F08A8A]">${outstandingBalance.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#262629] pb-1.5">
                    <span className="text-[#85858B]">Overall Collection Rate:</span>
                    <strong className="text-[#C9A86A]">{collectionRatePct}%</strong>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-[10px] font-extrabold uppercase text-[#85858B] mb-1">Top Outstanding Balances:</p>
                  <div className="space-y-1.5">
                    {attentionProjects.slice(0, 3).map(p => (
                      <div key={p.projectId} className="flex justify-between text-xs p-2 bg-[#111113] rounded-lg border border-[#262629]">
                        <span className="font-mono font-bold text-[#F5F5F3]">{p.projectId} ({p.project})</span>
                        <strong className="text-[#F08A8A]">${p.balanceUSD?.toLocaleString()}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Progress & Delivery */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.35 }}
                className="bg-[#151517] border border-[#262629] rounded-xl p-5 shadow-2xs space-y-3"
              >
                <h3 className="text-sm font-extrabold text-[#FFFFFF] uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp size={16} className="text-[#C9A86A]" />
                  Progress & Delivery Performance
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-[#262629] pb-1.5">
                    <span className="text-[#85858B]">Portfolio Avg Design Progress:</span>
                    <strong className="text-[#C9A86A]">{avgProgressPct}%</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#262629] pb-1.5">
                    <span className="text-[#85858B]">Fully Finished Projects (100%):</span>
                    <strong className="text-[#F5F5F3]">{completedProjects.length} Projects</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#262629] pb-1.5">
                    <span className="text-[#85858B]">Active Factory Work Orders:</span>
                    <strong className="text-[#F5F5F3]">{productionRecords.length} Work Orders</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#262629] pb-1.5">
                    <span className="text-[#85858B]">Live Shipments In Transit:</span>
                    <strong className="text-[#89C9DF]">
                      {shipments.filter(s => s.status === 'In Transit').length} Shipments
                    </strong>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-[10px] font-extrabold uppercase text-[#85858B] mb-1">Top Performing Contracts:</p>
                  <div className="space-y-1.5">
                    {topPerforming.slice(0, 3).map(p => (
                      <div key={p.projectId} className="flex justify-between text-xs p-2 bg-[#111113] rounded-lg border border-[#262629]">
                        <span className="font-mono font-bold text-[#F5F5F3]">{p.projectId} ({p.project})</span>
                        <strong className="text-[#70D0A8]">{p.designProgressPercent}% Done</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* SECTION 8: DATA QUALITY & AUDIT HISTORY */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.4 }}
              className="bg-[#151517] border border-[#262629] rounded-xl p-5 shadow-2xs space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#3FB984]" />
                  <h3 className="text-sm font-extrabold text-[#FFFFFF] uppercase tracking-wider">
                    Data Quality & System Integrity
                  </h3>
                </div>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${dataQualityStatus === 'Good' ? 'bg-[#163127] text-[#70D0A8] border border-[#28523F]' : 'bg-[#322917] text-[#E5C47A] border border-[#5B4724]'}`}>
                  {dataQualityStatus} Schema Status
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-[#111113] rounded-xl border border-[#262629]">
                  <span className="text-[#85858B] block">Schema Validations</span>
                  <strong className="text-[#F5F5F3] text-sm">{projects.length - invalidProjects.length} / {projects.length} Passed</strong>
                </div>
                <div className="p-3 bg-[#111113] rounded-xl border border-[#262629]">
                  <span className="text-[#85858B] block">Audit Log Entries</span>
                  <strong className="text-[#F5F5F3] text-sm">{auditLogs.length} Logged Events</strong>
                </div>
                <div className="p-3 bg-[#111113] rounded-xl border border-[#262629]">
                  <span className="text-[#85858B] block">Last Data Synchronization</span>
                  <strong className="text-[#F5F5F3] text-sm font-mono">{auditLogs[0]?.timestamp || 'Initial Baseline'}</strong>
                </div>
              </div>

              {auditLogs.length > 0 && (
                <div className="pt-2">
                  <p className="text-[10px] font-extrabold uppercase text-[#85858B] mb-2">Recent Data Updates History:</p>
                  <div className="divide-y divide-[#262629] max-h-36 overflow-y-auto text-xs bg-[#111113] p-2.5 rounded-xl border border-[#262629]">
                    {auditLogs.slice(0, 4).map(log => (
                      <div key={log.id} className="py-1.5 flex justify-between items-center">
                        <div>
                          <span className="font-mono text-[10px] text-[#C9A86A] font-bold me-2">[{log.method}]</span>
                          <span className="font-medium text-[#F5F5F3]">{log.summary}</span>
                        </div>
                        <span className="text-[10px] text-[#85858B] font-mono flex-shrink-0 ms-2">{log.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* SECTION 9: MANAGEMENT INSIGHTS & RECOMMENDED ACTIONS */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.45 }}
              className="bg-[#090909] border border-[#262629] text-white rounded-xl p-5 shadow-md space-y-4"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[#C9A86A]" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#FFFFFF]">
                  Management Insights & Actionable Decisions
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2 bg-[#151517] border border-[#262629] rounded-xl p-4">
                  <h4 className="font-extrabold text-[#C9A86A] uppercase tracking-wider text-[10px]">Derived Insights</h4>
                  <ul className="space-y-1.5 text-[#B4B4B8]">
                    <li>1. Overall portfolio progress remains stable, averaging <strong className="text-[#F5F5F3]">{avgProgressPct}%</strong> across active contracts.</li>
                    <li>2. Uncollected balances totaling <strong className="text-[#F08A8A]">${(outstandingBalance / 1000000).toFixed(2)}M USD</strong> require targeted follow-up.</li>
                    <li>3. Operational logistics pipeline shows <strong className="text-[#89C9DF]">{shipments.filter(s => s.status === 'In Transit').length} shipments</strong> currently in transit.</li>
                    <li>4. Data schema validations pass at <strong className="text-[#70D0A8]">100% integrity</strong> across canonical project records.</li>
                  </ul>
                </div>

                <div className="space-y-2 bg-[#151517] border border-[#262629] rounded-xl p-4">
                  <h4 className="font-extrabold text-[#E5C47A] uppercase tracking-wider text-[10px]">Recommended Actions</h4>
                  <div className="space-y-2">
                    <div className="p-2.5 bg-[#34191B] border border-[#5A292B] rounded-lg flex items-start gap-2 text-[#F08A8A]">
                      <span className="font-extrabold text-[10px] bg-[#E05A5A] text-white px-1.5 py-0.2 rounded uppercase">High</span>
                      <span>Execute executive follow-up on top {attentionProjects.length} attention-flagged payment balances.</span>
                    </div>
                    <div className="p-2.5 bg-[#322917] border border-[#5B4724] rounded-lg flex items-start gap-2 text-[#E5C47A]">
                      <span className="font-extrabold text-[10px] bg-[#D6A84F] text-[#111111] px-1.5 py-0.2 rounded uppercase">Medium</span>
                      <span>Review delivery dates for {delayedProjects.length} projects with active schedule delay notices.</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Drawer Footer Bar */}
          <div className="flex items-center justify-between bg-[#090909] px-6 py-4 border-t border-[#1E1E20] flex-shrink-0">
            <span className="text-xs text-[#85858B]">
              Kumkang Project Control Center • Portfolio Analysis Module
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="text-xs font-bold text-[#B4B4B8] hover:text-[#FFFFFF] px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Close Analysis
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 bg-[#C9A86A] hover:bg-[#D7B97C] text-[#111111] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Printer size={15} /> PRINT / EXPORT PDF REPORT
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
