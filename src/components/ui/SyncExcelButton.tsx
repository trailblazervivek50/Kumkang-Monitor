import { useState } from 'react';
import { FileSpreadsheet, RefreshCw, CheckCircle2 } from 'lucide-react';
import { ExcelImportModal } from '../ExcelImportModal';

interface SyncExcelButtonProps {
  variant?: 'primary' | 'secondary' | 'sidebar';
  className?: string;
  label?: string;
}

export function SyncExcelButton({ variant = 'primary', className = '', label = 'Sync Excel Data' }: SyncExcelButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'synced'>('idle');

  const handleSyncSuccess = () => {
    setSyncState('synced');
    setTimeout(() => {
      setSyncState('idle');
    }, 1800);
  };

  const buttonStyle = variant === 'sidebar'
    ? "w-full py-1.5 px-3 bg-[#C9A86A] hover:bg-[#D7B97C] text-[#111111] text-xs font-bold rounded-lg transition-all duration-150 ease-out active:scale-[0.98] hover:-translate-y-[1px] hover:shadow-md cursor-pointer text-center flex items-center justify-center gap-1.5 group select-none disabled:opacity-50"
    : variant === 'secondary'
    ? "flex items-center gap-1.5 text-xs font-extrabold text-[#D5D5D8] bg-[#18181B] border border-[#303035] hover:bg-[#222226] hover:border-[#46464D] px-3 py-1.5 rounded-lg transition-all duration-150 ease-out active:scale-[0.98] hover:-translate-y-[1px] hover:shadow-2xs cursor-pointer select-none group disabled:opacity-50"
    : "flex items-center gap-2 text-xs font-extrabold text-[#111111] bg-[#C9A86A] hover:bg-[#D7B97C] border border-[#B89355] rounded-lg px-4 py-2.5 shadow-2xs hover:shadow-md transition-all duration-150 ease-out active:scale-[0.98] hover:-translate-y-[1px] cursor-pointer flex-shrink-0 select-none group disabled:opacity-50";

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={syncState === 'syncing'}
        className={`${buttonStyle} ${className}`}
        title="Upload Excel workbook to synchronize data"
        aria-label={label}
      >
        {syncState === 'syncing' ? (
          <>
            <RefreshCw size={14} className="animate-spin text-white flex-shrink-0" />
            <span>Syncing...</span>
          </>
        ) : syncState === 'synced' ? (
          <>
            <CheckCircle2 size={15} className="text-emerald-300 animate-in zoom-in-75 duration-200 flex-shrink-0" />
            <span className="font-extrabold text-emerald-100">Synced</span>
          </>
        ) : (
          <>
            <FileSpreadsheet size={15} className="btn-icon-excel flex-shrink-0" />
            <span>{label}</span>
          </>
        )}
      </button>

      {isModalOpen && (
        <ExcelImportModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSyncSuccess}
        />
      )}
    </>
  );
}
