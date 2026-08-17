import type { Metadata } from "next";
import TransactionsClient from "./client";

export const metadata: Metadata = {
  title: "Transactions",
  description:
    "Review every movement of funds across your FundLok account — investments, returns, deposits, withdrawals and fees.",
};

export default function TransactionsPage() {
  return <TransactionsClient />;
}
