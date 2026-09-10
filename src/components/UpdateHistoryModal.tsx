import { useState } from 'react';
import { useData } from '../context/DataContext';
import {
  History, X, RotateCcw, Trash2, FileSpreadsheet,
  Edit3, Calendar, User, ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react';

interface UpdateHistoryModalProps {
  onClose: () => void;
}

export function UpdateHistoryModal({ onClose }: UpdateHistoryModalProps) {
  const { auditLogs, resetToInitialData, clearAuditLogs } = useData();
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleReset = () => {
    resetToInitialData();
    setShowConfirmReset(false);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 lg:p-6 z-50 overflow-y-auto">
      <div className="bg-[#151517] border border-[#303035] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-[#090909] text-white px-6 py-4 rounded-t-2xl border-b border-[#202023]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#2A2419] text-[#C9A86A] border border-[#55462C] rounded-xl">
              <History size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide text-[#FFFFFF]">DATA UPDATE & SYNCHRONIZATION HISTORY</h3>
              <p className="text-xs text-[#85858B] font-medium">
                Audit log of all manual edits and Excel import operations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#85858B] hover:text-white hover:bg-[#1B1B1F] transition-colors cursor-pointer"
            aria-label="Close history modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Top Bar */}
        <div className="bg-[#111113] border-b border-[#262629] px-6 py-3 flex items-center justify-between text-xs">
          <span className="font-bold text-[#F5F5F3]">
            {auditLogs.length} Logged Action{auditLogs.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-3">
            {auditLogs.length > 0 && (
              <button
                onClick={clearAuditLogs}
                className="text-[#85858B] hover:text-[#F08A8A] font-semibold flex items-center gap-1 transition-colors"
              >
                <Trash2 size={13} /> Clear History
              </button>
            )}
            <button
              onClick={() => setShowConfirmReset(true)}
              className="text-[#E5C47A] hover:text-[#FFFFFF] bg-[#322917] hover:bg-[#2A2419] px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors border border-[#5B4724]"
            >
              <RotateCcw size={13} /> Reset Data to Original Baseline
            </button>
          </div>
        </div>

        {/* Reset Confirmation Banner */}
        {showConfirmReset && (
          <div className="p-4 bg-[#322917] border-b border-[#5B4724] text-[#E5C47A] text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-[#D6A84F]" />
              <span>Are you sure? This will revert all manual and Excel updates back to the original Excel baseline dataset.</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowConfirmReset(false)} className="px-3 py-1 bg-[#18181B] border border-[#303035] text-[#D5D5D8] rounded font-bold">
                Cancel
              </button>
              <button onClick={handleReset} className="px-3 py-1 bg-[#5B4724] text-[#E5C47A] rounded font-bold hover:bg-[#322917]">
                Confirm Reset
              </button>
            </div>
          </div>
        )}

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[#0A0A0A]">
          {auditLogs.length === 0 ? (
            <div className="text-center py-12 text-[#65656B] text-xs font-medium space-y-2">
              <History size={32} className="mx-auto text-[#4D4D52]" />
              <p>No data updates logged yet.</p>
              <p className="text-[11px] text-[#65656B]">Manual project edits and Excel imports will be logged here for administrative auditing.</p>
            </div>
          ) : (
            auditLogs.map(log => {
              const isExpanded = expandedLogId === log.id;
              const isExcel = log.method === 'Excel Import';
              return (
                <div key={log.id} className="bg-[#151517] border border-[#262629] rounded-xl overflow-hidden shadow-2xs">
                  <div
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#1B1B1F] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isExcel ? 'bg-[#17272E] text-[#89C9DF] border border-[#294651]' : 'bg-[#163127] text-[#70D0A8] border border-[#28523F]'}`}>
                        {isExcel ? <FileSpreadsheet size={16} /> : <Edit3 size={16} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${isExcel ? 'bg-[#17272E] text-[#89C9DF]' : 'bg-[#163127] text-[#70D0A8]'}`}>
                            {log.method}
                          </span>
                          <span className="font-bold text-xs text-[#F5F5F3]">{log.summary}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[#85858B] mt-1 font-medium">
                          <span className="flex items-center gap-1"><Calendar size={11} /> {log.timestamp}</span>
                          <span className="flex items-center gap-1"><User size={11} /> {log.user}</span>
                        </div>
                      </div>
                    </div>

                    {log.changes && log.changes.length > 0 && (
                      <button className="text-[#85858B] hover:text-[#FFFFFF]">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    )}
                  </div>

                  {/* Expanded Field Changes */}
                  {isExpanded && log.changes && log.changes.length > 0 && (
                    <div className="border-t border-[#202023] bg-[#111113] p-3 text-xs">
                      <p className="font-bold text-[#B4B4B8] text-[10px] uppercase tracking-wider mb-2">Detailed Field Diffs:</p>
                      <div className="space-y-1 font-mono text-[11px]">
                        {log.changes.map((ch, i) => (
                          <div key={i} className="flex items-center gap-2 bg-[#151517] p-2 rounded border border-[#262629]">
                            <span className="font-bold text-[#C9A86A] w-32 truncate">{ch.field}:</span>
                            <span className="text-[#F08A8A] line-through">{String(ch.oldValue)}</span>
                            <span className="text-[#65656B]">→</span>
                            <span className="text-[#70D0A8] font-bold">{String(ch.newValue)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end bg-[#090909] px-6 py-4 rounded-b-2xl border-t border-[#202023]">
          <button
            onClick={onClose}
            className="btn-primary px-6 py-2.5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
