import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { BookingList } from '@/components/BookingList';
import { Button } from '@/components/ui/Button';

/**
 * Staff Dashboard Page
 * 
 * Server-rendered page that fetches today's bookings for the authenticated
 * restaurant owner. Uses server-side auth via Supabase SSR.
 */
export default async function DashboardPage() {
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
    .select('id, name')
    .eq('owner_id', session.user.id)
    .single();

  if (!restaurant) {
    // User is authenticated but doesn't have a restaurant yet
    return (
      <main className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to LeanReserve
          </h1>
          <p className="text-gray-600 mb-6">
            You don&apos;t have a restaurant set up yet. Please configure your
            restaurant to start managing bookings.
          </p>
          <Button asChild>
            <a href="/settings">Set Up Restaurant</a>
          </Button>
        </div>
      </main>
    );
  }

  // Get today's date
  const today = new Date().toISOString().split('T')[0];

  // Fetch today's bookings with server-side rendering
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('booking_date', today)
    .order('booking_time', { ascending: true });

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {restaurant.name}
              </h1>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" asChild>
                <a href="/settings">Settings</a>
              </Button>
              <form action="/api/auth/signout" method="post">
                <Button type="submit" variant="secondary">
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Today&apos;s Bookings"
            value={bookings?.length || 0}
            color="blue"
          />
          <StatCard
            title="Total Guests"
            value={
              bookings?.reduce((sum, b) => sum + b.guest_count, 0) || 0
            }
            color="green"
          />
          <StatCard
            title="Confirmed"
            value={
              bookings?.filter((b) => b.status === 'confirmed').length || 0
            }
            color="purple"
          />
        </div>

        {/* Booking List */}
        <BookingList initialBookings={bookings || []} />
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: 'blue' | 'green' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
  };

  const textClasses = {
    blue: 'text-blue-900',
    green: 'text-green-900',
    purple: 'text-purple-900',
  };

  return (
    <div className={`rounded-lg border p-6 ${colorClasses[color]}`}>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className={`text-3xl font-bold mt-2 ${textClasses[color]}`}>{value}</p>
    </div>
  );
}