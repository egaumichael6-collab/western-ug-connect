import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { MemberCard } from "../lib/types";
import { goalLabel } from "../lib/config";
import { Avatar } from "./ui";

export default function ProfileCard({ m, footer }: { m: MemberCard; footer?: ReactNode }) {
  return (
    <article className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
      <Link to={`/app/members/${m.id}`} className="relative block aspect-[4/5] bg-plum-100" aria-label={`View ${m.display_name}'s profile`}>
        <div className="absolute inset-0 [&>*]:!h-full [&>*]:!w-full">
          <Avatar path={m.photo} name={m.display_name} size={400} rounded="rounded-none" />
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-plum-950/90 via-plum-950/40 to-transparent p-3 pt-10 text-white">
          <p className="flex items-center gap-1.5 font-display text-lg font-bold">
            {m.display_name}, {m.age}
            {m.online && <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" title="Online now" />}
          </p>
          <p className="text-xs text-plum-100">{m.town ? `${m.town}, ` : ""}{m.district}</p>
        </div>
        {typeof m.university === "string" && m.near === true && <span className="absolute left-2 top-2 rounded-full bg-fuchsia-600 px-2 py-0.5 text-[10px] font-bold text-white">NEAR YOU</span>}
        {m.is_favorite && <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs" title="Saved">★</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        {typeof m.university === "string" && <span className="self-start rounded-full bg-fuchsia-50 px-2.5 py-0.5 text-xs font-semibold text-fuchsia-800 ring-1 ring-fuchsia-200">🎓 {m.university}</span>}
        <span className="chip self-start">{goalLabel(m.relationship_goal)}</span>
        {m.reasons && m.reasons.length > 0 && (
          <ul className="space-y-0.5 text-xs text-emerald-800">
            {m.reasons.slice(0, 3).map((r) => <li key={r}>✓ {r}</li>)}
          </ul>
        )}
        {!m.reasons && m.bio && <p className="line-clamp-2 text-xs text-slate-600">{m.bio}</p>}
        {footer && <div className="mt-auto pt-1">{footer}</div>}
      </div>
    </article>
  );
}
