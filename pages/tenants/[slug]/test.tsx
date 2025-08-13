import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function TenantTestPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/tenants/${slug}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data</div>;

  return (
    <div className="p-4">
      <h1>Tenant Test Page</h1>
      <p>Slug: {slug}</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
