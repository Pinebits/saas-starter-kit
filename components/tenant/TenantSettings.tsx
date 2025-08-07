import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { Card, Button, Input, FormErrorMessage } from '@/components/shared';
import { useFormik } from 'formik';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import * as Yup from 'yup';
import { slugify } from '@/lib/server-common';

const TenantSettings = ({ tenant }) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain || '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required(t('name-required')),
      slug: Yup.string().required(t('slug-required')),
      domain: Yup.string(),
    }),
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        const response = await fetch(`/api/tenants/${tenant.slug}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to update tenant');
        }

        const result = await response.json();
        toast.success(t('tenant-updated'));
        
        // If slug changed, redirect to new URL
        if (result.data.slug !== tenant.slug) {
          router.push(`/tenants/${result.data.slug}/settings`);
        }
      } catch (error) {
        toast.error(error.message);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div>
      <Card>
        <Card.Header>
          <Card.Title>{t('tenant-settings')}</Card.Title>
          <Card.Description>{t('tenant-settings-config')}</Card.Description>
        </Card.Header>
        <Card.Body>
          <form onSubmit={formik.handleSubmit}>
            <div className="space-y-4">
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
              
              <Input
                name="slug"
                label={t('tenant-slug')}
                placeholder={t('enter-tenant-slug')}
                value={formik.values.slug}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.slug && formik.errors.slug}
                required
              />
              
              <Input
                name="domain"
                label={t('tenant-domain')}
                placeholder={t('enter-tenant-domain')}
                value={formik.values.domain}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.domain && formik.errors.domain}
              />
              
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting || !formik.isValid}
                  loading={isSubmitting}
                >
                  {t('save-changes')}
                </Button>
              </div>
            </div>
          </form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default TenantSettings;