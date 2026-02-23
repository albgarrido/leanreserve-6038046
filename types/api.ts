/**
 * API TypeScript interfaces for external integrations
 * ElevenLabs AI Agent and other webhook structures
 */

import { BookingStatus } from './index';

// ============================================================================
// ElevenLabs AI Agent API
// ============================================================================

/**
 * Request payload from ElevenLabs AI agent
 * Sent to POST /api/external/elevenlabs/booking
 */
export interface ElevenLabsBookingRequest {
  /** Restaurant identifier (UUID) */
  restaurant_id: string;
  /** Customer's full name */
  customer_name: string;
  /** Customer's email address */
  customer_email: string;
  /** Booking date in ISO format (YYYY-MM-DD) */
  booking_date: string;
  /** Booking time in 24-hour format (HH:MM) */
  booking_time: string;
  /** Number of guests for the reservation */
  guest_count: number;
}

/**
 * Response structure for successful booking via ElevenLabs
 */
export interface ElevenLabsBookingSuccessResponse {
  success: true;
  data: {
    booking_id: string;
    status: BookingStatus;
    message: string;
  };
}

/**
 * Response structure for failed booking via ElevenLabs
 */
export interface ElevenLabsBookingErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string;
  };
}

/**
 * Union type for ElevenLabs booking responses
 */
export type ElevenLabsBookingResponse =
  | ElevenLabsBookingSuccessResponse
  | ElevenLabsBookingErrorResponse;

// ============================================================================
// Availability Check API
// ============================================================================

/**
 * Request payload for checking table availability
 */
export interface AvailabilityCheckRequest {
  restaurant_id: string;
  booking_date: string;
  booking_time: string;
  guest_count: number;
}

/**
 * Response structure for availability check
 */
export interface AvailabilityCheckResponse {
  available: boolean;
  /** Suggested alternative times if not available (ISO time strings) */
  alternatives?: string[];
  /** Reason for unavailability (e.g., 'no_capacity', 'restaurant_closed') */
  reason?: string;
}

// ============================================================================
// Common API Response Wrappers
// ============================================================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// Webhook Payloads (for future extensions)
// ============================================================================

/**
 * Payload structure for booking confirmation webhooks
 */
export interface BookingConfirmationWebhook {
  event: 'booking.created';
  booking: {
    id: string;
    customer_name: string;
    customer_email: string;
    booking_date: string;
    booking_time: string;
    guest_count: number;
    restaurant_name: string;
  };
}