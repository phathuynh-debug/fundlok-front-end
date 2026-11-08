// Contract 1: "Điều khoản Dịch vụ và Đồng ý xử lý dữ liệu / Terms & Services
// and Data Consent", accepted on the /consent screen by every SME and
// investor (three tick boxes and a one-time code).
//
// TERMS_VERSION must equal CURRENT_VERSION in the backend's
// app/consent/documents.py. Changing the text below means bumping BOTH, so
// everyone accepts the new text: an acceptance names the version it was for.
//
// Source: Contract set v0.3 (5 Nov 2026), DRAFT pending IBL review. Copied
// verbatim; if the Vietnamese and English differ, the Vietnamese prevails.

export const TERMS_VERSION = "tos-v0.3";

export interface Bilingual {
  vi: string;
  en: string;
}

export interface TermsArticle {
  id: string;
  title: Bilingual;
  paragraphs: Bilingual[];
}

export const TERMS_TITLE: Bilingual = {
  vi: "Điều khoản Dịch vụ và Đồng ý xử lý dữ liệu",
  en: "Terms & Services and Data Consent",
};

export const TERMS_PREVAILS: Bilingual = {
  vi: "Khi có khác biệt giữa bản tiếng Việt và bản tiếng Anh, bản tiếng Việt được ưu tiên áp dụng.",
  en: "If the Vietnamese and English texts differ, the Vietnamese text prevails.",
};

// Shown in full on the same screen as the tick boxes (Contract 1 Art. 3,
// "Pre-signing disclosures").
export const DISCLOSURES_ARTICLE_ID = "3";

export const TERMS_ARTICLES: TermsArticle[] = [
  {
    id: "1",
    title: { vi: "Điều 1. Về FundLok", en: "Article 1. About FundLok" },
    paragraphs: [
      {
        vi: "Nền tảng FundLok do Công ty Cổ phần FundLok (mã số doanh nghiệp 1501167629; trụ sở chính: Thửa đất số 31, Tờ bản đồ số 121, khóm Thuận Tiến B, phường Bình Minh, tỉnh Vĩnh Long, Việt Nam) (\"FundLok\") vận hành. FundLok là nền tảng công nghệ kết nối doanh nghiệp nhỏ và vừa cần vốn lưu động (\"Doanh nghiệp\") với nhà đầu tư cá nhân và tổ chức (\"Nhà đầu tư\").",
        en: "The FundLok platform is operated by FundLok Joint-Stock Company (enterprise code 1501167629; head office: Land Parcel No. 31, Cadastral Map Sheet No. 121, Thuan Tien B Quarter, Binh Minh Ward, Vinh Long Province, Vietnam) (\"FundLok\"). FundLok is a technology platform that connects small and medium enterprises needing working capital (\"SMEs\") with individual and institutional investors (\"Investors\").",
      },
      {
        vi: "FundLok không phải là tổ chức tín dụng. FundLok không cho vay, không đi vay, không nhận tiền gửi, không giữ tiền của khách hàng và không bảo lãnh cho bất kỳ khoản vay nào.",
        en: "FundLok is not a credit institution. FundLok does not lend, does not borrow, does not take deposits, does not hold customers' money and does not guarantee any loan.",
      },
    ],
  },
  {
    id: "2",
    title: { vi: "Điều 2. Phạm vi và chấp nhận", en: "Article 2. Scope and acceptance" },
    paragraphs: [
      {
        vi: "2.1. Điều khoản này áp dụng cho mọi người dùng nền tảng. Dịch vụ cụ thể được điều chỉnh thêm bởi Hợp đồng dịch vụ dành cho Doanh nghiệp hoặc Hợp đồng dịch vụ dành cho Nhà đầu tư.",
        en: "2.1. These Terms apply to every user of the platform. Specific services are further governed by the SME Service Agreement or the Investor Service Agreement.",
      },
      {
        vi: "2.2. Người dùng là cá nhân phải là công dân Việt Nam từ đủ 18 tuổi, có năng lực hành vi dân sự đầy đủ. Người dùng là tổ chức phải được thành lập hợp pháp tại Việt Nam và do người đại diện theo pháp luật hoặc người được ủy quyền hợp lệ thao tác.",
        en: "2.2. Individual users must be Vietnamese citizens aged 18 or over with full civil capacity. Organisations must be lawfully established in Vietnam and act through their legal representative or a duly authorised person.",
      },
      {
        vi: "2.3. Người dùng chấp nhận Điều khoản này bằng cách đánh dấu ô xác nhận và nhập mã OTP. Việc chấp nhận điện tử có giá trị như chữ ký theo Luật Giao dịch điện tử 2023.",
        en: "2.3. Users accept these Terms by ticking the confirmation box and entering an OTP. Electronic acceptance has the effect of a signature under the Law on Electronic Transactions 2023.",
      },
    ],
  },
  {
    id: "3",
    title: {
      vi: "Điều 3. Thông tin công bố trước khi giao kết",
      en: "Article 3. Pre-signing disclosures",
    },
    paragraphs: [
      {
        vi: "Người dùng xác nhận đã đọc và hiểu các nội dung sau trước khi sử dụng dịch vụ:",
        en: "Users confirm that they have read and understood the following before using the service:",
      },
      {
        vi: "3.1. FundLok không phải là một bên của khoản vay. Mỗi khoản vay là hợp đồng riêng giữa một Nhà đầu tư và Doanh nghiệp. FundLok không phải bên cho vay, bên vay, đại diện của bên vay hay bên bảo lãnh.",
        en: "3.1. FundLok is not a party to any loan. Each loan is a separate contract between one Investor and the SME. FundLok is not the lender, the borrower, the borrower's agent or a guarantor.",
      },
      {
        vi: "3.2. Không có bảo đảm. FundLok không bảo đảm việc hoàn trả gốc, lãi, hay việc một khoản gọi vốn đủ vốn. Nhà đầu tư có thể mất một phần hoặc toàn bộ số tiền cho vay.",
        en: "3.2. Nothing is guaranteed. FundLok does not guarantee repayment of principal or interest, or that a listing will be funded. Investors may lose part or all of the money they lend.",
      },
      {
        vi: "3.3. Tiền chuyển trực tiếp. Mọi khoản giải ngân và trả nợ chỉ được chuyển giữa tài khoản ngân hàng chính chủ của Nhà đầu tư và của Doanh nghiệp. Không bao giờ chuyển tiền vay hoặc tiền trả nợ vào tài khoản của FundLok. Chỉ phí dịch vụ của FundLok được thanh toán cho FundLok, theo hóa đơn riêng.",
        en: "3.3. Money moves directly. Every disbursement and repayment moves only between the Investor's and the SME's own bank accounts. Never send loan money or repayments to FundLok's account. Only FundLok's service fees are paid to FundLok, against a separate invoice.",
      },
      {
        vi: "3.4. Cách một khoản gọi vốn vận hành. (a) Nhà đầu tư cam kết và ký hợp đồng trong thời gian gọi vốn tối đa 12 ngày; chưa có tiền nào được chuyển. Ngày giải ngân là 14 ngày sau ngày đăng. (b) Doanh nghiệp có quyền hủy đề nghị đến hạn chấp nhận, 01 ngày trước ngày giải ngân. Nếu Doanh nghiệp không phản hồi: tổng cam kết từ 50% mục tiêu trở lên được coi là chấp nhận; dưới 50% được coi là hủy. (c) Nếu Doanh nghiệp chấp nhận, mọi Nhà đầu tư chuyển tiền trong cùng một ngày giải ngân, trước 15 giờ, bằng mã VietQR do nền tảng cung cấp. (d) Nếu có Nhà đầu tư không chuyển tiền, khoản vay vẫn tiếp tục và phần thiếu hụt được mở lại ngay cho Nhà đầu tư mới, họ chuyển tiền ngay khi cam kết.",
        en: "3.4. How a listing works. (a) Investors commit and sign during a commitment window of up to 12 days; no money moves yet. The disbursement day is 14 days after the listing date. (b) The SME may cancel its offer until the acceptance deadline, 1 day before the disbursement date. If the SME does not respond: commitments of 50% of the target or more count as accepted; below 50% count as cancelled. (c) If the SME accepts, every Investor transfers on the same disbursement day, before 3 pm, using the VietQR the platform provides. (d) If an Investor does not transfer, the loan goes ahead and the shortfall reopens at once for new Investors, who transfer as soon as they commit.",
      },
      {
        vi: "3.5. Bằng chứng giao dịch. FundLok không có kết nối với ngân hàng. Khi giải ngân, Nhà đầu tư tải ảnh chụp lệnh chuyển và Doanh nghiệp tải ảnh chụp tiền đến; hai ảnh khớp nhau thì khoản giải ngân được xác nhận; nếu Doanh nghiệp không tải ảnh trong 24 giờ, khoản giải ngân được coi là đã nhận. Khi trả nợ, Doanh nghiệp tải ảnh chụp lệnh chuyển; Nhà đầu tư bấm \"Đã nhận\" hoặc \"Chưa nhận\"; sau 24 giờ không phản hồi, khoản trả nợ được coi là đã nhận.",
        en: "3.5. Evidence. FundLok has no connection to any bank. On disbursement, the Investor uploads a screenshot of the transfer and the SME uploads a screenshot of the money arriving; when both match, the disbursement is confirmed; if the SME does not upload within 24 hours, the disbursement counts as received. On repayment, the SME uploads a screenshot of the transfer; the Investor presses \"Received\" or \"Not received\"; with no response within 24 hours, the repayment counts as received.",
      },
      {
        vi: "3.6. Phí. Doanh nghiệp trả phí kích hoạt 3% trên số tiền giải ngân được xác nhận. Nhà đầu tư trả phí dịch vụ 2,5%/năm, xuất hóa đơn hằng tháng. Phí không bao giờ bị khấu trừ vào tiền gốc hoặc tiền trả nợ.",
        en: "3.6. Fees. SMEs pay a 3% activation fee on the confirmed disbursed amount. Investors pay a service fee of 2.5% a year, invoiced monthly. Fees are never deducted from principal or repayments.",
      },
      {
        vi: "3.7. Thuế. Doanh nghiệp khấu trừ thuế thu nhập cá nhân 5% trên tiền lãi trả cho Nhà đầu tư cá nhân theo quy định pháp luật về thuế.",
        en: "3.7. Tax. The SME withholds 5% personal income tax on interest paid to individual Investors, as tax law requires.",
      },
      {
        vi: "3.8. Rủi ro. Rủi ro tín dụng (Doanh nghiệp không trả nợ); rủi ro thanh khoản (không có thị trường thứ cấp, không rút vốn trước hạn); rủi ro tập trung; rủi ro vận hành của nền tảng; rủi ro pháp lý. Kết quả đánh giá của FundLok là thông tin tham khảo, không phải lời khuyên đầu tư.",
        en: "3.8. Risks. Credit risk (the SME does not repay); liquidity risk (no secondary market, no early withdrawal); concentration risk; platform operational risk; legal and regulatory risk. FundLok's assessment is information for reference, not investment advice.",
      },
      {
        vi: "3.9. Hạn mức. Mỗi khoản đầu tư tối thiểu 10.000.000 đồng và tối đa bằng số tiền còn lại của Khoản gọi vốn. Dư nợ tối đa của một Doanh nghiệp trên nền tảng: 100.000.000 đồng.",
        en: "3.9. Limits. Each investment is at least VND 10,000,000 and at most the amount still open on the Listing. Maximum outstanding per SME on the platform: VND 100,000,000.",
      },
    ],
  },
  {
    id: "4",
    title: {
      vi: "Điều 4. Tài khoản và nghĩa vụ người dùng",
      en: "Article 4. Accounts and user obligations",
    },
    paragraphs: [
      {
        vi: "4.1. Người dùng cung cấp thông tin trung thực, đầy đủ và cập nhật khi thay đổi; chỉ dùng tài khoản ngân hàng đứng tên chính mình; không thao tác thay hoặc nhân danh người khác; bảo mật thông tin đăng nhập và OTP.",
        en: "4.1. Users provide true and complete information and update it when it changes; use only bank accounts in their own name; do not act for or in the name of another person; keep their login details and OTPs secure.",
      },
      {
        vi: "4.2. Người dùng tuân thủ quy định về phòng, chống rửa tiền. FundLok có quyền tạm khóa tài khoản và từ chối giao dịch khi có dấu hiệu gian lận hoặc vi phạm pháp luật.",
        en: "4.2. Users comply with anti-money-laundering rules. FundLok may suspend an account and refuse a transaction where there are signs of fraud or a breach of law.",
      },
      {
        vi: "4.3. Nhà đầu tư đã cam kết mà không chuyển tiền trước 15 giờ Ngày giải ngân sẽ bị khóa tài khoản ngay. Để mở lại ở lần đăng nhập tiếp theo, Nhà đầu tư phải xác minh danh tính (eKYC) lại và ký cam kết không tái phạm. Nếu tái phạm, tài khoản bị khóa vĩnh viễn.",
        en: "4.3. An Investor who committed but does not transfer before 3 pm on the Disbursement Date has its account locked at once. To unlock it at the next log-on, the Investor must complete identity verification (eKYC) again and sign an undertaking not to repeat. A repeat means the account is closed permanently.",
      },
    ],
  },
  {
    id: "5",
    title: {
      vi: "Điều 5. Vai trò và giới hạn trách nhiệm của FundLok",
      en: "Article 5. FundLok's role and limits of liability",
    },
    paragraphs: [
      {
        vi: "5.1. FundLok cung cấp nền tảng, thẩm định hồ sơ, tạo mã QR, tính lịch trả nợ, lưu trữ hồ sơ và gửi thông báo. FundLok không quyết định đầu tư thay Nhà đầu tư và không ký hay vay thay Doanh nghiệp.",
        en: "5.1. FundLok provides the platform, assesses applications, generates QR codes, computes repayment schedules, keeps records and sends notices. FundLok does not make investment decisions for Investors and does not sign or borrow for SMEs.",
      },
      {
        vi: "5.2. FundLok không chịu trách nhiệm về việc Doanh nghiệp không trả nợ hoặc Nhà đầu tư không chuyển tiền. FundLok chịu trách nhiệm đối với thiệt hại phát sinh do lỗi của chính FundLok theo quy định pháp luật.",
        en: "5.2. FundLok is not liable for an SME failing to repay or an Investor failing to transfer. FundLok is liable for losses caused by its own fault as the law provides.",
      },
    ],
  },
  {
    id: "6",
    title: {
      vi: "Điều 6. Thông báo và hồ sơ điện tử",
      en: "Article 6. Notices and electronic records",
    },
    paragraphs: [
      {
        vi: "Thông báo được gửi qua ứng dụng, email, SMS hoặc Zalo đã đăng ký. Hồ sơ điện tử trên nền tảng (hợp đồng, ảnh chụp giao dịch, nhật ký thao tác) được lưu trữ và có thể dùng làm chứng cứ.",
        en: "Notices are sent through the app, or to the registered email, SMS or Zalo. Electronic records on the platform (contracts, transfer screenshots, activity logs) are kept and may be used as evidence.",
      },
    ],
  },
  {
    id: "7",
    title: { vi: "Điều 7. Sửa đổi Điều khoản", en: "Article 7. Changes to these Terms" },
    paragraphs: [
      {
        vi: "FundLok thông báo trước ít nhất [30] ngày khi sửa đổi Điều khoản này. Sửa đổi không làm thay đổi hợp đồng cho vay hay hợp đồng dịch vụ đã ký.",
        en: "FundLok gives at least [30] days' notice of changes to these Terms. Changes never alter loan contracts or service agreements already signed.",
      },
    ],
  },
  {
    id: "8",
    title: { vi: "Điều 8. Tạm ngừng và chấm dứt", en: "Article 8. Suspension and termination" },
    paragraphs: [
      {
        vi: "Người dùng có thể đóng tài khoản khi không còn khoản vay, cam kết hoặc phí chưa thanh toán. FundLok có thể chấm dứt tài khoản khi người dùng vi phạm nghiêm trọng, sau khi thông báo. Nghĩa vụ phát sinh trước khi chấm dứt vẫn tiếp tục.",
        en: "Users may close their account when no loan, commitment or fee remains outstanding. FundLok may close an account for a serious breach, after notice. Obligations arising before closure continue.",
      },
    ],
  },
  {
    id: "9",
    title: {
      vi: "Điều 9. Luật áp dụng và giải quyết tranh chấp",
      en: "Article 9. Governing law and disputes",
    },
    paragraphs: [
      {
        vi: "Điều khoản này tuân theo pháp luật Việt Nam. Tranh chấp được ưu tiên thương lượng trong 30 ngày; sau đó do Tòa án có thẩm quyền của Việt Nam giải quyết, hoặc Trung tâm Trọng tài Quốc tế Việt Nam (VIAC) nếu các bên thỏa thuận bằng văn bản.",
        en: "These Terms are governed by Vietnamese law. Disputes are first negotiated for 30 days; then they go to the competent Vietnamese court, or to the Vietnam International Arbitration Centre (VIAC) if the parties agree in writing.",
      },
    ],
  },
  {
    id: "10",
    title: {
      vi: "Điều 10. Đồng ý xử lý dữ liệu cá nhân (ô đánh dấu riêng)",
      en: "Article 10. Personal data consent (separate tick box)",
    },
    paragraphs: [
      {
        vi: "10.1. Bên kiểm soát dữ liệu: FundLok. Dữ liệu: thông tin định danh, giấy tờ tùy thân, ảnh khuôn mặt, thông tin liên hệ, tài khoản ngân hàng; với Doanh nghiệp, thêm hồ sơ pháp lý, báo cáo tài chính, sao kê và các giấy tờ Doanh nghiệp tự tải lên; với người bảo lãnh cá nhân của Doanh nghiệp, thông tin định danh và liên hệ.",
        en: "10.1. Controller: FundLok. Data: identity details, ID documents, face image, contact details, bank account; for SMEs, also legal documents, financial statements, statements and other papers the SME uploads itself; for the SME's personal guarantor, identity and contact details.",
      },
      {
        vi: "10.2. Mục đích: định danh và xác thực khách hàng (eKYC), phòng chống rửa tiền, thẩm định hồ sơ vay, thực hiện hợp đồng, báo cáo theo yêu cầu của cơ quan nhà nước có thẩm quyền.",
        en: "10.2. Purposes: identifying and verifying customers (eKYC), anti-money laundering, assessing loan applications, performing contracts, and reporting as competent authorities require.",
      },
      {
        vi: "10.3. Chia sẻ cho bên xử lý (ô đánh dấu riêng): FundLok chia sẻ dữ liệu định danh với Công ty TPV Datatrust để thực hiện eKYC. TPV Datatrust chỉ xử lý theo chỉ dẫn của FundLok và không lưu trữ dữ liệu. FundLok không bán dữ liệu cá nhân.",
        en: "10.3. Sharing with a processor (separate tick box): FundLok shares identity data with TPV Datatrust to perform eKYC. TPV Datatrust processes only on FundLok's instructions and does not store the data. FundLok does not sell personal data.",
      },
      {
        vi: "10.4. Quyền của chủ thể dữ liệu: được biết, truy cập, chỉnh sửa, rút lại sự đồng ý và yêu cầu xóa theo Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15. Rút lại sự đồng ý không ảnh hưởng đến xử lý đã thực hiện trước đó và đến dữ liệu phải lưu trữ theo luật; khi rút lại, người dùng có thể không tiếp tục sử dụng được dịch vụ.",
        en: "10.4. Data subject rights: to be informed, access, correct, withdraw consent and request deletion under the Law on Personal Data Protection No. 91/2025/QH15. Withdrawal does not affect processing already done or data the law requires to be kept; after withdrawal the user may no longer be able to use the service.",
      },
      {
        vi: "10.5. Lưu trữ: trong thời hạn theo quy định của pháp luật.",
        en: "10.5. Retention: for the periods the law requires.",
      },
      {
        vi: "10.6. Việc tra cứu thông tin tín dụng (CIC) và kết nối dữ liệu ngân hàng chưa được thực hiện; khi triển khai, FundLok sẽ xin đồng ý riêng.",
        en: "10.6. Credit-bureau (CIC) lookups and bank-data connections are not in use; when introduced, FundLok will ask for separate consent.",
      },
    ],
  },
];

// The three separate tick boxes on the sign-up screen, in Contract 1's own
// words. Each maps to one field of the backend's ConsentAcceptRequest.
export const TERMS_TICK_BOXES = {
  terms: {
    vi: "Tôi đã đọc và đồng ý Điều khoản Dịch vụ và các thông tin công bố tại Điều 3.",
    en: "I have read and agree to the Terms & Services and the disclosures in Article 3.",
  },
  data_processing: {
    vi: "Tôi đồng ý FundLok xử lý dữ liệu cá nhân của tôi theo Điều 10.1–10.2.",
    en: "I consent to FundLok processing my personal data under Articles 10.1–10.2.",
  },
  data_sharing_tpv: {
    vi: "Tôi đồng ý FundLok chia sẻ dữ liệu định danh với TPV Datatrust để eKYC theo Điều 10.3.",
    en: "I consent to FundLok sharing my identity data with TPV Datatrust for eKYC under Article 10.3.",
  },
} satisfies Record<string, Bilingual>;

export type TickBox = keyof typeof TERMS_TICK_BOXES;
