import React, { useState } from 'react';
import { Donor } from '../types/blood';
import { formatDistance } from '../utils/geo';
import { Phone, Copy, Check, MessageSquare, Send, X, ShieldCheck, Heart, AlertCircle, Clock } from 'lucide-react';

interface DonorDetailDialerModalProps {
  donor: Donor | null;
  onClose: () => void;
  hospitalName?: string;
  patientName?: string;
}

export const DonorDetailDialerModal: React.FC<DonorDetailDialerModalProps> = ({
  donor,
  onClose,
  hospitalName = 'Local Medical Center',
  patientName = 'Patient'
}) => {
  const [copied, setCopied] = useState(false);
  const [callInitiated, setCallInitiated] = useState(false);

  if (!donor) return null;

  const rawPhone = donor.phone.replace(/[^0-9+]/g, '');
  const telHref = `tel:${rawPhone}`;

  const emergencyMessage = encodeURIComponent(
    `URGENT BLOOD REQUIREMENT: Hello ${donor.name}, we found your verified profile on HemoLink. We urgently need blood group ${donor.bloodGroup} for ${patientName} at ${hospitalName}. You are approximately ${donor.distanceKm ? formatDistance(donor.distanceKm) : 'nearby'}. Can you please confirm if you are available to donate? Thank you!`
  );

  const whatsappHref = `https://wa.me/${rawPhone.replace('+', '')}?text=${emergencyMessage}`;
  const smsHref = `sms:${rawPhone}?body=${emergencyMessage}`;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(donor.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInitiateCall = () => {
    setCallInitiated(true);
    window.location.href = telHref;
    setTimeout(() => setCallInitiated(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex flex-col items-center justify-center font-mono shrink-0">
              <span className="text-xl font-black leading-none">{donor.bloodGroup}</span>
              <span className="text-[9px] uppercase tracking-wider mt-0.5 opacity-90">Type</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{donor.name}</h3>
                {donor.verified && (
                  <span title="Verified Volunteer" className="inline-flex items-center">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-mono">
                {donor.area || donor.city || `[${donor.latitude.toFixed(4)}°, ${donor.longitude.toFixed(4)}°]`} · {donor.distanceKm !== undefined ? formatDistance(donor.distanceKm) : 'Nearby'}
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

        {/* Dialer Section */}
        <div className="p-6 space-y-6">
          {/* Big Phone Number Display */}
          <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Direct Donor Contact Number
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight tabular-nums">
              {donor.phone}
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={handleCopyPhone}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Number</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {callInitiated && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2 animate-pulse">
              <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Connecting to native dialer ({donor.phone}). Check your device's phone app.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5">
            {/* Primary Action: Direct Call */}
            <a
              href={telHref}
              onClick={handleInitiateCall}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 text-base font-bold text-white bg-red-600 hover:bg-red-700 active:scale-[0.99] rounded-xl transition-all shadow-md shadow-red-200 text-center"
            >
              <Phone className="w-5 h-5 text-white" />
              <span>Open Dialer & Call Now</span>
            </a>

            {/* Secondary Actions: WhatsApp and SMS */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors text-center"
              >
                <Send className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp Message</span>
              </a>

              <a
                href={smsHref}
                className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors text-center"
              >
                <MessageSquare className="w-4 h-4 text-slate-600" />
                <span>Send SMS</span>
              </a>
            </div>
          </div>

          {/* Donor Stats & Availability Summary */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Estimated Transit Time:</span>
              <span className="font-semibold text-slate-900 font-mono tabular-nums">
                ~{donor.responseTimeMinutes || 15} minutes
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Phone Verification:</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified via OTP
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Emergency Availability:</span>
              <span className="font-semibold text-red-600 flex items-center gap-1">
                <Heart className="w-3 h-3 fill-red-600" />
                {donor.isEmergencyReady ? '24/7 On-Call Donor' : 'Standard Response'}
              </span>
            </div>
          </div>

          {/* Important Patient Etiquette Guidance */}
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-[11px] text-blue-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Medical Emergency Etiquette:</span>
              <p className="text-blue-800">
                When the donor answers, clearly state the patient name, hospital name, exact ward/bed, required blood units, and hospital contact number.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
