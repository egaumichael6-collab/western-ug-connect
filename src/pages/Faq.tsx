import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";
import { PAYMENT_NUMBER_DISPLAY } from "../lib/config";

const faqs: [string, string][] = [
  ["Is registration free?", "Yes. Creating an account and a profile is free. Registration is free, but to start browsing and seeing singles, sugar mummies and sugar daddies near you, you need to subscribe to Silver, Gold or Diamond after registering."],
  ["Who can join?", "Single adults aged 18 and over. Our system checks your date of birth and rejects anyone under 18. Report any profile you believe belongs to a minor."],
  ["How do I pay?", `Choose a package, send the exact amount by MTN or Airtel Mobile Money to ${PAYMENT_NUMBER_DISPLAY}, then submit the transaction ID from your SMS on the payment confirmation page.`],
  ["When does my membership start?", "As soon as an administrator has matched your transaction ID with our mobile money records — usually within a few hours during the day. The 14 or 30 days are counted from that moment, not from when you paid."],
  ["What if my payment is rejected?", "You will see the reason on your Payment History page and in your notifications. Correct the details and submit again, or contact us with your transaction ID."],
  ["Can I renew early?", "Yes. If you pay again before your membership ends, the new period starts when the current one finishes, so you never lose days."],
  ["What is the difference between Silver, Gold and Diamond?", "Silver (14 days, UGX 10,000) and Gold (30 days, UGX 15,000) let you browse, match and chat with singles looking for love, marriage, dating or friendship. Diamond (30 days, UGX 25,000) is where you find your dream sugar mummy or sugar daddy — Diamond profiles are only visible to Diamond members, and Diamond also includes everything in Silver and Gold."],
  ["Who can see my phone number and email?", "No other member. Only you and our administrators can see them, and only to run the service."],
  ["Can I hide my profile for a while?", "Yes. Pause your profile in Settings — you will disappear from Discover until you un-pause."],
  ["How do I delete my account?", "Go to Settings → Delete account. Your profile, photos, matches and messages are permanently deleted. We keep a minimal payment record for accounting, as explained in our Privacy Policy."],
  ["Do you offer refunds?", "Memberships are generally non-refundable once activated, but we refund payments made in error or where we could not provide the service. Contact us with your transaction ID."],
];

export default function Faq() {
  usePageMeta("Frequently asked questions", "Answers about joining WESTERN UG CONNECT, mobile money payments, memberships, privacy and safety.");
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="text-4xl font-bold">Frequently asked questions</h1>
      <div className="mt-8 space-y-3">
        {faqs.map(([q, a]) => (
          <details key={q} className="card group p-5 open:shadow-md">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-plum-950">
              {q}
              <span className="text-gold-600 transition group-open:rotate-45" aria-hidden>＋</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">{a}</p>
          </details>
        ))}
      </div>
      <p className="mt-10 text-sm text-slate-600">Still have a question? <Link to="/contact" className="font-semibold text-plum-800 underline">Contact us</Link>.</p>
    </div>
  );
}
