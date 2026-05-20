import React, { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { DollarSign } from "lucide-react"

export function InvestmentTab() {
  const [amount, setAmount] = useState("")
  const [isPending, setIsPending] = useState(false)
  const { toast } = useToast()

  const maxAmount = 15000
  const progressPercent = 70.0

  const handleInvest = (e: React.FormEvent) => {
    e.preventDefault()
    const numericAmount = parseFloat(amount)

    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a valid investment amount.",
      })
      return
    }

    if (numericAmount > maxAmount) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: `The maximum remaining amount you can invest is $${maxAmount.toLocaleString()}.`,
      })
      return
    }

    setIsPending(true)
    setTimeout(() => {
      setIsPending(false)
      toast({
        title: "Investment Successful",
        description: `Successfully invested $${numericAmount.toLocaleString()} in this project!`,
      })
      setAmount("")
    }, 1500)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Funding Progress Card */}
      <Card className="p-6 md:p-8 rounded-2xl border shadow-sm bg-card space-y-6">
        <div>
          <h3 className="text-xl font-bold text-foreground">Funding Progress</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Track how much of this loan has been funded
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-foreground">{progressPercent.toFixed(1)}%</span>
          </div>
          {/* Progress Bar Container */}
          <div className="w-full bg-muted h-3.5 rounded-full overflow-hidden">
            <div 
              className="bg-foreground h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Funded / Remaining Labels */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Funded
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              $35,000
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Remaining
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              $15,000
            </p>
          </div>
        </div>
      </Card>

      {/* Make an Investment Card */}
      <Card className="p-6 md:p-8 rounded-2xl border shadow-sm bg-card space-y-6">
        <div>
          <h3 className="text-xl font-bold text-foreground">Make an Investment</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Enter the amount you wish to invest in this opportunity
          </p>
        </div>

        <form onSubmit={handleInvest} className="space-y-6">
          <div className="space-y-2.5">
            <Label htmlFor="investmentAmount" className="text-sm font-semibold">
              Investment Amount ($)
            </Label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-muted-foreground font-medium">
                $
              </span>
              <Input
                id="investmentAmount"
                type="number"
                placeholder="Enter amount"
                className="pl-8 bg-muted/20 border-muted focus-visible:ring-1 focus-visible:ring-foreground py-5 rounded-xl text-base"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground tracking-wide">
              Maximum: $15,000
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              type="submit" 
              className="w-full bg-black text-white hover:bg-black/90 py-5 h-12 rounded-xl text-base font-semibold flex items-center justify-center gap-2"
              disabled={isPending}
            >
              <DollarSign className="h-4 w-4" />
              {isPending ? "Processing..." : "Invest Now"}
            </Button>
            <p className="text-center text-xs text-muted-foreground/80 leading-relaxed px-4">
              By investing, you agree to deposit funds into our secure platform account
            </p>
          </div>
        </form>
      </Card>
    </div>
  )
}
