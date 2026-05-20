import { RegistrationForm } from "@/components/registration-form"

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-6">
      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-xl shadow-lg border border-border">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Create an Account</h1>
          <p className="text-muted-foreground">
            Start your fundraising or investment journey with FundLok
          </p>
        </div>

        {/* Main registration logic component */}
        <RegistrationForm />
      </div>
    </div>
  )
}