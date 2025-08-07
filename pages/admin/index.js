import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTenants: 0,
    totalUsers: 0,
    totalMasterAdmins: 0
  });

  // Check if user is master admin
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user?.isMasterAdmin) {
      toast.error('Only master administrators can access this page');
      router.push('/');
    }
  }, [session, status, router]);

  // Fetch tenants
  useEffect(() => {
    if (status === 'loading' || !session?.user?.isMasterAdmin) return;
    
    const fetchTenants = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/tenants');
        
        if (response.ok) {
          const data = await response.json();
          setTenants(data);
          setStats(prev => ({ ...prev, totalTenants: data.length }));
        } else {
          const error = await response.json();
          toast.error(error.error || 'Failed to fetch tenants');
        }
      } catch (error) {
        toast.error('An error occurred while fetching tenants');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTenants();
  }, [session, status]);

  // If still loading session or not master admin, show loading state
  if (status === 'loading' || !session?.user?.isMasterAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Loading...</h1>
          <p className="text-gray-500">Please wait while we check your credentials.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Master Administrator Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Total Tenants</h2>
          <p className="text-3xl font-bold">{stats.totalTenants}</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Quick Actions</h2>
          <div className="flex flex-col space-y-2">
            <Link href="/admin/tenants/new" className="text-blue-600 hover:underline">
              Create New Tenant
            </Link>
            <Link href="/admin/master-admins" className="text-blue-600 hover:underline">
              Manage Master Admins
            </Link>
            <Link href="/admin/audit-logs" className="text-blue-600 hover:underline">
              View Audit Logs
            </Link>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">System Status</h2>
          <p className="text-green-500 font-semibold">All systems operational</p>
          <p className="text-gray-500 text-sm mt-2">
            Last checked: {formatDistanceToNow(new Date(), { addSuffix: true })}
          </p>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Tenants</h2>
          <Link 
            href="/admin/tenants/new" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add New Tenant
          </Link>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading tenants...</p>
          </div>
        ) : tenants.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No tenants found. Create your first tenant to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{tenant.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{tenant.slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{tenant._count?.members || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">
                        {new Date(tenant.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Link 
                          href={`/admin/tenants/${tenant.slug}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Details
                        </Link>
                        <Link 
                          href={`/admin/tenants/${tenant.slug}/members`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Members
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}