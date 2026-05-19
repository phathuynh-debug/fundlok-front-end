import { AuthLayout } from "@/components/auth-layout"
import { AuthFormSwitcher } from "@/components/auth-form-switcher"

export default function LoginPage() {
  return (
    <AuthLayout>
      <AuthFormSwitcher initialMode="login" />
    </AuthLayout>
  )
}
