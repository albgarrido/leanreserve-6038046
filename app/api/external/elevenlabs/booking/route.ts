import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { validateBooking } from '@/lib/availability';
import {
  ElevenLabsBookingRequest,
  ElevenLabsBookingResponse,
  CreateBookingInput,
} from '@/types';

/**
 * POST /api/external/elevenlabs/booking
 * 
 * External API endpoint for ElevenLabs AI voice agent integration.
 * This endpoint allows AI agents to create bookings on behalf of customers
 * via phone conversations.
 * 
 * Authentication: This endpoint should be protected by an API key
 * in production (passed via Authorization header).
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ElevenLabsBookingResponse>> {
  try {
    // In production, validate API key from Authorization header
    // const authHeader = request.headers.get('authorization');
    // if (!authHeader || !validateApiKey(authHeader)) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: {
    //         code: 'UNAUTHORIZED',
    //         message: 'Invalid or missing API key',
    //       },
    //     },
    //     { status: 401 }
    //   );
    // }

    const body: ElevenLabsBookingRequest = await request.json();

    // Validate required fields
    const requiredFields: (keyof ElevenLabsBookingRequest)[] = [
      'restaurant_id',
      'customer_name',
      'customer_email',
      'booking_date',
      'booking_time',
      'guest_count',
    ];

    const missingFields = requiredFields.filter((field) => !body[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: `Missing required fields: ${missingFields.join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    const {
      restaurant_id,
      customer_name,
      customer_email,
      booking_date,
      booking_time,
      guest_count,
    } = body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer_email)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_EMAIL',
            message: 'The email address provided is not valid',
          },
        },
        { status: 400 }
      );
    }

    // Validate guest count
    if (guest_count < 1 || guest_count > 20) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_GUEST_COUNT',
            message: 'Guest count must be between 1 and 20',
          },
        },
        { status: 400 }
      );
    }

    // Check availability using the resource bucket logic
    const validation = await validateBooking({
      restaurantId: restaurant_id,
      bookingDate: booking_date,
      bookingTime: booking_time,
      guestCount: guest_count,
    });

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_AVAILABILITY',
            message: validation.reason || 'No availability for the requested time',
            details: validation.availability.alternatives?.length
              ? `Alternative times: ${validation.availability.alternatives.join(', ')}`
              : undefined,
          },
        },
        { status: 409 }
      );
    }

    // Create the booking using service role (bypasses RLS)
    const bookingData: CreateBookingInput = {
      restaurant_id,
      customer_name: customer_name.trim(),
      customer_email: customer_email.trim().toLowerCase(),
      booking_date,
      booking_time: booking_time + ':00', // Add seconds for time format
      guest_count,
      status: 'confirmed',
    };

    const { data: booking, error: insertError } = await supabaseAdmin
      .from('bookings')
      .insert(bookingData)
      .select('id, status')
      .single();

    if (insertError) {
      console.error('ElevenLabs booking insert error:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BOOKING_FAILED',
            message: 'Unable to complete the booking. Please try again.',
          },
        },
        { status: 500 }
      );
    }

    // Return success response formatted for ElevenLabs agent
    return NextResponse.json(
      {
        success: true,
        data: {
          booking_id: booking.id,
          status: booking.status,
          message: `Booking confirmed! Your reservation for ${guest_count} guest${
            guest_count > 1 ? 's' : ''
          } on ${formatDateForSpeech(booking_date)} at ${formatTimeForSpeech(
            booking_time
          )} has been confirmed.`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('ElevenLabs API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred. Please try again.',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Format date for natural speech output
 * e.g., "2024-03-15" -> "March 15th, 2024"
 */
function formatDateForSpeech(dateStr: string): string {
  const date = new Date(dateStr);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const suffix = getDaySuffix(day);
  const year = date.getFullYear();
  return `${month} ${day}${suffix}, ${year}`;
}

/**
 * Format time for natural speech output
 * e.g., "19:30" -> "7:30 PM"
 */
function formatTimeForSpeech(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Get ordinal suffix for day number
 */
function getDaySuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}