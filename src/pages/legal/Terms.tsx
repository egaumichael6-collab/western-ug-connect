import { usePageMeta } from "../../lib/usePageMeta";
import { PAYMENT_NUMBER_DISPLAY } from "../../lib/config";
import { LegalPage } from "./LegalPage";

export default function Terms() {
  usePageMeta("Terms and conditions", "The terms that apply when you use WESTERN UG CONNECT.");
  return (
    <LegalPage title="Terms and Conditions">
      <h2>1. Eligibility</h2>
      <p>You must be at least 18 years old, single or otherwise legally free to date, and able to enter a binding agreement. Accounts created by or for anyone under 18 will be deleted and may be reported to the authorities.</p>
      <h2>2. Your account</h2>
      <p>Give accurate information, use your own photos, keep your password secret, and have only one account. You are responsible for activity on your account.</p>
      <h2>3. Memberships and payment</h2>
      <ul>
        <li>Bronze 14 days: UGX 10,000. Bronze 30 days: UGX 15,000. Diamond 30 days: UGX 25,000.</li>
        <li>Pay only by mobile money to {PAYMENT_NUMBER_DISPLAY}, then submit your transaction ID on the site.</li>
        <li>A membership begins only after we verify the payment, and lasts for the stated number of days from activation. It ends automatically; there is no automatic renewal.</li>
        <li>Submitting false payment information or a reused transaction ID is fraud and leads to permanent removal.</li>
        <li>Activated memberships are non-refundable except where we made an error or could not provide the service. Refunds are paid back by mobile money.</li>
      </ul>
      <h2>4. Diamond membership</h2>
      <p>Diamond is a separate category for consenting adults who openly seek mutually agreed sugar-dating relationships. It does not permit, and we do not facilitate, the exchange of money for sex, escort or commercial sexual services, trafficking, coercion or any unlawful activity. Profiles or messages that offer or request such services will be removed and may be reported to the police.</p>
      <h2>5. Conduct</h2>
      <p>You agree to follow our Community Guidelines. You must not harass, threaten, deceive or defraud anyone; ask members for money; share explicit content; impersonate others; spam; or use the service for commercial promotion.</p>
      <h2>6. Moderation</h2>
      <p>We may remove content, suspend or close accounts that break these terms, with or without notice where safety requires it. You may appeal by contacting us.</p>
      <h2>7. Your content</h2>
      <p>You keep ownership of your photos and text, and give us permission to display them to eligible members to operate the service.</p>
      <h2>8. No guarantees</h2>
      <p>We cannot guarantee that you will find a partner, or verify every statement members make about themselves. Take sensible precautions — see our Safety Centre. We are not responsible for members' behaviour off the platform, to the extent permitted by law.</p>
      <h2>9. Changes and termination</h2>
      <p>We may update these terms and will notify members of significant changes. You may delete your account at any time from Settings.</p>
      <h2>10. Governing law</h2>
      <p>These terms are governed by the laws of the Republic of Uganda.</p>
    </LegalPage>
  );
}
