import type { Metadata } from "next";
import { SelectRoleClient } from "./select-role-client";

export const metadata: Metadata = {
  title: "Choose your account type",
  description:
    "Tell us how you'll use FundLok — apply for SME funding or invest in private credit opportunities.",
};

export default function Page() {
  return <SelectRoleClient />;
}
