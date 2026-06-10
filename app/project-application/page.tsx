'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, CalendarDays, Loader2, MapPin, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRequireAuth } from '@/hooks/use-authentication';
import { useCreateProject, useMyProjects } from '@/hooks/use-projects';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { useTranslations } from '@/lib/i18n';

type ProjectApplicationValues = {
  legal_name: string;
  tax_id: string;
  industry: string;
  incorporation_date: string;
  address: {
    street: string;
    city: string;
    state?: string;
    postal_code: string;
    country: string;
  };
};

export default function ProjectApplicationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslations();
  const { user, isLoading: isAuthLoading } = useRequireAuth();
  const shouldLoadProjects = !isAuthLoading && user?.role === 'SME';
  const { data: projects = [], isLoading } = useMyProjects(shouldLoadProjects);
  const { mutate: createProject, isPending } = useCreateProject();

  const projectApplicationSchema = z.object({
    legal_name: z.string().trim().min(2, t('projectApplication.validation.legalName')),
    tax_id: z.string().trim().min(3, t('projectApplication.validation.taxId')),
    industry: z.string().trim().min(2, t('projectApplication.validation.industry')),
    incorporation_date: z.string().min(1, t('projectApplication.validation.incorporationDate')),
    address: z.object({
      street: z.string().trim().min(2, t('projectApplication.validation.street')),
      city: z.string().trim().min(2, t('projectApplication.validation.city')),
      state: z.string().trim().optional(),
      postal_code: z.string().trim().min(2, t('projectApplication.validation.postalCode')),
      country: z.string().trim().min(2, t('projectApplication.validation.country')),
    }),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectApplicationValues>({
    resolver: zodResolver(projectApplicationSchema),
    defaultValues: {
      legal_name: '',
      tax_id: '',
      industry: '',
      incorporation_date: '',
      address: {
        street: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
      },
    },
  });

  useEffect(() => {
    if (user?.role === 'INVESTOR') {
      router.replace('/dashboard');
      return;
    }

    if (user?.role === 'SME' && !isLoading && projects.length > 0) {
      router.replace('/dashboard');
    }
  }, [isLoading, projects.length, router, user?.role]);

  const onSubmit = (values: ProjectApplicationValues) => {
    createProject(
      values,
      {
        onSuccess: () => {
          toast({
            title: t('projectApplication.toasts.submittedTitle'),
            description: t('projectApplication.toasts.submittedDescription'),
          });
          router.replace('/dashboard');
        },
        onError: (error) => {
          toast({
            variant: 'destructive',
            title: t('projectApplication.toasts.failedTitle'),
            description: error?.message || t('projectApplication.toasts.failedDescription'),
          });
        },
      }
    );
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t('projectApplication.loading')}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="flex flex-col justify-center gap-6">
        <div className="flex justify-end lg:justify-start">
          <LocaleSwitcher />
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            {t('projectApplication.eyebrow')}
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
            {t('projectApplication.title')}
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted-foreground">
            {t('projectApplication.subtitle')}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <InfoCard icon={<Building2 className="h-4 w-4" />} title={t('projectApplication.info.businessTitle')} text={t('projectApplication.info.businessText')} />
          <InfoCard icon={<MapPin className="h-4 w-4" />} title={t('projectApplication.info.locationTitle')} text={t('projectApplication.info.locationText')} />
          <InfoCard icon={<CalendarDays className="h-4 w-4" />} title={t('projectApplication.info.companyAgeTitle')} text={t('projectApplication.info.companyAgeText')} />
        </div>
      </div>

      <Card className="border-border/60 shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">{t('projectApplication.card.title')}</CardTitle>
          <CardDescription>{t('projectApplication.card.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Field label={t('projectApplication.fields.legalName')} htmlFor="legalName" error={errors.legal_name?.message}>
              <Input
                id="legalName"
                placeholder={t('projectApplication.placeholders.legalName')}
                {...register('legal_name')}
                disabled={isPending}
              />
            </Field>

            <Field label={t('projectApplication.fields.taxId')} htmlFor="taxId" error={errors.tax_id?.message}>
              <Input
                id="taxId"
                placeholder={t('projectApplication.placeholders.taxId')}
                {...register('tax_id')}
                disabled={isPending}
              />
            </Field>

            <Field label={t('projectApplication.fields.industry')} htmlFor="industry" error={errors.industry?.message}>
              <Input
                id="industry"
                placeholder={t('projectApplication.placeholders.industry')}
                {...register('industry')}
                disabled={isPending}
              />
            </Field>

            <Field
              label={t('projectApplication.fields.incorporationDate')}
              htmlFor="incorporationDate"
              error={errors.incorporation_date?.message}
            >
              <Input
                id="incorporationDate"
                type="date"
                {...register('incorporation_date')}
                disabled={isPending}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t('projectApplication.fields.street')}
                htmlFor="street"
                error={errors.address?.street?.message}
              >
                <Input
                  id="street"
                  placeholder={t('projectApplication.placeholders.street')}
                  {...register('address.street')}
                  disabled={isPending}
                />
              </Field>

              <Field
                label={t('projectApplication.fields.city')}
                htmlFor="city"
                error={errors.address?.city?.message}
              >
                <Input
                  id="city"
                  placeholder={t('projectApplication.placeholders.city')}
                  {...register('address.city')}
                  disabled={isPending}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('projectApplication.fields.stateRegion')} htmlFor="state" error={errors.address?.state?.message}>
                <Input
                  id="state"
                  placeholder={t('projectApplication.placeholders.state')}
                  {...register('address.state')}
                  disabled={isPending}
                />
              </Field>

              <Field
                label={t('projectApplication.fields.postalCode')}
                htmlFor="postalCode"
                error={errors.address?.postal_code?.message}
              >
                <Input
                  id="postalCode"
                  placeholder={t('projectApplication.placeholders.postalCode')}
                  {...register('address.postal_code')}
                  disabled={isPending}
                />
              </Field>
            </div>

            <Field
              label={t('projectApplication.fields.country')}
              htmlFor="country"
              error={errors.address?.country?.message}
            >
              <Input
                id="country"
                placeholder={t('projectApplication.placeholders.country')}
                {...register('address.country')}
                disabled={isPending}
              />
            </Field>

            <Button type="submit" className="w-full h-11" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('projectApplication.card.submitting')}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {t('projectApplication.card.submit')}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
  error,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function InfoCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm backdrop-blur">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <h2 className="font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}