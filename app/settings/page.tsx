import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { InventoryManager } from '@/components/InventoryManager';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

/**
 * Settings Page
 * 
 * Allows restaurant owners to configure their restaurant details
 * and manage table inventory.
 */
export default async function SettingsPage() {
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
    redirect('/login');
  }

  // Get the restaurant for this owner
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, email, timezone')
    .eq('owner_id', session.user.id)
    .single();

  // If no restaurant exists, show setup form
  if (!restaurant) {
    return (
      <main className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Set Up Your Restaurant
          </h1>
          <RestaurantSetupForm />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <Button variant="outline" asChild>
              <a href="/dashboard">← Back to Dashboard</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Settings Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Restaurant Details */}
        <Card>
          <CardHeader>
            <CardTitle>Restaurant Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-lg text-gray-900">{restaurant.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-lg text-gray-900">
                  {restaurant.email}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Timezone</dt>
                <dd className="mt-1 text-lg text-gray-900">
                  {restaurant.timezone}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Inventory Manager */}
        <InventoryManager restaurantId={restaurant.id} />
      </div>
    </main>
  );
}

/**
 * Simple setup form for new restaurants
 * In a real app, this would be a full form component
 */
function RestaurantSetupForm() {
  return (
    <Card>
      <CardContent className="py-8 text-center">
        <div className="text-6xl mb-4">🏪</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Create Your Restaurant
        </h2>
        <p className="text-gray-600 mb-6">
          You need to set up your restaurant profile before you can manage
          bookings.
        </p>
        <form action="/api/restaurant/setup" method="post" className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant Name
            </label>
            <input
              type="text"
              name="name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="My Restaurant"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="contact@restaurant.com"
            />
          </div>
          <Button type="submit" className="w-full">
            Create Restaurant
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}