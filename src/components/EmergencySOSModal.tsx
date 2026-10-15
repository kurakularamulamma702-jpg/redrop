import React, { useState } from 'react';
import { BloodGroup, EmergencyRequest, UrgencyLevel, UserCoordinates } from '../types/blood';
import { ALL_BLOOD_GROUPS } from '../utils/compatibility';
import { AlertTriangle, X, ShieldAlert, Hospital, Phone, User, Clock } from 'lucide-react';

interface EmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSOS: (sos: EmergencyRequest) => void;
  currentUserCoords: UserCoordinates;
}

export const EmergencySOSModal: React.FC<EmergencySOSModalProps> = ({
  isOpen,
  onClose,
  onSubmitSOS,
  currentUserCoords
}) => {
  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O-');
  const [unitsNeeded, setUnitsNeeded] = useState(2);
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [city, setCity] = useState(currentUserCoords.locationName || '');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('IMMEDIATE');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setError('Please provide patient name.');
      return;
    }
    if (!hospitalName.trim()) {
      setError('Please provide the hospital or medical center name.');
      return;
    }
    if (!contactPhone.trim()) {
      setError('Please provide a contact phone number for donors to call back.');
      return;
    }

    const newRequest: EmergencyRequest = {
      id: `sos-${Date.now()}`,
      patientName: patientName.trim(),
      bloodGroup,
      unitsNeeded: Number(unitsNeeded) || 1,
      hospitalName: hospitalName.trim(),
      hospitalAddress: hospitalAddress.trim() || 'Emergency Ward',
      city: city.trim() || currentUserCoords.locationName,
      latitude: currentUserCoords.latitude,
      longitude: currentUserCoords.longitude,
      contactPerson: contactPerson.trim() || 'Attendant',
      contactPhone: contactPhone.trim(),
      urgency,
      timestamp: Date.now(),
      status: 'OPEN',
      notes: notes.trim()
    };

    onSubmitSOS(newRequest);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-red-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-red-600 text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Broadcast Urgent Blood SOS</h3>
              <p className="text-xs text-red-100">
                Alerts nearby registered donors and prioritizes matching profiles.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-red-200 hover:text-white p-1 rounded-lg hover:bg-red-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Blood Group & Units */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Required Blood Group *</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                className="w-full text-sm font-mono font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-red-600"
              >
                {ALL_BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Units / Bags Needed *</label>
              <select
                value={unitsNeeded}
                onChange={(e) => setUnitsNeeded(parseInt(e.target.value) || 1)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value={1}>1 Unit (approx. 450ml)</option>
                <option value={2}>2 Units (Urgent)</option>
                <option value={3}>3 Units (Surgical)</option>
                <option value={4}>4+ Units (Critical Trauma)</option>
              </select>
            </div>
          </div>

          {/* Urgency Level */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Time Urgency
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setUrgency('IMMEDIATE')}
                className={`py-2 px-2 text-xs font-bold rounded-lg border transition-all text-center ${
                  urgency === 'IMMEDIATE'
                    ? 'bg-red-600 text-white border-red-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Immediate (Critical)
              </button>
              <button
                type="button"
                onClick={() => setUrgency('WITHIN_2_HOURS')}
                className={`py-2 px-2 text-xs font-bold rounded-lg border transition-all text-center ${
                  urgency === 'WITHIN_2_HOURS'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Within 2 Hours
              </button>
              <button
                type="button"
                onClick={() => setUrgency('TODAY')}
                className={`py-2 px-2 text-xs font-bold rounded-lg border transition-all text-center ${
                  urgency === 'TODAY'
                    ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Needed Today
              </button>
            </div>
          </div>

          {/* Patient Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Patient Name *
            </label>
            <input
              type="text"
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="e.g. Rachel Adams"
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Hospital Name & Address */}
          <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Hospital className="w-4 h-4 text-red-600" />
              Hospital / Transfusion Center Location
            </div>

            <div className="space-y-2 text-xs">
              <input
                type="text"
                required
                placeholder="Hospital Name (e.g. City General Hospital)"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Ward / Room No."
                  value={hospitalAddress}
                  onChange={(e) => setHospitalAddress(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <input
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {/* Attendant Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Attendant Name / Relation</label>
              <input
                type="text"
                placeholder="e.g. David (Spouse)"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Callback Phone Number *
              </label>
              <input
                type="tel"
                required
                placeholder="+1 (555) 000-0000"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Clinical Reason / Remarks</label>
            <input
              type="text"
              placeholder="e.g. Open heart surgery, cross-match blood sample ready in lab"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all shadow-sm shadow-red-200"
            >
              <AlertTriangle className="w-4 h-4" />
              Broadcast SOS Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
