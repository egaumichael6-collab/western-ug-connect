import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, friendlyError } from "../../lib/supabase";
import { usePageMeta } from "../../lib/usePageMeta";
import { useAuth } from "../../context/AuthContext";
import type { Payment } from "../../lib/types";
import { ugx } from "../../lib/config";
import { fmtDateTime } from "../../lib/format";
import { Alert, EmptyState, PageHeader, Spinner, StatusBadge } from "../../components/ui";

export default function PaymentHistory() {
  usePageMeta("Payment history", undefined, { noindex: true });
  const { user } = useAuth();
  const [rows, setRows] = useState<Payment[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("payment_submissions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data, error }) => {
      if (error) setErr(friendlyError(error));
      setRows((data ?? []) as Payment[]);
    });
  }, [user]);

  if (!rows) return <Spinner />;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Payment history" subtitle="Every payment confirmation you've submitted and its verification status."
        action={<Link to="/memberships" className="btn-outline">New payment</Link>} />
      {err && <Alert kind="error">{err}</Alert>}
      {rows.length === 0 ? (
        <EmptyState title="No payments yet" action={<Link to="/memberships" className="btn-primary">Explore Memberships</Link>} />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{r.package_name}</p>
                  <p className="text-sm text-slate-600">{ugx(r.amount_ugx)} · {r.network === "mtn" ? "MTN MoMo" : "Airtel Money"} · ID <span className="font-mono">{r.transaction_ref}</span></p>
                  <p className="text-xs text-slate-500">Submitted {fmtDateTime(r.created_at)}{r.reviewed_at ? ` · Reviewed ${fmtDateTime(r.reviewed_at)}` : ""}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              {r.status === "pending" && <p className="mt-3 text-sm text-gold-700">Waiting for our team to match this ID with our mobile money records. Your membership is not active until then.</p>}
              {r.status === "approved" && <p className="mt-3 text-sm text-emerald-700">Verified — membership activated. <Link to="/app/subscription" className="underline">See dates</Link></p>}
              {r.status === "rejected" && (
                <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">
                  <p><strong>Not verified:</strong> {r.review_note}</p>
                  <p className="mt-1">Check the transaction ID and <Link to={`/app/pay/${r.package_code}`} className="underline">submit again</Link>, or <Link to="/contact" className="underline">contact us</Link>.</p>
                </div>
              )}
              {r.status === "refunded" && <p className="mt-3 text-sm text-slate-600">Refunded. {r.review_note}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
