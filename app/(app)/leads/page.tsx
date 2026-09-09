import type { Metadata } from "next";
import { LeadsClient } from "@/components/leads/leads-client";

export const metadata: Metadata = { title: "Leads" };

export default function LeadsPage() {
  return <LeadsClient />;
}
