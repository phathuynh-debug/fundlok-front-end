import { SITE_URL } from "@/lib/site";

// Predefined content for Admin > Email: one click fills the subject, heading,
// body and button with a ready-made message, in the language the admin picks
// (not the console's own language: an admin reading the console in Vietnamese
// may still write to an English-speaking investor).
//
// The text is the email itself, not console chrome, so it lives here rather
// than in lib/i18n. It is user-facing copy all the same: the fundlok-domain
// rules apply to both languages (no rating language, no promised returns).
//
// The body is built as the HTML the rich-text editor itself produces (one
// <div> per line, <div><br></div> for a blank line) so editing it afterwards
// behaves like text the admin typed. It must not contain a newline character:
// the server's template runs nl2br over the body, which would double every
// line break.

export type EmailPresetId = "sme_onboarding" | "investor_onboarding";
export type EmailPresetLanguage = "vi" | "en";

export const EMAIL_PRESET_IDS: EmailPresetId[] = [
  "sme_onboarding",
  "investor_onboarding",
];
export const EMAIL_PRESET_LANGUAGES: EmailPresetLanguage[] = ["vi", "en"];

// A paragraph: plain text, or a bold lead-in followed by text.
type Paragraph = string | { lead: string; text: string };

interface PresetSource {
  subject: string;
  heading: string;
  paragraphs: Paragraph[];
  buttonLabel: string;
  // A path on the public site. Logged-out recipients are sent through /login
  // and back (proxy.ts).
  buttonPath: string;
}

export interface EmailPresetContent {
  subject: string;
  heading: string;
  body: string;
  buttonLabel: string;
  buttonUrl: string;
}

// The template puts the button and the admin's signature after the body, so
// the body ends on the sign-off and the signature supplies the name.
const PRESETS: Record<
  EmailPresetId,
  Record<EmailPresetLanguage, PresetSource>
> = {
  sme_onboarding: {
    vi: {
      subject: "Chào mừng bạn đến với FundLok – Bắt đầu gọi vốn chỉ với 2 bước",
      heading: "Bắt đầu chiến dịch gọi vốn đầu tiên của bạn",
      paragraphs: [
        "Xin chào,",
        "Chào mừng bạn đã gia nhập cộng đồng FundLok! Chúng tôi rất vui mừng được đồng hành cùng bạn trên chặng đường phát triển doanh nghiệp.",
        "FundLok được xây dựng nhằm giúp quá trình huy động vốn cho doanh nghiệp trở nên đơn giản, an toàn và hiệu quả hơn. Để bắt đầu tạo chiến dịch gọi vốn đầu tiên, bạn chỉ cần hoàn thành 2 bước sau:",
        {
          lead: "1. Xác minh doanh nghiệp (KYB):",
          text: "Hoàn tất xác minh tài khoản doanh nghiệp để đảm bảo tính an toàn, bảo mật và mở khóa đầy đủ tính năng trên nền tảng.",
        },
        {
          lead: "2. Đăng dự án gọi vốn:",
          text: "Chia sẻ câu chuyện, mục tiêu tài chính và bắt đầu kết nối với các nhà đầu tư tiềm năng.",
        },
        "Nhấn vào nút bên dưới để hoàn tất xác minh KYB và đăng dự án của bạn ngay hôm nay!",
        "Nếu bạn cần hỗ trợ trong quá trình thực hiện, đừng ngần ngại phản hồi lại email này hoặc liên hệ với đội ngũ hỗ trợ của FundLok.",
        "Trân trọng,",
      ],
      buttonLabel: "Hoàn tất xác minh KYB",
      // Gated: an unverified SME goes through KYB first, then lands back on
      // the project form.
      buttonPath: "/project-application",
    },
    en: {
      subject: "Welcome to FundLok – start raising capital in 2 steps",
      heading: "Start your first fundraising campaign",
      paragraphs: [
        "Hello,",
        "Welcome to the FundLok community! We're delighted to be with you as your business grows.",
        "FundLok is built to make raising capital simpler, safer and more efficient for businesses. To create your first fundraising campaign, just complete these 2 steps:",
        {
          lead: "1. Verify your business (KYB):",
          text: "Complete verification of your business account to keep it safe and secure, and to unlock every feature on the platform.",
        },
        {
          lead: "2. Post your fundraising project:",
          text: "Share your story and financial goals, and start connecting with potential investors.",
        },
        "Click the button below to complete your KYB verification and post your project today!",
        "If you need any help along the way, simply reply to this email or contact the FundLok support team.",
        "Best regards,",
      ],
      buttonLabel: "Complete KYB verification",
      buttonPath: "/project-application",
    },
  },
  investor_onboarding: {
    vi: {
      subject: "Chào mừng bạn đến với FundLok – Bắt đầu đầu tư chỉ với 2 bước",
      heading: "Bắt đầu hành trình đầu tư cùng FundLok",
      paragraphs: [
        "Xin chào Quý nhà đầu tư,",
        "Chào mừng bạn đến với cộng đồng FundLok! Chúng tôi rất vui mừng được đồng hành cùng bạn trên hành trình đầu tư sắp tới.",
        // Handbook §4/§5: "điểm doanh nghiệp và lãi suất tham khảo", never
        // "điểm tín nhiệm"; no "an toàn" next to investing.
        "FundLok được xây dựng để giúp bạn tiếp cận các cơ hội đầu tư vào doanh nghiệp một cách minh bạch và hiệu quả — nơi bạn có thể xem điểm doanh nghiệp và lãi suất tham khảo, doanh thu đã được xác minh và các rủi ro trước khi ra quyết định. Để bắt đầu đầu tư, bạn chỉ cần hoàn thành 2 bước sau:",
        {
          lead: "1. Xác minh danh tính (KYC):",
          text: "Hoàn tất xác minh tài khoản cá nhân để đảm bảo an toàn, bảo mật và tuân thủ quy định, đồng thời mở khóa đầy đủ tính năng đầu tư trên nền tảng.",
        },
        {
          lead: "2. Khám phá cơ hội đầu tư:",
          text: "Duyệt các dự án gọi vốn đã được xác minh, đánh giá điểm doanh nghiệp, doanh thu và mức độ rủi ro, rồi bắt đầu đầu tư vào những cơ hội phù hợp với bạn.",
        },
        "Nhấn vào nút bên dưới để hoàn tất xác minh KYC và khám phá các cơ hội đầu tư ngay hôm nay!",
        "Nếu bạn cần hỗ trợ trong quá trình thực hiện, đừng ngần ngại phản hồi lại email này hoặc liên hệ với đội ngũ hỗ trợ của FundLok.",
        "Trân trọng,",
      ],
      buttonLabel: "Hoàn tất xác minh KYC",
      buttonPath: "/kyc",
    },
    en: {
      subject: "Welcome to FundLok – start investing in 2 steps",
      heading: "Start your investing journey with FundLok",
      paragraphs: [
        "Dear Investor,",
        "Welcome to the FundLok community! We're delighted to be with you on your investing journey.",
        "FundLok is built to give you transparent, efficient access to opportunities to invest in businesses — where you can see each business's score and reference rate, its verified revenue and its risks before you decide. To start investing, just complete these 2 steps:",
        {
          lead: "1. Verify your identity (KYC):",
          text: "Complete verification of your personal account to keep it safe and secure and meet compliance requirements, and to unlock every investing feature on the platform.",
        },
        {
          lead: "2. Explore investment opportunities:",
          text: "Browse verified fundraising projects, review each business's score, revenue and risk level, and start investing in the opportunities that suit you.",
        },
        "Click the button below to complete your KYC verification and explore investment opportunities today!",
        "If you need any help along the way, simply reply to this email or contact the FundLok support team.",
        "Best regards,",
      ],
      buttonLabel: "Complete KYC verification",
      buttonPath: "/kyc",
    },
  },
};

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const paragraphHtml = (paragraph: Paragraph) =>
  typeof paragraph === "string"
    ? `<div>${escapeHtml(paragraph)}</div>`
    : `<div><b>${escapeHtml(paragraph.lead)}</b> ${escapeHtml(paragraph.text)}</div>`;

export function emailPresetContent(
  id: EmailPresetId,
  language: EmailPresetLanguage,
): EmailPresetContent {
  const source = PRESETS[id][language];
  return {
    subject: source.subject,
    heading: source.heading,
    body: source.paragraphs.map(paragraphHtml).join("<div><br></div>"),
    buttonLabel: source.buttonLabel,
    buttonUrl: `${SITE_URL.replace(/\/+$/, "")}${source.buttonPath}`,
  };
}
