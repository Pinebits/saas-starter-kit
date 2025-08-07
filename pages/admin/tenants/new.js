import { useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Too Short!')
    .max(50, 'Too Long!')
    .required('Required'),
  slug: Yup.string()
    .min(2, 'Too Short!')
    .max(50, 'Too Long!')
    .matches(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens are allowed')
    .required('Required'),
});

export default function CreateTenant() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect to login if not logged in or to dashboard if not master admin
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    router.push('/auth/login');
    return null;
  }

  if (!session?.user?.isMasterAdmin) {
    router.push('/');
    return null;
  }

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        const tenant = await response.json();
        toast.success(`Tenant ${tenant.name} created successfully!`);
        resetForm();
        router.push(`/admin/tenants/${tenant.slug}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create tenant');
      }
    } catch (error) {
      toast.error('An error occurred while creating the tenant');
      console.error(error);
    } finally {
      setSubmitting(false);
      setIsSubmitting(false);
    }
  };

  // Function to generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Create New Tenant</h1>
        <Link href="/admin" className="text-blue-600 hover:underline">
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg p-6 max-w-2xl mx-auto">
        <Formik
          initialValues={{ name: '', slug: '' }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, values, setFieldValue, errors, touched }) => (
            <Form className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Tenant Name
                </label>
                <Field
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter tenant name"
                  className={`mt-1 block w-full border ${
                    errors.name && touched.name ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setFieldValue('name', newName);
                    
                    // Auto-generate slug if slug field is empty or matches the previous generated slug
                    if (!values.slug || values.slug === generateSlug(values.name)) {
                      setFieldValue('slug', generateSlug(newName));
                    }
                  }}
                />
                <ErrorMessage name="name" component="div" className="mt-1 text-sm text-red-600" />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                  Tenant Slug (URL identifier)
                </label>
                <Field
                  id="slug"
                  name="slug"
                  type="text"
                  placeholder="enter-tenant-slug"
                  className={`mt-1 block w-full border ${
                    errors.slug && touched.slug ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
                <ErrorMessage name="slug" component="div" className="mt-1 text-sm text-red-600" />
                <p className="mt-1 text-sm text-gray-500">
                  The slug will be used in URLs: /tenant/{values.slug || 'example'}
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {isSubmitting ? 'Creating...' : 'Create Tenant'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}