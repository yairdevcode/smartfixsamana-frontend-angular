import { PartCatalog } from './part-catalog';
import { Repair } from './repair';

/**
 * Movement types matching backend enum MovementType.java
 */
export type MovementType =
  | 'PURCHASE'
  | 'SALE'
  | 'REPAIR_USE'
  | 'REPAIR_RETURN'
  | 'ADJUSTMENT'
  | 'DAMAGE';

/**
 * InventoryMovement model matching backend entity
 */
export interface InventoryMovement {
  id: number;
  partCatalog: PartCatalog;
  repair?: Repair;
  movementType: MovementType;
  quantity: number;
  reason?: string;
  notes?: string;
  createdAt: string;
}

/**
 * DTO for creating inventory movements - matches backend InventoryMovementDTO.java
 */
export interface InventoryMovementDTO {
  partCatalogId: number;
  movementType: MovementType;
  quantity: number;
  reason?: string;
  notes?: string;
}

/**
 * Helper to determine if a movement type increases stock
 */
export function isStockIncrease(type: MovementType): boolean {
  return type === 'PURCHASE' || type === 'REPAIR_RETURN' || type === 'ADJUSTMENT';
}

/**
 * Helper to determine if a movement type decreases stock
 */
export function isStockDecrease(type: MovementType): boolean {
  return type === 'SALE' || type === 'REPAIR_USE' || type === 'DAMAGE';
}

/**
 * Display labels for movement types (Spanish)
 */
export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  PURCHASE: 'Compra',
  SALE: 'Venta',
  REPAIR_USE: 'Uso en Reparacion',
  REPAIR_RETURN: 'Devolucion de Reparacion',
  ADJUSTMENT: 'Ajuste',
  DAMAGE: 'Dano/Perdida'
};

/**
 * CSS classes for movement type badges
 */
export const MOVEMENT_TYPE_CLASSES: Record<MovementType, string> = {
  PURCHASE: 'bg-green-100 text-green-800',
  SALE: 'bg-blue-100 text-blue-800',
  REPAIR_USE: 'bg-orange-100 text-orange-800',
  REPAIR_RETURN: 'bg-purple-100 text-purple-800',
  ADJUSTMENT: 'bg-gray-100 text-gray-800',
  DAMAGE: 'bg-red-100 text-red-800'
};

/**
 * Get the sign for display (+/-)
 */
export function getMovementSign(type: MovementType): string {
  return isStockIncrease(type) ? '+' : '-';
}
