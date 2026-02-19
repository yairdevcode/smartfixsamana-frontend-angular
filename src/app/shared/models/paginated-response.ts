/**
 * Generic interface for paginated responses from the backend.
 * Maps to Spring Data Page structure.
 */
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // Current page (0-indexed)
  numberOfElements: number; // Elements in current page
  first: boolean;
  last: boolean;
  empty: boolean;
}

/**
 * Parameters for paginated requests
 */
export interface PaginationParams {
  page: number;
  size: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

/**
 * Default pagination configuration
 */
export const DEFAULT_PAGINATION: PaginationParams = {
  page: 0,
  size: 10,
  sortBy: 'id',
  sortDirection: 'desc'
};

/**
 * Available page sizes for user selection
 */
export const PAGE_SIZE_OPTIONS: number[] = [4, 10, 25, 50];
