import React, { useState } from 'react';
import { BloodGroup, UserCoordinates } from '../types/blood';
import { ALL_BLOOD_GROUPS, getCompatibleDonorGroups } from '../utils/compatibility';
import { POPULAR_CITIES, CityPreset } from '../data/initialDonors';
import { MapPin, Navigation, Filter, CheckCircle2, ShieldAlert } from 'lucide-react';

interface SearchFilterBarProps {
  selectedBloodGroup: BloodGroup | 'ALL';
  onSelectBloodGroup: (bg: BloodGroup | 'ALL') => void;
  includeCompatible: boolean;
  onToggleIncludeCompatible: (val: boolean) => void;
  radiusKm: number;
  onSelectRadius: (radius: number) => void;
  availabilityFilter: 'all' | 'available' | 'emergency';
  onSelectAvailability: (val: 'all' | 'available' | 'emergency') => void;
  userCoords: UserCoordinates;
  onDetectLocation: () => void;
  onSelectPresetCity: (city: CityPreset) => void;
  isLocating: boolean;
  locationError: string | null;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  selectedBloodGroup,
  onSelectBloodGroup,
  includeCompatible,
  onToggleIncludeCompatible,
  radiusKm,
  onSelectRadius,
  availabilityFilter,
  onSelectAvailability,
  userCoords,
  onDetectLocation,
  onSelectPresetCity,
  isLocating,
  locationError,
}) => {
  const [showCoordinateDetails, setShowCoordinateDetails] = useState(false);

  const compatibleList = selectedBloodGroup !== 'ALL'
    ? getCompatibleDonorGroups(selectedBloodGroup)
    : [];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
      {/* Location Coordinates & Automatic GPS Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Patient Location Coordinates
            </span>
            {userCoords.isAutoDetected ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Live GPS Active
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Preset Location
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-slate-800">
            <MapPin className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-semibold text-base">{userCoords.locationName}</span>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              [{userCoords.latitude.toFixed(4)}°, {userCoords.longitude.toFixed(4)}°]
            </span>
            <button
              onClick={() => setShowCoordinateDetails(!showCoordinateDetails)}
              className="text-xs text-slate-500 hover:text-slate-800 underline ml-1"
            >
              {showCoordinateDetails ? 'Hide' : 'Details'}
            </button>
          </div>
        </div>

        {/* Location Actions: Automatic Geolocation Button + City Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onDetectLocation}
            disabled={isLocating}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors whitespace-nowrap active:scale-[0.98] disabled:opacity-60"
            title="Automatically detect coordinates using device GPS"
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            {isLocating ? 'Detecting GPS...' : 'Auto-Detect Coordinates'}
          </button>

          {/* Quick City Presets Dropdown */}
          <select
            aria-label="Preset City Location"
            value={userCoords.locationName}
            onChange={(e) => {
              const found = POPULAR_CITIES.find(c => c.name === e.target.value);
              if (found) onSelectPresetCity(found);
            }}
            className="text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            {POPULAR_CITIES.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name} ({city.country})
              </option>
            ))}
          </select>
        </div>
      </div>

      {locationError && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{locationError} (Using nearest coordinates fallback)</span>
        </div>
      )}

      {showCoordinateDetails && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 font-mono text-slate-600">
          <div className="flex justify-between">
            <span>Latitude:</span>
            <span className="font-semibold text-slate-900">{userCoords.latitude}°</span>
          </div>
          <div className="flex justify-between">
            <span>Longitude:</span>
            <span className="font-semibold text-slate-900">{userCoords.longitude}°</span>
          </div>
          {userCoords.accuracy && (
            <div className="flex justify-between">
              <span>GPS Precision Accuracy:</span>
              <span className="text-emerald-700">±{Math.round(userCoords.accuracy)} meters</span>
            </div>
          )}
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-200">
            Distances to all registered donors are calculated using spherical trigonometry (Haversine formula).
          </div>
        </div>
      )}

      {/* Blood Group Selector */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <span>Patient Blood Group Required</span>
            <span className="text-red-600 font-bold">*</span>
          </label>

          {selectedBloodGroup !== 'ALL' && (
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeCompatible}
                onChange={(e) => onToggleIncludeCompatible(e.target.checked)}
                className="rounded border-slate-300 text-red-600 focus:ring-red-500"
              />
              <span className="font-medium">
                Include Compatible Donors ({compatibleList.join(', ')})
              </span>
            </label>
          )}
        </div>

        {/* Blood Group Buttons */}
        <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5">
          <button
            onClick={() => onSelectBloodGroup('ALL')}
            className={`py-2 px-2 text-xs font-bold rounded-lg border transition-all text-center ${
              selectedBloodGroup === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            All
          </button>
          {ALL_BLOOD_GROUPS.map((bg) => {
            const isSelected = selectedBloodGroup === bg;
            const isUniversal = bg === 'O-';
            return (
              <button
                key={bg}
                onClick={() => onSelectBloodGroup(bg)}
                className={`relative py-2 px-2 text-xs font-extrabold rounded-lg border transition-all text-center ${
                  isSelected
                    ? 'bg-red-600 text-white border-red-600 shadow-sm shadow-red-200'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-red-300 hover:bg-red-50/50'
                }`}
              >
                {bg}
                {isUniversal && !isSelected && (
                  <span className="block text-[9px] font-normal text-red-600 leading-none mt-0.5">
                    Univ.
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Availability Filter */}
      <div className="pt-2 border-t border-slate-100">
        <div className="space-y-1.5 max-w-md">
          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Donor Availability Status
          </span>
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => onSelectAvailability('all')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                availabilityFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Donors
            </button>
            <button
              onClick={() => onSelectAvailability('available')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                availabilityFilter === 'available'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Available Now
            </button>
            <button
              onClick={() => onSelectAvailability('emergency')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                availabilityFilter === 'emergency'
                  ? 'bg-white text-red-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Emergency Ready
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
