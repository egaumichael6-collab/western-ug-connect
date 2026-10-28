import { usePageMeta } from "../../lib/usePageMeta";
import { LegalPage } from "./LegalPage";

export default function Guidelines() {
  usePageMeta("Community guidelines", "The rules every WESTERN UG CONNECT member agrees to follow.");
  return (
    <LegalPage title="Community Guidelines">
      <p>WESTERN UG CONNECT works because members treat each other with respect. Breaking these rules can lead to warnings, suspension or permanent removal.</p>
      <h2>Be real</h2>
      <ul><li>Use your own recent photos and honest details.</li><li>One account per person. No impersonation.</li><li>Adults only — never misrepresent your age.</li></ul>
      <h2>Be respectful</h2>
      <ul><li>No harassment, threats, insults or hate based on tribe, religion, gender, disability or any other characteristic.</li><li>"No" means no. Stop contacting anyone who declines, unmatches or stops replying.</li><li>No unsolicited sexual messages or images.</li></ul>
      <h2>Keep money out of it</h2>
      <ul><li>Never ask members for money, airtime, mobile money transfers, gifts or investments.</li><li>No selling, advertising, recruiting or promoting other sites.</li><li>No offering or requesting sex in exchange for money or gifts — in any membership category.</li></ul>
      <h2>Consent and safety</h2>
      <ul><li>All relationships must be between consenting adults, free of pressure, threats or control.</li><li>Nothing involving minors, trafficking, coercion or exploitation is ever tolerated, and we will report it to the authorities.</li><li>Do not share another member's private information or screenshots of their messages.</li></ul>
      <h2>Reporting</h2>
      <p>If someone breaks these rules, use Report on their profile or message. Reports are confidential — the member is not told who reported them.</p>
    </LegalPage>
  );
}
