'use client';

import React, { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, CalendarDays, Loader2, MapPin, Send, ArrowRight, ArrowLeft } from 'lucide-react';
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
import { cn } from '@/lib/utils';

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

  const [currentStep, setCurrentStep] = useState(1);

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
    trigger,
    getValues,
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

  const handleNextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ['legal_name', 'tax_id', 'industry'];
    } else if (currentStep === 2) {
      fieldsToValidate = [
        'address.street',
        'address.city',
        'address.state',
        'address.postal_code',
        'address.country',
      ];
    } else if (currentStep === 3) {
      fieldsToValidate = ['incorporation_date'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

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
          <InfoCard
            icon={<Building2 className="h-4 w-4" />}
            title={t('projectApplication.info.businessTitle')}
            text={t('projectApplication.info.businessText')}
            isActive={currentStep === 1}
          />
          <InfoCard
            icon={<MapPin className="h-4 w-4" />}
            title={t('projectApplication.info.locationTitle')}
            text={t('projectApplication.info.locationText')}
            isActive={currentStep === 2}
          />
          <InfoCard
            icon={<CalendarDays className="h-4 w-4" />}
            title={t('projectApplication.info.companyAgeTitle')}
            text={t('projectApplication.info.companyAgeText')}
            isActive={currentStep === 3}
          />
        </div>
      </div>

      <div className="flex flex-col justify-between py-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">{t('projectApplication.card.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('projectApplication.card.description')}</p>
          </div>
          
          {/* Multi-step progress stepper */}
          <div className="flex items-center justify-between px-1 mb-2">
            {[
              { id: 1, label: t('projectApplication.info.businessTitle') },
              { id: 2, label: t('projectApplication.info.locationTitle') },
              { id: 3, label: t('projectApplication.info.companyAgeTitle') },
              { id: 4, label: t('projectApplication.info.reviewTitle') },
            ].map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                      currentStep === step.id
                        ? "bg-emerald-600 text-white ring-4 ring-emerald-600/20 shadow-sm"
                        : currentStep > step.id
                        ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-500/20"
                        : "bg-muted text-muted-foreground border border-transparent"
                    )}
                  >
                    {step.id}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold hidden sm:inline transition-colors",
                      currentStep === step.id ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {index < 3 && (
                  <div
                    className={cn(
                      "flex-1 h-[2px] mx-2 transition-colors duration-300",
                      currentStep > step.id ? "bg-emerald-600" : "bg-muted"
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Step 1: Business details */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
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
              </div>
            )}

            {/* Step 2: Location */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
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
              </div>
            )}

            {/* Step 3: Company age */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200">
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
              </div>
            )}

            {/* Step 4: Review Summary */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-in fade-in duration-200 text-sm">
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 space-y-3">
                  <h3 className="font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/50">
                    <Building2 className="h-4 w-4 text-emerald-600 animate-pulse" />
                    <span>{t('projectApplication.info.businessTitle')}</span>
                  </h3>
                  <div className="grid grid-cols-[120px_1fr] gap-y-2 text-muted-foreground">
                    <span>{t('projectApplication.fields.legalName')}:</span>
                    <span className="text-foreground font-semibold">{getValues('legal_name')}</span>

                    <span>{t('projectApplication.fields.taxId')}:</span>
                    <span className="text-foreground font-semibold">{getValues('tax_id')}</span>

                    <span>{t('projectApplication.fields.industry')}:</span>
                    <span className="text-foreground font-semibold">{getValues('industry')}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 space-y-3">
                  <h3 className="font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/50">
                    <MapPin className="h-4 w-4 text-emerald-600 animate-pulse" />
                    <span>{t('projectApplication.info.locationTitle')}</span>
                  </h3>
                  <div className="grid grid-cols-[120px_1fr] gap-y-2 text-muted-foreground">
                    <span>Address:</span>
                    <span className="text-foreground font-semibold leading-relaxed">
                      {getValues('address.street')}, {getValues('address.city')}
                      {getValues('address.state') ? `, ${getValues('address.state')}` : ''}
                      {`, ${getValues('address.postal_code')}`}, {getValues('address.country')}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 space-y-3">
                  <h3 className="font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/50">
                    <CalendarDays className="h-4 w-4 text-emerald-600 animate-pulse" />
                    <span>{t('projectApplication.info.companyAgeTitle')}</span>
                  </h3>
                  <div className="grid grid-cols-[120px_1fr] gap-y-2 text-muted-foreground">
                    <span>{t('projectApplication.fields.incorporationDate')}:</span>
                    <span className="text-foreground font-semibold">{getValues('incorporation_date')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation controls */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/60">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={isPending}
                  className="h-11 px-6 flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
              )}

              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="h-11 px-6 ml-auto flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <span>Next</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" className="h-11 px-6 ml-auto flex items-center gap-2" disabled={isPending}>
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
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  htmlFor: string;
  children: ReactNode;
  error?: string;
};

function Field({ label, htmlFor, children, error }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-sm font-semibold">{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive mt-1">{error}</p> : null}
    </div>
  );
}

type InfoCardProps = {
  icon: ReactNode;
  title: string;
  text: string;
  isActive?: boolean;
};

function InfoCard({ icon, title, text, isActive }: InfoCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-background/80 p-4 shadow-sm backdrop-blur transition-all duration-300",
        isActive
          ? "border-emerald-600 ring-2 ring-emerald-600/10 shadow-emerald-500/5 translate-y-[-2px] scale-[1.01]"
          : "border-border/60"
      )}
    >
      <div
        className={cn(
          "mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300",
          isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"
        )}
      >
        {icon}
      </div>
      <h2 className={cn("font-semibold text-sm transition-colors", isActive ? "text-emerald-700 dark:text-emerald-400" : "text-foreground")}>{title}</h2>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
    </div>
  );
}