import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { parseAndPreviewExcel, type ExcelParseResult } from '../utils/excelParser';
import {
  FileSpreadsheet, Upload, CheckCircle2, AlertTriangle, X,
  RefreshCw, Filter
} from 'lucide-react';

interface ExcelImportModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function ExcelImportModal({ onClose, onSuccess }: ExcelImportModalProps) {
  const { projects, commitExcelImport } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ExcelParseResult | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'updated' | 'new' | 'errors'>('all');
  const [filterSearch, setFilterSearch] = useState('');
  const [commitResult, setCommitResult] = useState<{ updated: number; newCount: number } | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setErrorMsg('Please upload a valid Excel file (.xlsx or .xls).');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const result = await parseAndPreviewExcel(file, projects);
      setParseResult(result);
      setStep('preview');
    } catch (err: any) {
      console.error('Error parsing Excel:', err);
      setErrorMsg(err.message || 'Failed to parse Excel workbook. Please check file format.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCommit = () => {
    if (!parseResult) return;

    setLoading(true);
    try {
      const res = commitExcelImport(
        parseResult.updatedProjectsMap,
        parseResult.newProjects,
        { filename: parseResult.fileName, recordCount: parseResult.totalRowsProcessed },
        'Administrator'
      );

      setCommitResult({ updated: res.updatedCount, newCount: res.newCount });
      setStep('result');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Commit failed:', err);
      setErrorMsg('Failed to commit updates: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredDiffs = parseResult?.diffItems.filter(item => {
    const matchesSearch =
      item.projectId.toLowerCase().includes(filterSearch.toLowerCase()) ||
      item.projectName.toLowerCase().includes(filterSearch.toLowerCase()) ||
      item.fieldLabel.toLowerCase().includes(filterSearch.toLowerCase());

    if (activeTab === 'updated') return matchesSearch && item.status === 'Updated';
    if (activeTab === 'new') return matchesSearch && item.status === 'New';
    return matchesSearch;
  }) || [];

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 lg:p-6 z-50 overflow-y-auto">
      <div className="bg-[#151517] border border-[#303035] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 text-[#F5F5F3]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between bg-[#090909] text-white px-6 py-4 rounded-t-2xl border-b border-[#1E1E20]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#C9A86A]/10 text-[#C9A86A] rounded-xl border border-[#C9A86A]/20">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide text-[#FFFFFF]">EXCEL DATA UPDATE & SYNCHRONIZATION</h3>
              <p className="text-xs text-[#85858B] font-medium">
                Import updated Excel workbook to synchronize canonical project data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#85858B] hover:text-white hover:bg-[#18181B] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0A0A0A]">

          {/* Excel Synchronization Journey Stepper */}
          <div className="bg-[#151517] border border-[#262629] rounded-xl p-3 shadow-2xs">
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
              <div className={`py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${step === 'upload' ? 'bg-[#C9A86A] text-[#111111] shadow-2xs font-extrabold' : 'bg-[#111113] text-[#85858B]'}`}>
                <span className="w-4 h-4 rounded-full bg-black/20 text-[10px] flex items-center justify-center font-mono">1</span>
                <span>UPLOAD</span>
              </div>
              <div className={`py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${step === 'preview' ? 'bg-[#C9A86A] text-[#111111] shadow-2xs font-extrabold' : 'bg-[#111113] text-[#85858B]'}`}>
                <span className="w-4 h-4 rounded-full bg-black/20 text-[10px] flex items-center justify-center font-mono">2</span>
                <span>PREVIEW</span>
              </div>
              <div className={`py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${loading && step === 'preview' ? 'bg-[#D6A84F] text-[#111111] shadow-2xs animate-pulse font-extrabold' : 'bg-[#111113] text-[#85858B]'}`}>
                <span className="w-4 h-4 rounded-full bg-black/20 text-[10px] flex items-center justify-center font-mono">3</span>
                <span>RECALCULATE</span>
              </div>
              <div className={`py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${step === 'result' ? 'bg-[#3FB984] text-[#111111] shadow-2xs font-extrabold' : 'bg-[#111113] text-[#85858B]'}`}>
                <span className="w-4 h-4 rounded-full bg-black/20 text-[10px] flex items-center justify-center font-mono">4</span>
                <span>SYNCED</span>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 bg-[#34191B] border border-[#5A292B] rounded-xl flex items-start gap-3 text-[#F08A8A] text-xs font-semibold">
              <AlertTriangle size={16} className="text-[#E05A5A] flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">{errorMsg}</div>
            </div>
          )}

          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-[#151517] border border-[#262629] rounded-2xl p-6 lg:p-8 text-center space-y-4 shadow-sm">
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#303035] hover:border-[#C9A86A] bg-[#111113] hover:bg-[#18181B] p-8 lg:p-12 rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#2A2419] text-[#C9A86A] border border-[#55462C] flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                    <Upload size={28} />
                  </div>
                  <div>
                    <p className="font-extrabold text-[#FFFFFF] text-base">
                      Click to upload or drag & drop Excel workbook
                    </p>
                    <p className="text-xs text-[#85858B] font-medium mt-1">
                      Supports <span className="font-mono text-[#F5F5F3] font-bold">.xlsx</span> and <span className="font-mono text-[#F5F5F3] font-bold">.xls</span> files (e.g. <em>260908 KKI PROJECT FOLLOW UP.xlsx</em>)
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {loading && (
                  <div className="flex items-center justify-center gap-2 text-xs font-extrabold text-[#C9A86A]">
                    <RefreshCw size={14} className="animate-spin" />
                    Parsing workbook sheets and validating schema...
                  </div>
                )}
              </div>

              <div className="bg-[#111113] border border-[#262629] rounded-xl p-4 text-xs text-[#B4B4B8] space-y-1">
                <h4 className="font-extrabold text-[#FFFFFF] uppercase tracking-wider text-[10px]">Import Pipeline Process</h4>
                <p>1. <strong>Validation</strong>: Validates headers, data types, numbers, and dates before applying any change.</p>
                <p>2. <strong>Preview</strong>: Displays a field-by-field diff comparison table for administrative review.</p>
                <p>3. <strong>Canonical Update</strong>: Updates existing projects by Project ID and registers new projects without duplicates.</p>
              </div>
            </motion.div>
          )}

          {/* STEP 2: CHANGE PREVIEW */}
          {step === 'preview' && parseResult && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >

              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-[#151517] border border-[#262629] rounded-xl p-3.5 shadow-2xs">
                  <p className="text-[10px] font-bold text-[#85858B] uppercase tracking-wider">Processed</p>
                  <p className="text-2xl font-extrabold text-[#FFFFFF]">{parseResult.totalRowsProcessed}</p>
                  <p className="text-[10px] text-[#85858B] font-medium">Rows detected</p>
                </div>
                <div className="bg-[#172531] border border-[#2B455A] rounded-xl p-3.5 shadow-2xs">
                  <p className="text-[10px] font-bold text-[#9BC5E8] uppercase tracking-wider">Updates</p>
                  <p className="text-2xl font-extrabold text-[#6EA8D9]">{parseResult.updatedCount}</p>
                  <p className="text-[10px] text-[#9BC5E8] font-medium">Modified projects</p>
                </div>
                <div className="bg-[#163127] border border-[#28523F] rounded-xl p-3.5 shadow-2xs">
                  <p className="text-[10px] font-bold text-[#70D0A8] uppercase tracking-wider">New</p>
                  <p className="text-2xl font-extrabold text-[#3FB984]">{parseResult.newCount}</p>
                  <p className="text-[10px] text-[#70D0A8] font-medium">New records</p>
                </div>
                <div className="bg-[#151517] border border-[#262629] rounded-xl p-3.5 shadow-2xs">
                  <p className="text-[10px] font-bold text-[#85858B] uppercase tracking-wider">Unchanged</p>
                  <p className="text-2xl font-extrabold text-[#B4B4B8]">{parseResult.unchangedCount}</p>
                  <p className="text-[10px] text-[#85858B] font-medium">Identical records</p>
                </div>
                <div className={`border rounded-xl p-3.5 shadow-2xs ${parseResult.errorCount > 0 ? 'bg-[#322917] border-[#5B4724]' : 'bg-[#151517] border-[#262629]'}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${parseResult.errorCount > 0 ? 'text-[#E5C47A]' : 'text-[#85858B]'}`}>Errors</p>
                  <p className={`text-2xl font-extrabold ${parseResult.errorCount > 0 ? 'text-[#D6A84F]' : 'text-[#85858B]'}`}>{parseResult.errorCount}</p>
                  <p className={`text-[10px] font-medium ${parseResult.errorCount > 0 ? 'text-[#E5C47A]' : 'text-[#85858B]'}`}>Invalid rows</p>
                </div>
              </div>

              {/* Sheet & Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#151517] border border-[#262629] rounded-xl p-3 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#85858B]">Active Sheet:</span>
                  <span className="text-xs font-mono font-bold bg-[#2A2419] text-[#E8D6AE] border border-[#55462C] px-2.5 py-1 rounded-md">
                    {parseResult.selectedSheet}
                  </span>
                  <span className="text-xs text-[#85858B]">({parseResult.fileName})</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${activeTab === 'all' ? 'bg-[#C9A86A] text-[#111111]' : 'bg-[#18181B] text-[#B4B4B8] hover:bg-[#222226]'}`}
                  >
                    All Changes ({parseResult.diffItems.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('updated')}
                    className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${activeTab === 'updated' ? 'bg-[#6EA8D9] text-[#111111]' : 'bg-[#172531] text-[#9BC5E8] hover:bg-[#2B455A]'}`}
                  >
                    Updated ({parseResult.diffItems.filter(i => i.status === 'Updated').length})
                  </button>
                  <button
                    onClick={() => setActiveTab('new')}
                    className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${activeTab === 'new' ? 'bg-[#3FB984] text-[#111111]' : 'bg-[#163127] text-[#70D0A8] hover:bg-[#28523F]'}`}
                  >
                    New ({parseResult.newCount})
                  </button>
                  {parseResult.errorCount > 0 && (
                    <button
                      onClick={() => setActiveTab('errors')}
                      className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${activeTab === 'errors' ? 'bg-[#D6A84F] text-[#111111]' : 'bg-[#322917] text-[#E5C47A] hover:bg-[#5B4724]'}`}
                    >
                      Errors ({parseResult.errorCount})
                    </button>
                  )}
                </div>
              </div>

              {/* Diffs Table or Errors List */}
              {activeTab === 'errors' ? (
                <div className="bg-[#151517] border border-[#262629] rounded-xl overflow-hidden shadow-2xs">
                  <div className="p-4 bg-[#322917] border-b border-[#5B4724] font-extrabold text-xs text-[#E5C47A]">
                    Invalid Rows Excluded From Import ({parseResult.invalidRows.length})
                  </div>
                  <div className="divide-y divide-[#262629] max-h-60 overflow-y-auto text-xs">
                    {parseResult.invalidRows.map((inv, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between">
                        <span className="font-mono font-bold text-[#F5F5F3]">Row {inv.rowNumber}</span>
                        <span className="text-[#E5C47A] font-medium">{inv.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-[#151517] border border-[#262629] rounded-xl overflow-hidden shadow-2xs">
                  <div className="p-3 border-b border-[#262629] flex items-center gap-2">
                    <Filter size={14} className="text-[#85858B]" />
                    <input
                      type="text"
                      placeholder="Search preview by Project ID, Client or Field..."
                      value={filterSearch}
                      onChange={e => setFilterSearch(e.target.value)}
                      className="text-xs w-full max-w-sm border border-[#303035] rounded-lg px-3 py-1.5 bg-[#111113] text-[#F5F5F3] placeholder-[#66666C] focus:outline-none focus:border-[#C9A86A]"
                    />
                  </div>

                  {filteredDiffs.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#85858B] font-medium">
                      No matching record differences found. The uploaded Excel workbook data matches current project data.
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-72">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#111113] text-[#85858B] font-bold border-b border-[#262629] uppercase">
                            <th className="p-2.5">Project ID</th>
                            <th className="p-2.5">Project Name</th>
                            <th className="p-2.5">Field Changed</th>
                            <th className="p-2.5">Current Value</th>
                            <th className="p-2.5">New Excel Value</th>
                            <th className="p-2.5">Type</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#262629]">
                          {filteredDiffs.map((diff, i) => (
                            <tr key={i} className="hover:bg-[#1B1B1F]">
                              <td className="p-2.5 font-mono font-bold text-[#C9A86A]">{diff.projectId}</td>
                              <td className="p-2.5 font-semibold text-[#F5F5F3]">{diff.projectName}</td>
                              <td className="p-2.5 font-medium text-[#9BC5E8]">{diff.fieldLabel}</td>
                              <td className="p-2.5 text-[#F08A8A] line-through bg-[#34191B] px-2 py-1 rounded">{String(diff.existingValue)}</td>
                              <td className="p-2.5 font-bold text-[#70D0A8] bg-[#163127] px-2 py-1 rounded">{String(diff.newValue)}</td>
                              <td className="p-2.5">
                                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${diff.status === 'New' ? 'bg-[#163127] text-[#70D0A8]' : 'bg-[#172531] text-[#9BC5E8]'}`}>
                                  {diff.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Administrative Notice */}
              <div className="bg-[#322917] border border-[#5B4724] rounded-xl p-4 flex items-start gap-3 text-xs text-[#E5C47A]">
                <AlertTriangle size={16} className="text-[#D6A84F] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold">Confirmation Required</h4>
                  <p className="mt-0.5 leading-relaxed">
                    Clicking <strong>"Confirm & Commit Import"</strong> will update the canonical project dataset and immediately recalculate dependent metrics across all dashboards and reports.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: RESULT */}
          {step === 'result' && commitResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="space-y-6 text-center py-6"
            >
              <div className="w-16 h-16 bg-[#163127] border border-[#28523F] text-[#70D0A8] rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-extrabold text-[#FFFFFF]">Excel Import Completed</h3>
                <p className="text-sm text-[#85858B] font-medium max-w-md mx-auto">
                  Canonical project data updated and derived KPIs recalculated in real time.
                </p>
              </div>

              <div className="grid grid-cols-2 max-w-sm mx-auto gap-4 bg-[#151517] border border-[#262629] rounded-2xl p-4 shadow-2xs">
                <div className="p-3 bg-[#172531] border border-[#2B455A] rounded-xl">
                  <p className="text-[10px] font-bold uppercase text-[#9BC5E8]">Updated</p>
                  <p className="text-2xl font-extrabold text-[#6EA8D9]">{commitResult.updated}</p>
                </div>
                <div className="p-3 bg-[#163127] border border-[#28523F] rounded-xl">
                  <p className="text-[10px] font-bold uppercase text-[#70D0A8]">New Projects</p>
                  <p className="text-2xl font-extrabold text-[#3FB984]">{commitResult.newCount}</p>
                </div>
              </div>
            </motion.div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between bg-[#090909] px-6 py-4 rounded-b-2xl border-t border-[#1E1E20]">
          {step === 'preview' ? (
            <>
              <button
                onClick={() => setStep('upload')}
                className="text-xs font-bold text-[#B4B4B8] hover:text-white px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Back to Upload
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="text-xs font-bold text-[#B4B4B8] hover:text-white px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCommit}
                  disabled={loading}
                  className="flex items-center gap-2 bg-[#C9A86A] hover:bg-[#D7B97C] text-[#111111] font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  CONFIRM & COMMIT IMPORT
                </button>
              </div>
            </>
          ) : step === 'result' ? (
            <button
              onClick={onClose}
              className="ml-auto flex items-center gap-2 bg-[#C9A86A] hover:bg-[#D7B97C] text-[#111111] font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              Close & View Dashboard
            </button>
          ) : (
            <button
              onClick={onClose}
              className="ml-auto text-xs font-bold text-[#B4B4B8] hover:text-white px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
