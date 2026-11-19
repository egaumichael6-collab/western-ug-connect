import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase, friendlyError } from "../../lib/supabase";
import { usePageMeta } from "../../lib/usePageMeta";
import { useAuth } from "../../context/AuthContext";
import {
  GOALS, GENDERS, INTEREST_SUGGESTIONS, LIFESTYLE_FIELDS, WESTERN_DISTRICTS, OTHER_DISTRICTS, ALL_DISTRICTS, UNIVERSITIES, type Goal, type Gender,
} from "../../lib/config";
import type { Preferences } from "../../lib/types";
import { compressImage, validateImage } from "../../lib/images";
import { Alert, Avatar, PageHeader, Spinner } from "../../components/ui";

export default function EditProfile() {
  usePageMeta("Your profile", undefined, { noindex: true });
  const { profile, refreshProfile, user } = useAuth();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [p, setP] = useState({
    display_name: "", district: "", town: "", bio: "", interests: [] as string[],
    relationship_goal: "" as Goal | "", lifestyle: {} as Record<string, string>,
    university: "", campus_visible: false,
  });
  const [prefs, setPrefs] = useState<Omit<Preferences, "user_id">>({
    seeking_gender: null, min_age: 18, max_age: 60, preferred_districts: [], preferred_goal: null,
  });
  const [interestInput, setInterestInput] = useState("");
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!profile || loaded) return;
    setP({
      display_name: profile.display_name, district: profile.district, town: profile.town ?? "", bio: profile.bio ?? "",
      interests: profile.interests ?? [], relationship_goal: profile.relationship_goal ?? "", lifestyle: profile.lifestyle ?? {},
      university: profile.university ?? "", campus_visible: profile.campus_visible ?? false,
    });
    supabase.from("preferences").select("*").eq("user_id", profile.id).maybeSingle().then(({ data }) => {
      if (data) setPrefs({ seeking_gender: data.seeking_gender, min_age: data.min_age, max_age: data.max_age,
        preferred_districts: data.preferred_districts ?? [], preferred_goal: data.preferred_goal });
      setLoaded(true);
    });
  }, [profile, loaded]);

  if (!profile || !user) return <Spinner />;

  const addInterest = (raw: string) => {
    const v = raw.trim().slice(0, 30);
    if (!v || p.interests.includes(v) || p.interests.length >= 15) return;
    setP({ ...p, interests: [...p.interests, v] });
    setInterestInput("");
  };

  async function uploadPhoto(file: File) {
    const bad = validateImage(file);
    if (bad) return setMsg({ kind: "error", text: bad });
    if (profile!.photos.length >= 6) return setMsg({ kind: "error", text: "You can have up to 6 photos." });
    setUploading(true);
    setMsg(null);
    try {
      const blob = await compressImage(file);
      const ext = blob.type === "image/webp" ? "webp" : "jpg";
      const path = `${user!.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("profile-photos").upload(path, blob, { contentType: blob.type, upsert: false });
      if (upErr) throw upErr;
      const { error } = await supabase.from("profiles").update({ photos: [...profile!.photos, path] }).eq("id", user!.id);
      if (error) {
        await supabase.storage.from("profile-photos").remove([path]);
        throw error;
      }
      await refreshProfile();
    } catch (e) {
      setMsg({ kind: "error", text: friendlyError(e) });
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto(path: string) {
    const photos = profile!.photos.filter((x) => x !== path);
    const { error } = await supabase.from("profiles").update({ photos }).eq("id", user!.id);
    if (error) return setMsg({ kind: "error", text: friendlyError(error) });
    await supabase.storage.from("profile-photos").remove([path]);
    await refreshProfile();
  }

  async function makeMain(path: string) {
    const photos = [path, ...profile!.photos.filter((x) => x !== path)];
    await supabase.from("profiles").update({ photos }).eq("id", user!.id);
    await refreshProfile();
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (p.display_name.trim().length < 2) return setMsg({ kind: "error", text: "Display name must be at least 2 characters." });
    if (!p.relationship_goal) return setMsg({ kind: "error", text: "Choose what you're looking for." });
    if (p.bio.trim().length < 20) return setMsg({ kind: "error", text: "Write a short bio of at least 20 characters." });
    if (prefs.max_age < prefs.min_age) return setMsg({ kind: "error", text: "Maximum age must be higher than minimum age." });
    setBusy(true);
    setMsg(null);
    const lifestyle = Object.fromEntries(Object.entries(p.lifestyle).filter(([, v]) => v).map(([k, v]) => [k, String(v).slice(0, 80)]));
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from("profiles").update({
        display_name: p.display_name.trim(), district: p.district, town: p.town.trim() || null, bio: p.bio.trim(),
        interests: p.interests, relationship_goal: p.relationship_goal, lifestyle,
        university: p.university.trim().slice(0, 80) || null,
        campus_visible: profile!.gender === "woman" && !!p.university.trim() && p.campus_visible,
      }).eq("id", user!.id),
      supabase.from("preferences").upsert({ user_id: user!.id, ...prefs }),
    ]);
    setBusy(false);
    if (e1 || e2) return setMsg({ kind: "error", text: friendlyError(e1 ?? e2) });
    await refreshProfile();
    const { data } = await supabase.from("profiles").select("profile_completed").eq("id", user!.id).single();
    if (data?.profile_completed && params.get("welcome")) return nav("/app/recommendations");
    setMsg({ kind: "success", text: data?.profile_completed ? "Profile saved." : "Saved. Add at least one photo to make your profile visible to members." });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={params.get("welcome") ? "Complete your profile" : "Edit your profile"}
        subtitle="A complete profile with a clear photo gets far more genuine interest." />
      {params.get("welcome") && !profile.profile_completed && (
        <div className="mb-5"><Alert kind="info">Welcome! Add a photo, a short bio and what you're looking for. Your profile becomes visible once these are done.</Alert></div>
      )}
      {msg && <div className="mb-5"><Alert kind={msg.kind}>{msg.text}</Alert></div>}

      <section className="card mb-6 p-6">
        <h2 className="text-lg font-bold">Photos <span className="text-sm font-normal text-slate-500">({profile.photos.length}/6)</span></h2>
        <p className="mt-1 text-sm text-slate-600">Use clear, recent photos of yourself only. The first photo is your main picture. Location data is removed automatically.</p>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {profile.photos.map((ph, i) => (
            <div key={ph} className="group relative">
              <Avatar path={ph} name={profile.display_name} size={100} rounded="rounded-xl" />
              {i === 0 && <span className="absolute left-1 top-1 rounded bg-gold-400 px-1.5 text-[10px] font-bold text-plum-950">MAIN</span>}
              <div className="mt-1 flex gap-1">
                {i > 0 && <button type="button" onClick={() => makeMain(ph)} className="text-[11px] text-plum-800 underline">Main</button>}
                <button type="button" onClick={() => removePhoto(ph)} className="text-[11px] text-red-700 underline">Remove</button>
              </div>
            </div>
          ))}
          {profile.photos.length < 6 && (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-plum-200 text-plum-700 hover:bg-plum-50">
              <span className="text-2xl">{uploading ? "…" : "+"}</span>
              <span className="text-[11px]">{uploading ? "Uploading" : "Add photo"}</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.target.value = ""; }} />
            </label>
          )}
        </div>
      </section>

      <form onSubmit={save} className="space-y-6">
        <section className="card space-y-4 p-6">
          <h2 className="text-lg font-bold">About you</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="ep-name">Display name</label>
              <input id="ep-name" className="input" maxLength={40} value={p.display_name} onChange={(e) => setP({ ...p, display_name: e.target.value })} /></div>
            <div><label className="label" htmlFor="ep-goal">I'm looking for</label>
              <select id="ep-goal" className="input" value={p.relationship_goal} onChange={(e) => setP({ ...p, relationship_goal: e.target.value as Goal })}>
                <option value="">Select…</option>
                {GOALS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select></div>
            <div><label className="label" htmlFor="ep-district">District</label>
              <select id="ep-district" className="input" value={p.district} onChange={(e) => setP({ ...p, district: e.target.value })}>
                <optgroup label="Western Uganda">{WESTERN_DISTRICTS.map((d) => <option key={d}>{d}</option>)}</optgroup>
                <optgroup label="Rest of Uganda">{OTHER_DISTRICTS.map((d) => <option key={d}>{d}</option>)}</optgroup>
              </select></div>
            <div><label className="label" htmlFor="ep-town">Town / area <span className="text-xs text-slate-500">(no street address)</span></label>
              <input id="ep-town" className="input" maxLength={60} value={p.town} onChange={(e) => setP({ ...p, town: e.target.value })} /></div>
          </div>
          {p.relationship_goal === "sugar_dating" && (
            <Alert kind="warn">Sugar mummy / sugar daddy profiles are shown only to Diamond members, and you need a Diamond membership to browse them. Adults 18+ only — see our Terms.</Alert>
          )}
          <div><label className="label" htmlFor="ep-bio">Bio <span className="text-xs text-slate-500">({p.bio.length}/1000)</span></label>
            <textarea id="ep-bio" className="input min-h-32" maxLength={1000} placeholder="What makes you smile? What are you hoping to find?"
              value={p.bio} onChange={(e) => setP({ ...p, bio: e.target.value })} />
            <p className="mt-1 text-xs text-slate-500">Don't include your phone number, social media or address.</p></div>
          <div>
            <span className="label">Interests <span className="text-xs text-slate-500">({p.interests.length}/15)</span></span>
            <div className="flex flex-wrap gap-2">
              {p.interests.map((i) => (
                <button type="button" key={i} className="chip gap-1" onClick={() => setP({ ...p, interests: p.interests.filter((x) => x !== i) })} aria-label={`Remove ${i}`}>
                  {i} <span aria-hidden>✕</span>
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input className="input" placeholder="Add an interest" value={interestInput} maxLength={30}
                onChange={(e) => setInterestInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addInterest(interestInput); } }} />
              <button type="button" className="btn-outline" onClick={() => addInterest(interestInput)}>Add</button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {INTEREST_SUGGESTIONS.filter((s) => !p.interests.includes(s)).map((s) => (
                <button type="button" key={s} onClick={() => addInterest(s)} className="rounded-full border border-plum-100 px-2.5 py-1 text-xs text-slate-600 hover:bg-plum-50">+ {s}</button>
              ))}
            </div>
          </div>
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="text-lg font-bold">University <span className="text-sm font-normal text-slate-500">(optional)</span></h2>
          <div><label className="label" htmlFor="ep-uni">University you attend</label>
            <input id="ep-uni" className="input" list="ep-uni-list" maxLength={80} placeholder="e.g. Mbarara University of Science and Technology (MUST)"
              value={p.university} onChange={(e) => setP({ ...p, university: e.target.value, campus_visible: e.target.value.trim() ? p.campus_visible : false })} />
            <datalist id="ep-uni-list">{UNIVERSITIES.map((u) => <option key={u} value={u} />)}</datalist></div>
          {profile.gender === "woman" ? (
            <label className="flex items-start gap-3 rounded-xl bg-fuchsia-50 p-3 text-sm text-fuchsia-950 ring-1 ring-fuchsia-200">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-fuchsia-700" disabled={!p.university.trim()}
                checked={p.campus_visible} onChange={(e) => setP({ ...p, campus_visible: e.target.checked })} />
              <span><strong>Show me in JUICY UNIVERSITY BABES.</strong> Members with that package can find you by your university and see which university you attend. You must be 18 or older. Untick any time to hide.</span>
            </label>
          ) : (
            <p className="text-xs text-slate-500">Your university is kept on your profile only. The JUICY UNIVERSITY BABES section lists ladies who choose to appear there.</p>
          )}
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="text-lg font-bold">Lifestyle <span className="text-sm font-normal text-slate-500">(optional)</span></h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {LIFESTYLE_FIELDS.map((fld) => (
              <div key={fld.key}>
                <label className="label" htmlFor={`ls-${fld.key}`}>{fld.label}</label>
                {fld.type === "select" ? (
                  <select id={`ls-${fld.key}`} className="input" value={p.lifestyle[fld.key] ?? ""}
                    onChange={(e) => setP({ ...p, lifestyle: { ...p.lifestyle, [fld.key]: e.target.value } })}>
                    <option value="">—</option>
                    {fld.options.map((o) => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input id={`ls-${fld.key}`} className="input" maxLength={80} value={p.lifestyle[fld.key] ?? ""}
                    onChange={(e) => setP({ ...p, lifestyle: { ...p.lifestyle, [fld.key]: e.target.value } })} />
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="text-lg font-bold">Who you'd like to meet</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><label className="label" htmlFor="pf-g">Interested in</label>
              <select id="pf-g" className="input" value={prefs.seeking_gender ?? ""} onChange={(e) => setPrefs({ ...prefs, seeking_gender: (e.target.value || null) as Gender | null })}>
                <option value="">Anyone</option>
                {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select></div>
            <div><label className="label" htmlFor="pf-min">Age from</label>
              <input id="pf-min" type="number" min={18} max={99} className="input" value={prefs.min_age}
                onChange={(e) => setPrefs({ ...prefs, min_age: Math.max(18, Number(e.target.value) || 18) })} /></div>
            <div><label className="label" htmlFor="pf-max">Age to</label>
              <input id="pf-max" type="number" min={18} max={99} className="input" value={prefs.max_age}
                onChange={(e) => setPrefs({ ...prefs, max_age: Math.min(99, Number(e.target.value) || 99) })} /></div>
          </div>
          <div><label className="label" htmlFor="pf-goal">Preferred relationship type</label>
            <select id="pf-goal" className="input" value={prefs.preferred_goal ?? ""} onChange={(e) => setPrefs({ ...prefs, preferred_goal: (e.target.value || null) as Goal | null })}>
              <option value="">Any</option>
              {GOALS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select></div>
          <div>
            <span className="label">Preferred districts <span className="text-xs text-slate-500">(leave empty for your own district)</span></span>
            <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-slate-200 p-3">
              {ALL_DISTRICTS.map((d) => {
                const on = prefs.preferred_districts.includes(d);
                return (
                  <button type="button" key={d} aria-pressed={on}
                    onClick={() => setPrefs({ ...prefs, preferred_districts: on ? prefs.preferred_districts.filter((x) => x !== d) : [...prefs.preferred_districts, d].slice(0, 20) })}
                    className={`rounded-full px-2.5 py-1 text-xs ${on ? "bg-plum-800 text-white" : "border border-plum-100 text-slate-700 hover:bg-plum-50"}`}>{d}</button>
                );
              })}
            </div>
          </div>
        </section>

        <div className="sticky bottom-20 flex justify-end lg:bottom-3">
          <button className="btn-primary px-8 py-3 shadow-lg" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>
        </div>
      </form>
    </div>
  );
}
