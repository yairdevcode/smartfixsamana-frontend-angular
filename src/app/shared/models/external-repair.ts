export interface ExternalRepair {
  id?: number;
  clientName: string;
  phoneBrand: string;
  solution: string;
  repairPrice: number;
  partCost: number;
  status: 'REPARADO' | 'ENTREGADO' | 'PENDIENTE_RECOGER';
  date: string;
  notes?: string;
  settlementId?: number;
  partCatalogId?: number;
  partCatalogName?: string;
  partQuantity?: number;
  netProfit?: number;
  myShare?: number;
  storeShare?: number;
}

export interface ExternalRepairDTO {
  clientName: string;
  phoneBrand: string;
  solution: string;
  repairPrice: number;
  partCost: number;
  status: 'REPARADO' | 'ENTREGADO' | 'PENDIENTE_RECOGER';
  date: string;
  notes?: string;
  partCatalogId?: number | null;
  partQuantity?: number | null;
}

export interface ImportReconciliationResponse {
  entregadas: ExternalRepair[];
  pendientesRecoger: ExternalRepair[];
  totalEntregadas: number;
  totalPendientesRecoger: number;
  entregadasNuevas: number;
  entregadasPendientesAnteriores: number;
}

export interface Settlement {
  id?: number;
  startDate: string;
  endDate: string;
  totalRepairPrice: number;
  totalPartCost: number;
  totalMyShare: number;
  totalStoreShare: number;
  status: 'ABIERTA' | 'LIQUIDADA';
  createdAt?: string;
  repairCount?: number;
  warning?: string;
}
