import React, { useState, useEffect, useMemo } from 'react';
import { BloodGroup, Donor, EmergencyRequest, UserCoordinates } from './types/blood';
import { ALL_BLOOD_GROUPS, getCompatibleDonorGroups } from './utils/compatibility';
import { calculateDistanceKm, estimateResponseTimeMinutes } from './utils/geo';
import { POPULAR_CITIES, CityPreset, INITIAL_EMERGENCY_REQUESTS } from './data/initialDonors';
import { Header } from './components/Header';
import { SearchFilterBar } from './components/SearchFilterBar';
import { DonorCard } from './components/DonorCard';
import { DonorDetailDialerModal } from './components/DonorDetailDialerModal';
import { MapView } from './components/MapView';
import { RegisterDonorModal } from './components/RegisterDonorModal';
import { EmergencySOSModal } from './components/EmergencySOSModal';
import { CompatibilityMatrixModal } from './components/CompatibilityMatrixModal';
import { EmergencyTicker } from './components/EmergencyTicker';
import { 
  Heart, 
  MapPin, 
  PhoneCall, 
  AlertTriangle, 
  Users, 
  Zap, 
  CheckCircle2, 
  Droplet, 
  Info,
  Clock,
  ShieldCheck,
  Search,
  PlusCircle,
  UserPlus,
  Database
} from 'lucide-react';
import { 
  subscribeToDonors, 
  subscribeToEmergencyRequests, 
  saveDonorToFirestore, 
  deleteDonorFromFirestore, 
  saveEmergencyRequestToFirestore 
} from './services/firestoreService';

const STORAGE_KEY_DONORS = 'hemolink_donors_v3';
const STORAGE_KEY_SOS = 'hemolink_sos_v3';

export default function App() {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<'search' | 'map' | 'sos' | 'register' | 'compatibility'>('search');

  // User / Patient Geolocation Coordinates
  const [userCoords, setUserCoords] = useState<UserCoordinates>({
    latitude: 37.7749,
    longitude: -122.4194,
    locationName: 'San Francisco, CA',
    isAutoDetected: false,
  });

  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Filters
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<BloodGroup | 'ALL'>('ALL');
  const [includeCompatible, setIncludeCompatible] = useState(true);
  const [radiusKm, setRadiusKm] = useState<number>(0); // 0 = all distances, nearest first
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'emergency'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedDonorForDialer, setSelectedDonorForDialer] = useState<Donor | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isCompatibilityOpen, setIsCompatibilityOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Initialize Geolocation on initial load
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation API not supported by browser.');
      return;
    }
    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setUserCoords({
          latitude,
          longitude,
          accuracy,
          locationName: 'Detected Current Location',
          isAutoDetected: true,
        });
        setIsLocating(false);
        showToast(`GPS Coordinates detected: ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`);
      },
      (err) => {
        setIsLocating(false);
        setLocationError(`Location permission unavailable (${err.message}). Using preset coordinates.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    detectLocation();
  }, []);

  // 2. Initialize Donors State - NO DEMO DONORS. Only real registered donors.
  const [donors, setDonors] = useState<Donor[]>(() => {
    try {
      // Clear legacy demo keys if present
      localStorage.removeItem('hemolink_donors_v1');
      localStorage.removeItem('hemolink_donors_v2');

      const saved = localStorage.getItem(STORAGE_KEY_DONORS);
      if (saved) {
        const parsed: Donor[] = JSON.parse(saved);
        // Exclude any demo seed donors
        return parsed.filter(d => !d.id.startsWith('donor-seed'));
      }
    } catch (e) {
      console.error('Error loading saved donors', e);
    }
    return [];
  });

  // 3. Initialize Emergency SOS Requests - NO DEMO REQUESTS.
  const [emergencyRequests, setEmergencyRequests] = useState<EmergencyRequest[]>(() => {
    try {
      localStorage.removeItem('hemolink_sos_v1');
      localStorage.removeItem('hemolink_sos_v2');

      const saved = localStorage.getItem(STORAGE_KEY_SOS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading saved SOS requests', e);
    }
    return [];
  });

  // Real-time Firestore Live Synchronization
  useEffect(() => {
    let unsubscribeDonors: () => void = () => {};
    let unsubscribeSOS: () => void = () => {};

    try {
      unsubscribeDonors = subscribeToDonors((remoteDonors) => {
        setDonors(remoteDonors);
        localStorage.setItem(STORAGE_KEY_DONORS, JSON.stringify(remoteDonors));
      });

      unsubscribeSOS = subscribeToEmergencyRequests((remoteSOS) => {
        setEmergencyRequests(remoteSOS);
        localStorage.setItem(STORAGE_KEY_SOS, JSON.stringify(remoteSOS));
      });
    } catch (err) {
      console.warn('Firestore live listener notice:', err);
    }

    return () => {
      unsubscribeDonors();
      unsubscribeSOS();
    };
  }, []);

  // Save changes to Firestore & local state
  const handleRegisterDonor = async (newDonor: Donor) => {
    const updated = [newDonor, ...donors.filter(d => d.id !== newDonor.id)];
    setDonors(updated);
    localStorage.setItem(STORAGE_KEY_DONORS, JSON.stringify(updated));
    showToast(`Donor ${newDonor.name} (${newDonor.bloodGroup}) registered! Syncing to Firestore...`);

    try {
      await saveDonorToFirestore(newDonor);
      showToast(`Donor ${newDonor.name} saved in Firebase Firestore!`);
    } catch (e) {
      console.error('Failed to sync donor to Firestore', e);
    }
  };

  const handleDeleteDonor = async (donorId: string) => {
    const updated = donors.filter(d => d.id !== donorId);
    setDonors(updated);
    localStorage.setItem(STORAGE_KEY_DONORS, JSON.stringify(updated));
    showToast('Donor profile removed.');

    try {
      await deleteDonorFromFirestore(donorId);
    } catch (e) {
      console.error('Failed to remove donor from Firestore', e);
    }
  };

  const handleCreateSOS = async (newSOS: EmergencyRequest) => {
    const updated = [newSOS, ...emergencyRequests.filter(r => r.id !== newSOS.id)];
    setEmergencyRequests(updated);
    localStorage.setItem(STORAGE_KEY_SOS, JSON.stringify(updated));
    setSelectedBloodGroup(newSOS.bloodGroup);
    setIncludeCompatible(true);
    setActiveTab('search');
    showToast(`Urgent SOS Broadcasted! Syncing to Firestore...`);

    try {
      await saveEmergencyRequestToFirestore(newSOS);
      showToast(`Urgent SOS saved to Firebase Firestore!`);
    } catch (e) {
      console.error('Failed to sync SOS to Firestore', e);
    }
  };

  // Select Preset City
  const handleSelectPresetCity = (city: CityPreset) => {
    setUserCoords({
      latitude: city.latitude,
      longitude: city.longitude,
      locationName: `${city.name}, ${city.country}`,
      isAutoDetected: false,
    });
    showToast(`Switched location to ${city.name} [${city.latitude}°, ${city.longitude}°]`);
  };

  // 4. Calculate Distance & Filter Donors in Real-time
  const filteredDonors = useMemo(() => {
    let allowedGroups: BloodGroup[] = [];
    if (selectedBloodGroup !== 'ALL') {
      if (includeCompatible) {
        allowedGroups = getCompatibleDonorGroups(selectedBloodGroup);
      } else {
        allowedGroups = [selectedBloodGroup];
      }
    }

    return donors
      .map((donor) => {
        const dist = calculateDistanceKm(
          userCoords.latitude,
          userCoords.longitude,
          donor.latitude,
          donor.longitude
        );
        return {
          ...donor,
          distanceKm: dist,
          responseTimeMinutes: estimateResponseTimeMinutes(dist),
        };
      })
      .filter((donor) => {
        // Blood Group Match
        if (selectedBloodGroup !== 'ALL' && !allowedGroups.includes(donor.bloodGroup)) {
          return false;
        }

        // Radius Match
        if (radiusKm > 0 && donor.distanceKm > radiusKm) {
          return false;
        }

        // Availability Match
        if (availabilityFilter === 'available' && !donor.isAvailable) {
          return false;
        }
        if (availabilityFilter === 'emergency' && !donor.isEmergencyReady) {
          return false;
        }

        // Optional search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = donor.name.toLowerCase().includes(q);
          const matchArea = donor.area ? donor.area.toLowerCase().includes(q) : false;
          const matchCity = donor.city ? donor.city.toLowerCase().includes(q) : false;
          const matchBlood = donor.bloodGroup.toLowerCase().includes(q);
          if (!matchName && !matchArea && !matchCity && !matchBlood) {
            return false;
          }
        }

        return true;
      })
      // Sort in ascending order: NEAREST DONORS FIRST!
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }, [donors, userCoords, selectedBloodGroup, includeCompatible, radiusKm, availabilityFilter, searchQuery]);

  const nearestDistance = filteredDonors.length > 0 ? filteredDonors[0].distanceKm : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSOS={() => setIsSOSOpen(true)}
        onOpenRegister={() => setIsRegisterOpen(true)}
        sosCount={emergencyRequests.filter(r => r.status === 'OPEN').length}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Active Emergency SOS Ticker */}
        {emergencyRequests.length > 0 && (
          <EmergencyTicker
            requests={emergencyRequests.filter(r => r.status === 'OPEN')}
            onSelectRequest={(req) => {
              setSelectedBloodGroup(req.bloodGroup);
              setIncludeCompatible(true);
              setActiveTab('search');
              showToast(`Filtered donors for patient ${req.patientName} (${req.bloodGroup})`);
            }}
            onOpenSOSModal={() => setIsSOSOpen(true)}
          />
        )}

        {/* Hero Banner Strip */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            {/* Left Narrative */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  Instant Life-Saving Blood Connection
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Direct Patient-to-Donor Network with Automatic GPS & Instant Dialer
                </h1>
                <p className="text-sm text-slate-600 max-w-xl leading-relaxed">
                  Automatically calculates precise geographic coordinates to find nearest registered blood donors. 
                  Click directly to open the phone dialer, send emergency WhatsApp messages, or register new donors.
                </p>
              </div>

              {/* Quick Metric KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Active Donors</span>
                  <span className="text-base font-extrabold text-slate-900 font-mono tabular-nums">
                    {donors.length} Registered
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Nearest Donor</span>
                  <span className="text-base font-extrabold text-emerald-600 font-mono tabular-nums">
                    {nearestDistance !== null ? `${nearestDistance} km` : 'None yet'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Direct Dialer</span>
                  <span className="text-base font-extrabold text-red-600 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 fill-red-600" />
                    Instant Tap
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Donor Network</span>
                  <button
                    onClick={() => setIsRegisterOpen(true)}
                    className="text-xs font-bold text-slate-900 hover:text-red-600 underline flex items-center gap-1 mt-0.5"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-red-600" />
                    + Register
                  </button>
                </div>
              </div>
            </div>

            {/* Right Clinical Visual Asset */}
            <div className="lg:col-span-5 relative min-h-[220px] bg-slate-100 overflow-hidden">
              <img
                src="/src/assets/images/hero_blood_donation_1792038331057.jpg"
                alt="Blood donation center with volunteer and medical staff"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent flex items-end p-4">
                <span className="text-xs font-medium text-white/95">
                  Direct connection between voluntary donors and critical patients.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* View Switcher / Tabs Content */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            {/* Search Filter Bar */}
            <SearchFilterBar
              selectedBloodGroup={selectedBloodGroup}
              onSelectBloodGroup={setSelectedBloodGroup}
              includeCompatible={includeCompatible}
              onToggleIncludeCompatible={setIncludeCompatible}
              radiusKm={radiusKm}
              onSelectRadius={setRadiusKm}
              availabilityFilter={availabilityFilter}
              onSelectAvailability={setAvailabilityFilter}
              userCoords={userCoords}
              onDetectLocation={detectLocation}
              onSelectPresetCity={handleSelectPresetCity}
              isLocating={isLocating}
              locationError={locationError}
            />

            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Nearest Blood Donors</span>
                  <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                    {filteredDonors.length} Found
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Sorted automatically by spherical distance from [{userCoords.latitude.toFixed(4)}°, {userCoords.longitude.toFixed(4)}°].
                  Tap any "Call Directly" button to open your phone dialer.
                </p>
              </div>

              {/* Text Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by name, area..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Donors Grid or Empty State */}
            {filteredDonors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {filteredDonors.map((donor) => (
                  <DonorCard
                    key={donor.id}
                    donor={donor}
                    onOpenDialerModal={setSelectedDonorForDialer}
                    onDeleteDonor={handleDeleteDonor}
                  />
                ))}
              </div>
            ) : donors.length === 0 ? (
              /* Completely Empty Network state (No demo donors) */
              <div className="text-center py-14 px-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-xs">
                <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                  <Heart className="w-7 h-7 text-red-600 fill-red-100" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-lg font-bold text-slate-900">No Donors in the Network Yet</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    All demo donors have been removed. You can now register real volunteer blood donors with their GPS coordinates and phone numbers so patients can dial them directly!
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <button
                    onClick={() => setIsRegisterOpen(true)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-sm shadow-red-200"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Register as Blood Donor
                  </button>
                  <button
                    onClick={() => setIsSOSOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Broadcast Emergency SOS
                  </button>
                </div>
              </div>
            ) : (
              /* Donors exist, but filtered out by current criteria */
              <div className="text-center py-12 px-4 bg-white border border-slate-200 rounded-xl space-y-3">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                  <Droplet className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No Donors Matching Your Filter Within Radius</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Try expanding the search radius to "Any km", enabling "Include Compatible Donors", or switching your blood group selection.
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setRadiusKm(0);
                      setSelectedBloodGroup('ALL');
                      setAvailabilityFilter('all');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Reset All Filters
                  </button>
                  <button
                    onClick={() => setIsRegisterOpen(true)}
                    className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    Register as Donor
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Interactive Map Tab */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Geographic Radar & Donor Map</h2>
                <p className="text-xs text-slate-500">
                  Visual map of patient coordinates (blue dot) and registered nearest donors (red pins with blood type).
                </p>
              </div>

              {/* Radius selector */}
              <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg text-xs">
                <span className="text-slate-400 px-2 font-medium">Radius:</span>
                {[5, 10, 25, 50].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadiusKm(r)}
                    className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                      radiusKm === r ? 'bg-red-600 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {r}km
                  </button>
                ))}
              </div>
            </div>

            <MapView
              donors={filteredDonors}
              userCoords={userCoords}
              radiusKm={radiusKm}
              onOpenDialerModal={setSelectedDonorForDialer}
            />
          </div>
        )}

        {/* SOS Tab */}
        {activeTab === 'sos' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span>Emergency Blood SOS Broadcasts</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Critical patient blood requests from nearby hospitals and emergency wards.
                </p>
              </div>

              <button
                onClick={() => setIsSOSOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all shadow-sm shadow-red-200"
              >
                + Broadcast Urgent SOS
              </button>
            </div>

            {emergencyRequests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {emergencyRequests.map((req) => {
                  const rawPhone = req.contactPhone.replace(/[^0-9+]/g, '');
                  return (
                    <div key={req.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex flex-col items-center justify-center font-mono">
                            <span className="text-lg font-black">{req.bloodGroup}</span>
                            <span className="text-[9px] uppercase">Needed</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-base">{req.patientName}</h3>
                            <span className="text-xs text-slate-500">
                              Units: <strong className="text-slate-800">{req.unitsNeeded} units</strong> · {req.city}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          req.urgency === 'IMMEDIATE'
                            ? 'bg-red-100 text-red-700'
                            : req.urgency === 'WITHIN_2_HOURS'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {req.urgency.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 text-slate-600">
                        <div><strong className="text-slate-800">Hospital:</strong> {req.hospitalName} ({req.hospitalAddress})</div>
                        <div><strong className="text-slate-800">Attendant:</strong> {req.contactPerson}</div>
                        {req.notes && <div><strong className="text-slate-800">Notes:</strong> {req.notes}</div>}
                      </div>

                      <div className="pt-2 flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            setSelectedBloodGroup(req.bloodGroup);
                            setIncludeCompatible(true);
                            setActiveTab('search');
                          }}
                          className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
                        >
                          Search Matching Donors
                        </button>

                        <a
                          href={`tel:${rawPhone}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-2xs"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Dial Attendant ({req.contactPhone})</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 px-4 bg-white border border-slate-200 rounded-xl space-y-3">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No Open Emergency SOS Requests</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  There are currently no open emergency transfusion broadcasts. If you or a hospital needs blood immediately, broadcast an SOS request.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setIsSOSOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-xs"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    + Broadcast Urgent SOS Alert
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Compatibility Guide Tab */}
        {activeTab === 'compatibility' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">ABO & Rh Factor Compatibility Matrix</h2>
              <p className="text-xs text-slate-500 mt-1">
                Direct clinical reference for emergency blood transfusions and donor eligibility.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-red-900 uppercase tracking-wider block">
                  Universal Red Blood Cell Donor: O Negative (O-)
                </span>
                <p className="text-xs text-red-800 leading-relaxed">
                  O- blood does not possess A, B, or Rh surface antigens. It is universally accepted in emergency trauma when typing cannot be delayed.
                </p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block">
                  Universal Recipient: AB Positive (AB+)
                </span>
                <p className="text-xs text-blue-800 leading-relaxed">
                  AB+ individuals have both A and B antigens, as well as the Rh factor, allowing them to safely receive red blood cells from any blood group.
                </p>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Recipient Blood Group</th>
                    <th className="py-2.5 px-4">Can Safely Receive From</th>
                    <th className="py-2.5 px-4">Can Give Blood To</th>
                    <th className="py-2.5 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {ALL_BLOOD_GROUPS.map((bg) => (
                    <tr key={bg} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-extrabold text-red-600 text-sm">
                        {bg}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {getCompatibleDonorGroups(bg).join(', ')}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {getCompatibleDonorGroups(bg).includes(bg) ? 'Standard match' : ''}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <button
                          onClick={() => {
                            setSelectedBloodGroup(bg);
                            setIncludeCompatible(true);
                            setActiveTab('search');
                            showToast(`Searching compatible donors for ${bg}`);
                          }}
                          className="text-xs font-bold text-red-600 hover:text-red-800 underline"
                        >
                          Find {bg} Donors
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">HemoLink Network</span>
            <span>·</span>
            <span>Emergency Blood Donor Coordinate Locator</span>
          </div>

          <div className="flex items-center gap-4 text-slate-600">
            <button onClick={() => setIsRegisterOpen(true)} className="hover:text-slate-900 underline">
              Register as Donor
            </button>
            <button onClick={() => setIsSOSOpen(true)} className="hover:text-slate-900 underline">
              Broadcast SOS
            </button>
            <button onClick={() => setIsCompatibilityOpen(true)} className="hover:text-slate-900 underline">
              Compatibility Guide
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DonorDetailDialerModal
        donor={selectedDonorForDialer}
        onClose={() => setSelectedDonorForDialer(null)}
        hospitalName={userCoords.locationName}
      />

      <RegisterDonorModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegisterDonor={handleRegisterDonor}
        currentUserCoords={userCoords}
      />

      <EmergencySOSModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
        onSubmitSOS={handleCreateSOS}
        currentUserCoords={userCoords}
      />

      <CompatibilityMatrixModal
        isOpen={isCompatibilityOpen}
        onClose={() => setIsCompatibilityOpen(false)}
        onSelectGroupForSearch={(bg) => {
          setSelectedBloodGroup(bg);
          setIncludeCompatible(true);
          setActiveTab('search');
        }}
      />
    </div>
  );
}
