import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";

export default function About() {
  usePageMeta("About us", "WESTERN UG CONNECT is a Ugandan dating community for single adults in Western Uganda and across the country.");
  return (
    <div className="container-page max-w-3xl py-12">
      <p className="text-xs font-semibold tracking-[0.25em] text-gold-600">ABOUT WESTERN UG CONNECT</p>
      <h1 className="mt-2 text-4xl font-bold">Love that feels like home</h1>
      <div className="prose-legal mt-6">
        <p>
          WESTERN UG CONNECT was created for single adults in Western Uganda — Ankole, Kigezi, Tooro, Bunyoro, Rwenzori and
          the wider region — and for Ugandans everywhere who want to meet someone who understands where they come from.
        </p>
        <p className="mt-4">
          Big international apps rarely reflect how we date here: family matters, faith matters, and many people pay with mobile
          money rather than cards. We built a platform around that reality, with simple membership packages and payments
          that a real person verifies.
        </p>
        <h2>What we stand for</h2>
        <ul>
          <li><strong>Respect.</strong> Every member is an adult who deserves courtesy, honesty and consent.</li>
          <li><strong>Privacy.</strong> We collect only what we need, and we never show your contact details to other members.</li>
          <li><strong>Honesty.</strong> No fake profiles, no fake statistics, no invented success stories.</li>
          <li><strong>Safety.</strong> Blocking, reporting and active moderation are built into every part of the site.</li>
        </ul>
        <h2>Two kinds of membership</h2>
        <p>
          <strong>Bronze</strong> is for members looking for marriage, a long-term relationship, dating or friendship.
          <strong> Diamond</strong> is a separate category for consenting adults who openly prefer mutually agreed sugar-dating
          relationships. Diamond profiles are only shown to other Diamond members, and the same community rules apply to everyone.
        </p>
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/register" className="btn-primary">Join Now</Link>
        <Link to="/contact" className="btn-outline">Contact us</Link>
      </div>
    </div>
  );
}
