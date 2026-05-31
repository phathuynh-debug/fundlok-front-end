import type { Metadata } from "next";
import { RegisterClient } from "./register-client";

export const metadata: Metadata = {
  title: "Register",
  description:
    "Create an account on FundLok to apply for SME funding or to invest in private credit opportunities.",
};

export default function Page() {
  return <RegisterClient />;
}
