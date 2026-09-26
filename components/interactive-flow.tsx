"use client";

import { useState, useRef, useEffect } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ShieldCheck, Layers, Coins, Banknote } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

// Content structures for both roles in both English and Vietnamese
const contentData = {
  en: {
    sme: {
      steps: [
        {
          title: "Apply & KYC",
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
          title: "Đăng ký & KYC",
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

  const stageIcons = [ShieldCheck, Layers, Coins, Banknote];
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
  // "end start", not "end end": the panel is pinned from the moment the
  // wrapper's top reaches the viewport top until its BOTTOM does, so that is
  // the span progress has to map onto. Measuring to "end end" instead leaves
  // the last stage holding for a whole extra viewport while the first three
  // get one each.
  const { scrollYProgress } = useScroll({
    target: sequenceRef,
    offset: ["start start", "end start"],
  });
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const idx = Math.min(steps.length - 1, Math.floor(v * steps.length));
    setActiveStep((prev) => (prev === idx ? prev : idx));
  });

  useEffect(() => {
    if (
      activeStep === steps.length - 1 &&
      !celebrated.current &&
      !reduceMotion
    ) {
      celebrated.current = true;
      triggerConfetti();
    }
  }, [activeStep, steps.length, reduceMotion]);

  const handleRoleChange = (newRole: "sme" | "investor") => {
    setRole(newRole);
    celebrated.current = false;
  };

  const audiences = [
    {
      key: "sme" as const,
      label: currentLocale === "vi" ? "Cho doanh nghiệp" : "For SMEs",
    },
    {
      key: "investor" as const,
      label: currentLocale === "vi" ? "Cho nhà đầu tư" : "For Investors",
    },
  ];

  const stageDetail = (s: (typeof steps)[number]) => (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:gap-8">
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
        <p className="eyebrow mb-3">{s.badge}</p>
        <h3 className="mb-4 font-sans text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
          {(s as { detailTitle?: string }).detailTitle || s.title}
        </h3>
        <p className="mb-6 max-w-[65ch] font-sans text-sm leading-relaxed text-muted-foreground">
          {s.desc}
        </p>
        <div className="mb-6 flex flex-wrap gap-2">
          {s.tags.map((tag, tIdx) => (
            <span
              key={tIdx}
              className="rounded-full bg-emerald-500/10 px-3 py-1 font-sans text-[11px] font-semibold text-emerald-700 dark:text-emerald-400"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 border-t border-border/40 pt-6 md:grid-cols-3">
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
          ].map(([label, body]) => (
            <div key={label}>
              <h4 className="mb-2 font-sans text-xs font-semibold text-foreground">
                {label}
              </h4>
              <p className="font-sans text-[11px] leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/20 p-6">
        <h4 className="font-sans text-sm font-bold tracking-wide text-foreground">
          {s.journeyTitle}
        </h4>
        <div className="rounded-2xl border border-border bg-card p-5">
          <span className="mb-4 block font-sans text-xs font-semibold text-foreground">
            {currentLocale === "vi"
              ? "Các bước thực hiện"
              : "What happens here"}
          </span>
          <div className="flex flex-col gap-3.5">
            {s.rows.map((row, rIdx) => (
              <div
                key={rIdx}
                className="flex items-start justify-between gap-4 border-b border-border/10 pb-3.5 last:border-none last:pb-0"
              >
                <span className="font-sans text-xs text-muted-foreground">
                  {row[0]}
                </span>
                <span className="text-right font-sans text-xs font-bold text-foreground">
                  {row[1]}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-auto rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 dark:border-emerald-900/30 dark:bg-emerald-950/20">
          <p className="font-sans text-xs font-medium leading-relaxed text-emerald-800 dark:text-emerald-300">
            {s.emphasis}
          </p>
        </div>
      </div>
    </div>
  );

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
          {a.label}
        </button>
      ))}
    </div>
  );

  // Reduced motion gets the whole story stacked, with no pin and no scrub.
  // Same content, same order, nothing that moves under the reader (6.B).
  if (reduceMotion) {
    return (
      <div className="w-full">
        <div className="mb-8 flex justify-center">{audienceRail}</div>
        <div className="space-y-14">
          {steps.map((s, idx) => (
            <div key={`${role}-${idx}`}>{stageDetail(s)}</div>
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

      {/* Exactly one viewport of scroll per stage. */}
      <div
        ref={sequenceRef}
        style={{ height: `${steps.length * 100}vh` }}
        className="relative"
      >
        <div className="sticky top-0 flex min-h-[100dvh] flex-col justify-center py-16">
          {/* Pinned rail: progress, stage names, audience. Always on screen, so
              the reader can see where they are and what is still coming. */}
          <div className="mb-8">
            <div className="mb-5 h-1 w-full overflow-hidden rounded-full bg-border">
              <motion.div
                style={{ width: progressWidth }}
                className="h-full rounded-full bg-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-2">
                {steps.map((s, idx) => {
                  const Icon = stageIcons[idx] ?? ShieldCheck;
                  const isActive = idx === activeStep;
                  const isPast = idx < activeStep;
                  return (
                    <li
                      key={`${role}-rail-${idx}`}
                      className="flex items-center"
                    >
                      <span
                        aria-current={isActive ? "step" : undefined}
                        className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors ${
                          isActive
                            ? "bg-emerald-600 text-white"
                            : isPast
                              ? "text-foreground"
                              : "text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                        <span className="font-sans text-xs font-bold">
                          {s.title}
                        </span>
                      </span>
                      {idx < steps.length - 1 && (
                        <span
                          aria-hidden
                          className="mx-1 hidden h-px w-6 bg-[repeating-linear-gradient(90deg,currentColor_0_4px,transparent_4px_8px)] text-border md:block"
                        />
                      )}
                    </li>
                  );
                })}
              </ol>
              {audienceRail}
            </div>
          </div>

          {/* The stage itself. Cross-fades as the scroll crosses each boundary. */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${role}-${activeStep}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              {stageDetail(step)}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
