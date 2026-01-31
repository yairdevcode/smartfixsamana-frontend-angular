/**
 * Phone model matching backend entity Phone.java
 */
export interface Phone {
  id?: number;
  brand: string;
  model: string;
}

/**
 * DTO for creating/updating phones
 */
export interface PhoneDTO {
  brand: string;
  model: string;
}
