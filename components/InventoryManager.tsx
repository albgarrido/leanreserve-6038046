'use client';

import React, { useState, useEffect } from 'react';
import { TableInventory } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface InventoryManagerProps {
  restaurantId: string;
}

export function InventoryManager({ restaurantId }: InventoryManagerProps) {
  const [inventory, setInventory] = useState<TableInventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch inventory on mount
  useEffect(() => {
    fetchInventory();
  }, [restaurantId]);

  const fetchInventory = async () => {
    try {
      const response = await fetch(`/api/inventory?restaurant_id=${restaurantId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }
      const data = await response.json();
      setInventory(data.inventory || []);
    } catch (err) {
      setError('Failed to load inventory. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update quantity for a specific capacity
  const updateQuantity = (capacity: number, quantity: number) => {
    setInventory((prev) => {
      const existing = prev.find((item) => item.capacity === capacity);
      if (existing) {
        return prev.map((item) =>
          item.capacity === capacity ? { ...item, quantity } : item
        );
      }
      return [
        ...prev,
        {
          id: '', // Will be assigned by backend
          restaurant_id: restaurantId,
          capacity,
          quantity,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
    });
  };

  // Save all inventory changes
  const saveInventory = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          inventory: inventory.map((item) => ({
            capacity: item.capacity,
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save inventory');
      }

      setSuccess('Inventory saved successfully!');
      fetchInventory(); // Refresh to get updated IDs
    } catch (err) {
      setError('Failed to save inventory. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Common table sizes
  const tableSizes = [1, 2, 3, 4, 5, 6, 8, 10, 12];

  // Calculate totals
  const totalTables = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const totalSeats = inventory.reduce(
    (sum, item) => sum + item.capacity * item.quantity,
    0
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Table Inventory</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Description */}
          <p className="text-sm text-gray-600">
            Configure how many tables you have for each party size. This is used
            to calculate availability for booking requests.
          </p>

          {/* Inventory Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {tableSizes.map((capacity) => {
              const item = inventory.find((i) => i.capacity === capacity);
              const quantity = item?.quantity || 0;

              return (
                <div
                  key={capacity}
                  className="border border-gray-200 rounded-lg p-4 text-center hover:border-blue-300 transition-colors"
                >
                  <div className="text-2xl mb-2">
                    {capacity <= 4 ? '🪑' : capacity <= 8 ? '🛋️' : '🍽️'}
                  </div>
                  <p className="font-medium text-gray-900 mb-1">
                    {capacity} {capacity === 1 ? 'seat' : 'seats'}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(capacity, Math.max(0, quantity - 1))
                      }
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-medium"
                      disabled={quantity === 0}
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-medium">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(capacity, quantity + 1)}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-medium"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4 flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-gray-500">Total Tables</p>
              <p className="text-2xl font-bold text-gray-900">{totalTables}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Seats</p>
              <p className="text-2xl font-bold text-gray-900">{totalSeats}</p>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={saveInventory}
              isLoading={isSaving}
              disabled={isSaving}
            >
              Save Inventory
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}