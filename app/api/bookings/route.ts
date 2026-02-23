import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { validateBooking } from '@/lib/availability';
import { CreateBookingInput, Booking } from '@/types';

/**
 * POST /api/bookings
 * 
 * Creates a new booking after validating availability.
 * This endpoint is public (no auth required) to allow customers
 * to book directly via the web form.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'restaurant_id',
      'customer_name',
      'customer_email',
      'booking_date',
      'booking_time',
      'guest_count',
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
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
        { error: 'Invalid email address' },
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
          error: validation.reason,
          alternatives: validation.availability.alternatives,
        },
        { status: 409 }
      );
    }

    // Create the booking
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
      .insert(bookingData as any)
      .select('id')
      .single();

    if (insertError) {
      console.error('Booking insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create booking. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        bookingId: booking.id,
        message: `Your booking for ${guest_count} guest${
          guest_count > 1 ? 's' : ''
        } on ${booking_date} at ${booking_time} is confirmed.`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Booking API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}