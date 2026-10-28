import { usePageMeta } from "../../lib/usePageMeta";
import { LegalPage } from "./LegalPage";

export default function Privacy() {
  usePageMeta("Privacy policy", "How WESTERN UG CONNECT collects, uses, protects and deletes your personal data.");
  return (
    <LegalPage title="Privacy Policy">
      <p>WESTERN UG CONNECT ("we") respects your privacy and processes personal data in line with Uganda's Data Protection and Privacy Act, 2019 and its Regulations. This policy explains what we collect, why, and your rights.</p>
      <h2>1. What we collect</h2>
      <ul>
        <li><strong>Account data:</strong> full name, email address, phone number, password (stored only as a secure hash by our authentication provider), date of birth, gender, district and town.</li>
        <li><strong>Profile data you choose to add:</strong> display name, photos, biography, interests, relationship goals, partner preferences and optional lifestyle details.</li>
        <li><strong>Activity data:</strong> likes, connection requests, matches, favourites, blocks, reports, messages, notifications and the time you were last active.</li>
        <li><strong>Payment data:</strong> selected package, amount, mobile money network, transaction ID, payer phone number and any receipt image you upload. We never collect your mobile money PIN, passwords or one-time codes.</li>
      </ul>
      <h2>2. Why we use it</h2>
      <ul>
        <li>To create and secure your account and confirm you are 18 or older.</li>
        <li>To show your profile to eligible members and recommend compatible matches.</li>
        <li>To deliver your private messages to the person you are messaging.</li>
        <li>To verify payments and activate, renew or refund memberships.</li>
        <li>To keep the community safe: investigating reports, preventing fraud and enforcing our rules.</li>
      </ul>
      <h2>3. What other members can see</h2>
      <p>Your display name, age (not your date of birth), gender, district, and — depending on your settings — your town, photos, interests, biography and online status. Other members can never see your email, phone number, full name, payment information or exact address.</p>
      <h2>4. Private messages</h2>
      <p>Only you and the person you are messaging can read your conversation. Our staff do not browse conversations. If you report a specific message, a moderator may read that single message to investigate, and every such access is recorded in our audit log.</p>
      <h2>5. Who we share data with</h2>
      <p>We use trusted service providers to run the site: Supabase (database, authentication, file storage) and Netlify (website hosting). Their servers may be outside Uganda; we rely on their security commitments to protect the data. We do not sell your data. We may disclose data where required by Ugandan law or to protect someone from serious harm.</p>
      <h2>6. How long we keep it</h2>
      <ul>
        <li>Profile, photos, matches and messages: until you delete your account.</li>
        <li>Payment records: kept for up to 5 years for accounting and dispute resolution; when you delete your account we remove your phone number and receipt from them.</li>
        <li>Moderation and audit records: kept as long as needed to protect the community.</li>
      </ul>
      <h2>7. Your rights</h2>
      <p>You can access and correct your data in your profile and settings, pause or deactivate your profile, and permanently delete your account from Settings. You may also contact us to request a copy of your data or to object to processing, and complain to the Personal Data Protection Office.</p>
      <h2>8. Security</h2>
      <p>Data is encrypted in transit, photos are stored privately and served through short-lived links, and database rules prevent members from reading other members' private information.</p>
      <h2>9. Contact</h2>
      <p>Use our Contact page for any privacy request.</p>
    </LegalPage>
  );
}
