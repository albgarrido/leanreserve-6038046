import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * GET /api/inventory?restaurant_id=xxx
 * 
 * Fetches the table inventory for a restaurant.
 * Requires authentication.
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get restaurant_id from query params
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurant_id');

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Missing restaurant_id parameter' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('id', restaurantId)
      .eq('owner_id', session.user.id)
      .single();

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch inventory
    const { data: inventory, error } = await supabase
      .from('table_inventory')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('capacity', { ascending: true });

    if (error) {
      console.error('Error fetching inventory:', error);
      return NextResponse.json(
        { error: 'Failed to fetch inventory' },
        { status: 500 }
      );
    }

    return NextResponse.json({ inventory }, { status: 200 });
  } catch (error) {
    console.error('Inventory API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/inventory
 * 
 * Updates the table inventory for a restaurant.
 * Requires authentication.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { restaurant_id, inventory } = body;

    if (!restaurant_id || !Array.isArray(inventory)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('id', restaurant_id)
      .eq('owner_id', session.user.id)
      .single();

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found or access denied' },
        { status: 404 }
      );
    }

    // Delete existing inventory and insert new values
    // This is simpler than upsert for this use case
    const { error: deleteError } = await supabase
      .from('table_inventory')
      .delete()
      .eq('restaurant_id', restaurant_id);

    if (deleteError) {
      console.error('Error deleting inventory:', deleteError);
      return NextResponse.json(
        { error: 'Failed to update inventory' },
        { status: 500 }
      );
    }

    // Filter out zero quantities and insert new inventory
    const inventoryToInsert = inventory
      .filter((item) => item.quantity > 0)
      .map((item) => ({
        restaurant_id,
        capacity: item.capacity,
        quantity: item.quantity,
      }));

    if (inventoryToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('table_inventory')
        .insert(inventoryToInsert);

      if (insertError) {
        console.error('Error inserting inventory:', insertError);
        return NextResponse.json(
          { error: 'Failed to save inventory' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { success: true, message: 'Inventory updated' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Inventory API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}