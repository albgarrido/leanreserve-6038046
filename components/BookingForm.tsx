'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface BookingFormData {
  customer_name: string;
  customer_email: string;
  booking_date: string;
  booking_time: string;
  guest_count: number;
}

interface BookingFormProps {
  restaurantId: string;
}

export function BookingForm({ restaurantId }: BookingFormProps) {
  const [formData, setFormData] = useState<BookingFormData>({
    customer_name: '',
    customer_email: '',
    booking_date: '',
    booking_time: '',
    guest_count: 2,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    bookingId: string;
    message: string;
  } | null>(null);
  const [alternatives, setAlternatives] = useState<string[]>([]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'guest_count' ? parseInt(value) || 1 : value,
    }));
    setError(null);
    setAlternatives([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    setAlternatives([]);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          restaurant_id: restaurantId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.alternatives && data.alternatives.length > 0) {
          setAlternatives(data.alternatives);
        }
        throw new Error(data.error || 'Failed to create booking');
      }

      setSuccess({
        bookingId: data.bookingId,
        message: data.message,
      });

      // Reset form
      setFormData({
        customer_name: '',
        customer_email: '',
        booking_date: '',
        booking_time: '',
        guest_count: 2,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get today's date for min attribute
  const today = new Date().toISOString().split('T')[0];

  if (success) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-green-600">
            Booking Confirmed!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-6xl mb-4">✓</div>
          <p className="text-gray-600">{success.message}</p>
          <p className="text-sm text-gray-500">
            Booking ID: <code className="bg-gray-100 px-2 py-1 rounded">{success.bookingId}</code>
          </p>
          <Button
            variant="outline"
            onClick={() => setSuccess(null)}
            className="mt-4"
          >
            Make Another Booking
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Make a Reservation</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            name="customer_name"
            type="text"
            required
            value={formData.customer_name}
            onChange={handleChange}
            placeholder="John Doe"
          />

          <Input
            label="Email Address"
            name="customer_email"
            type="email"
            required
            value={formData.customer_email}
            onChange={handleChange}
            placeholder="john@example.com"
          />

          <Input
            label="Date"
            name="booking_date"
            type="date"
            required
            min={today}
            value={formData.booking_date}
            onChange={handleChange}
          />

          <Input
            label="Time"
            name="booking_time"
            type="time"
            required
            min="11:00"
            max="21:30"
            value={formData.booking_time}
            onChange={handleChange}
            helperText="Restaurant hours: 11:00 AM - 10:00 PM"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Guests
            </label>
            <select
              name="guest_count"
              value={formData.guest_count}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'guest' : 'guests'}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
              {alternatives.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-2">
                    Alternative times available:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {alternatives.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, booking_time: time }))
                        }
                        className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Checking Availability...' : 'Request Booking'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}