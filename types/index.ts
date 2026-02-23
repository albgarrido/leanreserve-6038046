/**
 * Core TypeScript interfaces for LeanReserve
 * Based on the database schema defined in the architecture document
 */

export type BookingStatus = 'confirmed' | 'cancelled' | 'completed';

export interface Restaurant {
  id: string;
  name: string;
  email: string;
  timezone: string;
  owner_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TableInventory {
  id: string;
  restaurant_id: string;
  capacity: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  restaurant_id: string;
  customer_name: string;
  customer_email: string;
  booking_date: string; // ISO date format (YYYY-MM-DD)
  booking_time: string; // ISO time format (HH:MM:SS)
  guest_count: number;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
}

// Extended booking type with restaurant info for dashboard display
export interface BookingWithRestaurant extends Booking {
  restaurant: Pick<Restaurant, 'name' | 'email'>;
}

// Type for creating a new booking (omits auto-generated fields)
export type CreateBookingInput = Omit<
  Booking,
  'id' | 'created_at' | 'updated_at' | 'status'
> & {
  status?: BookingStatus;
};

// Type for updating inventory
export type UpdateInventoryInput = Pick<TableInventory, 'id' | 'quantity'>;

// Type for creating new inventory entry
export type CreateInventoryInput = Omit<
  TableInventory,
  'id' | 'created_at' | 'updated_at'
>;