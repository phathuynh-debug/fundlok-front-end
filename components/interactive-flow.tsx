"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "@/lib/i18n";
import { ChevronRight, ChevronLeft, RotateCcw } from "lucide-react";

// Content structures for both roles in both English and Vietnamese
const contentData = {
  en: {
    sme: {
      steps: [
        {
          num: 1,
          title: "Apply & KYC",
          caption: "A simple and secure way to get started",
          stage: "Stage 1 of 4",
          badge: "Easy onboarding",
          tags: [
            "Simple start",
            "Secure onboarding",
            "Guided flow",
            "Digital verification",
          ],
          desc: "Getting started with FundLok should feel clear, simple, and secure. In this first step, you submit your application and complete verification through one guided process so your business can move forward quickly and with confidence.",
          how: "You go through one digital application and verification journey, with clear requirements and fewer manual back-and-forth steps.",
          why: "This helps you get into the funding process more smoothly while giving FundLok the information needed to review your business responsibly.",
          tech: "Behind the scenes, digital onboarding, verification workflows, and automated requirement handling help make the process faster, more consistent, and easier to manage.",
          journeyTitle: "Your application journey",
          rows: [
            ["You apply online", "Quick and guided"],
            ["Verification begins", "Digitally"],
            ["Requirements are organized", "Automatically"],
            ["Your case moves forward", "Ready for assessment"],
          ],
          emphasis:
            "What we want to emphasize here is that getting started should feel simple for you — but still supported by secure digital workflows that keep the process efficient and reliable.",
        },
        {
          num: 2,
          title: "Assess",
          detailTitle: "Business Assessment",
          caption: "A smarter review powered by data and AI",
          stage: "Stage 2 of 4",
          badge: "Smart assessment",
          tags: [
            "Data-driven review",
            "AI-supported analysis",
            "Cash flow understanding",
            "Business-specific assessment",
          ],
          desc: "Once your application is complete, FundLok reviews your business in a way that is designed to reflect how it actually operates. Instead of forcing every SME into the same rigid model, we use data, automation, and AI-supported analysis to better understand your business reality, funding needs, and repayment capacity.",
          how: "Your business is assessed using a more structured and technology-enabled process that helps us understand performance patterns, operating context, and funding suitability more accurately.",
          why: "This matters because better assessment leads to funding structures that are more realistic, more relevant, and better aligned with how your business grows.",
          tech: "Behind the experience are automated financial workflows, data analysis tools, and AI-assisted review models that help tailor decisions more intelligently than a one-size-fits-all approach.",
          journeyTitle: "Understanding your business",
          rows: [
            ["Business data is analyzed", "With structure"],
            ["Patterns are reviewed", "Using data tools"],
            ["Context is considered", "More intelligently"],
            ["A funding outcome is prepared", "For the next step"],
          ],
          emphasis:
            "What we want to emphasize here is that your business is not being looked at in a generic way. Technology helps us evaluate your real operating situation more thoughtfully and more accurately.",
        },
        {
          num: 3,
          title: "Offer",
          detailTitle: "Offer & Confirmation",
          caption: "Clear terms supported by a structured workflow",
          stage: "Stage 3 of 4",
          badge: "Transparent offer",
          tags: [
            "Clear structure",
            "Transparent terms",
            "Digital confirmation",
            "Confidence before proceeding",
          ],
          desc: "If your business is suitable for funding, we prepare an offer for you to review. This is where you can understand the structure, review the terms clearly, and decide whether the funding arrangement fits your business before moving ahead.",
          how: "You receive a structured offer experience that makes it easier to review terms, understand the arrangement, and move forward with clarity.",
          why: "This helps ensure that funding is not only available, but also presented in a way that lets you make an informed and confident decision.",
          tech: "Behind this step are automated offer-generation, approval-routing, and confirmation workflows that help keep the process secure, consistent, and scalable.",
          journeyTitle: "Your offer review",
          rows: [
            ["Your offer is prepared", "Clearly and digitally"],
            ["Terms are presented", "For review"],
            ["You confirm suitability", "Before proceeding"],
            ["The process advances", "Only after confirmation"],
          ],
          emphasis:
            "What we want to emphasize here is confidence. You should feel that the offer is not only clear to review, but also supported by a structured technology layer that makes the process more secure and dependable.",
        },
        {
          num: 4,
          title: "Disburse & Repay",
          detailTitle: "Disbursement & Repayment",
          caption: "Flexible servicing with clear tracking",
          stage: "Stage 4 of 4",
          badge: "Repayment experience",
          tags: [
            "Funding delivered",
            "Flexible servicing",
            "Ongoing visibility",
            "Clear repayment flow",
          ],
          desc: "Once funding is completed, capital is disbursed to your business and repayment begins. FundLok is designed to make this stage more practical and transparent by connecting repayment more closely to actual business activity and giving you clearer visibility along the way.",
          how: "You experience a repayment process that is easier to follow, with notifications, tracking, and connected servicing designed to reduce friction over time.",
          why: "This is where FundLok's model becomes most meaningful: funding supports growth, while repayment is structured in a way that better reflects real business conditions.",
          tech: "Behind this experience are connected revenue data flows, automated reminders, repayment routing logic, and transaction tracking systems that help make money movement more visible and manageable.",
          journeyTitle: "Your funding and repayment experience",
          rows: [
            ["Funds are disbursed", "To your business"],
            ["Repayment begins", "With defined structure"],
            ["Tracking stays active", "Throughout the journey"],
            ["Notifications support you", "Along the way"],
          ],
          emphasis:
            "What we want to emphasize here is practicality supported by technology. Funding should reach you efficiently, and repayment should feel clearer, smoother, and easier to navigate because the system is built to support it.",
        },
      ],
    },
    investor: {
      steps: [
        {
          num: 1,
          title: "Apply & KYC",
          caption: "A secure and trusted starting point",
          stage: "Stage 1 of 4",
          badge: "Secure onboarding",
          tags: [
            "Trusted entry",
            "Secure verification",
            "Controlled access",
            "Digital onboarding",
          ],
          desc: "Before participating on FundLok, you complete a secure onboarding and verification process. This gives you a clearer and more trusted starting point, while helping establish a disciplined environment for participation across the platform.",
          how: "You go through a structured onboarding experience that is designed to be efficient for you while maintaining strong verification and access control.",
          why: "This matters because a stronger onboarding process supports a more credible platform and a more trusted investment environment.",
          tech: "Behind the scenes, digital KYC workflows, verification checks, and controlled access systems help create a cleaner foundation for routing funds securely.",
          journeyTitle: "Your onboarding journey",
          rows: [
            ["You register", "Through a guided flow"],
            ["Verification is completed", "Securely"],
            ["Access is reviewed", "Before activation"],
            ["You enter the platform", "With confidence"],
          ],
          emphasis:
            "What we want to emphasize here is trust supported by technology. Your participation begins through a controlled digital process designed to make the platform feel more secure and dependable from the start.",
        },
        {
          num: 2,
          title: "Browse Listings",
          caption: "Structured opportunities in one marketplace",
          stage: "Stage 2 of 4",
          badge: "Investment discovery",
          tags: [
            "Vetted listings",
            "Structured details",
            "Filter & search",
            "Transparent data",
          ],
          desc: "Explore investment opportunities with detailed business information, risk assessment parameters, and financial offers. We organize listings transparently so you can build your portfolio based on clear parameters.",
          how: "You browse a structured database of verified SME listings, sorted and filtered by risk grades, industries, and repayment structures.",
          why: "This gives you full visibility into loan offerings, so you can perform your due diligence and allocate capital to projects matching your risk-return targets.",
          tech: "Behind the marketplace are secure listing databases, automated risk grading indexes, and real-time updates that synchronize active funding opportunities.",
          journeyTitle: "Finding opportunities",
          rows: [
            ["Listings are presented", "With standard detail"],
            ["Risk grades are shown", "Based on model metrics"],
            ["Financials are available", "For diligence review"],
            ["Portfolio selection is", "In your control"],
          ],
          emphasis:
            "What we want to emphasize here is data transparency. Discovering projects should feel simple, backed by structured assessments that help you make balanced decisions.",
        },
        {
          num: 3,
          title: "Deposit",
          caption: "Controlled fund handling with greater transparency",
          stage: "Stage 3 of 4",
          badge: "Secure allocation",
          tags: [
            "Secure escrow",
            "Capital allocation",
            "Automated tracking",
            "Zero hidden fees",
          ],
          desc: "Transfer funds securely into your platform escrow account. You specify how much you want to invest in chosen projects, and the capital is routed safely to fund the selected loan contracts.",
          how: "You deposit capital through secure channels. The platform coordinates allocation to matching SME loan pools under strict custody terms.",
          why: "Your funds are held securely and only committed to active loans once the matching phase is completed, ensuring transparent custody.",
          tech: "Behind the funding are escrow accounts, ledger tracking systems, and transaction verification protocols that keep your capital safe and accounted for.",
          journeyTitle: "Your deposit flow",
          rows: [
            ["Deposit funds", "Securely to escrow"],
            ["Select project allocations", "Precisely and digitally"],
            ["Funds are pooled", "For disbursement"],
            ["Ledger tracks capital", "At every step"],
          ],
          emphasis:
            "What we want to emphasize here is control. You manage how and where your capital is deployed, with platform automation securing the custody and transit of your funds.",
        },
        {
          num: 4,
          title: "Repayment",
          caption: "Technology-enabled routing and tracking",
          stage: "Stage 4 of 4",
          badge: "Investor returns",
          tags: [
            "Revenue sharing",
            "Automated distribution",
            "Real-time ledger",
            "Direct updates",
          ],
          desc: "Receive your share of repayments automatically as SMEs make their daily or weekly revenue-share payments. Monitor returns and track progress in real-time on your dashboard ledger.",
          how: "The platform routes the incoming SME revenue-share payments directly to the participating investors' accounts on a prorated basis.",
          why: "This turns investment into regular, liquid cash flow returns, directly reflecting the performance of the businesses you support.",
          tech: "Behind this are automated revenue-split contracts, bank-account integration APIs, and prorated ledger distribution scripts that automate repayment payouts.",
          journeyTitle: "Your repayment tracking",
          rows: [
            ["Payments are received", "From the SME loop"],
            ["Platform distributes split", "Automatically to ledger"],
            ["Balance is updated", "In real-time"],
            ["Dashboard charts portfolio", "Ongoing return progress"],
          ],
          emphasis:
            "What we want to emphasize here is passive tracking. Returns are calculated, split, and deposited to your balance automatically, so you can track growth with zero manual overhead.",
        },
      ],
    },
  },
  vi: {
    sme: {
      steps: [
        {
          num: 1,
          title: "Đăng ký & KYC",
          detailTitle: "Đăng ký & Xác thực",
          caption: "Quy trình đơn giản và an toàn để bắt đầu",
          stage: "Giai đoạn 1/4",
          badge: "Đăng ký dễ dàng",
          tags: [
            "Khởi đầu đơn giản",
            "Onboarding bảo mật",
            "Luồng hướng dẫn",
            "Xác thực kỹ thuật số",
          ],
          desc: "Bắt đầu với FundLok được thiết kế để mang lại cảm giác rõ ràng, đơn giản và an toàn. Trong bước đầu tiên này, bạn gửi hồ sơ đăng ký và hoàn thành xác thực thông qua một quy trình có hướng dẫn để doanh nghiệp có thể tiến hành nhanh chóng và tự tin.",
          how: "Bạn trải qua một hành trình đăng ký và xác thực trực quan duy nhất, với các yêu cầu rõ ràng và hạn chế tối đa các bước thủ công rườm rà.",
          why: "Điều này giúp bạn bước vào quy trình gọi vốn thuận lợi hơn, đồng thời cung cấp đầy đủ thông tin để FundLok thẩm định hồ sơ doanh nghiệp một cách có trách nhiệm.",
          tech: "Đằng sau hệ thống là các luồng đăng ký kỹ thuật số, quy trình xác thực tự động và cơ chế xử lý tài liệu giúp đẩy nhanh tiến độ, đảm bảo tính nhất quán.",
          journeyTitle: "Hành trình đăng ký của bạn",
          rows: [
            ["Bạn đăng ký trực tuyến", "Nhanh chóng và có hướng dẫn"],
            ["Quá trình xác thực bắt đầu", "Hoàn toàn kỹ thuật số"],
            ["Các hồ sơ được sắp xếp", "Tự động"],
            ["Hồ sơ được chuyển tiếp", "Sẵn sàng để thẩm định"],
          ],
          emphasis:
            "Chúng tôi muốn nhấn mạnh rằng việc bắt đầu sẽ cực kỳ đơn giản cho bạn — nhưng vẫn được bảo đảm bởi các luồng công việc kỹ thuật số an toàn để giữ cho quy trình luôn hiệu quả và đáng tin cậy.",
        },
        {
          num: 2,
          title: "Thẩm định",
          detailTitle: "Thẩm định doanh nghiệp",
          caption: "Đánh giá thông minh bằng dữ liệu và AI",
          stage: "Giai đoạn 2/4",
          badge: "Thẩm định thông minh",
          tags: [
            "Đánh giá qua dữ liệu",
            "Phân tích hỗ trợ bởi AI",
            "Hiểu rõ dòng tiền",
            "Thẩm định theo doanh nghiệp",
          ],
          desc: "Sau khi hồ sơ hoàn tất, FundLok đánh giá doanh nghiệp của bạn theo phương thức phản ánh đúng cách thức vận hành thực tế. Thay vì ép buộc mọi SME vào một mô hình cứng nhắc, chúng tôi sử dụng dữ liệu và phân tích AI để hiểu rõ thực tế hoạt động, nhu cầu vốn và khả năng hoàn trả.",
          how: "Doanh nghiệp của bạn được đánh giá bằng quy trình áp dụng công nghệ và cấu trúc chặt chẽ giúp phân tích chính xác xu hướng hiệu suất, bối cảnh hoạt động và độ phù hợp.",
          why: "Điều này quan trọng vì thẩm định tốt hơn sẽ dẫn đến các cấu trúc vốn thực tế, phù hợp và liên kết chặt chẽ hơn với tốc độ tăng trưởng của doanh nghiệp.",
          tech: "Đằng sau trải nghiệm là các luồng công việc tài chính tự động, công cụ phân tích dữ liệu và mô hình đánh giá có AI hỗ trợ giúp tùy chỉnh các quyết định thông minh hơn.",
          journeyTitle: "Hiểu rõ doanh nghiệp của bạn",
          rows: [
            ["Dữ liệu kinh doanh được phân tích", "Theo cấu trúc"],
            ["Các mô hình được đánh giá", "Sử dụng công cụ dữ liệu"],
            ["Bối cảnh được xem xét", "Một cách thông minh hơn"],
            ["Kết quả gọi vốn được chuẩn bị", "Cho bước tiếp theo"],
          ],
          emphasis:
            "Điều chúng tôi muốn nhấn mạnh ở đây là doanh nghiệp của bạn không bị đánh giá theo cách chung chung. Công nghệ giúp chúng tôi đánh giá tình hình hoạt động thực tế của bạn một cách thấu đáo và chính xác hơn.",
        },
        {
          num: 3,
          title: "Đề xuất",
          detailTitle: "Đề xuất & Xác nhận",
          caption: "Điều khoản rõ ràng với quy trình chuẩn hóa",
          stage: "Giai đoạn 3/4",
          badge: "Đề xuất minh bạch",
          tags: [
            "Cấu trúc rõ ràng",
            "Điều khoản minh bạch",
            "Xác nhận kỹ thuật số",
            "Tự tin trước khi tiến hành",
          ],
          desc: "Nếu doanh nghiệp của bạn đủ điều kiện tài trợ, chúng tôi sẽ chuẩn bị một đề xuất vay để bạn xem xét. Đây là nơi bạn có thể nắm rõ cấu trúc, xem các điều khoản một cách minh bạch và quyết định xem thỏa thuận gọi vốn có phù hợp với doanh nghiệp hay không.",
          how: "Bạn nhận được một trải nghiệm xem đề xuất được cấu trúc rõ ràng giúp dễ dàng đánh giá điều khoản, hiểu rõ thỏa thuận và tiến hành với sự tường minh.",
          why: "Điều này đảm bảo rằng nguồn vốn không chỉ có sẵn mà còn được trình bày theo cách giúp bạn đưa ra quyết định sáng suốt và tự tin nhất.",
          tech: "Đằng sau bước này là các quy trình tự động tạo đề xuất, phê duyệt luồng và xác nhận kỹ thuật số giúp giữ cho quy trình an toàn, nhất quán và có thể mở rộng.",
          journeyTitle: "Xem xét đề xuất của bạn",
          rows: [
            ["Đề xuất được chuẩn bị", "Rõ ràng và bằng kỹ thuật số"],
            ["Các điều khoản được trình bày", "Để xem xét"],
            ["Bạn xác nhận độ phù hợp", "Trước khi tiến hành"],
            ["Quy trình được chuyển tiếp", "Chỉ sau khi xác nhận"],
          ],
          emphasis:
            "Điều chúng tôi muốn nhấn mạnh ở đây là sự tự tin. Bạn sẽ cảm nhận được đề xuất không chỉ rõ ràng để xem xét, mà còn được hỗ trợ bởi một lớp công nghệ giúp quy trình an toàn và đáng tin cậy hơn.",
        },
        {
          num: 4,
          title: "Giải ngân & Hoàn trả",
          detailTitle: "Giải ngân & Hoàn trả",
          caption: "Dịch vụ linh hoạt với giám sát rõ ràng",
          stage: "Giai đoạn 4/4",
          badge: "Trải nghiệm thanh toán",
          tags: [
            "Vốn được chuyển giao",
            "Dịch vụ linh hoạt",
            "Giám sát liên tục",
            "Luồng hoàn trả rõ ràng",
          ],
          desc: "Sau khi gọi vốn hoàn tất, nguồn vốn sẽ được giải ngân cho doanh nghiệp của bạn và quá trình hoàn trả bắt đầu. FundLok được thiết kế để làm cho giai đoạn này thực tế và minh bạch hơn bằng cách kết nối việc hoàn trả chặt chẽ hơn với doanh thu thực tế.",
          how: "Bạn trải nghiệm quy trình hoàn trả dễ dàng theo dõi, với các thông báo, cập nhật tiến độ và dịch vụ kết nối được thiết kế để giảm thiểu mọi trở ngại.",
          why: "Đây là nơi mô hình của FundLok trở nên ý nghĩa nhất: vốn hỗ trợ tăng trưởng, trong khi hoàn trả được cấu trúc phù hợp với điều kiện kinh doanh thực tế.",
          tech: "Đằng sau là các luồng dữ liệu doanh thu kết nối trực tiếp, hệ thống nhắc nhở tự động, logic định tuyến thanh toán và cơ chế theo dõi giao dịch giúp dòng tiền trở nên minh bạch.",
          journeyTitle: "Trải nghiệm gọi vốn và hoàn trả của bạn",
          rows: [
            ["Vốn được giải ngân", "Đến doanh nghiệp của bạn"],
            ["Quá trình hoàn trả bắt đầu", "Với cấu trúc xác định"],
            ["Theo dõi hoạt động liên tục", "Suốt hành trình"],
            ["Các thông báo hỗ trợ bạn", "Trong suốt quá trình"],
          ],
          emphasis:
            "Điều chúng tôi muốn nhấn mạnh ở đây là tính thực tế được hỗ trợ bởi công nghệ. Vốn tiếp cận bạn nhanh chóng, và hoàn trả nhẹ nhàng, mượt mà hơn vì hệ thống được xây dựng để tối ưu hóa điều đó.",
        },
      ],
    },
    investor: {
      steps: [
        {
          num: 1,
          title: "Đăng ký & KYC",
          caption: "Điểm khởi đầu an toàn và đáng tin cậy",
          stage: "Giai đoạn 1/4",
          badge: "Onboarding an toàn",
          tags: [
            "Lối vào tin cậy",
            "Xác thực bảo mật",
            "Kiểm soát truy cập",
            "Onboarding kỹ thuật số",
          ],
          desc: "Trước khi tham gia vào FundLok, bạn hoàn thành quy trình đăng ký và xác thực bảo mật. Điều này mang lại cho bạn điểm khởi đầu rõ ràng, đáng tin cậy hơn, đồng thời thiết lập môi trường kỷ luật cho mọi hoạt động trên nền tảng.",
          how: "Bạn trải qua quy trình đăng ký được cấu trúc hợp lý để tối ưu hóa thời gian của bạn mà vẫn duy trì kiểm soát xác thực chặt chẽ.",
          why: "Điều này quan trọng vì quy trình đăng ký chặt chẽ giúp xây dựng nền tảng uy tín và môi trường đầu tư đáng tin cậy hơn cho tất cả thành viên.",
          tech: "Hệ thống sử dụng các luồng KYC kỹ thuật số, cơ chế kiểm tra xác thực và hệ thống kiểm soát truy cập để tạo nền tảng sạch cho việc chuyển tiền và theo dõi sau này.",
          journeyTitle: "Hành trình đăng ký của bạn",
          rows: [
            ["Bạn đăng ký tài khoản", "Qua luồng hướng dẫn trực quan"],
            ["Xác thực được hoàn thành", "Bảo mật và an toàn"],
            ["Quyền truy cập được duyệt", "Trước khi kích hoạt"],
            ["Bạn truy cập nền tảng", "Với sự tự tin cao nhất"],
          ],
          emphasis:
            "Chúng tôi muốn nhấn mạnh ở đây là niềm tin được củng cố bởi công nghệ. Sự tham gia của bạn bắt đầu qua quy trình kỹ thuật số được kiểm soát chặt chẽ thiết kế để nền tảng an toàn ngay từ đầu.",
        },
        {
          num: 2,
          title: "Duyệt danh sách",
          caption: "Cơ hội đầu tư chuẩn hóa trong một thị trường",
          stage: "Giai đoạn 2/4",
          badge: "Khám phá đầu tư",
          tags: [
            "Dự án đã thẩm định",
            "Chi tiết chuẩn hóa",
            "Bộ lọc & Tìm kiếm",
            "Dữ liệu minh bạch",
          ],
          desc: "Khám phá các cơ hội đầu tư với đầy đủ thông tin chi tiết về doanh nghiệp, thông số đánh giá rủi ro và các đề xuất tài chính. Chúng tôi sắp xếp các dự án minh bạch để bạn xây dựng danh mục theo các tiêu chí rõ ràng.",
          how: "Bạn duyệt danh mục các doanh nghiệp SME đã xác thực, được sắp xếp và lọc theo xếp hạng rủi ro, ngành nghề và cơ cấu hoàn trả.",
          why: "Điều này mang lại cho bạn sự minh bạch hoàn toàn đối với các khoản vay, giúp bạn dễ dàng thẩm định và phân bổ vốn vào các dự án phù hợp mục tiêu.",
          tech: "Nền tảng vận hành các cơ sở dữ liệu dự án an toàn, chỉ số xếp hạng rủi ro tự động và hệ thống cập nhật đồng bộ các cơ hội gọi vốn đang hoạt động.",
          journeyTitle: "Tìm kiếm cơ hội",
          rows: [
            ["Các dự án được trình bày", "Với chi tiết chuẩn hóa"],
            ["Xếp hạng rủi ro hiển thị rõ", "Dựa trên mô hình đánh giá"],
            ["Số liệu tài chính có sẵn", "Để thẩm định dễ dàng"],
            ["Lựa chọn danh mục đầu tư", "Nằm trong tầm kiểm soát của bạn"],
          ],
          emphasis:
            "Chúng tôi muốn nhấn mạnh ở đây là sự minh bạch dữ liệu. Việc khám phá các dự án sẽ vô cùng đơn giản, được hỗ trợ bởi các báo cáo giúp bạn đưa ra quyết định cân bằng.",
        },
        {
          num: 3,
          title: "Đầu tư",
          caption: "Quản lý vốn an toàn với tính minh bạch cao",
          stage: "Giai đoạn 3/4",
          badge: "Phân bổ nguồn vốn",
          tags: [
            "Tài khoản escrow an toàn",
            "Phân bổ vốn",
            "Theo dõi tự động",
            "Không có phí ẩn",
          ],
          desc: "Chuyển tiền an toàn vào tài khoản phong tỏa (escrow) của bạn trên nền tảng. Bạn chỉ định số tiền muốn đầu tư vào dự án đã chọn, và nguồn vốn được định tuyến an toàn để tài trợ các hợp đồng vay.",
          how: "Bạn nạp tiền qua các kênh thanh toán bảo mật. Nền tảng điều phối phân bổ vốn vào các nhóm vay SME tương ứng theo điều khoản ký gửi nghiêm ngặt.",
          why: "Nguồn vốn của bạn được giữ an toàn và chỉ cam kết giải ngân vào các khoản vay sau khi hoàn thành khớp lệnh, đảm bảo tính minh bạch.",
          tech: "Hệ thống sử dụng các tài khoản ký gửi phong tỏa, hệ thống ghi sổ tài khoản và giao thức xác thực giao dịch để bảo toàn nguồn vốn của bạn.",
          journeyTitle: "Luồng đầu tư của bạn",
          rows: [
            ["Ký gửi vốn", "An toàn vào tài khoản phong tỏa"],
            ["Chọn phân bổ dự án", "Chính xác và bằng kỹ thuật số"],
            ["Vốn được gom nhóm", "Để tiến hành giải ngân"],
            ["Sổ cái theo dõi nguồn vốn", "Tại mỗi bước di chuyển"],
          ],
          emphasis:
            "Chúng tôi muốn nhấn mạnh ở đây là quyền kiểm soát. Bạn chủ động quản lý cách thức và nơi phân bổ vốn, với hệ thống tự động bảo mật việc ký gửi và luân chuyển nguồn tiền của bạn.",
        },
        {
          num: 4,
          title: "Hoàn trả",
          caption: "Định tuyến và theo dõi dựa trên công nghệ",
          stage: "Giai đoạn 4/4",
          badge: "Lợi nhuận nhà đầu tư",
          tags: [
            "Chia sẻ doanh thu",
            "Phân phối tự động",
            "Sổ cái thời gian thực",
            "Cập nhật trực tiếp",
          ],
          desc: "Nhận phần chia sẻ hoàn trả tự động khi doanh nghiệp SME thực hiện các khoản thanh toán doanh thu hằng ngày hoặc hằng tuần. Giám sát lợi nhuận và tiến độ hoàn vốn trực tiếp trên sổ cái bảng điều khiển.",
          how: "Nền tảng tự động định tuyến các khoản chia sẻ doanh thu từ SME trực tiếp về tài khoản của các nhà đầu tư tham gia theo tỷ lệ góp vốn.",
          why: "Điều này biến khoản đầu tư thành dòng tiền thu hồi đều đặn, phản ánh trực tiếp hiệu quả hoạt động của doanh nghiệp bạn hỗ trợ.",
          tech: "Hệ thống vận hành các hợp đồng chia sẻ doanh thu tự động, API tích hợp tài khoản ngân hàng và các lệnh phân phối sổ cái theo tỷ lệ để tự động hóa việc chi trả.",
          journeyTitle: "Theo dõi hoàn trả của bạn",
          rows: [
            ["Các khoản thanh toán nhận về", "Từ vòng lặp doanh thu SME"],
            ["Hệ thống phân phối tỷ lệ", "Tự động về tài khoản sổ cái"],
            ["Số dư được cập nhật", "Theo thời gian thực"],
            ["Bảng điều khiển vẽ biểu đồ", "Tiến độ lợi nhuận danh mục"],
          ],
          emphasis:
            "Chúng tôi muốn nhấn mạnh ở đây là việc theo dõi thụ động. Lợi nhuận được tính toán, chia tỷ lệ và gửi về số dư của bạn tự động, giúp danh mục tăng trưởng không cần thao tác thủ công.",
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
  const [activeStep, setActiveStep] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiCleanupRef = useRef<(() => void) | null>(null);

  const activeRoleData = role === "sme" ? text.sme : text.investor;
  const stepCount = activeRoleData.steps.length;
  const currentStepData = activeRoleData.steps[activeStep];

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

  // Confetti trigger on reaching the last step (index 3)
  useEffect(() => {
    if (activeStep === 3) {
      const timer = setTimeout(() => triggerConfetti(), 80);
      return () => {
        clearTimeout(timer);
        if (confettiCleanupRef.current) {
          confettiCleanupRef.current();
        }
      };
    }
  }, [activeStep]);

  // Cleanup confetti animation on unmount
  useEffect(() => {
    return () => {
      if (confettiCleanupRef.current) {
        confettiCleanupRef.current();
      }
    };
  }, []);

  const handleStepClick = (idx: number) => {
    setActiveStep(idx);
    if (idx === 3) {
      setTimeout(() => triggerConfetti(), 80);
    }
  };

  const handleNext = () => {
    if (activeStep < stepCount - 1) {
      const nextStep = activeStep + 1;
      setActiveStep(nextStep);
      if (nextStep === 3) {
        setTimeout(() => triggerConfetti(), 80);
      }
    }
  };

  const handlePrev = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const handleRoleChange = (newRole: "sme" | "investor") => {
    setRole(newRole);
    setActiveStep(0); // Reset to step 1
  };

  return (
    <div className="w-full flex flex-col items-center relative">
      {/* Money Confetti Overlay Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-50 w-full h-full"
      />

      {/* Role Toggle Button Switch */}
      <div className="flex bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-full mb-12 relative z-20">
        <button
          onClick={() => handleRoleChange("sme")}
          className={`px-6 py-2.5 rounded-full text-xs font-sans font-bold transition-all duration-300 ${
            role === "sme"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {currentLocale === "vi" ? "Cho doanh nghiệp" : "For SMEs"}
        </button>
        <button
          onClick={() => handleRoleChange("investor")}
          className={`px-6 py-2.5 rounded-full text-xs font-sans font-bold transition-all duration-300 ${
            role === "investor"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {currentLocale === "vi" ? "Cho nhà đầu tư" : "For Investors"}
        </button>
      </div>

      {/* Top Rows: Step Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mb-10 relative z-20">
        {activeRoleData.steps.map((step, idx) => {
          const isActive = idx === activeStep;
          return (
            <button
              key={idx}
              onClick={() => handleStepClick(idx)}
              className={`flex flex-col text-left p-5 rounded-2xl border transition-all duration-300 outline-none w-full ${
                isActive
                  ? "bg-white dark:bg-slate-900 border-emerald-500 dark:border-emerald-400 shadow-md scale-[1.02]"
                  : "bg-white/40 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/80 text-muted-foreground/80 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              {/* Step indicator circle */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-sans font-bold mb-3 transition-colors duration-300 ${
                  isActive
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-muted-foreground"
                }`}
              >
                {step.num}
              </div>
              <h4
                className={`font-sans font-bold text-sm mb-1 transition-colors duration-300 ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.title}
              </h4>
              <p className="text-[10px] font-sans text-muted-foreground leading-normal line-clamp-2">
                {step.caption}
              </p>
            </button>
          );
        })}
      </div>

      {/* Two Column details section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full relative z-20">
        {/* Left Column: Full Content Card */}
        <div className="lg:col-span-7 bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-8 shadow-xl backdrop-blur-md flex flex-col justify-between min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col justify-between"
            >
              <div>
                {/* Badge tags header */}
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-[10px] font-mono tracking-widest bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full font-bold uppercase">
                    {currentStepData.badge}
                  </span>
                  <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">
                    {currentStepData.stage}
                  </span>
                </div>

                {/* Main H3 Title */}
                <h3 className="font-sans text-3xl font-extrabold text-foreground mb-4 leading-tight tracking-tight">
                  {(currentStepData as { detailTitle?: string }).detailTitle ||
                    currentStepData.title}
                </h3>

                {/* Description Paragraph */}
                <p className="text-sm text-muted-foreground leading-relaxed font-sans mb-6">
                  {currentStepData.desc}
                </p>

                {/* Sub tags list */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {currentStepData.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[10px] font-sans font-semibold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30 px-3 py-1.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Three small columns of info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-border/40 pt-6 mb-8">
                  <div>
                    <h5 className="text-[10px] font-sans font-bold tracking-wider text-emerald-700 dark:text-emerald-400 uppercase mb-2">
                      {currentLocale === "vi"
                        ? "Cách hoạt động"
                        : "How this works"}
                    </h5>
                    <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
                      {currentStepData.how}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-[10px] font-sans font-bold tracking-wider text-emerald-700 dark:text-emerald-400 uppercase mb-2">
                      {currentLocale === "vi"
                        ? "Tại sao quan trọng"
                        : "Why this matters"}
                    </h5>
                    <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
                      {currentStepData.why}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-[10px] font-sans font-bold tracking-wider text-emerald-700 dark:text-emerald-400 uppercase mb-2">
                      {currentLocale === "vi"
                        ? "Công nghệ hỗ trợ"
                        : "Technology behind it"}
                    </h5>
                    <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
                      {currentStepData.tech}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center gap-3 border-t border-border/30 pt-6">
                <button
                  disabled={activeStep === 0}
                  onClick={handlePrev}
                  className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-sans font-bold tracking-wide uppercase transition-all duration-300 border ${
                    activeStep === 0
                      ? "bg-slate-100/50 dark:bg-slate-800/30 border-slate-200/40 dark:border-slate-800/50 text-muted-foreground/30 cursor-not-allowed"
                      : "bg-[#eef1f4] dark:bg-slate-800/85 border-transparent text-zinc-700 dark:text-zinc-200 hover:bg-[#e4e8ec] dark:hover:bg-slate-800 active:scale-95"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  {currentLocale === "vi" ? "Quay lại" : "Previous"}
                </button>

                {activeStep < stepCount - 1 ? (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-sans font-bold tracking-wide uppercase bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-emerald-600/10 transition-all duration-300 active:scale-95 ml-auto"
                  >
                    {currentLocale === "vi" ? "Tiếp theo" : "Next"}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-sans font-bold tracking-wide uppercase bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-emerald-600/10 transition-all duration-300 active:scale-95 ml-auto"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {currentLocale === "vi" ? "Bắt đầu lại" : "Start again"}
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Column: Visual Journey Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-emerald-50/40 to-teal-50/20 dark:from-slate-900/60 dark:to-slate-950/20 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-6 md:p-8 shadow-xl backdrop-blur-md flex flex-col justify-between min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col justify-between"
            >
              <div>
                {/* Header title & step dot markers */}
                <div className="flex items-center justify-between mb-8">
                  <h4 className="font-sans font-bold text-foreground text-sm tracking-wide">
                    {currentStepData.journeyTitle}
                  </h4>
                  {/* Stepper dots indicator */}
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: stepCount }).map((_, dIdx) => (
                      <span
                        key={dIdx}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          dIdx === activeStep
                            ? "bg-emerald-500 scale-125"
                            : "bg-slate-200 dark:bg-slate-700"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Inner White table card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-md mb-6">
                  {/* Category label */}
                  <div className="flex justify-between items-center pb-4 border-b border-border/30 mb-4">
                    <span className="text-[10px] font-sans font-bold tracking-widest text-emerald-700 dark:text-emerald-400 uppercase">
                      {currentLocale === "vi"
                        ? "BƯỚC THỰC HIỆN"
                        : "WHAT HAPPENS HERE"}
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded uppercase font-bold text-[9px]">
                      Tech + Trust
                    </span>
                  </div>

                  {/* Flow list table rows */}
                  <div className="flex flex-col gap-3.5">
                    {currentStepData.rows.map((row, rIdx) => (
                      <div
                        key={rIdx}
                        className="flex justify-between items-start gap-4 pb-3.5 border-b border-border/10 last:border-none last:pb-0"
                      >
                        <span className="text-xs text-muted-foreground font-sans">
                          {row[0]}
                        </span>
                        <span className="text-xs font-sans font-bold text-foreground text-right shrink-0">
                          {row[1]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom emphasis callout */}
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-5">
                <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed font-sans font-medium">
                  {currentStepData.emphasis}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
