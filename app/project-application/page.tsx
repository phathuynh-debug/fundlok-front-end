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

const projectApplicationSchema = z.object({
  legal_name: z.string().trim().min(2, 'Legal name is required'),
  tax_id: z.string().trim().min(3, 'Tax ID is required'),
  industry: z.string().trim().min(2, 'Industry is required'),
  incorporation_date: z.string().min(1, 'Incorporation date is required'),
  address: z.object({
    street: z.string().trim().min(2, 'Street is required'),
    city: z.string().trim().min(2, 'City is required'),
    state: z.string().trim().optional(),
    postal_code: z.string().trim().min(2, 'Postal code is required'),
    country: z.string().trim().min(2, 'Country is required'),
  }),
});

type ProjectApplicationValues = z.infer<typeof projectApplicationSchema>;

export default function ProjectApplicationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useRequireAuth();
  const shouldLoadProjects = !isAuthLoading && user?.role === 'SME';
  const { data: projects = [], isLoading } = useMyProjects(shouldLoadProjects);
  const { mutate: createProject, isPending } = useCreateProject();

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
            title: 'Application submitted',
            description: 'Your project is ready. Redirecting to the dashboard.',
          });
          router.replace('/dashboard');
        },
        onError: (error) => {
          toast({
            variant: 'destructive',
            title: 'Submission failed',
            description: error?.message || 'Please check the form and try again.',
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
          Checking your project access...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="flex flex-col justify-center gap-6">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Project Application
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
            Register the project your investors will see.
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted-foreground">
            Submit the basic company details and we will route your account into
            the dashboard once the project is created.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <InfoCard icon={<Building2 className="h-4 w-4" />} title="Business details" text="Tell us who you are and what you do." />
          <InfoCard icon={<MapPin className="h-4 w-4" />} title="Location" text="Add a complete operating address." />
          <InfoCard icon={<CalendarDays className="h-4 w-4" />} title="Company age" text="Share when you incorporated." />
        </div>
      </div>

      <Card className="border-border/60 shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Application form</CardTitle>
          <CardDescription>
            Fill in the fields below to create your first project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Field label="Legal name" htmlFor="legalName" error={errors.legal_name?.message}>
              <Input
                id="legalName"
                placeholder="Acme Holdings Limited"
                {...register('legal_name')}
                disabled={isPending}
              />
            </Field>

            <Field label="Tax ID" htmlFor="taxId" error={errors.tax_id?.message}>
              <Input
                id="taxId"
                placeholder="123456789"
                {...register('tax_id')}
                disabled={isPending}
              />
            </Field>

            <Field label="Industry" htmlFor="industry" error={errors.industry?.message}>
              <Input
                id="industry"
                placeholder="Fintech"
                {...register('industry')}
                disabled={isPending}
              />
            </Field>

            <Field
              label="Incorporation date"
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
                label="Street"
                htmlFor="street"
                error={errors.address?.street?.message}
              >
                <Input
                  id="street"
                  placeholder="123 Market Street"
                  {...register('address.street')}
                  disabled={isPending}
                />
              </Field>

              <Field
                label="City"
                htmlFor="city"
                error={errors.address?.city?.message}
              >
                <Input
                  id="city"
                  placeholder="Singapore"
                  {...register('address.city')}
                  disabled={isPending}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="State / region" htmlFor="state" error={errors.address?.state?.message}>
                <Input
                  id="state"
                  placeholder="Central"
                  {...register('address.state')}
                  disabled={isPending}
                />
              </Field>

              <Field
                label="Postal code"
                htmlFor="postalCode"
                error={errors.address?.postal_code?.message}
              >
                <Input
                  id="postalCode"
                  placeholder="018956"
                  {...register('address.postal_code')}
                  disabled={isPending}
                />
              </Field>
            </div>

            <Field
              label="Country"
              htmlFor="country"
              error={errors.address?.country?.message}
            >
              <Input
                id="country"
                placeholder="Singapore"
                {...register('address.country')}
                disabled={isPending}
              />
            </Field>

            <Button type="submit" className="w-full h-11" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting application...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit project application
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