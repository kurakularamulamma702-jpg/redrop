import React from 'react';
import { Donor } from '../types/blood';
import { formatDistance } from '../utils/geo';
import { Phone, MessageSquare, ShieldCheck, Clock, MapPin, Heart, ChevronRight, Trash2 } from 'lucide-react';

interface DonorCardProps {
  donor: Donor;
  onOpenDialerModal: (donor: Donor) => void;
  onDeleteDonor?: (id: string) => void;
  isUrgentSOS?: boolean;
}

export const DonorCard: React.FC<DonorCardProps> = ({
  donor,
  onOpenDialerModal,
  onDeleteDonor,
  isUrgentSOS
}) => {
  // Format clean dialer URI
  const rawPhone = donor.phone.replace(/[^0-9+]/g, '');
  const telHref = `tel:${rawPhone}`;

  return (
    <div className={`relative bg-white border rounded-xl p-5 transition-all hover:shadow-md ${
      donor.isEmergencyReady
        ? 'border-red-200 hover:border-red-300'
        : 'border-slate-200 hover:border-slate-300'
    }`}>
      {/* Top row: Blood Group Badge + Name + Distance */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          {/* Prominent Blood Group Badge */}
          <div className="w-13 h-13 rounded-xl bg-red-600 text-white flex flex-col items-center justify-center font-mono shrink-0 shadow-xs shadow-red-200">
            <span className="text-xl font-extrabold leading-none">{donor.bloodGroup}</span>
            <span className="text-[10px] tracking-wider uppercase opacity-90 mt-0.5 font-sans font-semibold">Blood</span>
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-base font-bold text-slate-900">{donor.name}</h3>
              {donor.verified && (
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-blue-600" title="Verified Credentialed Donor">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="hidden sm:inline">Verified</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-mono text-[11px]">
                {donor.area || donor.city || `GPS: ${donor.latitude.toFixed(4)}°, ${donor.longitude.toFixed(4)}°`}
              </span>
            </div>
          </div>
        </div>

        {/* Distance from patient & optional remove button */}
        <div className="flex items-start gap-2">
          <div className="text-right shrink-0">
            <div className="text-sm font-extrabold text-slate-900 font-mono tabular-nums">
              {donor.distanceKm !== undefined ? formatDistance(donor.distanceKm) : 'Nearby'}
            </div>
            {donor.responseTimeMinutes && (
              <div className="text-[11px] text-slate-500 font-medium flex items-center justify-end gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Est. ~{donor.responseTimeMinutes}m</span>
              </div>
            )}
          </div>
          {onDeleteDonor && (
            <button
              onClick={() => onDeleteDonor(donor.id)}
              title="Remove donor profile"
              className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Meta tags & Details row */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2.5 text-slate-600 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Verified Phone via OTP
          </span>
          {donor.isEmergencyReady && (
            <span className="text-red-600 font-semibold flex items-center gap-1 text-[11px]">
              <Heart className="w-3 h-3 fill-red-600 text-red-600" />
              Emergency On-Call
            </span>
          )}
        </div>

        {/* Availability tag */}
        <div>
          {donor.isAvailable ? (
            <span className="text-emerald-700 bg-emerald-50 text-[11px] font-semibold px-2 py-0.5 rounded">
              Ready to Donate Today
            </span>
          ) : (
            <span className="text-slate-500 bg-slate-100 text-[11px] font-medium px-2 py-0.5 rounded">
              In Recovery Period
            </span>
          )}
        </div>
      </div>

      {donor.notes && (
        <div className="mt-2.5 text-xs text-slate-600 bg-slate-50 rounded-lg p-2 border border-slate-100">
          <span className="font-medium text-slate-700">Donor Note:</span> {donor.notes}
        </div>
      )}

      {/* Direct Contact Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
        {/* Direct One-Click Native Dialer Button: opens phone dialer directly! */}
        <a
          href={telHref}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] rounded-lg transition-all shadow-sm shadow-red-200"
          title={`Call ${donor.name} at ${donor.phone}`}
        >
          <Phone className="w-4 h-4 text-white" />
          <span>Call Directly</span>
          <span className="text-xs font-mono font-normal opacity-90 hidden sm:inline">
            ({donor.phone})
          </span>
        </a>

        {/* Detail Dialer / WhatsApp / SMS Options Button */}
        <button
          onClick={() => onOpenDialerModal(donor)}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
          title="More contact options & emergency WhatsApp/SMS"
        >
          <MessageSquare className="w-4 h-4 text-slate-600" />
          <span className="hidden sm:inline">Emergency Details</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    </div>
  );
};
