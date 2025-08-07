import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ManageMasterAdmins() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [masterAdmins, setMasterAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  // Check if user is master admin
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user?.isMasterAdmin) {
      toast.error('Only master administrators can access this page');
      router.push('/');
    }
  }, [session, status, router]);

  // Fetch master admins
  useEffect(() => {
    if (status === 'loading' || !session?.user?.isMasterAdmin) return;
    
    const fetchMasterAdmins = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/master-admins');
        
        if (response.ok) {
          const data = await response.json();
          setMasterAdmins(data);
        } else {
          const error = await response.json();
          toast.error(error.error || 'Failed to fetch master administrators');
        }
      } catch (error) {
        toast.error('An error occurred while fetching master administrators');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMasterAdmins();
  }, [session, status]);

  // Fetch users for dropdown
  useEffect(() => {
    if (status === 'loading' || !session?.user?.isMasterAdmin) return;
    
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users');
        
        if (response.ok) {
          const data = await response.json();
          // Filter out users who are already master admins
          const regularUsers = data.filter(user => !user.isMasterAdmin);
          setUsers(regularUsers);
        } else {
          const error = await response.json();
          toast.error(error.error || 'Failed to fetch users');
        }
      } catch (error) {
        toast.error('An error occurred while fetching users');
        console.error(error);
      }
    };
    
    fetchUsers();
  }, [session, status, masterAdmins]);

  const handleAddMasterAdmin = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) {
      toast.error('Please select a user to designate as a master administrator');
      return;
    }
    
    setIsAddingAdmin(true);
    
    try {
      const response = await fetch('/api/admin/master-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser })
      });
      
      if (response.ok) {
        const newAdmin = await response.json();
        setMasterAdmins([...masterAdmins, newAdmin]);
        toast.success(`${newAdmin.name} is now a master administrator`);
        setSelectedUser('');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add master administrator');
      }
    } catch (error) {
      toast.error('An error occurred while adding master administrator');
      console.error(error);
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleRevokeMasterAdmin = async (userId) => {
    if (!confirm('Are you sure you want to revoke master administrator privileges from this user?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/master-admins/${userId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setMasterAdmins(masterAdmins.filter(admin => admin.id !== userId));
        toast.success('Master administrator privileges revoked successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to revoke master administrator privileges');
      }
    } catch (error) {
      toast.error('An error occurred while revoking master administrator privileges');
      console.error(error);
    }
  };

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Master Administrators</h1>
        <Link href="/admin" className="text-blue-600 hover:underline">
          Back to Dashboard
        </Link>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Master Administrator</h2>
        <form onSubmit={handleAddMasterAdmin} className="space-y-4">
          <div>
            <label htmlFor="user" className="block text-sm font-medium text-gray-700">
              Select User
            </label>
            <select 
              id="user"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              disabled={isAddingAdmin}
            >
              <option value="">Select a user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isAddingAdmin || !selectedUser}
            >
              {isAddingAdmin ? 'Adding...' : 'Add Master Administrator'}
            </button>
          </div>
        </form>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Current Master Administrators</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading master administrators...</p>
          </div>
        ) : masterAdmins.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No master administrators found.</p>
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
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Designated On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {masterAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{admin.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{admin.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleRevokeMasterAdmin(admin.id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={masterAdmins.length <= 1}
                        title={masterAdmins.length <= 1 ? "Cannot remove the last master administrator" : ""}
                      >
                        {masterAdmins.length <= 1 ? (
                          "Cannot Remove"
                        ) : (
                          "Revoke Admin"
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {masterAdmins.length > 0 && (
          <p className="text-sm text-gray-500 mt-4">
            Note: You must always have at least one master administrator in the system.
          </p>
        )}
      </div>
    </div>
  );
}