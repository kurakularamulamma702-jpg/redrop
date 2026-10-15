import React from 'react';
import { EmergencyRequest } from '../types/blood';
import { AlertTriangle, Phone, Hospital, MapPin, Clock } from 'lucide-react';

interface EmergencyTickerProps {
  requests: EmergencyRequest[];
  onSelectRequest: (req: EmergencyRequest) => void;
  onOpenSOSModal: () => void;
}

export const EmergencyTicker: React.FC<EmergencyTickerProps> = ({
  requests,
  onSelectRequest,
  onOpenSOSModal
}) => {
  if (requests.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-2xs">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-red-200/70">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
          </span>
          <span className="text-xs font-extrabold uppercase tracking-wider text-red-900 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            Active Urgent Blood SOS Broadcasts ({requests.length})
          </span>
        </div>

        <button
          onClick={onOpenSOSModal}
          className="text-xs font-bold text-red-700 hover:text-red-900 underline"
        >
          + Post New SOS Request
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
        {requests.map((req) => {
          const rawPhone = req.contactPhone.replace(/[^0-9+]/g, '');
          const telHref = `tel:${rawPhone}`;

          return (
            <div
              key={req.id}
              className="bg-white border border-red-100 rounded-lg p-3.5 flex flex-col justify-between gap-3 hover:shadow-xs transition-shadow"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-sm bg-red-600 text-white px-2 py-0.5 rounded">
                      {req.bloodGroup}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Patient: {req.patientName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Needs {req.unitsNeeded} Units · {req.urgency.replace('_', ' ')}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                    {req.status}
                  </span>
                </div>

                <div className="mt-2 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1">
                    <Hospital className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{req.hospitalName}, {req.city}</span>
                  </div>
                  {req.notes && (
                    <div className="text-[11px] text-slate-500 italic truncate">
                      "{req.notes}"
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 font-mono">
                  Attendant: {req.contactPerson}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectRequest(req)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
                  >
                    Find Donors
                  </button>
                  <a
                    href={telHref}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors shadow-2xs"
                  >
                    <Phone className="w-3 h-3 text-white" />
                    <span>Dial {req.contactPhone}</span>
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
