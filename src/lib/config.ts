export const SITE_NAME = "WESTERN UG CONNECT";
export const TAGLINE = "Your Journey to True Love Starts Here.";
export const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) ?? window.location.origin;
export const SUPPORT_EMAIL = (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined) ?? "";

/** Owner-supplied mobile money number. Shown everywhere payments are mentioned. */
export const PAYMENT_NUMBER = "+256794273661";
export const PAYMENT_NUMBER_DISPLAY = "+256 794 273 661";
export const PAYMENT_NUMBER_LOCAL = "0794 273 661";

export type Gender = "man" | "woman";
export type Goal = "marriage" | "long_term" | "dating" | "friendship" | "sugar_dating";
export type Tier = "bronze" | "campus" | "diamond";

export const GOALS: { value: Goal; label: string }[] = [
  { value: "marriage", label: "Marriage" },
  { value: "long_term", label: "Long-term relationship" },
  { value: "dating", label: "Dating to see where it goes" },
  { value: "friendship", label: "Friendship first" },
  { value: "sugar_dating", label: "Sugar mummy / sugar daddy (Diamond)" },
];
export const goalLabel = (g?: string | null) => GOALS.find((x) => x.value === g)?.label ?? "Not set";

export const GENDERS: { value: Gender; label: string }[] = [
  { value: "woman", label: "Woman" },
  { value: "man", label: "Man" },
];

export const WESTERN_DISTRICTS = [
  "Mbarara", "Bushenyi", "Ntungamo", "Kabale", "Kisoro", "Rukungiri", "Kanungu", "Ibanda", "Isingiro",
  "Kiruhura", "Kazo", "Rwampara", "Sheema", "Mitooma", "Rubirizi", "Buhweju", "Rukiga", "Rubanda",
  "Kabarole", "Fort Portal City", "Bunyangabu", "Kyenjojo", "Kyegegwa", "Kamwenge", "Kitagwenda",
  "Kasese", "Bundibugyo", "Ntoroko", "Hoima", "Masindi", "Kibaale", "Kagadi", "Kakumiro", "Kikuube",
  "Buliisa", "Kiryandongo",
];
export const OTHER_DISTRICTS = [
  "Kampala", "Wakiso", "Mukono", "Entebbe", "Jinja", "Masaka", "Mpigi", "Mityana", "Mubende", "Luweero",
  "Mbale", "Tororo", "Soroti", "Lira", "Gulu", "Arua", "Iganga", "Kayunga", "Other",
];
export const ALL_DISTRICTS = [...WESTERN_DISTRICTS, ...OTHER_DISTRICTS];

export const INTEREST_SUGGESTIONS = [
  "Church", "Music", "Football", "Cooking", "Travel", "Farming", "Business", "Reading", "Dancing",
  "Fitness", "Movies", "Nature walks", "Photography", "Fashion", "Technology", "Volunteering", "Family time",
];

export const LIFESTYLE_FIELDS = [
  { key: "occupation", label: "Occupation", type: "text" },
  { key: "education", label: "Education", type: "select", options: ["Secondary", "Certificate", "Diploma", "Degree", "Postgraduate", "Prefer not to say"] },
  { key: "children", label: "Children", type: "select", options: ["None", "Have children", "Prefer not to say"] },
  { key: "wants_children", label: "Wants children", type: "select", options: ["Yes", "No", "Open to it", "Prefer not to say"] },
  { key: "drinking", label: "Drinking", type: "select", options: ["Never", "Socially", "Regularly", "Prefer not to say"] },
  { key: "smoking", label: "Smoking", type: "select", options: ["Never", "Sometimes", "Regularly", "Prefer not to say"] },
  { key: "languages", label: "Languages", type: "text" },
] as const;

export const REPORT_REASONS = [
  { value: "harassment", label: "Harassment or abuse" },
  { value: "scam", label: "Scam or asking for money" },
  { value: "fake_profile", label: "Fake profile or impersonation" },
  { value: "underage", label: "May be under 18" },
  { value: "explicit_content", label: "Explicit or sexual content" },
  { value: "solicitation", label: "Offering or requesting sex for money" },
  { value: "hate", label: "Hate or discrimination" },
  { value: "other", label: "Something else" },
];

/** Display names for membership packages (internal codes stay the same). */
export const PLAN_LABELS: Record<string, string> = { bronze_14: "Silver", bronze_30: "Gold", campus_30: "Juicy University Babes", diamond_30: "Diamond" };
export const CAMPUS_NAME = "JUICY UNIVERSITY BABES";
export const PLAN_IMAGES: Record<string, { src: string; alt: string }> = {
  bronze_14: { src: "/img/plan-silver.webp", alt: "AI-generated image of a smiling young lady at sunset over green hills — Silver membership" },
  bronze_30: { src: "/img/plan-gold.webp", alt: "AI-generated image of a happy young couple at sunset — Gold membership" },
  diamond_30: { src: "/img/plan-diamond.webp", alt: "AI-generated image of an elegant lady and a distinguished gentleman — Diamond membership for sugar mummies and sugar daddies" },
};
export const tierLabel = (t?: string | null) => (t === "diamond" ? "Diamond" : t === "campus" ? "Juicy University Babes" : t === "bronze" ? "Silver/Gold" : "");

/** Universities members can pick (they can also type another one). */
export const UNIVERSITIES = [
  "Mbarara University of Science and Technology (MUST)", "Bishop Stuart University", "Kabale University",
  "Mountains of the Moon University", "Kampala International University – Western Campus (Ishaka)",
  "Ankole Western University", "Uganda Pentecostal University", "Uganda Martyrs University",
  "Makerere University", "Kyambogo University", "Makerere University Business School (MUBS)",
  "Uganda Christian University (UCU)", "Kampala International University (KIU)", "Ndejje University",
  "Nkumba University", "Kampala University", "Victoria University", "Cavendish University Uganda",
  "Islamic University in Uganda (IUIU)", "Busitema University", "Gulu University", "Muni University",
  "Lira University", "Soroti University", "Uganda Management Institute (UMI)", "Bugema University",
];
export const WHATSAPP_NUMBER = "18026189459";
export const WHATSAPP_DISPLAY = "+1 802 618 9459";
export const whatsappLink = (text = "Hello WESTERN UG CONNECT, I need help.") => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

export const ugx = (n: number) => `UGX ${n.toLocaleString("en-UG")}`;
