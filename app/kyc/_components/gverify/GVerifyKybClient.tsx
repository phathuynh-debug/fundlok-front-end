'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Building2,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  LogOut,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from '@/lib/i18n';
import { useCurrentUser, useLogout } from '@/hooks/use-authentication';
import { useGVerifyKybStatus } from '@/hooks/use-gverify';
import type { GVerifyKybDocumentType } from '@/services/gverify.service';
import { kycLandingForRole } from '../../kyc-landing';
import { StatusBlock } from '../status-block';
import { DocumentCaptureField } from './DocumentCaptureField';
import { useGVerifyKyb } from './useGVerifyKyb';
import type { ApiError } from '@/lib/types';

const DOCUMENT_TYPES: Array<{
  value: GVerifyKybDocumentType;
  labelKey: string;
  docLabelKey: string;
}> = [
  { value: 'COMPANY', labelKey: 'kyc.kyb.typeCompany', docLabelKey: 'kyc.kyb.docLabelCompany' },
  {
    value: 'COMPANY_BRANCH',
    labelKey: 'kyc.kyb.typeBranch',
    docLabelKey: 'kyc.kyb.docLabelBranch',
  },
  {
    value: 'HOUSEHOLD',
    labelKey: 'kyc.kyb.typeHousehold',
    docLabelKey: 'kyc.kyb.docLabelHousehold',
  },
];

// SME business verification via GVerify eKYB — the in-app replacement for the
// Didit hosted KYB flow. The SME uploads the business registration certificate
// (photo or PDF), we OCR it and cross-check the tax code against the state
// registry, and the verdict comes back synchronously.
export function GVerifyKybClient() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslations();
  const { data: user } = useCurrentUser();
  const { mutate: logout, isPending: loggingOut } = useLogout();
  const { data: status } = useGVerifyKybStatus();
  const {
    document,
    setFile,
    reset,
    documentType,
    selectDocumentType,
    ready,
    submit,
    submitting,
  } = useGVerifyKyb();

  // After a REJECTED/FAILED verdict the result screen shows first; "try again"
  // flips into capture mode for a fresh attempt.
  const [retaking, setRetaking] = useState(false);

  const landing = kycLandingForRole(user?.role);
  const isApproved = status?.is_approved === true;

  useEffect(() => {
    if (isApproved) {
      const id = setTimeout(() => router.replace(landing), 1200);
      return () => clearTimeout(id);
    }
  }, [isApproved, router, landing]);

  const handleSubmit = async () => {
    try {
      const verdict = await submit();
      setRetaking(false);
      if (verdict.status === 'REJECTED') reset();
    } catch (err) {
      const apiError = err as ApiError;
      setRetaking(false);
      toast({
        variant: 'destructive',
        title: t('kyc.gv.errorTitle'),
        description: apiError?.message || t('kyc.startErrorDescription'),
      });
    }
  };

  const showResult =
    !retaking && (status?.status === 'REJECTED' || status?.status === 'FAILED');

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-lg space-y-6 rounded-2xl border border-border bg-card p-8 text-center text-card-foreground shadow-lg"
      >
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            disabled={loggingOut}
            onClick={() => logout()}
          >
            {loggingOut ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            {t('common.logout')}
          </Button>
          <LocaleSwitcher />
        </div>

        {/* --- Approved --- */}
        {isApproved ? (
          <StatusBlock
            icon={<CheckCircle2 className="h-12 w-12 text-emerald-500" />}
            title={t('kyc.kyb.approvedTitle')}
            hint={t('kyc.kyb.approvedHint')}
          />
        ) : /* --- Loading the latest attempt --- */ !status ? (
          <StatusBlock
            icon={<Loader2 className="h-12 w-12 animate-spin text-primary" />}
            title={t('kyc.inProgress')}
            hint={t('kyc.checking')}
          />
        ) : /* --- Last attempt rejected / provider failure --- */ showResult ? (
          <StatusBlock
            icon={
              status.status === 'REJECTED' ? (
                <XCircle className="h-12 w-12 text-destructive" />
              ) : (
                <AlertTriangle className="h-12 w-12 text-amber-500" />
              )
            }
            title={t(status.status === 'REJECTED' ? 'kyc.kyb.declinedTitle' : 'kyc.gv.failedTitle')}
            hint={
              status.status === 'REJECTED'
                ? status.rejection_reason || t('kyc.declinedHint')
                : t('kyc.gv.failedHint')
            }
          >
            <Button className="h-11 w-full" onClick={() => setRetaking(true)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {t('kyc.retryBtn')}
            </Button>
          </StatusBlock>
        ) : (
          /* --- Capture: certificate type + document + submit --- */
          <>
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Building2 className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  {t('kyc.kyb.title')}
                </h1>
                <p className="text-muted-foreground">{t('kyc.kyb.subtitle')}</p>
              </div>
            </div>

            <div className="space-y-2 text-left">
              <label className="text-sm font-semibold text-foreground">
                {t('kyc.kyb.typeLabel')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {DOCUMENT_TYPES.map(({ value, labelKey }) => (
                  <Button
                    key={value}
                    type="button"
                    variant={documentType === value ? 'default' : 'outline'}
                    className="h-auto whitespace-normal px-2 py-2 text-xs"
                    disabled={submitting}
                    onClick={() => selectDocumentType(value)}
                  >
                    {t(labelKey)}
                  </Button>
                ))}
              </div>
            </div>

            <DocumentCaptureField
              document={document}
              disabled={submitting}
              onSelect={setFile}
              label={t(
                DOCUMENT_TYPES.find((d) => d.value === documentType)?.docLabelKey ??
                  'kyc.kyb.docLabelCompany',
              )}
            />

            <p className="text-xs leading-relaxed text-muted-foreground">
              {t('kyc.kyb.consent')}
            </p>

            <Button
              type="button"
              className="h-12 w-full text-base font-medium"
              disabled={!ready || submitting}
              onClick={handleSubmit}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('kyc.gv.submitting')}
                </>
              ) : (
                t('kyc.gv.submitBtn')
              )}
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}
