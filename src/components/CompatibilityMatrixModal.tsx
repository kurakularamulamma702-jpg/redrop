import React, { useState } from 'react';
import { BloodGroup } from '../types/blood';
import { ALL_BLOOD_GROUPS, getCompatibleDonorGroups, getCanDonateTo } from '../utils/compatibility';
import { X, Check, Droplet, ArrowRight, Info } from 'lucide-react';

interface CompatibilityMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGroupForSearch?: (bg: BloodGroup) => void;
}

export const CompatibilityMatrixModal: React.FC<CompatibilityMatrixModalProps> = ({
  isOpen,
  onClose,
  onSelectGroupForSearch
}) => {
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup>('O-');

  if (!isOpen) return null;

  const canReceiveFrom = getCompatibleDonorGroups(selectedGroup);
  const canDonateTo = getCanDonateTo(selectedGroup);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
              <Droplet className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Blood Group Compatibility Guide</h3>
              <p className="text-xs text-slate-300">
                Understanding ABO and Rh antigen compatibility for emergency transfusions.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Interactive Blood Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Select Blood Group to Check:
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {ALL_BLOOD_GROUPS.map((bg) => (
                <button
                  key={bg}
                  onClick={() => setSelectedGroup(bg)}
                  className={`py-2 px-2 text-xs font-mono font-black rounded-lg border transition-all text-center ${
                    selectedGroup === bg
                      ? 'bg-red-600 text-white border-red-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Compatibility Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Can Receive From */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Patient with {selectedGroup} Can Receive From:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {canReceiveFrom.map((bg) => (
                  <span
                    key={bg}
                    className="font-mono font-bold text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-md"
                  >
                    {bg}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-emerald-800/80 pt-1">
                {selectedGroup === 'AB+'
                  ? 'Universal recipient: Can safely receive red blood cells of any type in emergency.'
                  : `Compatible donor groups for ${selectedGroup} transfusions.`}
              </p>
            </div>

            {/* Can Donate To */}
            <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                <ArrowRight className="w-4 h-4 text-blue-600" />
                <span>Donor with {selectedGroup} Can Give Blood To:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {canDonateTo.map((bg) => (
                  <span
                    key={bg}
                    className="font-mono font-bold text-xs bg-blue-100 text-blue-800 border border-blue-300 px-2.5 py-1 rounded-md"
                  >
                    {bg}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-blue-800/80 pt-1">
                {selectedGroup === 'O-'
                  ? 'Universal donor: Can be administered to any patient regardless of blood group.'
                  : `Eligible recipient groups for ${selectedGroup} donors.`}
              </p>
            </div>
          </div>

          {/* Full Reference Table */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Complete Emergency Compatibility Reference
            </span>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Patient Group</th>
                    <th className="py-2 px-3">Can Receive Red Blood Cells From</th>
                    <th className="py-2 px-3">Quick Search</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ALL_BLOOD_GROUPS.map((bg) => {
                    const donorsFor = getCompatibleDonorGroups(bg);
                    return (
                      <tr key={bg} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 font-mono font-extrabold text-red-600 text-sm">
                          {bg}
                        </td>
                        <td className="py-2 px-3 font-mono font-semibold text-slate-700">
                          {donorsFor.join(', ')}
                        </td>
                        <td className="py-2 px-3">
                          {onSelectGroupForSearch && (
                            <button
                              onClick={() => {
                                onSelectGroupForSearch(bg);
                                onClose();
                              }}
                              className="text-red-600 hover:text-red-800 font-bold text-[11px] underline"
                            >
                              Search for {bg}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Medical Note */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-[11px]">
              Note: In actual hospital settings, cross-matching tests (major and minor compatibility) are performed by certified pathology labs prior to whole blood or packed red blood cell administration.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
