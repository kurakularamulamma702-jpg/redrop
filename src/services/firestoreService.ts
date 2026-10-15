import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Donor, EmergencyRequest } from '../types/blood';

const DONORS_COLLECTION = 'donors';
const EMERGENCY_COLLECTION = 'emergencyRequests';

/**
 * Subscribes to real-time updates for all registered blood donors
 */
export function subscribeToDonors(
  onUpdate: (donors: Donor[]) => void,
  onError?: (err: any) => void
) {
  const colRef = collection(db, DONORS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Donor[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Donor;
        list.push({
          ...data,
          id: docSnap.id,
        });
      });
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, DONORS_COLLECTION);
      if (onError) onError(error);
    }
  );
}

/**
 * Subscribes to real-time updates for active patient SOS requests
 */
export function subscribeToEmergencyRequests(
  onUpdate: (requests: EmergencyRequest[]) => void,
  onError?: (err: any) => void
) {
  const colRef = collection(db, EMERGENCY_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: EmergencyRequest[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as EmergencyRequest;
        list.push({
          ...data,
          id: docSnap.id,
        });
      });
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, EMERGENCY_COLLECTION);
      if (onError) onError(error);
    }
  );
}

/**
 * Saves a new or updated donor to Firestore
 */
export async function saveDonorToFirestore(donor: Donor): Promise<void> {
  const docRef = doc(db, DONORS_COLLECTION, donor.id);
  try {
    await setDoc(docRef, {
      ...donor,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${DONORS_COLLECTION}/${donor.id}`);
  }
}

/**
 * Removes a donor from Firestore
 */
export async function deleteDonorFromFirestore(donorId: string): Promise<void> {
  const docRef = doc(db, DONORS_COLLECTION, donorId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${DONORS_COLLECTION}/${donorId}`);
  }
}

/**
 * Saves an emergency blood SOS request to Firestore
 */
export async function saveEmergencyRequestToFirestore(request: EmergencyRequest): Promise<void> {
  const docRef = doc(db, EMERGENCY_COLLECTION, request.id);
  try {
    await setDoc(docRef, request);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${EMERGENCY_COLLECTION}/${request.id}`);
  }
}
