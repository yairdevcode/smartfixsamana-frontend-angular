import { Customer } from './customer';
import { Phone } from './phone';
import { RepairPart } from './repair-part';

/**
 * Repair model matching backend entity Repair.java
 * Used for displaying repair data received from the API
 */
export interface Repair {
  id?: number;
  customer: Customer;
  phone: Phone;
  fault: string;
  state: string;
  date: string;
  partsUsed?: RepairPart[];
  totalPartsCost?: number;
  laborCost?: number;
  totalCost?: number;
}

/**
 * DTO for creating/updating repairs - matches backend RepairDTO.java
 * Backend expects customerId and phoneId, not full objects
 */
export interface RepairDTO {
  customerId: number;
  phoneId: number;
  fault: string;
  state: string;
  date: string;
  laborCost?: number;
}

/**
 * Repair states enum for consistency
 */
export type RepairState =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'WAITING_PARTS'
  | 'COMPLETED'
  | 'DELIVERED'
  | 'CANCELLED';

/**
 * Display labels for repair states (Spanish)
 */
export const REPAIR_STATE_LABELS: Record<RepairState, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En Progreso',
  WAITING_PARTS: 'Esperando Repuestos',
  COMPLETED: 'Completado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado'
};

/**
 * CSS classes for repair state badges
 */
export const REPAIR_STATE_CLASSES: Record<RepairState, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  WAITING_PARTS: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800',
  DELIVERED: 'bg-purple-100 text-purple-800',
  CANCELLED: 'bg-red-100 text-red-800'
};

/**
 * Helper to create a RepairDTO from form data
 */
export function createRepairDTO(
  customerId: number,
  phoneId: number,
  fault: string,
  state: string,
  date: string,
  laborCost?: number
): RepairDTO {
  return {
    customerId,
    phoneId,
    fault,
    state,
    date,
    laborCost: laborCost ?? 0
  };
}
