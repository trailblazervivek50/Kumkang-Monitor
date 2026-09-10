import { useState } from 'react';
import { useData } from '../context/DataContext';
import { validateProjectMaster, type ValidationError } from '../utils/dataValidation';
import type { ProjectMaster } from '../data/projectData';
import {
  Building2, Save, X, AlertTriangle, CheckCircle2, RefreshCw,
  DollarSign, Calendar, Layers, ShieldAlert
} from 'lucide-react';

interface EditProjectModalProps {
  projectId: string | null; // null means create new project
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditProjectModal({ projectId, onClose, onSuccess }: EditProjectModalProps) {
  const { getProjectById, updateProjectManual, addProjectManual } = useData();

  const isNew = !projectId;
  const existing = projectId ? getProjectById(projectId) : undefined;

  const [formData, setFormData] = useState<Partial<ProjectMaster>>({
    projectId: existing?.projectId || '',
    country: existing?.country || 'India',
    customer: existing?.customer || '',
    project: existing?.project || '',
    block: existing?.block || '',
    contractDate: existing?.contractDate || '',
    contractStatus: existing?.contractStatus || 'Signed',
    contractQtyM2: existing?.contractQtyM2 ?? null,
    contractWeightTons: existing?.contractWeightTons ?? null,
    actualDesignQtyM2: existing?.actualDesignQtyM2 ?? null,
    actualDesignWeightTons: existing?.actualDesignWeightTons ?? null,
    designProgressPercent: existing?.designProgressPercent ?? null,
    pricePerM2USD: existing?.pricePerM2USD ?? null,
    totalAmountUSD: existing?.totalAmountUSD ?? null,
    advanceUSD: existing?.advanceUSD ?? null,
    balanceUSD: existing?.balanceUSD ?? null,
    shellPlanConfirmation: existing?.shellPlanConfirmation || '',
    mdCompletion: existing?.mdCompletion || '',
    productionStart: existing?.productionStart || '',
    productionComplete: existing?.productionComplete || '',
    deliveryRequest: existing?.deliveryRequest || '',
    loadingDate: existing?.loadingDate || '',
    etd: existing?.etd || '',
    eta: existing?.eta || '',
    fwd: existing?.fwd || '',
    paymentTerm: existing?.paymentTerm || '',
    paymentStatus: existing?.paymentStatus || '',
    incoterm: existing?.incoterm || '',
    remark: existing?.remark || '',
  });

  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleChange = (field: keyof ProjectMaster, value: any) => {
    setIsDirty(true);
    setSubmitError(null);
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      
      // Auto recalculate balance if total or advance changes
      if (field === 'totalAmountUSD' || field === 'advanceUSD') {
        const tot = field === 'totalAmountUSD' ? value : next.totalAmountUSD;
        const adv = field === 'advanceUSD' ? value : next.advanceUSD;
        if (tot !== null && tot !== undefined && tot !== '') {
          const tNum = typeof tot === 'number' ? tot : parseFloat(tot);
          const aNum = adv ? (typeof adv === 'number' ? adv : parseFloat(adv)) : 0;
          if (!isNaN(tNum)) {
            next.balanceUSD = Math.max(0, Math.round((tNum - (isNaN(aNum) ? 0 : aNum)) * 100) / 100);
          }
        }
      }
      return next;
    });
  };

  const handleCloseAttempt = () => {
    if (isDirty) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate
    const valResult = validateProjectMaster(formData);
    if (!valResult.isValid) {
      setValidationErrors(valResult.errors);
      return;
    }
    setValidationErrors([]);
    setSaveState('saving');

    setTimeout(() => {
      if (isNew) {
        const result = addProjectManual(formData as ProjectMaster, 'Administrator');
        if (!result.success) {
          setSubmitError(result.errors?.join('; ') || 'Failed to add project.');
          setSaveState('idle');
          return;
        }
      } else {
        const result = updateProjectManual(projectId!, formData, 'Administrator');
        if (!result.success) {
          setSubmitError(result.errors?.join('; ') || 'Failed to update project.');
          setSaveState('idle');
          return;
        }
      }

      setSaveState('saved');
      setToastMessage(isNew ? '✓ Project created successfully' : '✓ Project updated successfully');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    }, 400);
  };

  const calculatedBalance = Math.max(0, ((formData.totalAmountUSD || 0) - (formData.advanceUSD || 0)));

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 lg:p-6 z-50 overflow-y-auto">
      <div className="bg-[#151517] border border-[#303035] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-[#090909] text-white px-6 py-4 rounded-t-2xl border-b border-[#202023]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#2A2419] text-[#C9A86A] rounded-xl border border-[#55462C]">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide text-[#FFFFFF]">
                {isNew ? 'ADD NEW PROJECT' : `UPDATE PROJECT DATA — ${formData.projectId}`}
              </h3>
              <p className="text-xs text-[#85858B] font-medium">
                {isNew ? 'Register a new project into canonical dataset' : `Modifying project parameters for ${formData.project || formData.projectId}`}
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseAttempt}
            className="p-1.5 rounded-lg text-[#85858B] hover:text-white hover:bg-[#1B1B1F] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success Toast Banner */}
        {toastMessage && (
          <div className="bg-[#163127] border-b border-[#28523F] text-[#70D0A8] text-xs font-extrabold p-3 text-center animate-in fade-in">
            {toastMessage}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0A0A0A] text-[#F5F5F3] text-xs">

          {/* Validation / Submit Errors */}
          {(validationErrors.length > 0 || submitError) && (
            <div className="p-4 bg-[#34191B] border border-[#5A292B] rounded-xl space-y-1 text-[#F08A8A] text-xs font-semibold">
              <div className="flex items-center gap-2 text-[#F08A8A] font-bold">
                <AlertTriangle size={15} /> Please resolve the following errors:
              </div>
              {submitError && <p>• {submitError}</p>}
              {validationErrors.map((err, i) => (
                <p key={i}>• <strong>{err.field}:</strong> {err.message}</p>
              ))}
            </div>
          )}

          {/* SECTION 1: PROJECT IDENTITY */}
          <div className="bg-[#111113] border border-[#262629] rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#202023] pb-2">
              <Building2 size={16} className="text-[#C9A86A]" />
              <h4 className="font-extrabold text-sm text-[#FFFFFF] uppercase tracking-wider">
                1. Project Identity & Location
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#B4B4B8] mb-1">
                  Project ID <span className="text-[#E05A5A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!isNew}
                  value={formData.projectId || ''}
                  onChange={e => handleChange('projectId', e.target.value)}
                  placeholder="e.g. IND-025"
                  className="w-full p-2.5 border border-[#303035] rounded-lg font-mono font-bold bg-[#151517] text-[#F5F5F3] focus:ring-2 focus:ring-[#C9A86A] disabled:bg-[#18181B] disabled:text-[#65656B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#B4B4B8] mb-1">
                  Country <span className="text-[#E05A5A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.country || ''}
                  onChange={e => handleChange('country', e.target.value)}
                  placeholder="e.g. India"
                  className="w-full p-2.5 border border-[#303035] rounded-lg bg-[#151517] text-[#F5F5F3] focus:ring-2 focus:ring-[#C9A86A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#B4B4B8] mb-1">
                  Customer / Client <span className="text-[#E05A5A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.customer || ''}
                  onChange={e => handleChange('customer', e.target.value)}
                  placeholder="e.g. TOTAL ENVIRONMENT"
                  className="w-full p-2.5 border border-[#303035] rounded-lg bg-[#151517] text-[#F5F5F3] focus:ring-2 focus:ring-[#C9A86A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#B4B4B8] mb-1">
                  Project Name <span className="text-[#E05A5A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.project || ''}
                  onChange={e => handleChange('project', e.target.value)}
                  placeholder="e.g. DBTW"
                  className="w-full p-2.5 border border-[#303035] rounded-lg bg-[#151517] text-[#F5F5F3] focus:ring-2 focus:ring-[#C9A86A] font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#B4B4B8] mb-1">Block / Tower</label>
                <input
                  type="text"
                  value={formData.block || ''}
                  onChange={e => handleChange('block', e.target.value)}
                  placeholder="e.g. T1_Typical"
                  className="w-full p-2.5 border border-[#303035] rounded-lg bg-[#151517] text-[#F5F5F3] focus:ring-2 focus:ring-[#C9A86A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#B4B4B8] mb-1">Contract Status</label>
                <select
                  value={formData.contractStatus || 'Signed'}
                  onChange={e => handleChange('contractStatus', e.target.value)}
                  className="w-full p-2.5 border border-[#303035] rounded-lg bg-[#151517] text-[#F5F5F3] font-bold focus:ring-2 focus:ring-[#C9A86A]"
                >
                  <option value="Signed">Signed</option>
                  <option value="Not Signed">Not Signed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: PROGRESS & TECHNICAL QUANTITIES */}
          <div className="bg-[#111113] border border-[#262629] rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#202023] pb-2">
              <Layers size={16} className="text-[#BBA8E8]" />
              <h4 className="font-extrabold text-sm text-[#FFFFFF] uppercase tracking-wider">
                2. Technical Scope, Quantities & Progress
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#B4B4B8] mb-1">Contract Qty (m²)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.contractQtyM2 ?? ''}
                  onChange={e => handleChange('contractQtyM2', e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full p-2.5 border border-[#303035] rounded-lg bg-[#151517] text-[#F5F5F3] focus:ring-2 focus:ring-[#C9A86A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#B4B4B8] mb-1">Contract Weight (Tons)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.contractWeightTons ?? ''}
                  onChange={e => handleChange('contractWeightTons', e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full p-2.5 border border-[#303035] rounded-lg bg-[#151517] text-[#F5F5F3] focus:ring-2 focus:ring-[#C9A86A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#B4B4B8] mb-1">Design Progress (%)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  max="100"
                  value={formData.designProgressPercent ?? ''}
                  onChange={e => handleChange('designProgressPercent', e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full p-2.5 border border-[#303035] rounded-lg bg-[#151517] text-[#BBA8E8] font-bold focus:ring-2 focus:ring-[#C9A86A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#B4B4B8] mb-1">Actual Design Qty (m²)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.actualDesignQtyM2 ?? ''}
                  onChange={e => handleChange('actualDesignQtyM2', e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full p-2.5 border border-[#303035] rounded-lg bg-[#151517] text-[#F5F5F3] focus:ring-2 focus:ring-[#C9A86A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#B4B4B8] mb-1">Actual Design Weight (Tons)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.actualDesignWeightTons ?? ''}
                  onChange={e => handleChange('actualDesignWeightTons', e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full p-2.5 border border-[#303035] rounded-lg bg-[#151517] text-[#F5F5F3] focus:ring-2 focus:ring-[#C9A86A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#B4B4B8] mb-1">Price per m² (USD)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.pricePerM2USD ?? ''}
                  onChange={e => handleChange('pricePerM2USD', e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full p-2.5 border border-[#303035] rounded-lg bg-[#151517] text-[#F5F5F3] focus:ring-2 focus:ring-[#C9A86A]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: COMMERCIAL & FINANCIAL VALUES */}
          <div className="bg-[#111113] border border-[#262629] rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#202023] pb-2">
              <DollarSign size={16} className="text-[#70D0A8]" />
              <h4 className="font-extrabold text-sm text-[#FFFFFF] uppercase tracking-wider">
                3. Commercial & Financial Values
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#B4B4B8] mb-1">Total Contract Amount (USD)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.totalAmountUSD ?? ''}
                  onChange={e => handleChange('totalAmountUSD', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="0.00"
                  className="w-full p-2.5 border border-[#303035] rounded-lg bg-[#151517] text-[#F5F5F3] font-bold focus:ring-2 focus:ring-[#C9A86A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#B4B4B8] mb-1">Advance Collected (USD)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.advanceUSD ?? ''}
                  onChange={e => handleChange('advanceUSD', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="0.00"
                  className="w-full p-2.5 border border-[#303035] rounded-lg bg-[#151517] text-[#70D0A8] font-bold focus:ring-2 focus:ring-[#C9A86A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#B4B4B8] mb-1">
                  Derived Balance Due (USD) <span className="text-[#85858B]">(Calculated)</span>
                </label>
                <div className="w-full p-2.5 border border-[#303035] rounded-lg bg-[#18181B] font-extrabold text-[#E5C47A]">
                  ${calculatedBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-[#B4B4B8] mb-1">Payment Terms</label>
                <input
                  type="text"
                  value={formData.paymentTerm || ''}
                  onChange={e => handleChange('paymentTerm', e.target.value)}
                  placeholder="e.g. Advance 20% Done, 80% before dispatch"
                  className="w-full p-2.5 border border-[#303035] rounded-lg bg-[#151517] text-[#F5F5F3] focus:ring-2 focus:ring-[#C9A86A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#B4B4B8] mb-1">Payment Status</label>
                <input
                  type="text"
                  value={formData.paymentStatus || ''}
                  onChange={e => handleChange('paymentStatus', e.target.value)}
                  placeholder="e.g. Received 100% payment"
                  className="w-full p-2.5 border border-[#303035] rounded-lg bg-[#151517] text-[#F5F5F3] focus:ring-2 focus:ring-[#C9A86A]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: KEY DATES & SCHEDULES */}
          <div className="bg-[#111113] border border-[#262629] rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#202023] pb-2">
              <Calendar size={16} className="text-[#C9A86A]" />
              <h4 className="font-extrabold text-sm text-[#FFFFFF] uppercase tracking-wider">
                4. Schedule & Milestone Dates
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#B4B4B8] mb-1">Contract Date</label>
                <input
                  type="text"
                  value={formData.contractDate || ''}
                  onChange={e => handleChange('contractDate', e.target.value)}
                  placeholder="DD-MM-YYYY"
                  className="w-full p-2.5 border border-[#303035] rounded-lg bg-[#151517] text-[#F5F5F3]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#B4B4B8] mb-1">Shell Plan Confirm</label>
                <input
                  type="text"
                  value={formData.shellPlanConfirmation || ''}
                  onChange={e => handleChange('shellPlanConfirmation', e.target.value)}
                  placeholder="Done / Date"
                  className="w-full p-2.5 border border-[#303035] rounded-lg bg-[#151517] text-[#F5F5F3]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#B4B4B8] mb-1">MD Completion</label>
                <input
                  type="text"
                  value={formData.mdCompletion || ''}
                  onChange={e => handleChange('mdCompletion', e.target.value)}
                  placeholder="Done / Date"
                  className="w-full p-2.5 border border-[#303035] rounded-lg bg-[#151517] text-[#F5F5F3]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#B4B4B8] mb-1">Production Start</label>
                <input
                  type="text"
                  value={formData.productionStart || ''}
                  onChange={e => handleChange('productionStart', e.target.value)}
                  placeholder="Done / Date"
                  className="w-full p-2.5 border border-[#303035] rounded-lg bg-[#151517] text-[#F5F5F3]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#B4B4B8] mb-1">Production Complete</label>
                <input
                  type="text"
                  value={formData.productionComplete || ''}
                  onChange={e => handleChange('productionComplete', e.target.value)}
                  placeholder="DD-MM-YYYY"
                  className="w-full p-2.5 border border-[#303035] rounded-lg bg-[#151517] text-[#F5F5F3]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#B4B4B8] mb-1">ETD</label>
                <input
                  type="text"
                  value={formData.etd || ''}
                  onChange={e => handleChange('etd', e.target.value)}
                  placeholder="Date / Status"
                  className="w-full p-2.5 border border-[#303035] rounded-lg bg-[#151517] text-[#F5F5F3]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#B4B4B8] mb-1">ETA</label>
                <input
                  type="text"
                  value={formData.eta || ''}
                  onChange={e => handleChange('eta', e.target.value)}
                  placeholder="Date / Status"
                  className="w-full p-2.5 border border-[#303035] rounded-lg bg-[#151517] text-[#F5F5F3]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#B4B4B8] mb-1">Incoterm</label>
                <input
                  type="text"
                  value={formData.incoterm || ''}
                  onChange={e => handleChange('incoterm', e.target.value)}
                  placeholder="e.g. CIF ICD Bangalore"
                  className="w-full p-2.5 border border-[#303035] rounded-lg bg-[#151517] text-[#F5F5F3]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#B4B4B8] mb-1">Remarks & Notes</label>
              <textarea
                rows={2}
                value={formData.remark || ''}
                onChange={e => handleChange('remark', e.target.value)}
                placeholder="Additional administrative notes..."
                className="w-full p-2.5 border border-[#303035] rounded-lg bg-[#151517] text-[#F5F5F3] placeholder-[#66666C]"
              />
            </div>
          </div>

          {/* UNSAVED CHANGES WARNING SUB-DIALOG */}
          {showConfirmClose && (
            <div className="p-4 bg-[#322917] border border-[#5B4724] rounded-xl flex items-center justify-between text-[#E5C47A] text-xs font-bold animate-in fade-in">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-[#D6A84F]" />
                <span>You have unsaved changes. Are you sure you want to discard them?</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmClose(false)}
                  className="px-3 py-1.5 bg-[#18181B] text-[#D5D5D8] border border-[#303035] rounded-lg hover:bg-[#222226]"
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 bg-[#5B4724] text-[#E5C47A] rounded-lg hover:bg-[#322917]"
                >
                  Discard Changes
                </button>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-[#262629] pt-4">
            <button
              type="button"
              onClick={handleCloseAttempt}
              className="text-xs font-bold text-[#B4B4B8] hover:text-[#FFFFFF] px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveState === 'saving'}
              className="btn-primary"
            >
              {saveState === 'saving' ? (
                <>
                  <RefreshCw size={15} className="animate-spin text-[#111111] flex-shrink-0" />
                  <span>Saving Changes...</span>
                </>
              ) : saveState === 'saved' ? (
                <>
                  <CheckCircle2 size={15} className="text-[#111111] animate-in zoom-in-75 duration-200 flex-shrink-0" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save size={15} className="btn-icon-edit flex-shrink-0" />
                  <span>SAVE & RECALCULATE METRICS</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
