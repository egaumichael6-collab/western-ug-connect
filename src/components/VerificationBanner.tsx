import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/** Shown to members whose face check is not approved yet. */
export default function VerificationBanner() {
  const { profile } = useAuth();
  if (!profile) return null;
  const s = profile.verification_status ?? "unverified";
  if (s === "approved") return null;
  if (s === "pending") {
    return (
      <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
        <strong>Your face check is being reviewed.</strong> Your profile becomes visible to members as soon as our team approves it — usually the same day.
      </div>
    );
  }
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold-300 bg-gold-50 p-4 text-sm text-plum-950">
      <p className="max-w-2xl">
        {s === "rejected" ? (
          <><strong>Your face check was not approved.</strong> {profile.verification_note} Fix your photos if needed, then take a new selfie.</>
        ) : (
          <><strong>Verify your face to appear to members.</strong> Only verified members with real photos are shown, and you need to be verified to like, connect or message. It takes about a minute.</>
        )}
      </p>
      <Link to="/app/verify" className="btn-primary shrink-0">Verify me now</Link>
    </div>
  );
}
