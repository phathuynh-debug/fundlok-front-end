import { Card } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import { useTranslations } from "@/lib/i18n"

interface PaymentRecord {
  date: string
  amount: number
}

interface PaymentHistoryProps {
  payments: PaymentRecord[]
}

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  const { t } = useTranslations()

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">{t("investment.paymentHistory.title")}</h3>
        <p className="text-sm text-muted-foreground">{t("investment.paymentHistory.subtitle")}</p>
      </div>

      <div className="divide-y">
        {payments.map((payment, idx) => (
          <div key={idx} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{payment.date}</span>
            </div>
            <span className="text-sm font-bold text-emerald-600">
              +${payment.amount}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
