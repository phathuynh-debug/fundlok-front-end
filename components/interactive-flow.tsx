"use client";

import { useState, useRef, useEffect } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  Building2,
  Banknote,
  ChevronDown,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Content structures for both roles in both English and Vietnamese
const contentData = {
  en: {
    sme: {
      steps: [
        {
          title: "Apply & KYB",
          detailTitle: "Apply & verify online",
          badge: "Step 1 · Apply",
          tags: [
            "Fully online",
            "Documents you already have",
            "No hard collateral",
          ],
          desc: "Apply online and verify your business in one guided flow. We work from documents you already have: your VAT declarations and e-invoices.",
          how: "One form, one identity check. We tell you up front what we need.",
          why: "No paperwork chase. Your application moves straight to review.",
          tech: "Uploads are checked as they land, so a missing or edited file is flagged straight away.",
          journeyTitle: "Your application",
          rows: [
            ["You apply online", "Step by step"],
            ["Your identity is verified", "Digitally"],
            ["Documents are checked", "Automatically"],
            ["Your file goes to review", "Ready to assess"],
          ],
          emphasis: "Simple for you. Checked properly on our side.",
        },
        {
          title: "Assess",
          detailTitle: "Business assessment",
          badge: "Step 2 · Assess",
          tags: [
            "Based on real cash flow",
            "Data and AI",
            "Business score 0–100",
          ],
          desc: "We look at how your business actually earns, not a one-size-fits-all checklist. Verified revenue and cash flow set your business score and reference rate.",
          how: "Your tax data is analysed with data tools and AI, then reviewed by our team.",
          why: "A fair read of your business means terms you can actually keep up with.",
          tech: "Automated analysis of your VAT and e-invoice data keeps the review fast and consistent.",
          journeyTitle: "Understanding your business",
          rows: [
            ["Revenue is verified", "From tax records"],
            ["Cash flow is analysed", "With data and AI"],
            ["Your score is set", "0–100"],
            ["A reference rate follows", "From your score"],
          ],
          emphasis: "Your business is judged on its own numbers.",
        },
        {
          title: "Offer",
          detailTitle: "Offer & confirmation",
          badge: "Step 3 · Offer",
          tags: ["All-in rate", "All fees upfront", "No prepayment penalty"],
          desc: "If your business is a fit, you get an offer with the rate, the daily amount and every fee spelled out. Take your time and sign only when it works for you.",
          how: "Review the terms online and confirm digitally when you are ready.",
          why: "All fees are disclosed before disbursement. Nothing is added after.",
          tech: "Offers are generated and routed for approval automatically, so every one follows the same rules.",
          journeyTitle: "Your offer",
          rows: [
            ["Your offer arrives", "Online"],
            ["Rate and fees are shown", "In full"],
            ["You review the terms", "At your pace"],
            ["You sign", "Only if it fits"],
          ],
          emphasis: "No surprises. Every fee is on the table before you sign.",
        },
        {
          title: "Disburse & Repay",
          detailTitle: "Disbursement & repayment",
          badge: "Step 4 · Repay",
          tags: [
            "Fixed daily repayment",
            "Relief when revenue dips",
            "Early repayment, no penalty",
          ],
          desc: "Once funded, the money reaches your business and repayment begins: a small, fixed amount each working day, matched to how your business takes in cash.",
          how: "Track every payment on your dashboard, with reminders along the way.",
          why: "If verified revenue dips, the term can be extended to lower your daily payment. Interest applies to the extra time.",
          tech: "Connected revenue data and automated tracking keep your balance up to date.",
          journeyTitle: "Funding and repayment",
          rows: [
            ["Funds are disbursed", "To your business"],
            ["Daily repayment starts", "Fixed amount"],
            ["Your balance updates", "Every day"],
            ["Revenue dips?", "Term can extend"],
          ],
          emphasis: "Repayment that moves with your business, not against it.",
        },
      ],
    },
    investor: {
      steps: [
        {
          title: "Apply & KYC",
          detailTitle: "Sign up & verify",
          badge: "Step 1 · Join",
          tags: ["Verified investors only", "Secure access", "Fully online"],
          desc: "Sign up and verify your identity online. Every investor on FundLok is verified before they can invest.",
          how: "A short guided sign-up, then an identity check.",
          why: "A verified community keeps the marketplace credible for everyone.",
          tech: "Digital KYC and access controls run in the background.",
          journeyTitle: "Your sign-up",
          rows: [
            ["You register", "Online"],
            ["Your identity is verified", "Securely"],
            ["Access is approved", "Before you invest"],
            ["You are in", "Ready to browse"],
          ],
          emphasis: "Trust starts at the door.",
        },
        {
          title: "Browse Listings",
          detailTitle: "Browse listings",
          badge: "Step 2 · Browse",
          tags: ["Vetted SMEs", "Business score 0–100", "Verified revenue"],
          desc: "Every listing shows the business score, the verified revenue behind it, how fresh that data is, the fees and the backstop date.",
          how: "Filter by business score, industry and term to find what fits you.",
          why: "Everything you need for your own due diligence, in one place.",
          tech: "Listings update in real time as funding comes in.",
          journeyTitle: "Finding opportunities",
          rows: [
            ["Listings are presented", "In a standard format"],
            ["Business scores are shown", "0–100"],
            ["Revenue data is shared", "With its date"],
            ["You choose", "What to fund"],
          ],
          emphasis: "Clear data, your decision.",
        },
        {
          title: "Deposit",
          detailTitle: "Deposit & invest",
          badge: "Step 3 · Invest",
          tags: ["Secure escrow", "You choose the amount", "All fees upfront"],
          desc: "Deposit into your escrow account, then choose the projects and how much to put into each. Funds are only committed once a loan is fully matched.",
          how: "Deposit through secure channels, then allocate in a few clicks.",
          why: "All fees are disclosed before disbursement. Nothing is added after.",
          tech: "A ledger tracks every movement of your money, step by step.",
          journeyTitle: "Your deposit",
          rows: [
            ["You deposit", "Into escrow"],
            ["You pick projects", "And amounts"],
            ["Funds are committed", "Once fully matched"],
            ["Every movement", "Is on the ledger"],
          ],
          emphasis: "You stay in control of where your money goes.",
        },
        {
          title: "Repayment",
          detailTitle: "Receive repayments",
          badge: "Step 4 · Earn",
          tags: [
            "Daily repayments",
            "Paid out automatically",
            "Live dashboard",
          ],
          desc: "SMEs repay a fixed amount every working day. Your share lands in your account automatically, in proportion to what you invested.",
          how: "Repayments are split across investors pro rata and credited to your balance.",
          why: "Steady daily cash flow from real businesses, not a lump sum at the end.",
          tech: "Automated distribution and a real-time ledger keep your balance current.",
          journeyTitle: "Your returns",
          rows: [
            ["The SME repays", "Every working day"],
            ["Your share is calculated", "Pro rata"],
            ["Your balance updates", "In real time"],
            ["Your dashboard shows", "Progress to date"],
          ],
          emphasis: "Your returns arrive daily, tracked to the dong.",
        },
      ],
    },
  },
  vi: {
    sme: {
      steps: [
        {
          title: "Đăng ký & KYB",
          detailTitle: "Đăng ký & xác thực trực tuyến",
          badge: "Bước 1 · Đăng ký",
          tags: [
            "Hoàn toàn trực tuyến",
            "Dùng giấy tờ sẵn có",
            "Không cần tài sản thế chấp",
          ],
          desc: "Đăng ký trực tuyến và xác thực doanh nghiệp trong một quy trình có hướng dẫn. Chúng tôi dùng giấy tờ bạn đã có sẵn: tờ khai VAT và hóa đơn điện tử.",
          how: "Một biểu mẫu, một bước xác minh danh tính. Chúng tôi nói rõ cần gì ngay từ đầu.",
          why: "Không phải chạy theo giấy tờ. Hồ sơ của bạn chuyển thẳng sang thẩm định.",
          tech: "Tài liệu được kiểm tra ngay khi tải lên, nên tệp thiếu hoặc bị chỉnh sửa sẽ được phát hiện ngay.",
          journeyTitle: "Hồ sơ của bạn",
          rows: [
            ["Bạn đăng ký trực tuyến", "Từng bước"],
            ["Danh tính được xác minh", "Trực tuyến"],
            ["Tài liệu được kiểm tra", "Tự động"],
            ["Hồ sơ chuyển sang thẩm định", "Sẵn sàng đánh giá"],
          ],
          emphasis: "Đơn giản với bạn. Kiểm tra kỹ lưỡng ở phía chúng tôi.",
        },
        {
          title: "Thẩm định",
          detailTitle: "Thẩm định doanh nghiệp",
          badge: "Bước 2 · Thẩm định",
          tags: [
            "Dựa trên dòng tiền thực",
            "Dữ liệu và AI",
            "Điểm doanh nghiệp 0–100",
          ],
          desc: "Chúng tôi xem doanh nghiệp của bạn thực sự tạo ra tiền thế nào, không áp một khuôn mẫu chung. Doanh thu đã xác minh và dòng tiền quyết định điểm doanh nghiệp và lãi suất tham khảo.",
          how: "Dữ liệu thuế của bạn được phân tích bằng công cụ dữ liệu và AI, sau đó đội ngũ của chúng tôi xem xét.",
          why: "Đánh giá đúng doanh nghiệp nghĩa là điều khoản bạn thực sự theo kịp.",
          tech: "Phân tích tự động dữ liệu VAT và hóa đơn điện tử giúp việc thẩm định nhanh và nhất quán.",
          journeyTitle: "Hiểu doanh nghiệp của bạn",
          rows: [
            ["Doanh thu được xác minh", "Từ hồ sơ thuế"],
            ["Dòng tiền được phân tích", "Bằng dữ liệu và AI"],
            ["Điểm doanh nghiệp được xác định", "Thang 0–100"],
            ["Lãi suất tham khảo", "Theo điểm của bạn"],
          ],
          emphasis:
            "Doanh nghiệp của bạn được đánh giá bằng chính số liệu của mình.",
        },
        {
          title: "Đề xuất",
          detailTitle: "Đề xuất & xác nhận",
          badge: "Bước 3 · Đề xuất",
          tags: [
            "Lãi suất trọn gói",
            "Công khai mọi khoản phí",
            "Không phạt trả trước hạn",
          ],
          desc: "Nếu doanh nghiệp phù hợp, bạn nhận đề xuất ghi rõ lãi suất, khoản trả hằng ngày và mọi khoản phí. Cứ cân nhắc kỹ và chỉ ký khi thấy phù hợp.",
          how: "Xem điều khoản trực tuyến và xác nhận bằng chữ ký số khi sẵn sàng.",
          why: "Mọi khoản phí được công bố trước khi giải ngân. Không phát sinh thêm sau đó.",
          tech: "Đề xuất được tạo và chuyển duyệt tự động, nên mọi đề xuất đều theo cùng một quy tắc.",
          journeyTitle: "Đề xuất của bạn",
          rows: [
            ["Đề xuất được gửi", "Trực tuyến"],
            ["Lãi suất và phí", "Hiển thị đầy đủ"],
            ["Bạn xem điều khoản", "Theo tốc độ của bạn"],
            ["Bạn ký", "Chỉ khi phù hợp"],
          ],
          emphasis:
            "Không bất ngờ. Mọi khoản phí đều rõ ràng trước khi bạn ký.",
        },
        {
          title: "Giải ngân & Hoàn trả",
          detailTitle: "Giải ngân & hoàn trả",
          badge: "Bước 4 · Hoàn trả",
          tags: [
            "Trả cố định hằng ngày",
            "Giãn thời hạn khi doanh thu giảm",
            "Trả sớm không bị phạt",
          ],
          desc: "Khi gọi vốn xong, tiền được chuyển đến doanh nghiệp và việc hoàn trả bắt đầu: một khoản nhỏ, cố định mỗi ngày làm việc, khớp với cách doanh nghiệp thu tiền.",
          how: "Theo dõi từng khoản thanh toán trên bảng điều khiển, kèm nhắc nhở trong suốt quá trình.",
          why: "Nếu doanh thu đã xác minh giảm, thời hạn có thể được kéo dài để giảm khoản trả hằng ngày. Lãi được tính cho phần thời gian kéo dài.",
          tech: "Dữ liệu doanh thu được kết nối và theo dõi tự động giúp số dư luôn cập nhật.",
          journeyTitle: "Giải ngân và hoàn trả",
          rows: [
            ["Vốn được giải ngân", "Đến doanh nghiệp"],
            ["Bắt đầu trả hằng ngày", "Khoản cố định"],
            ["Số dư được cập nhật", "Mỗi ngày"],
            ["Doanh thu giảm?", "Có thể giãn thời hạn"],
          ],
          emphasis: "Hoàn trả thuận theo nhịp kinh doanh của bạn.",
        },
      ],
    },
    investor: {
      steps: [
        {
          title: "Đăng ký & KYC",
          detailTitle: "Đăng ký & xác thực",
          badge: "Bước 1 · Tham gia",
          tags: [
            "Chỉ nhà đầu tư đã xác thực",
            "Truy cập bảo mật",
            "Hoàn toàn trực tuyến",
          ],
          desc: "Đăng ký và xác minh danh tính trực tuyến. Mọi nhà đầu tư trên FundLok đều được xác thực trước khi đầu tư.",
          how: "Đăng ký nhanh có hướng dẫn, sau đó xác minh danh tính.",
          why: "Cộng đồng đã xác thực giúp sàn đáng tin cậy với tất cả mọi người.",
          tech: "KYC kỹ thuật số và kiểm soát truy cập vận hành phía sau.",
          journeyTitle: "Đăng ký của bạn",
          rows: [
            ["Bạn đăng ký", "Trực tuyến"],
            ["Danh tính được xác minh", "An toàn"],
            ["Quyền truy cập được duyệt", "Trước khi đầu tư"],
            ["Hoàn tất", "Sẵn sàng khám phá"],
          ],
          emphasis: "Niềm tin bắt đầu từ bước đầu tiên.",
        },
        {
          title: "Duyệt dự án",
          detailTitle: "Duyệt dự án",
          badge: "Bước 2 · Khám phá",
          tags: [
            "SME đã thẩm định",
            "Điểm doanh nghiệp 0–100",
            "Doanh thu đã xác minh",
          ],
          desc: "Mỗi dự án đều hiển thị điểm doanh nghiệp, doanh thu đã xác minh đằng sau điểm số, độ mới của dữ liệu, các khoản phí và hạn tất toán cuối cùng.",
          how: "Lọc theo điểm doanh nghiệp, ngành và kỳ hạn để tìm dự án phù hợp.",
          why: "Đủ thông tin để bạn tự thẩm định, tất cả ở một nơi.",
          tech: "Danh sách dự án cập nhật theo thời gian thực khi vốn được huy động.",
          journeyTitle: "Tìm cơ hội",
          rows: [
            ["Dự án được trình bày", "Theo định dạng chuẩn"],
            ["Điểm doanh nghiệp", "Thang 0–100"],
            ["Dữ liệu doanh thu", "Kèm ngày cập nhật"],
            ["Bạn quyết định", "Đầu tư vào đâu"],
          ],
          emphasis: "Dữ liệu rõ ràng, quyết định của bạn.",
        },
        {
          title: "Nạp vốn",
          detailTitle: "Nạp vốn & đầu tư",
          badge: "Bước 3 · Đầu tư",
          tags: [
            "Tài khoản escrow an toàn",
            "Bạn chọn số tiền",
            "Công khai mọi khoản phí",
          ],
          desc: "Nạp tiền vào tài khoản escrow, rồi chọn dự án và số tiền cho từng dự án. Tiền chỉ được cam kết khi khoản vay đã huy động đủ.",
          how: "Nạp tiền qua kênh bảo mật, rồi phân bổ chỉ với vài thao tác.",
          why: "Mọi khoản phí được công bố trước khi giải ngân. Không phát sinh thêm sau đó.",
          tech: "Sổ cái ghi lại từng bước di chuyển của dòng tiền.",
          journeyTitle: "Khoản nạp của bạn",
          rows: [
            ["Bạn nạp tiền", "Vào tài khoản escrow"],
            ["Bạn chọn dự án", "Và số tiền"],
            ["Tiền được cam kết", "Khi huy động đủ"],
            ["Mọi giao dịch", "Đều có trên sổ cái"],
          ],
          emphasis: "Bạn luôn kiểm soát tiền của mình đi đâu.",
        },
        {
          title: "Hoàn trả",
          detailTitle: "Nhận hoàn trả",
          badge: "Bước 4 · Nhận lãi",
          tags: [
            "Hoàn trả hằng ngày",
            "Chi trả tự động",
            "Bảng điều khiển trực tiếp",
          ],
          desc: "Doanh nghiệp trả một khoản cố định mỗi ngày làm việc. Phần của bạn tự động về tài khoản, theo tỷ lệ số vốn bạn đầu tư.",
          how: "Khoản hoàn trả được chia theo tỷ lệ cho các nhà đầu tư và ghi có vào số dư của bạn.",
          why: "Dòng tiền đều đặn mỗi ngày từ doanh nghiệp thật, không phải chờ đến cuối kỳ.",
          tech: "Phân phối tự động và sổ cái thời gian thực giúp số dư luôn cập nhật.",
          journeyTitle: "Khoản nhận của bạn",
          rows: [
            ["Doanh nghiệp trả nợ", "Mỗi ngày làm việc"],
            ["Phần của bạn được tính", "Theo tỷ lệ góp vốn"],
            ["Số dư được cập nhật", "Theo thời gian thực"],
            ["Bảng điều khiển", "Hiển thị tiến độ"],
          ],
          emphasis: "Tiền về mỗi ngày, theo dõi đến từng đồng.",
        },
      ],
    },
  },
};

/**
 * The audience gate: "SME or investor?", the question the section opens with.
 *
 * It is a tall scroll track (GATE_TRACK_VH) with one viewport-sized panel
 * pinned inside it, and the track's scroll progress (0 → 1) drives three beats:
 *
 *   approach  the panel is still scrolling into view. The heading drops in and
 *             the two cards slide in from opposite edges of the screen.
 *   hold      the panel is pinned with both cards seated, so the reader has a
 *             moment to choose.
 *   release   the panel fades as the track ends and the sequence takes over.
 *
 * Not choosing is a choice: the sequence starts on the SME flow, so scrolling
 * straight through the hold shows the Business process by default.
 */
const GATE_TRACK_VH = 185;

/**
 * One choice on the gate.
 *
 * `x` and `opacity` are the scroll-driven entrance and live on a wrapper that
 * does nothing else. The button inside owns the hover and selected colours.
 * They must not share an element: a CSS transition on the element framer-motion
 * writes `transform` to turns every scroll frame into a 300ms ease, so that card
 * trails behind its neighbour instead of tracking the scrollbar.
 */
function AudienceGateCard({
  icon: Icon,
  label,
  blurb,
  cta,
  selected,
  onChoose,
  x,
  opacity,
}: {
  icon: LucideIcon;
  label: string;
  blurb: string;
  cta: string;
  selected: boolean;
  onChoose: () => void;
  x: MotionValue<string>;
  opacity: MotionValue<number>;
}) {
  return (
    <motion.div style={{ x, opacity }} className="h-full">
      <button
        type="button"
        onClick={onChoose}
        aria-pressed={selected}
        className={cn(
          "group flex h-full w-full cursor-pointer flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-[background-color,border-color,box-shadow] md:gap-3 md:p-8",
          selected
            ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
            : "border-border bg-card hover:border-emerald-500/50 hover:shadow-md",
        )}
      >
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-colors md:h-12 md:w-12",
            selected
              ? "bg-emerald-600 text-white"
              : "bg-muted text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
          )}
        >
          <Icon className="h-5 w-5 md:h-6 md:w-6" strokeWidth={1.75} />
        </span>
        <span className="font-sans text-xl font-extrabold tracking-tight text-foreground md:text-2xl">
          {label}
        </span>
        <span className="font-sans text-sm leading-relaxed text-muted-foreground">
          {blurb}
        </span>
        <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 md:mt-2">
          {cta}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </span>
      </button>
    </motion.div>
  );
}

export function InteractiveFlow() {
  const { locale } = useTranslations();
  const currentLocale = (locale === "vi" ? "vi" : "en") as "en" | "vi";
  const text = contentData[currentLocale];

  const [role, setRole] = useState<"sme" | "investor">("sme");
  const reduceMotion = useReducedMotion();
  const celebrated = useRef(false);
  const [activeStep, setActiveStep] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiCleanupRef = useRef<(() => void) | null>(null);

  const activeRoleData = role === "sme" ? text.sme : text.investor;

  const triggerConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Cancel any previous running animation
    if (confettiCleanupRef.current) {
      confettiCleanupRef.current();
    }

    // Resize canvas to cover the container card area
    canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
    canvas.height = canvas.parentElement?.clientHeight || 650;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      rotationX: number;
      rotationY: number;
      rotationZ: number;
      rotSpeedX: number;
      rotSpeedY: number;
      rotSpeedZ: number;
      type: "bill" | "coin" | "confetti";
      color: string;
      width: number;
      height: number;
      opacity: number;
      scale: number;
    }

    interface Shockwave {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      opacity: number;
    }

    const particles: Particle[] = [];
    const shockwaves: Shockwave[] = [];

    const centerX = canvas.width / 2;
    const bottomY = canvas.height;
    const isMobile = canvas.width < 640;
    const scaleMultiplier = isMobile ? 0.75 : 1.0;
    const xOffsetMultiplier = isMobile ? 0.7 : 1.0;
    const yOffsetMultiplier = isMobile ? 0.75 : 1.0;

    const poppers = [
      {
        id: 1,
        colorType: "green" as const,
        baseScale: 1.0 * scaleMultiplier,
        width: 26,
        height: 95,
        angle: -Math.PI / 6, // tilted up-right
        targetX: centerX - 55 * xOffsetMultiplier,
        targetY: bottomY - 110 * yOffsetMultiplier,
        startY: bottomY + 120,
        hasPopped: false,
      },
      {
        id: 2,
        colorType: "red" as const,
        baseScale: 1.0 * scaleMultiplier,
        width: 24,
        height: 90,
        angle: Math.PI / 5, // tilted up-left
        targetX: centerX + 50 * xOffsetMultiplier,
        targetY: bottomY - 95 * yOffsetMultiplier,
        startY: bottomY + 130,
        hasPopped: false,
      },
      {
        id: 3,
        colorType: "red" as const,
        baseScale: 0.75 * scaleMultiplier,
        width: 22,
        height: 80,
        angle: -Math.PI / 10, // tilted slightly up-right
        targetX: centerX - 12 * xOffsetMultiplier,
        targetY: bottomY - 65 * yOffsetMultiplier,
        startY: bottomY + 100,
        hasPopped: false,
      },
    ];

    const shootConfetti = (
      tipX: number,
      tipY: number,
      angle: number,
      typeColor: "green" | "red",
    ) => {
      const count = isMobile ? 25 : 45;
      for (let i = 0; i < count; i++) {
        // Vector in the direction of the popper
        const dirX = Math.sin(angle);
        const dirY = -Math.cos(angle);

        // Add spread: rotate the direction vector by a random angle between -0.35 and +0.35 radians
        const spread = (Math.random() - 0.5) * 0.7;
        const spreadCos = Math.cos(spread);
        const spreadSin = Math.sin(spread);
        const velX = dirX * spreadCos - dirY * spreadSin;
        const velY = dirX * spreadSin + dirY * spreadCos;

        const speed = (8 + Math.random() * 16) * scaleMultiplier;
        const typeRand = Math.random();
        let type: "bill" | "coin" | "confetti" = "confetti";
        let color = "#10b981"; // emerald
        let width = 6 + Math.random() * 6;
        let height = 3 + Math.random() * 3;

        if (typeColor === "green") {
          if (typeRand < 0.45) {
            type = "bill";
            color = "#059669"; // Dollar green
            width = 16 + Math.random() * 6;
            height = 8 + Math.random() * 3;
          } else if (typeRand < 0.75) {
            type = "coin";
            color = "#fbbf24"; // Gold yellow
            width = 8 + Math.random() * 4;
            height = width;
          } else {
            type = "confetti";
            color = Math.random() > 0.5 ? "#14b8a6" : "#34d399";
            width = 6 + Math.random() * 4;
            height = 10 + Math.random() * 6;
          }
        } else {
          // red poppers
          if (typeRand < 0.35) {
            type = "bill";
            color = "#10b981"; // Emerald/dollar green (still money!)
            width = 16 + Math.random() * 6;
            height = 8 + Math.random() * 3;
          } else if (typeRand < 0.65) {
            type = "coin";
            color = "#fbbf24"; // Gold yellow
            width = 8 + Math.random() * 4;
            height = width;
          } else {
            type = "confetti";
            color = Math.random() > 0.5 ? "#ef4444" : "#fb7185"; // Red/rose colors
            width = 6 + Math.random() * 4;
            height = 10 + Math.random() * 6;
          }
        }

        particles.push({
          x: tipX,
          y: tipY,
          vx: velX * speed,
          vy: velY * speed,
          rotationX: Math.random() * Math.PI,
          rotationY: Math.random() * Math.PI,
          rotationZ: Math.random() * Math.PI,
          rotSpeedX: (Math.random() - 0.5) * 0.1,
          rotSpeedY: (Math.random() - 0.5) * 0.1,
          rotSpeedZ: (Math.random() - 0.5) * 0.1,
          type,
          color,
          width,
          height,
          opacity: 1,
          scale: 0.6 + Math.random() * 0.6,
        });
      }
    };

    let animationFrameId: number;
    let frameCount = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      frameCount++;
      let activeParticles = 0;

      // 1. Update & Draw Particles (Money/Confetti)
      particles.forEach((p) => {
        if (p.opacity <= 0) return;

        activeParticles++;

        // Update physics
        p.x += p.vx;
        p.y += p.vy;

        p.vy += 0.35; // Gravity
        p.vx *= 0.985; // Air resistance
        p.vy *= 0.985;

        p.rotationX += p.rotSpeedX;
        p.rotationY += p.rotSpeedY;
        p.rotationZ += p.rotSpeedZ;

        // Fade out as they fall below screen height
        if (p.y > canvas.height - 40) {
          p.opacity -= 0.02;
        }

        // Draw particle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotationZ);
        ctx.scale(
          Math.cos(p.rotationX) * p.scale,
          Math.sin(p.rotationY) * p.scale,
        );
        ctx.globalAlpha = Math.max(0, p.opacity);

        if (p.type === "bill") {
          // Draw green dollar bill
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);

          // Draw white outline border
          ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
          ctx.lineWidth = 0.8;
          ctx.strokeRect(-p.width / 2, -p.height / 2, p.width, p.height);

          // Tiny dollar sign $ in center
          ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
          ctx.font = "bold 6px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("$", 0, 0);
        } else if (p.type === "coin") {
          // Draw gold coin circle
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
          ctx.fill();

          // Outer gold border outline
          ctx.strokeStyle = "#d97706"; // Dark gold
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
          ctx.stroke();

          // Coin detail dot in center
          ctx.fillStyle = "#d97706";
          ctx.beginPath();
          ctx.arc(0, 0, p.width / 5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Standard Confetti Strip
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        }

        ctx.restore();
      });

      // 2. Update & Draw Shockwaves
      shockwaves.forEach((sw) => {
        sw.radius += 4;
        sw.opacity -= 0.05;

        if (sw.opacity > 0) {
          ctx.save();
          ctx.globalAlpha = sw.opacity;
          const grad = ctx.createRadialGradient(
            sw.x,
            sw.y,
            sw.radius * 0.1,
            sw.x,
            sw.y,
            sw.radius,
          );
          grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
          grad.addColorStop(0.3, "rgba(253, 224, 71, 0.7)"); // yellow
          grad.addColorStop(1, "rgba(239, 68, 68, 0)"); // red transparent
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // 3. Update & Draw Popper Cones
      poppers.forEach((p) => {
        // Trigger popping explosion at exactly frame 12
        if (frameCount >= 12 && !p.hasPopped) {
          p.hasPopped = true;

          // Compute tip position in world coordinates
          const scaleY = 1 - 0.35; // initial squish scale at t=0
          const tipX =
            p.targetX +
            Math.sin(p.angle) * (p.height / 2) * (scaleY * p.baseScale);
          const tipY =
            p.targetY -
            Math.cos(p.angle) * (p.height / 2) * (scaleY * p.baseScale);

          // Shoot particles!
          shootConfetti(tipX, tipY, p.angle, p.colorType);

          // Add shockwave
          shockwaves.push({
            x: tipX,
            y: tipY,
            radius: 5,
            maxRadius: 70 * scaleMultiplier,
            opacity: 0.85,
          });
        }

        // Draw the popper if it hasn't finished sliding down off-screen
        if (frameCount < 65) {
          // Determine current position
          let currentY = p.targetY;
          const currentX = p.targetX;

          if (frameCount < 12) {
            // Sliding up
            const pct = frameCount / 12;
            const ease = 1 - Math.pow(1 - pct, 3); // easeOutCubic
            currentY = p.startY - (p.startY - p.targetY) * ease;
          } else if (frameCount > 45) {
            // Sliding down
            const pct = Math.min(1, (frameCount - 45) / 20);
            const ease = pct * pct; // easeInQuad
            currentY = p.targetY + 200 * ease;
          }

          // Calculate spring scale
          let scaleX = 1;
          let scaleY = 1;
          if (frameCount >= 12 && frameCount < 45) {
            const t = frameCount - 12;
            scaleX = 1 + 0.35 * Math.cos(t * 0.6) * Math.exp(-t * 0.15);
            scaleY = 1 - 0.35 * Math.cos(t * 0.6) * Math.exp(-t * 0.15);
          }

          ctx.save();
          // Move to center of popper
          ctx.translate(currentX, currentY);
          ctx.rotate(p.angle);
          ctx.scale(scaleX * p.baseScale, scaleY * p.baseScale);

          const H = p.height;
          const W = p.width;
          const W_base = W * 0.3;

          // A. Draw Pull String (wavy line from bottom)
          ctx.beginPath();
          ctx.moveTo(0, H / 2);
          ctx.bezierCurveTo(-5, H / 2 + 10, 5, H / 2 + 15, 0, H / 2 + 25);
          ctx.strokeStyle = "rgba(203, 213, 225, 0.85)";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Draw small pull loop at the end
          ctx.beginPath();
          ctx.arc(0, H / 2 + 28, 3, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(203, 213, 225, 0.9)";
          ctx.fill();
          ctx.strokeStyle = "rgba(148, 163, 184, 0.9)";
          ctx.lineWidth = 1;
          ctx.stroke();

          // B. Draw Popper Body (Cone)
          ctx.beginPath();
          ctx.moveTo(-W_base / 2, H / 2);
          ctx.lineTo(-W / 2, -H / 2);
          ctx.lineTo(W / 2, -H / 2);
          ctx.lineTo(W_base / 2, H / 2);
          ctx.closePath();

          // Create beautiful shiny cylinder gradient
          const bodyGrad = ctx.createLinearGradient(-W / 2, 0, W / 2, 0);
          if (p.colorType === "green") {
            bodyGrad.addColorStop(0, "#065f46"); // Emerald 800
            bodyGrad.addColorStop(0.25, "#059669"); // Emerald 600
            bodyGrad.addColorStop(0.5, "#34d399"); // Emerald 300 (shine)
            bodyGrad.addColorStop(0.75, "#10b981"); // Emerald 500
            bodyGrad.addColorStop(1, "#047857"); // Emerald 700
          } else {
            bodyGrad.addColorStop(0, "#991b1b"); // Red 800
            bodyGrad.addColorStop(0.25, "#dc2626"); // Red 600
            bodyGrad.addColorStop(0.5, "#f87171"); // Red 400 (shine)
            bodyGrad.addColorStop(0.75, "#ef4444"); // Red 500
            bodyGrad.addColorStop(1, "#b91c1c"); // Red 700
          }
          ctx.fillStyle = bodyGrad;
          ctx.fill();

          // Draw outline
          ctx.strokeStyle = p.colorType === "green" ? "#047857" : "#b91c1c";
          ctx.lineWidth = 0.5;
          ctx.stroke();

          // C. Draw Gold Rim Band at the opening (top)
          const bandHeight = 7;
          ctx.beginPath();
          ctx.moveTo(-W / 2 - 1, -H / 2);
          ctx.lineTo(-W / 2 + 1, -H / 2 + bandHeight);
          ctx.lineTo(W / 2 - 1, -H / 2 + bandHeight);
          ctx.lineTo(W / 2 + 1, -H / 2);
          ctx.closePath();

          const goldGrad = ctx.createLinearGradient(-W / 2, 0, W / 2, 0);
          goldGrad.addColorStop(0, "#b45309"); // Amber 700 (dark gold)
          goldGrad.addColorStop(0.3, "#fbbf24"); // Amber 400 (bright gold)
          goldGrad.addColorStop(0.5, "#fef08a"); // Yellow 200 (shine)
          goldGrad.addColorStop(0.7, "#f59e0b"); // Amber 500
          goldGrad.addColorStop(1, "#92400e"); // Amber 800 (shadow)

          ctx.fillStyle = goldGrad;
          ctx.fill();

          // Draw the dark inner opening ellipse
          ctx.beginPath();
          ctx.ellipse(0, -H / 2, W / 2, W / 6, 0, 0, Math.PI * 2);
          ctx.fillStyle = "#1e293b"; // Dark inner opening
          ctx.fill();

          // Gold ellipse border
          ctx.beginPath();
          ctx.ellipse(0, -H / 2, W / 2, W / 6, 0, 0, Math.PI * 2);
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // D. Draw tiny sparks sticking out of opening
          ctx.beginPath();
          ctx.moveTo(-W / 4, -H / 2);
          ctx.lineTo(-W / 3, -H / 2 - 8);
          ctx.moveTo(0, -H / 2);
          ctx.lineTo(-2, -H / 2 - 12);
          ctx.moveTo(W / 4, -H / 2);
          ctx.lineTo(W / 3, -H / 2 - 8);
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.restore();
        }
      });

      // Continue animation if we have active particles or if poppers are still animating
      if (activeParticles > 0 || frameCount < 65) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    const cleanup = () => {
      cancelAnimationFrame(animationFrameId);
    };
    confettiCleanupRef.current = cleanup;
    return cleanup;
  };

  // Cleanup on unmount. The burst fires when the reader reaches the final
  // node, not on a timer, so it can be mid-flight when the section unmounts.
  useEffect(() => {
    return () => {
      confettiCleanupRef.current?.();
    };
  }, []);

  const steps = activeRoleData.steps;
  const step = steps[Math.min(activeStep, steps.length - 1)];

  /**
   * Scroll-pinned sequence, after worldquant.com.
   *
   * The section is several viewports tall. Inside it a single panel is pinned,
   * and scrolling advances the stage rather than moving the panel. That answers
   * the thing tabs got wrong: the reader does not have to discover a control or
   * decide what to click, they just keep scrolling and all four stages arrive
   * in the order they actually happen.
   *
   * `useScroll` + `useTransform`, never a scroll listener (5.D). The progress
   * bar is a motion value, so it repaints without re-rendering React; only the
   * stage INDEX goes through state, and only when it actually changes, which is
   * three times across the whole section rather than once per frame (3.B).
   */
  const sequenceRef = useRef<HTMLDivElement>(null);
  // Pinned from the moment the wrapper's top reaches viewport top ("start start")
  // until the container's bottom reaches the viewport bottom ("end end"), which is
  // the exact point where sticky top-0 ceases to stick. This guarantees that all stages
  // — including the final stage — receive their full scroll distance inside the block.
  const { scrollYProgress } = useScroll({
    target: sequenceRef,
    offset: ["start start", "end end"],
  });
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const idx = Math.min(steps.length - 1, Math.floor(v * steps.length));
    setActiveStep((prev) => (prev === idx ? prev : idx));

    // Celebrate when the reader finishes scrolling through the final stage
    if (v >= 0.92 && !celebrated.current && !reduceMotion) {
      celebrated.current = true;
      triggerConfetti();
    } else if (v < 0.75 && celebrated.current) {
      celebrated.current = false;
    }
  });

  const handleRoleChange = (newRole: "sme" | "investor") => {
    setRole(newRole);
    celebrated.current = false;
  };

  const audiences = [
    {
      key: "sme" as const,
      icon: Building2,
      label: currentLocale === "vi" ? "Doanh nghiệp" : "SME",
      short: currentLocale === "vi" ? "Cho doanh nghiệp" : "For SMEs",
      blurb:
        currentLocale === "vi"
          ? "Tôi đang tìm nguồn vốn cho doanh nghiệp của mình."
          : "I am looking for funding for my business.",
      cta:
        currentLocale === "vi"
          ? "Xem quy trình Doanh nghiệp"
          : "View Business flow",
    },
    {
      key: "investor" as const,
      icon: Banknote,
      label: currentLocale === "vi" ? "Nhà đầu tư" : "Investor",
      short: currentLocale === "vi" ? "Cho nhà đầu tư" : "For Investors",
      blurb:
        currentLocale === "vi"
          ? "Tôi muốn cấp vốn cho các doanh nghiệp đã được thẩm định."
          : "I want to fund businesses that have been assessed.",
      cta:
        currentLocale === "vi"
          ? "Xem quy trình Nhà đầu tư"
          : "View Investor flow",
    },
  ];

  const gateContainerRef = useRef<HTMLDivElement>(null);

  // Scroll progress across the whole gate track (approach + hold), 0 → 1.
  const { scrollYProgress: gateTrackProgress } = useScroll({
    target: gateContainerRef,
    offset: ["start end", "end end"],
  });

  // The same number, copied through a plain function on purpose.
  //
  // framer-motion 12 hands a `useScroll({ target })` value that goes straight
  // into `useTransform(v, [in], [out])` to the browser's native ViewTimeline
  // instead of computing it in JS. For a target taller than the screen the
  // native "entry" range ends when the target's TOP reaches the top of the
  // screen, not when its bottom reaches the bottom, and its keyframes only
  // cover the ranges given, so anything outside them falls back to the inline
  // style. Opacity peaked early, faded back to 0 before the panel had pinned
  // and the hold was an empty screen, while `x` (not accelerated) stayed on the
  // JS progress. One value, one clock: everything below reads this copy.
  const gateProgress = useTransform(gateTrackProgress, (v) => v);

  // Landmarks, as fractions of the track: ~0.12 the panel's content is just
  // below the fold, 0.54 (100/185) its top reaches the top of the screen and it
  // pins, 1 the track ends and the sequence takes over.
  //
  // Approach: the heading drops in and the cards travel in from opposite screen
  // edges, seated a moment before the panel locks. The travel is in vw, not px,
  // so it starts off-screen at any width and needs no window read (which would
  // make the server render differ from the client).
  const headerY = useTransform(gateProgress, [0.1, 0.44], [-35, 0]);
  const headerOpacity = useTransform(gateProgress, [0.1, 0.38], [0, 1]);
  const leftCardX = useTransform(gateProgress, [0.12, 0.48], ["-45vw", "0vw"]);
  const rightCardX = useTransform(gateProgress, [0.12, 0.48], ["45vw", "0vw"]);
  const cardOpacity = useTransform(gateProgress, [0.12, 0.42], [0, 1]);

  // Hold: the "keep scrolling" hint shows while the cards are seated.
  const hintOpacity = useTransform(
    gateProgress,
    [0.5, 0.58, 0.82, 0.88],
    [0, 1, 1, 0],
  );

  // Release: the whole panel eases away as the track ends.
  const gateExitOpacity = useTransform(gateProgress, [0.86, 0.98], [1, 0]);
  const gateExitScale = useTransform(gateProgress, [0.86, 0.98], [1, 0.96]);
  const gateExitY = useTransform(gateProgress, [0.86, 0.98], [0, -18]);

  // Cards that are still transparent (approach) or already fading (release)
  // must not catch clicks meant for the page behind them.
  const gateInteractive = useTransform(gateProgress, (v) =>
    v > 0.4 && v < 0.93 ? "auto" : "none",
  );

  /**
   * Picking an audience takes you to the sequence.
   *
   * The sequence starts on the SME flow, so there is nothing to "default" to
   * when the reader scrolls past without choosing: that already IS the Business
   * process. A choice, from here or from the rail, is simply kept.
   */
  const chooseAudience = (key: "sme" | "investor") => {
    handleRoleChange(key);
    sequenceRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  const staticAudienceGate = (
    <div className="mx-auto mb-14 max-w-3xl text-center lg:mb-20">
      <h3 className="mb-3 font-sans text-3xl font-extrabold leading-[1.15] tracking-tighter text-foreground md:text-5xl">
        {currentLocale === "vi"
          ? "Bạn là doanh nghiệp hay nhà đầu tư?"
          : "Are you an SME or an investor?"}
      </h3>
      <p className="mx-auto mb-8 max-w-[48ch] font-sans text-sm text-muted-foreground md:text-base">
        {currentLocale === "vi"
          ? "Chọn một bên để xem đúng quy trình dành cho bạn."
          : "Pick one to see the process that applies to you."}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {audiences.map((a) => {
          const Icon = a.icon;
          const isChosen = role === a.key;
          return (
            <button
              key={a.key}
              onClick={() => chooseAudience(a.key)}
              aria-pressed={isChosen}
              className={`group flex flex-col items-start gap-3 rounded-2xl border p-6 text-left transition-colors md:p-8 ${
                isChosen
                  ? "border-emerald-500 bg-emerald-500/5"
                  : "border-border bg-card hover:border-emerald-500/50"
              }`}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                  isChosen
                    ? "bg-emerald-600 text-white"
                    : "bg-muted text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                }`}
              >
                <Icon className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <span className="font-sans text-xl font-extrabold tracking-tight text-foreground md:text-2xl">
                {a.label}
              </span>
              <span className="font-sans text-sm leading-relaxed text-muted-foreground">
                {a.blurb}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  /**
   * One stage, presented the way worldquant.com presents a belief: the title
   * IS the slide. Display type first, one lead paragraph, and the supporting
   * detail demoted to a quiet grid underneath rather than competing with it.
   *
   * leading-[1.1], not leading-none. Vietnamese stacks diacritics above the
   * cap height (ế, ữ, ộ) and a zero-leading display line clips them. The English
   * copy would have looked fine and the production language would not.
   */
  function ScrollProgressItem({
    progress,
    range,
    className = "",
    children,
  }: {
    progress: MotionValue<number>;
    range: [number, number];
    className?: string;
    children: React.ReactNode;
  }) {
    const opacity = useTransform(progress, range, [0, 1], { clamp: true });
    const y = useTransform(progress, range, [14, 0], { clamp: true });

    return (
      <motion.div style={{ opacity, y }} className={className}>
        {children}
      </motion.div>
    );
  }

  function ScrollDrivenStageDetail({
    s,
    idx,
    totalSteps,
    currentLocale,
    scrollYProgress,
  }: {
    s: (typeof contentData)["en"]["sme"]["steps"][number];
    idx: number;
    totalSteps: number;
    currentLocale: string;
    scrollYProgress: MotionValue<number>;
  }) {
    // Normalize scroll progress within this stage's span (idx / totalSteps -> (idx + 1) / totalSteps)
    const stageProgress = useTransform(
      scrollYProgress,
      [idx / totalSteps, (idx + 1) / totalSteps],
      [0, 1],
      { clamp: true },
    );

    const cards = [
      [currentLocale === "vi" ? "Cách hoạt động" : "How this works", s.how],
      [
        currentLocale === "vi" ? "Tại sao quan trọng" : "Why this matters",
        s.why,
      ],
      [
        currentLocale === "vi" ? "Công nghệ hỗ trợ" : "Technology behind it",
        s.tech,
      ],
      [s.journeyTitle, s.emphasis],
    ];

    const cardRanges: [number, number][] = [
      [0.02, 0.14],
      [0.14, 0.26],
      [0.26, 0.38],
      [0.38, 0.5],
    ];

    const rowRanges: [number, number][] = [
      [0.58, 0.67],
      [0.67, 0.76],
      [0.76, 0.85],
      [0.85, 0.94],
    ];

    return (
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div>
          <p className="mb-5 font-mono text-xs text-muted-foreground">
            {String(idx + 1).padStart(2, "0")}
          </p>

          <h3 className="mb-6 max-w-[14ch] font-sans text-4xl font-extrabold leading-[1.1] tracking-tighter text-foreground md:text-6xl lg:text-7xl">
            {(s as { detailTitle?: string }).detailTitle || s.title}
          </h3>

          <p className="mb-8 max-w-[52ch] font-sans text-base leading-relaxed text-muted-foreground md:text-lg">
            {s.desc}
          </p>

          <div className="flex flex-wrap gap-2">
            {s.tags.map((tag, tIdx) => (
              <span
                key={tIdx}
                className="rounded-full border border-border px-3 py-1 font-sans text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Supporting detail: items appear one by one as the reader scrolls within this stage */}
        <div className="flex flex-col gap-8 lg:pt-16">
          <div className="grid gap-6 sm:grid-cols-2">
            {cards.map(([label, body], cIdx) => (
              <ScrollProgressItem
                key={label}
                progress={stageProgress}
                range={cardRanges[cIdx] ?? [0, 1]}
                className="border-t border-border pt-4"
              >
                <h4 className="mb-2 font-sans text-xs font-semibold text-foreground">
                  {label}
                </h4>
                <p className="font-sans text-xs leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </ScrollProgressItem>
            ))}
          </div>

          <dl className="border-t border-border pt-4">
            <ScrollProgressItem progress={stageProgress} range={[0.5, 0.58]}>
              <dt className="mb-3 font-sans text-xs font-semibold text-foreground">
                {currentLocale === "vi"
                  ? "Các bước thực hiện"
                  : "What happens here"}
              </dt>
            </ScrollProgressItem>
            {s.rows.map((row, rIdx) => (
              <ScrollProgressItem
                key={rIdx}
                progress={stageProgress}
                range={rowRanges[rIdx] ?? [0.58, 0.95]}
                className="flex items-start justify-between gap-6 py-2"
              >
                <dd className="font-sans text-xs text-muted-foreground">
                  {row[0]}
                </dd>
                <dd className="shrink-0 text-right font-sans text-xs font-bold text-foreground">
                  {row[1]}
                </dd>
              </ScrollProgressItem>
            ))}
          </dl>
        </div>
      </div>
    );
  }

  function StaticStageDetail({
    s,
    idx,
    currentLocale,
  }: {
    s: (typeof contentData)["en"]["sme"]["steps"][number];
    idx: number;
    currentLocale: string;
  }) {
    return (
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div>
          <p className="mb-5 font-mono text-xs text-muted-foreground">
            {String(idx + 1).padStart(2, "0")}
          </p>

          <h3 className="mb-6 max-w-[14ch] font-sans text-4xl font-extrabold leading-[1.1] tracking-tighter text-foreground md:text-6xl lg:text-7xl">
            {(s as { detailTitle?: string }).detailTitle || s.title}
          </h3>

          <p className="mb-8 max-w-[52ch] font-sans text-base leading-relaxed text-muted-foreground md:text-lg">
            {s.desc}
          </p>

          <div className="flex flex-wrap gap-2">
            {s.tags.map((tag, tIdx) => (
              <span
                key={tIdx}
                className="rounded-full border border-border px-3 py-1 font-sans text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-8 lg:pt-16">
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              [
                currentLocale === "vi" ? "Cách hoạt động" : "How this works",
                s.how,
              ],
              [
                currentLocale === "vi"
                  ? "Tại sao quan trọng"
                  : "Why this matters",
                s.why,
              ],
              [
                currentLocale === "vi"
                  ? "Công nghệ hỗ trợ"
                  : "Technology behind it",
                s.tech,
              ],
              [s.journeyTitle, s.emphasis],
            ].map(([label, body]) => (
              <div key={label} className="border-t border-border pt-4">
                <h4 className="mb-2 font-sans text-xs font-semibold text-foreground">
                  {label}
                </h4>
                <p className="font-sans text-xs leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </div>
            ))}
          </div>

          <dl className="border-t border-border pt-4">
            <dt className="mb-3 font-sans text-xs font-semibold text-foreground">
              {currentLocale === "vi"
                ? "Các bước thực hiện"
                : "What happens here"}
            </dt>
            {s.rows.map((row, rIdx) => (
              <div
                key={rIdx}
                className="flex items-start justify-between gap-6 py-2"
              >
                <dd className="font-sans text-xs text-muted-foreground">
                  {row[0]}
                </dd>
                <dd className="shrink-0 text-right font-sans text-xs font-bold text-foreground">
                  {row[1]}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    );
  }

  const audienceRail = (
    <div className="flex gap-1 rounded-2xl border border-border bg-card p-1.5">
      {audiences.map((a) => (
        <button
          key={a.key}
          onClick={() => handleRoleChange(a.key)}
          aria-pressed={role === a.key}
          className={`rounded-xl px-4 py-2 text-xs font-sans font-bold transition-colors ${
            role === a.key
              ? "bg-emerald-600 text-white"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          }`}
        >
          {a.short}
        </button>
      ))}
    </div>
  );

  // Reduced motion gets the whole story stacked, with no pin and no scrub.
  // Same content, same order, nothing that moves under the reader (6.B).
  if (reduceMotion) {
    return (
      <div className="w-full">
        {staticAudienceGate}
        <div className="space-y-14">
          {steps.map((s, idx) => (
            <div key={`${role}-${idx}`}>
              <StaticStageDetail
                s={s}
                idx={idx}
                currentLocale={currentLocale}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-50 h-full w-full"
      />

      {/* Too short to pin a whole screen of content (a phone on its side, a
          window with devtools docked): show the plain, unpinned gate instead.
          Pure CSS, so rotating never unmounts the element useScroll tracks.
          639px is where the pinned content stops fitting on a phone. */}
      <div className="hidden [@media(max-height:639px)]:block">
        {staticAudienceGate}
      </div>

      {/* Audience gate: a scroll track with one viewport-tall panel pinned
          inside it (see GATE_TRACK_VH). No overflow clip on the panel: the
          cards travel in from the edges of the SCREEN, and the page wrapper
          already clips horizontally. */}
      <div
        ref={gateContainerRef}
        style={{ height: `${GATE_TRACK_VH}vh` }}
        className="relative w-full [@media(max-height:639px)]:hidden"
      >
        <div className="sticky top-0 flex min-h-[100dvh] w-full flex-col items-center justify-center px-4 pb-8 pt-28 md:pt-24">
          <motion.div
            style={{
              opacity: gateExitOpacity,
              scale: gateExitScale,
              y: gateExitY,
              pointerEvents: gateInteractive,
            }}
            className="mx-auto w-full max-w-3xl text-center"
          >
            <motion.div style={{ y: headerY, opacity: headerOpacity }}>
              <h3
                id="audience-gate-title"
                className="mb-3 font-sans text-2xl font-extrabold leading-[1.15] tracking-tighter text-foreground sm:text-3xl md:text-5xl"
              >
                {currentLocale === "vi"
                  ? "Bạn là doanh nghiệp hay nhà đầu tư?"
                  : "Are you an SME or an investor?"}
              </h3>
              {/* On a short screen the hint below says the same, and the room is needed. */}
              <p className="mx-auto mb-5 max-w-[48ch] font-sans text-sm text-muted-foreground md:mb-8 md:text-base [@media(max-height:700px)]:hidden">
                {currentLocale === "vi"
                  ? "Chọn một bên để xem đúng quy trình dành cho bạn."
                  : "Pick one to see the process that applies to you."}
              </p>
            </motion.div>

            <div
              role="group"
              aria-labelledby="audience-gate-title"
              className="grid gap-3 sm:grid-cols-2 sm:gap-4"
            >
              {audiences.map((a, i) => (
                <AudienceGateCard
                  key={a.key}
                  icon={a.icon}
                  label={a.label}
                  blurb={a.blurb}
                  cta={a.cta}
                  selected={role === a.key}
                  onChoose={() => chooseAudience(a.key)}
                  x={i === 0 ? leftCardX : rightCardX}
                  opacity={cardOpacity}
                />
              ))}
            </div>

            {/* Hint for scrolling harder */}
            <motion.div
              style={{ opacity: hintOpacity }}
              className="mt-5 flex flex-col items-center justify-center gap-2 md:mt-8"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
                <span>
                  {currentLocale === "vi"
                    ? "Chọn một bên hoặc cuộn tiếp để xem quy trình Doanh nghiệp mặc định"
                    : "Choose an option or scroll to continue with Business process by default"}
                </span>
                <motion.span
                  aria-hidden
                  animate={{ y: [0, 3, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="inline-block text-emerald-600 dark:text-emerald-400"
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Exactly one viewport of scroll per stage, plus the pinned viewport height. */}
      <div
        ref={sequenceRef}
        style={{ height: `${steps.length * 100 + 100}vh` }}
        className="relative"
      >
        <div className="sticky top-0 flex min-h-[100dvh] flex-col">
          {/* Segmented indicator, after worldquant.com: one segment per stage,
              filled as the reader passes it, with the progress line running
              underneath. It is the wayfinding for the whole section, so it sits
              at the very top of the pinned area and never moves. */}
          <div className="border-b border-border pt-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <span className="font-sans text-xs font-semibold text-muted-foreground">
                {currentLocale === "vi" ? "Quy trình" : "How it works"}
              </span>
              {audienceRail}
            </div>

            <ol className="grid grid-cols-2 md:grid-cols-4">
              {steps.map((s, idx) => {
                const isActive = idx === activeStep;
                const isDone = idx < activeStep;
                return (
                  <li
                    key={`${role}-seg-${idx}`}
                    aria-current={isActive ? "step" : undefined}
                    className={`border-l px-3 py-3 transition-colors first:border-l-0 ${
                      isActive || isDone
                        ? "border-emerald-500/40"
                        : "border-border"
                    }`}
                  >
                    <span
                      className={`block font-sans text-[11px] font-bold leading-snug transition-colors md:text-xs ${
                        isActive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : isDone
                            ? "text-foreground"
                            : "text-muted-foreground"
                      }`}
                    >
                      {s.title}
                    </span>
                  </li>
                );
              })}
            </ol>

            {/* The scrubbed line. Sits on the section's own bottom rule so the
                bar reads as one object rather than a bar plus a stray track. */}
            <div className="-mb-px h-0.5 w-full bg-transparent">
              <motion.div
                style={{ width: progressWidth }}
                className="h-full bg-emerald-500"
              />
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-center py-12">
            {/* The stage itself. Cross-fades as the scroll crosses each boundary. */}
            <motion.div
              key={`${role}-${activeStep}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <ScrollDrivenStageDetail
                s={step}
                idx={activeStep}
                totalSteps={steps.length}
                currentLocale={currentLocale}
                scrollYProgress={scrollYProgress}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
