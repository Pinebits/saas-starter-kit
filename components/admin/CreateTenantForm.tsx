import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { Card, Button, Input, FormErrorMessage } from '@/components/shared';
import { useFormik } from 'formik';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import * as Yup from 'yup';
import { slugify } from '@/lib/server-common';

const CreateTenantForm = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required(t('name-required')),
    }),
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        const response = await fetch('/api/tenants', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: values.name,
            slug: slugify(values.name),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create tenant');
        }

        const result = await response.json();
        toast.success(t('tenant-created'));
        router.push(`/tenants/${result.data.slug}/settings`);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('create-new-tenant')}</h1>
      
      <Card>
        <Card.Header>
          <Card.Title>{t('tenant-details')}</Card.Title>
          <Card.Description>
            {t('enter-tenant-details-to-create')}
          </Card.Description>
        </Card.Header>
        <Card.Body>
          <form onSubmit={formik.handleSubmit}>
            <div className="mb-4">
              <Input
                name="name"
                label={t('tenant-name')}
                placeholder={t('enter-tenant-name')}
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && formik.errors.name}
                required
              />
              {formik.touched.name && formik.errors.name && (
                <FormErrorMessage>{formik.errors.name}</FormErrorMessage>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('tenant-slug')}
              </label>
              <div className="text-gray-500 bg-gray-50 border border-gray-300 rounded-md px-3 py-2">
                {formik.values.name ? slugify(formik.values.name) : '-'}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {t('slug-auto-generated')}
              </p>
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <Button
                variant="secondary"
                onClick={() => router.push('/admin')}
                disabled={isSubmitting}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formik.isValid}
                loading={isSubmitting}
              >
                {t('create-tenant')}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CreateTenantForm;