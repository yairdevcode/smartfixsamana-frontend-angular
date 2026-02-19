/**
 * PartType model matching backend entity PartType.java
 */
export interface PartType {
  id?: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * PartTypeResponse - matches backend PartTypeResponse.java
 */
export interface PartTypeResponse {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * DTO for creating/updating part types - matches backend PartTypeDTO.java
 */
export interface PartTypeDTO {
  name: string;
  description?: string;
}
