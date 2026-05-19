import { AuthLayout } from "@/components/auth-layout"
import { AuthFormSwitcher } from "@/components/auth-form-switcher"

export default function RegisterPage() {
  return (
    <AuthLayout>
      <AuthFormSwitcher initialMode="register" />
    </AuthLayout>
  )
}
