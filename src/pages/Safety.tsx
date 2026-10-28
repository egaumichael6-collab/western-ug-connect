import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";
import { PAYMENT_NUMBER_DISPLAY } from "../lib/config";

const tips = [
  { t: "Never send money to someone you met online", d: "Not for transport, school fees, a sick relative, a business deal or a 'customs fee'. Romance scammers build trust for weeks before asking. If someone asks for money, report them." },
  { t: "Never share financial details", d: "Do not share your mobile money PIN, bank details, card numbers, passwords or the codes sent to your phone — with anyone, including people claiming to be from WESTERN UG CONNECT." },
  { t: "Keep chats on the site at first", d: "Our messaging lets you block and report. Move to WhatsApp or phone calls only when you are comfortable." },
  { t: "Meet in public", d: "Choose a busy café, restaurant or mall for the first few dates. Arrange your own transport and stay sober enough to make good decisions." },
  { t: "Tell someone you trust", d: "Share who you are meeting, where and when. Agree a time to check in." },
  { t: "Trust your instincts", d: "Pressure, rushing, inconsistent stories or refusing to video-call are warning signs. You can leave at any time." },
];

export default function Safety() {
  usePageMeta("Safety Centre", "Dating safety advice for WESTERN UG CONNECT members: avoid romance scams, protect your money and meet safely.");
  return (
    <div className="container-page py-12">
      <div className="rounded-3xl bg-gradient-to-br from-plum-950 to-plum-800 p-8 text-white sm:p-12">
        <p className="text-xs font-semibold tracking-[0.25em] text-gold-300">SAFETY CENTRE</p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Your safety comes first</h1>
        <p className="mt-3 max-w-2xl text-plum-100">
          The most important rule: <strong className="text-gold-300">do not send money to people you meet online, and never share your
          PIN, passwords or verification codes.</strong>
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {tips.map((x) => (
          <div key={x.t} className="card p-6">
            <h2 className="text-lg font-bold">{x.t}</h2>
            <p className="mt-2 text-sm text-slate-600">{x.d}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-xl font-bold">About our payments</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>Membership fees are paid ONLY to our official number <strong>{PAYMENT_NUMBER_DISPLAY}</strong>.</li>
            <li>We will never call or message you asking for your PIN or an SMS code.</li>
            <li>No member, and no one claiming to be staff, can "activate" your account for cash.</li>
            <li>Your membership starts only after we verify your payment — you will see it on your My Subscription page.</li>
          </ul>
        </div>
        <div className="card p-6">
          <h2 className="text-xl font-bold">Diamond members: extra care</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>Any arrangement must be legal, between consenting adults, and free of pressure.</li>
            <li>Offering or requesting sex in exchange for money is prohibited and will lead to removal.</li>
            <li>Never pay "deposits", "registration fees" or "allowances in advance" to someone you have not met — this is the most common sugar-dating scam.</li>
            <li>Never let anyone take your ID, phone or documents, or control where you live or travel. If someone does, contact the Uganda Police on 999 or 112.</li>
          </ul>
        </div>
      </div>

      <div className="mt-10 card p-6">
        <h2 className="text-xl font-bold">Need help?</h2>
        <p className="mt-2 text-sm text-slate-700">
          Use <strong>Report</strong> on any profile or message, or <strong>Block</strong> to stop someone contacting you. In an emergency call
          <strong> 999</strong> or <strong>112</strong>. For child protection concerns call the Sauti Child Helpline on <strong>116</strong>.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/guidelines" className="btn-outline">Community guidelines</Link>
          <Link to="/contact" className="btn-primary">Contact our team</Link>
        </div>
      </div>
    </div>
  );
}
