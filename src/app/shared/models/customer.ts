/**
 * Customer model matching backend entity Customer.java
 */
export interface Customer {
  id?: number;
  name: string;
  lastname: string;
  phone: string;
  email: string;
}

/**
 * DTO for creating/updating customers
 */
export interface CustomerDTO {
  name: string;
  lastname: string;
  phone: string;
  email: string;
}
