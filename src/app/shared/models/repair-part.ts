/**
 * RepairPart response model matching backend RepairPartResponse.java
 */
export interface RepairPart {
  id: number;
  partCatalogId: number;
  partCatalogName: string;
  phoneBrand?: string;
  phoneModel?: string;
  quantity: number;
  priceCharged: number;
  createdAt: string;
}

/**
 * Request DTO for adding a part to repair - matches backend RepairPartRequest.java
 */
export interface RepairPartRequest {
  partCatalogId: number;
  quantity?: number;
  priceCharged?: number;
}

/**
 * Calculate the total cost for a repair part
 */
export function calculateRepairPartTotal(part: RepairPart): number {
  return (part.priceCharged || 0) * (part.quantity || 1);
}

/**
 * Calculate total cost for all repair parts
 */
export function calculateTotalPartsCost(parts: RepairPart[]): number {
  return parts.reduce((sum, part) => sum + calculateRepairPartTotal(part), 0);
}
