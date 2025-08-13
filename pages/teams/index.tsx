import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function TeamsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect from /teams to /tenants
    router.replace('/tenants');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-2">Redirecting...</h1>
        <p className="text-gray-600">Redirecting from teams to tenants...</p>
      </div>
    </div>
  );
}
