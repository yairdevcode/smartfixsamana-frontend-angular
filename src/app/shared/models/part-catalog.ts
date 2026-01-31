import { Phone } from './phone';

/**
 * PartCatalog model matching backend entity PartCatalog.java
 * Used when receiving data with nested Phone object (from some endpoints)
 */
export interface PartCatalog {
  id?: number;
  name: string;
  description?: string;
  phone?: Phone;
  quantity: number;
  minStock: number;
  purchasePrice?: number;
  salePrice?: number;
}

/**
 * PartCatalogResponse - matches backend PartCatalogResponse.java
 * This is what the backend actually returns from /api/parts-catalog endpoints
 */
export interface PartCatalogResponse {
  id: number;
  name: string;
  description?: string;
  phoneId?: number;
  phoneBrand?: string;
  phoneModel?: string;
  quantity: number;
  minStock: number;
  purchasePrice?: number;
  salePrice?: number;
  isLowStock: boolean;
}

/**
 * DTO for creating/updating parts catalog - matches backend PartCatalogDTO.java
 */
export interface PartCatalogDTO {
  name: string;
  description?: string;
  phoneId?: number;
  quantity?: number;
  minStock?: number;
  purchasePrice?: number;
  salePrice?: number;
}

/**
 * Check if a part is low on stock
 */
export function isLowStock(part: PartCatalog | PartCatalogResponse): boolean {
  if ('isLowStock' in part) {
    return part.isLowStock;
  }
  return part.quantity <= part.minStock;
}

/**
 * Check if a part is out of stock
 */
export function isOutOfStock(part: PartCatalog | PartCatalogResponse): boolean {
  return part.quantity <= 0;
}

/**
 * Convert PartCatalogResponse to PartCatalog for compatibility
 */
export function responseToPartCatalog(response: PartCatalogResponse): PartCatalog {
  return {
    id: response.id,
    name: response.name,
    description: response.description,
    phone: response.phoneId ? {
      id: response.phoneId,
      brand: response.phoneBrand || '',
      model: response.phoneModel || ''
    } : undefined,
    quantity: response.quantity,
    minStock: response.minStock,
    purchasePrice: response.purchasePrice,
    salePrice: response.salePrice
  };
}

/**
 * Create PartCatalogDTO from PartCatalog
 */
export function toPartCatalogDTO(part: Partial<PartCatalog>): PartCatalogDTO {
  return {
    name: part.name || '',
    description: part.description,
    phoneId: part.phone?.id,
    quantity: part.quantity,
    minStock: part.minStock,
    purchasePrice: part.purchasePrice,
    salePrice: part.salePrice
  };
}
