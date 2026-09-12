import type { Metadata } from "next";
import { RegisterClient } from "./register-client";

export const metadata: Metadata = {
  alternates: { canonical: "/register" },
  title: "Create an account — apply for funding or invest",
  description:
    "Create an account on FundLok to apply for SME funding or to invest in private credit opportunities.",
};

export default function Page() {
  return <RegisterClient />;
}
