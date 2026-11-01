import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, friendlyError } from "../../lib/supabase";
import { usePageMeta } from "../../lib/usePageMeta";
import { useAuth } from "../../context/AuthContext";
import { Alert, PageHeader, Spinner } from "../../components/ui";

type Step = "intro" | "camera" | "preview" | "sending" | "sent";

/**
 * Live face check: the member takes a selfie with the camera (no file upload)
 * while doing a random gesture chosen by the server. An admin compares it with
 * the profile photos.
 */
export default function Verify() {
  usePageMeta("Verify your face", undefined, { noindex: true });
  const { profile, user, refreshProfile } = useAuth();
  const [step, setStep] = useState<Step>("intro");
  const [gesture, setGesture] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [shot, setShot] = useState<{ blob: Blob; url: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => { streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; };
  useEffect(() => () => stopCamera(), []);
  useEffect(() => () => { if (shot) URL.revokeObjectURL(shot.url); }, [shot]);

  if (!profile || !user) return <Spinner />;
  const status = profile.verification_status ?? "unverified";

  async function openCamera() {
    setErr(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      return setErr("This browser cannot open the camera. Please use Chrome or Safari on your phone.");
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 1280 } }, audio: false });
      streamRef.current = stream;
      setStep("camera");
      requestAnimationFrame(() => {
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
      });
    } catch {
      setErr("We could not open your camera. Allow camera access for this site in your browser settings, then try again.");
    }
  }

  async function start() {
    setErr(null);
    const { data, error } = await supabase.rpc("start_face_verification");
    if (error) return setErr(friendlyError(error));
    setGesture(String(data));
    await openCamera();
  }

  function capture() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    const scale = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight));
    c.width = Math.round(v.videoWidth * scale);
    c.height = Math.round(v.videoHeight * scale);
    c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
    c.toBlob((b) => {
      if (!b) return setErr("Could not take the photo. Please try again.");
      stopCamera();
      setShot({ blob: b, url: URL.createObjectURL(b) });
      setStep("preview");
    }, "image/jpeg", 0.88);
  }

  async function send() {
    if (!shot) return;
    setStep("sending");
    setErr(null);
    const path = `${user!.id}/${crypto.randomUUID()}.jpg`;
    const { error: upErr } = await supabase.storage.from("verification-selfies").upload(path, shot.blob, { contentType: "image/jpeg", upsert: false });
    if (upErr) { setStep("preview"); return setErr(friendlyError(upErr)); }
    const { error } = await supabase.rpc("submit_face_verification", { p_selfie: path });
    if (error) { setStep("preview"); return setErr(friendlyError(error)); }
    await refreshProfile();
    setStep("sent");
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Verify your face" subtitle="We only show real people. A quick live selfie proves your photos are really you." />
      {err && <div className="mb-4"><Alert kind="error">{err}</Alert></div>}

      {status === "approved" ? (
        <div className="card p-6 text-center">
          <p className="text-4xl">✅</p>
          <h2 className="mt-2 text-xl font-bold">You are verified</h2>
          <p className="mt-1 text-sm text-slate-600">Your profile shows a “Face verified” badge. New photos you add are checked by our team before members can see them.</p>
          <Link to="/app/discover" className="btn-primary mt-5">Go to Discover</Link>
        </div>
      ) : step === "sent" || (status === "pending" && step === "intro") ? (
        <div className="card p-6 text-center">
          <p className="text-4xl">⏳</p>
          <h2 className="mt-2 text-xl font-bold">Selfie received</h2>
          <p className="mt-1 text-sm text-slate-600">Our team is checking that your selfie matches your profile photos — usually the same day. You'll get a notification. Meanwhile you can still browse.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to="/app/discover" className="btn-primary">Browse members</Link>
            <button className="btn-outline" onClick={() => { setStep("intro"); start(); }}>Retake selfie</button>
          </div>
        </div>
      ) : profile.photos.length < 1 ? (
        <div className="card p-6">
          <h2 className="text-lg font-bold">First, add a real photo of yourself</h2>
          <p className="mt-1 text-sm text-slate-600">Upload at least one clear, recent photo where your face is visible. No cartoons, celebrities, group photos or pictures of other people.</p>
          <Link to="/app/profile/edit" className="btn-primary mt-4">Add photos</Link>
        </div>
      ) : step === "intro" ? (
        <div className="card space-y-4 p-6">
          {status === "rejected" && profile.verification_note && (
            <Alert kind="warn"><strong>Last check was not approved:</strong> {profile.verification_note}</Alert>
          )}
          <h2 className="text-lg font-bold">How it works</h2>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
            <li>Make sure your profile photos are real, clear photos of <strong>you</strong>.</li>
            <li>Tap <strong>Start</strong> — your front camera opens and we show you a simple gesture to do.</li>
            <li>Face the camera in good light, do the gesture and take the selfie.</li>
            <li>Our team compares it with your photos. Approved profiles become visible to members.</li>
          </ol>
          <p className="rounded-xl bg-plum-50 p-3 text-xs text-plum-900">Your selfie is private. Only our admins see it, it is never shown on your profile, and it is used only to confirm you are real.</p>
          <button className="btn-primary w-full py-3" onClick={start}>Start face check</button>
        </div>
      ) : step === "camera" ? (
        <div className="card overflow-hidden">
          <div className="bg-plum-900 px-4 py-3 text-center text-white">
            <p className="text-xs font-semibold tracking-[0.2em] text-gold-300">DO THIS GESTURE</p>
            <p className="mt-1 text-lg font-bold">{gesture}</p>
          </div>
          <div className="relative bg-black">
            <video ref={videoRef} playsInline muted className="mx-auto aspect-[3/4] max-h-[65vh] w-full -scale-x-100 object-cover" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-[62%] w-[58%] rounded-[50%] border-4 border-white/70" />
            </div>
          </div>
          <div className="flex gap-3 p-4">
            <button className="btn-outline flex-1" onClick={() => { stopCamera(); setStep("intro"); }}>Cancel</button>
            <button className="btn-primary flex-1 py-3" onClick={capture}>📸 Take selfie</button>
          </div>
        </div>
      ) : shot && (
        <div className="card overflow-hidden">
          <div className="bg-plum-900 px-4 py-3 text-center text-sm text-white">Check: is your face clear and are you doing <strong className="text-gold-300">“{gesture}”</strong>?</div>
          <img src={shot.url} alt="Your selfie" className="mx-auto max-h-[65vh] w-full object-contain" />
          <div className="flex gap-3 p-4">
            <button className="btn-outline flex-1" disabled={step === "sending"} onClick={() => { setShot(null); openCamera(); }}>Retake</button>
            <button className="btn-primary flex-1 py-3" disabled={step === "sending"} onClick={send}>{step === "sending" ? "Sending…" : "Send for checking"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
