import { BloodGroup } from '../types/blood';

export const ALL_BLOOD_GROUPS: BloodGroup[] = [
  'O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'
];

/**
 * Returns an array of donor blood groups that a patient with recipientGroup can safely receive blood from.
 */
export function getCompatibleDonorGroups(recipientGroup: BloodGroup): BloodGroup[] {
  switch (recipientGroup) {
    case 'O-':
      return ['O-'];
    case 'O+':
      return ['O-', 'O+'];
    case 'A-':
      return ['O-', 'A-'];
    case 'A+':
      return ['O-', 'O+', 'A-', 'A+'];
    case 'B-':
      return ['O-', 'B-'];
    case 'B+':
      return ['O-', 'O+', 'B-', 'B+'];
    case 'AB-':
      return ['O-', 'A-', 'B-', 'AB-'];
    case 'AB+':
      // Universal recipient
      return ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
    default:
      return [recipientGroup];
  }
}

/**
 * Returns an array of recipient blood groups that a donor with donorGroup can safely give blood to.
 */
export function getCanDonateTo(donorGroup: BloodGroup): BloodGroup[] {
  switch (donorGroup) {
    case 'O-':
      // Universal donor
      return ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
    case 'O+':
      return ['O+', 'A+', 'B+', 'AB+'];
    case 'A-':
      return ['A-', 'A+', 'AB-', 'AB+'];
    case 'A+':
      return ['A+', 'AB+'];
    case 'B-':
      return ['B-', 'B+', 'AB-', 'AB+'];
    case 'B+':
      return ['B+', 'AB+'];
    case 'AB-':
      return ['AB-', 'AB+'];
    case 'AB+':
      return ['AB+'];
    default:
      return [donorGroup];
  }
}

export function isDonorCompatible(donorGroup: BloodGroup, recipientGroup: BloodGroup): boolean {
  const compatibleGroups = getCompatibleDonorGroups(recipientGroup);
  return compatibleGroups.includes(donorGroup);
}
