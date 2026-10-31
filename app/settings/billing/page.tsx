"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  CreditCard,
  Download,
  ExternalLink,
  Layers,
  Lock,
  Plus,
  Receipt,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Invoice = {
  id: string;
  number: string;
  date: string;
  amount: string;
  status: "paid" | "open" | "uncollectible";
  seatCount: number;
  pdfUrl: string;
};

const mockInvoices: Invoice[] = [
  {
    id: "inv-1",
    number: "INV-2026-010",
    date: "Oct 1, 2026",
    amount: "$960.00",
    status: "paid",
    seatCount: 40,
    pdfUrl: "#",
  },
  {
    id: "inv-2",
    number: "INV-2026-009",
    date: "Sep 1, 2026",
    amount: "$960.00",
    status: "paid",
    seatCount: 40,
    pdfUrl: "#",
  },
  {
    id: "inv-3",
    number: "INV-2026-008",
    date: "Aug 1, 2026",
    amount: "$840.00",
    status: "paid",
    seatCount: 35,
    pdfUrl: "#",
  },
  {
    id: "inv-4",
    number: "INV-2026-007",
    date: "Jul 1, 2026",
    amount: "$840.00",
    status: "paid",
    seatCount: 35,
    pdfUrl: "#",
  },
];

export default function BillingPage() {
  const [totalSeats, setTotalSeats] = useState(40);
  const [activeSeats, setActiveSeats] = useState(32);
  const [isAddSeatsModalOpen, setIsAddSeatsModalOpen] = useState(false);
  const [seatsToAdd, setSeatsToAdd] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);

  const availableSeats = totalSeats - activeSeats;
  const utilizationPct = Math.round((activeSeats / totalSeats) * 100);

  const handlePurchaseSeats = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setTotalSeats((prev) => prev + seatsToAdd);
      setIsProcessing(false);
      setIsAddSeatsModalOpen(false);
    }, 700);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)] mb-1">
            <Link href="/settings" className="hover:text-[var(--color-text-primary)] transition-colors">
              Settings
            </Link>
            <span>/</span>
            <span className="text-[var(--color-text-primary)]">Billing & Plan</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Subscription & Seat Management
            </h1>
            <Badge variant="outline" className="text-xs font-semibold py-0.5 px-2">
              Enterprise
            </Badge>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Manage your team license seats, payment credentials, and monthly tax invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsAddSeatsModalOpen(true)}
            className="gap-1.5 text-xs font-semibold rounded-xl bg-[var(--color-accent)] text-white hover:opacity-90 active:scale-95 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Team Seats</span>
          </Button>
        </div>
      </div>

      {/* Grid: Plan card + Seat Utilization Meter */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Active Plan Card */}
        <Card className="rounded-2xl border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="default" className="text-[10px] font-bold uppercase tracking-wider bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-[var(--color-accent)]/20">
                Current Plan
              </Badge>
              <span className="text-xs font-semibold text-emerald-500">Active</span>
            </div>
            <CardTitle className="text-xl font-bold text-[var(--color-text-primary)] mt-2">
              Orbit Enterprise
            </CardTitle>
            <CardDescription className="text-xs text-[var(--color-text-secondary)]">
              $24 per seat / month, billed annually
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-3">
            <div className="space-y-1.5 border-t border-[var(--color-border-secondary)] pt-3 text-xs">
              <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>Unlimited Projects & Portfolios</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>Unlimited Workflow Automations</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>SAML 2.0 / Okta SSO & SCIM</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>99.9% Uptime SLA & Priority Support</span>
              </div>
            </div>

            <div className="border-t border-[var(--color-border-secondary)] pt-3 text-[11px] text-[var(--color-text-tertiary)] flex items-center justify-between">
              <span>Next renewal on Nov 1, 2026</span>
              <span className="font-semibold text-[var(--color-text-primary)]">$960.00 / mo</span>
            </div>
          </CardContent>
        </Card>

        {/* Seat Utilization Meter */}
        <Card className="rounded-2xl border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] lg:col-span-2">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-[var(--color-text-primary)]">
                Seat Utilization
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {availableSeats} Available Seats
              </Badge>
            </div>
            <CardDescription className="text-xs text-[var(--color-text-secondary)]">
              License allocation across active members and pending invitations.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-[var(--color-text-primary)]">
                  {activeSeats} Active Seats Assigned
                </span>
                <span className="text-[var(--color-text-tertiary)] font-medium">
                  {totalSeats} Total Purchased
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-3 w-full rounded-full bg-[var(--color-surface)] border border-[var(--color-border-secondary)] overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
                  style={{ width: `${utilizationPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[var(--color-text-tertiary)] pt-1">
                <span>{utilizationPct}% utilized</span>
                <span>Each extra seat is $24/month prorated</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-[var(--color-border-secondary)] pt-4">
              <div className="rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-3 text-center">
                <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase">
                  Active Users
                </p>
                <p className="text-xl font-bold text-[var(--color-text-primary)] mt-1">
                  {activeSeats}
                </p>
              </div>

              <div className="rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-3 text-center">
                <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase">
                  Spare Seats
                </p>
                <p className="text-xl font-bold text-emerald-500 mt-1">
                  {availableSeats}
                </p>
              </div>

              <div className="rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-3 text-center">
                <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase">
                  Annual Cost
                </p>
                <p className="text-xl font-bold text-[var(--color-text-primary)] mt-1">
                  ${(totalSeats * 24 * 12).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method & Invoicing */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Payment Method Card */}
        <Card className="rounded-2xl border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[var(--color-accent)]" />
              <span>Payment Details</span>
            </CardTitle>
            <CardDescription className="text-xs text-[var(--color-text-secondary)]">
              Credit card charged automatically for monthly renewals.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-4">
            <div className="rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-[var(--color-text-primary)]">
                  •••• •••• •••• 4242
                </span>
                <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                  Visa
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
                <span>Expires 12/28</span>
                <span>Alexander Chen</span>
              </div>
            </div>

            <div className="text-xs space-y-1 text-[var(--color-text-secondary)]">
              <p className="font-semibold text-[var(--color-text-primary)]">Billing Contact:</p>
              <p>billing@company.com</p>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">VAT ID: US894102931</p>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs font-semibold rounded-xl border-[var(--color-border-secondary)] hover:bg-[var(--color-surface-hover)]"
            >
              Update Payment Method
            </Button>
          </CardContent>
        </Card>

        {/* Invoices History Table */}
        <Card className="rounded-2xl border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] lg:col-span-2 overflow-hidden">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-500" />
              <span>Invoice Receipts</span>
            </CardTitle>
            <CardDescription className="text-xs text-[var(--color-text-secondary)]">
              Download tax compliant PDF invoices for corporate accounting.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border-secondary)] bg-[var(--color-surface)]/80 text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                    <th className="px-5 py-3">Invoice</th>
                    <th className="px-4 py-3">Billing Date</th>
                    <th className="px-4 py-3">Seats</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-secondary)]">
                  {mockInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                      <td className="px-5 py-3 font-mono font-semibold text-[var(--color-text-primary)]">
                        {inv.number}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                        {inv.date}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-tertiary)]">
                        {inv.seatCount} seats
                      </td>
                      <td className="px-4 py-3 font-semibold text-[var(--color-text-primary)]">
                        {inv.amount}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="default"
                          className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-semibold py-0 px-2 capitalize"
                        >
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-accent)] hover:underline cursor-pointer"
                        >
                          <Download className="h-3 w-3" />
                          <span>PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Seats Modal */}
      {isAddSeatsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-6 shadow-2xl animate-in fade-in-50 zoom-in-95">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
              Add Organization Seats
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mb-4">
              Expand your team capacity. Additional seats are billed prorated for the current cycle.
            </p>

            <form onSubmit={handlePurchaseSeats} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider block mb-1">
                  Seats to Add
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={seatsToAdd}
                    onChange={(e) => setSeatsToAdd(Math.max(1, parseInt(e.target.value) || 1))}
                    className="text-sm font-semibold bg-[var(--color-surface-strong)] border-[var(--color-border-secondary)] w-28"
                  />
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    New total: <strong className="text-[var(--color-text-primary)]">{totalSeats + seatsToAdd} seats</strong>
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-3 text-xs space-y-1.5">
                <div className="flex justify-between text-[var(--color-text-secondary)]">
                  <span>Additional Cost:</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    ${seatsToAdd * 24}/month
                  </span>
                </div>
                <div className="flex justify-between text-[var(--color-text-secondary)]">
                  <span>Prorated Today:</span>
                  <span className="font-semibold text-emerald-500">
                    ${(seatsToAdd * 24 * 0.5).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border-secondary)]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddSeatsModalOpen(false)}
                  className="text-xs border-[var(--color-border-secondary)]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="text-xs bg-[var(--color-accent)] text-white hover:opacity-90 font-semibold"
                >
                  {isProcessing ? "Processing..." : `Confirm & Purchase (${seatsToAdd} Seats)`}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
