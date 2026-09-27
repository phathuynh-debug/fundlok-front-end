"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Shield,
  FileText,
  Search,
  CheckCircle2,
  Lock,
  Building2,
  ArrowLeft,
  Share2,
  Check,
  ChevronRight,
} from "lucide-react";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { BackgroundBlobs } from "@/components/background-blobs";
import { useTranslations } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SectionContent {
  id: string;
  badgeVi: string;
  badgeEn: string;
  titleVi: string;
  titleEn: string;
  items: {
    headingVi: string;
    headingEn: string;
    contentVi: string[];
    contentEn: string[];
  }[];
}

const TERMS_SECTIONS: SectionContent[] = [
  {
    id: "part-a",
    badgeVi: "Phần A",
    badgeEn: "Part A",
    titleVi: "Điều khoản chung",
    titleEn: "General Terms",
    items: [
      {
        headingVi: "I. GIẢI THÍCH TỪ NGỮ",
        headingEn: "I. DEFINITIONS",
        contentVi: [
          "FundLok: là Công ty Cổ phần FundLok, bao gồm trụ sở chính, các chi nhánh, văn phòng đại diện, công ty liên kết (nếu có) và toàn bộ cán bộ nhân viên làm việc tại FundLok.",
          "Nền tảng FundLok (Sàn FundLok): là hệ thống website (fundlok.com), ứng dụng web, hệ thống công nghệ, giao diện số và phần mềm do FundLok sở hữu, quản lý và vận hành nhằm cung cấp các giải pháp kết nối tài chính và dịch vụ số cho Người dùng.",
          "Điều khoản sử dụng: Các điều khoản và điều kiện quy định quyền và nghĩa vụ của Người dùng khi truy cập và sử dụng dịch vụ trên Nền tảng FundLok.",
          "Chính sách bảo mật: Chính sách bảo mật và bảo vệ dữ liệu cá nhân của FundLok, tuân thủ Nghị định số 13/2023/NĐ-CP của Chính phủ.",
          "Người dùng: là bất kỳ cá nhân hoặc tổ chức nào tiếp cận, tìm hiểu, truy cập, đăng ký tài khoản và/hoặc sử dụng Nền tảng FundLok.",
          "Nhà đầu tư: là cá nhân hoặc tổ chức có nguồn tiền nhàn rỗi, hợp pháp, có nhu cầu tài trợ vốn hoặc đầu tư vào các doanh nghiệp và sử dụng Nền tảng FundLok để kết nối với các doanh nghiệp phù hợp.",
          "Doanh nghiệp (SME / MSME / Khách hàng): là các doanh nghiệp siêu nhỏ, nhỏ và vừa được thành lập và hoạt động hợp pháp tại Việt Nam, có nhu cầu tiếp cận nguồn vốn sản xuất kinh doanh thông qua sự kết nối của FundLok.",
          "Đối tác của FundLok: là các tổ chức, cá nhân hợp tác với FundLok, bao gồm các đối tác ngân hàng lưu ký (custodial bank partners), tổ chức cung cấp giải pháp xác thực (eKYC/KYB), đơn vị cung cấp chứng thư số và tư vấn pháp lý.",
          "Hợp đồng tài trợ vốn: là (các) hợp đồng, thỏa thuận tài trợ vốn và phân chia nghĩa vụ hoàn trả được giao kết trực tiếp giữa Doanh nghiệp và Nhà đầu tư thông qua sự kết nối và hỗ trợ công nghệ của FundLok.",
          "Dữ liệu cá nhân & Xử lý dữ liệu cá nhân: là thông tin gắn liền hoặc giúp xác định một con người cụ thể và các hoạt động tác động tới dữ liệu cá nhân theo quy định tại Nghị định số 13/2023/NĐ-CP ngày 17/04/2023 của Chính phủ.",
        ],
        contentEn: [
          "FundLok: Refers to FundLok Joint Stock Company, including its headquarters, branches, affiliates, and all authorized personnel.",
          "FundLok Platform: The fundlok.com website, web applications, arranger software, portals, and digital infrastructure operated by FundLok to provide technological connection and arranger services.",
          "Terms of Use: The terms governing access, obligations, and transactions executed on or facilitated by the FundLok Platform.",
          "Privacy Policy: The personal data protection and privacy policy of FundLok, fully compliant with Vietnam's Decree No. 13/2023/ND-CP.",
          "User: Any individual or legal entity accessing, browsing, registering an account, or transacting on the FundLok Platform.",
          "Investor: Any individual or institution possessing lawful capital who deploys funds to finance Vietnamese enterprises through FundLok.",
          "Enterprise (SME / MSME / Client): Any legally established micro, small, or medium enterprise in Vietnam seeking non-dilutive working capital facilitated via FundLok.",
          "FundLok Partners: Third-party service providers, including custodial bank partners, verified identity providers (KYC/KYB), and digital signature infrastructure.",
          "Financing Agreement: The legally binding agreement executed directly between the Investor and the SME. FundLok is not a party to this agreement and does not lend its own balance sheet.",
          "Personal Data & Processing: Identifiable data relating to a natural person and any operation performed on such data pursuant to Decree No. 13/2023/ND-CP.",
        ],
      },
      {
        headingVi: "II. MIỄN TRỪ TRÁCH NHIỆM VÀ NGUYÊN TẮC RỦI RO",
        headingEn: "II. DISCLAIMERS & RISK ALLOCATION",
        contentVi: [
          "FundLok vận hành với tư cách là nền tảng công nghệ và thu xếp kết nối trong giới hạn khuôn khổ pháp lý hiện hành. FundLok không phải là tổ chức tín dụng, không phải ngân hàng, không phải bên cho vay, bên bảo lãnh và không huy động vốn cho chính mình.",
          "Nhà đầu tư là bên cung cấp nguồn vốn và hợp đồng tín dụng/tài trợ vốn được xác lập trực tiếp giữa Nhà đầu tư và Doanh nghiệp. Nhà đầu tư tự chịu rủi ro tín dụng nếu doanh nghiệp hoạt động kém hiệu quả hoặc chậm trễ hoàn trả. FundLok không cam kết bảo toàn vốn gốc, không cam kết mức lợi nhuận chắc chắn và không sở hữu quỹ dự phòng bảo hiểm rủi ro tín dụng.",
          "Toàn bộ các con số về tỷ suất sinh lời hiển thị trên nền tảng là mục tiêu, ước tính hoặc kịch bản tham khảo (target/scenario), tuyệt đối không cấu thành cam kết hay bảo đảm chắc chắn.",
          "FundLok nỗ lực tối đa để đảm bảo tính an toàn, liên tục của hệ thống công nghệ nhưng được miễn trừ trách nhiệm trước các sự cố gián đoạn do hạ tầng viễn thông, lỗi phần mềm bên thứ ba, sự cố mạng diện rộng hoặc các trường hợp bất khả kháng.",
          "Người dùng chịu trách nhiệm toàn diện về tính chính xác, hợp pháp của mọi hồ sơ, tài liệu tải lên hệ thống. Người dùng cam kết bồi thường thiệt hại cho FundLok nếu có hành vi cố ý gian lận, làm giả dữ liệu số hoặc vi phạm pháp luật gây tổn thất cho FundLok và các bên liên quan.",
        ],
        contentEn: [
          "FundLok operates strictly as a financial technology and arranger platform within reviewed legal boundaries. FundLok is not a bank, not a licensed lender, not a guarantor, and does not lend its own money.",
          "Investors provide the capital. The financing agreement is directly between the Investor and the SME. The Investor bears the credit risk if a business underperforms. FundLok offers no capital guarantees, no principal protection reserve, and no risk-free returns.",
          "Any quoted returns or yields are scenarios and targets, never promises or bare point figures.",
          "FundLok exercises industry-standard care in platform uptime and security, but is held harmless against third-party network failures, telecommunications downtime, or events of force majeure.",
          "Users warrant the veracity and legality of all uploaded data. Users agree to indemnify FundLok for damages arising from willful falsification, document tampering, or unlawful conduct.",
        ],
      },
      {
        headingVi: "III. CÁC PHIÊN BẢN CẬP NHẬT VÀ HIỆU LỰC",
        headingEn: "III. AMENDMENTS & ENFORCEABILITY",
        contentVi: [
          "FundLok có toàn quyền sửa đổi, bổ sung hoặc cập nhật Điều khoản và Điều kiện này tại từng thời điểm để phù hợp với thực tiễn vận hành và quy định pháp luật hiện hành. Những sửa đổi sẽ có hiệu lực ngay khi được công bố trên Nền tảng FundLok.",
          "Điều khoản này có giá trị ràng buộc pháp lý với Người dùng kể từ thời điểm Người dùng cung cấp thông tin hoặc đăng ký tài khoản trên Nền tảng FundLok.",
          "Trong trường hợp có bất kỳ điều khoản nào bị cơ quan tài phán có thẩm quyền tuyên bố vô hiệu, điều khoản đó sẽ được điều chỉnh cho phù hợp với pháp luật và các điều khoản còn lại vẫn giữ nguyên giá trị hiệu lực.",
        ],
        contentEn: [
          "FundLok reserves the right to amend, update, or modify these Terms at any time in accordance with operational requirements and regulatory updates. Revisions become effective upon platform publication.",
          "These Terms are legally binding upon account creation or use of any FundLok service.",
          "If any provision is found invalid or unenforceable by a competent court in Vietnam, the remaining provisions shall remain in full force and effect.",
        ],
      },
      {
        headingVi: "IV. THÔNG TIN LIÊN HỆ CHÍNH THỨC",
        headingEn: "IV. OFFICIAL CONTACT INFORMATION",
        contentVi: [
          "Tên đơn vị: Công ty Cổ phần FundLok (FundLok Joint Stock Company)",
          "Địa chỉ văn phòng: 123 Trương Định, Phường Xuân Hòa, Thành phố Hồ Chí Minh, Việt Nam",
          "Email hỗ trợ: support@fundlok.com",
          "Website chính thức: https://www.fundlok.com",
        ],
        contentEn: [
          "Entity Name: FundLok Joint Stock Company",
          "Office Address: 123 Truong Dinh, Xuan Hoa, Ho Chi Minh City, Vietnam",
          "Customer Support: support@fundlok.com",
          "Official Website: https://www.fundlok.com",
        ],
      },
    ],
  },
  {
    id: "part-b",
    badgeVi: "Phần B",
    badgeEn: "Part B",
    titleVi: "Điều khoản sử dụng dịch vụ",
    titleEn: "Terms of Use",
    items: [
      {
        headingVi: "I. NGUYÊN TẮC THAM GIA NỀN TẢNG",
        headingEn: "I. PARTICIPATION PRINCIPLES",
        contentVi: [
          "Người dùng cam kết có đầy đủ năng lực hành vi dân sự và tư cách pháp nhân hợp pháp theo quy định của pháp luật Việt Nam.",
          "Người dùng cam kết chỉ sử dụng dịch vụ cho các mục đích kinh doanh hợp pháp. Nghiêm cấm các hành vi rửa tiền, tài trợ khủng bố, lừa đảo hoặc can thiệp kỹ thuật vào mã nguồn và hệ thống cơ sở dữ liệu của FundLok.",
          "Các ngành nghề không được tài trợ vốn trên nền tảng: cờ bạc, trò chơi có thưởng, buôn bán vũ khí/quân sự, sản xuất kinh doanh rượu hoặc thuốc lá làm ngành nghề chủ đạo.",
        ],
        contentEn: [
          "Users affirm they hold full legal capacity and proper corporate authority under the laws of Vietnam.",
          "The platform must only be used for legitimate commercial financing. Money laundering, terrorism financing, market manipulation, or unauthorized system access are strictly forbidden.",
          "Excluded sectors: FundLok will not finance gambling, alcohol or tobacco as a primary business, or weapons/defence ventures under any circumstances.",
        ],
      },
      {
        headingVi: "II. TÀI KHOẢN VÀ NGHĨA VỤ CỦA DOANH NGHIỆP (SME/MSME)",
        headingEn: "II. SME ACCOUNTS & FACILITY INVARIANTS",
        contentVi: [
          "Doanh nghiệp thực hiện quy trình định danh doanh nghiệp (KYB) và xác minh người đại diện theo pháp luật thông qua hệ thống eKYC hợp tác của FundLok.",
          "Tính nguyên bản của hồ sơ: Hồ sơ chứng minh doanh thu bắt buộc phải là bản gốc điện tử có chữ ký số (tờ khai thuế GTGT và hóa đơn điện tử XML gốc). Nền tảng từ chối các file PDF quét, hình ảnh chụp hoặc file bảng tính có thể can thiệp chỉnh sửa.",
          "Kỳ hạn tài trợ: Kỳ hạn do Doanh nghiệp lựa chọn chỉ gồm 6 tháng hoặc 12 tháng (12 tháng là kỳ hạn tối đa; nền tảng không cung cấp kỳ hạn dài hơn).",
          "Tổng nghĩa vụ hoàn trả: Được ấn định cố định ngay tại thời điểm ký kết hợp đồng. Số tiền này không tăng lên khi doanh thu tháng sau gặp khó khăn, và không giảm xuống khi tháng sau doanh thu tăng trưởng vượt trội. Trường hợp duy nhất làm thay đổi tổng nghĩa vụ hoàn trả là phí gia hạn nêu tại mục dưới đây.",
          "Cơ chế hoàn trả hàng ngày: Doanh nghiệp hoàn trả một khoản tiền cố định vào mỗi ngày làm việc, phù hợp với dòng tiền kinh doanh hàng ngày.",
          "Cơ chế san sẻ và điều chỉnh (Relief / True-up): Định kỳ đối soát doanh thu thực tế. Nếu doanh thu thực tế sụt giảm so với dự kiến, nghĩa vụ hoàn trả của kỳ đó sẽ được hạ xuống và thời gian cơ sở kéo dài thêm; bản thân cơ chế này không bao giờ làm tăng tổng số tiền nợ và cũng không làm giảm tổng số tiền nợ. Cơ chế này bảo vệ dòng tiền doanh nghiệp và chỉ hoạt động theo một chiều.",
          "Khoản trả thiếu và cảnh báo sớm: Một kỳ trả nợ hằng ngày chưa được thanh toán sẽ phát sinh cảnh báo tại lần đối soát ngày làm việc kế tiếp và đưa khoản tài trợ vào danh sách theo dõi (watchlist). Đây không phải là chế tài xử phạt và cũng không phải là trạng thái vi phạm hợp đồng — cơ chế này tồn tại để hai bên trao đổi ngay từ ngày đầu tiên thay vì nhiều tháng sau đó. Câu hỏi đầu tiên của FundLok khi có kỳ trả thiếu là điều gì đã xảy ra.",
          "Gia hạn và phí gia hạn: Nếu tổng nghĩa vụ hoàn trả chưa được tất toán khi kết thúc kỳ hạn đã đăng ký, khoản tài trợ sẽ được gia hạn và phát sinh phí gia hạn. Mức phí được xác định sao cho chi phí vốn quy đổi theo năm giữ nguyên như tại thời điểm ký kết — lợi suất kỳ vọng của Nhà đầu tư được khôi phục chứ không tăng thêm, và không bên nào hưởng lợi từ việc chậm trễ. Việc gia hạn chỉ được thực hiện trong phạm vi ngày backstop và không bao giờ làm dịch chuyển ngày này.",
          "Ngày chạm ngưỡng tới hạn (Backstop date): Hạn chót cố định tại 1.33 lần kỳ hạn đăng ký (kỳ hạn 6 tháng ứng với tối đa ~8 tháng; kỳ hạn 12 tháng ứng với tối đa ~16 tháng). Tại ngày này, toàn bộ dư nợ còn lại — bao gồm phần gốc chưa thu hồi, lãi phát sinh đến thời điểm đó và phí gia hạn (nếu có) — đến hạn tất toán toàn bộ. Ngày backstop được công khai minh bạch ngay từ ngày ký hợp đồng.",
          "Hoàn trả trước hạn: Lợi ích dành cho doanh nghiệp là 'không bị phạt trả trước' ('no prepayment penalty'), tuyệt đối không phải là chiết khấu giảm trừ tổng số tiền hoàn trả đã ký kết.",
          "Các trạng thái kết thúc khoản tài trợ: Khoản tài trợ kết thúc theo một trong bốn trường hợp — hoàn trả đủ trong kỳ hạn đã đăng ký, hoàn trả trước hạn, tất toán toàn bộ tại ngày backstop, hoặc được ghi giảm thành tổn thất khi không đáp ứng được ngày backstop. Việc ghi giảm chỉ có thể xảy ra sau khi đã quá ngày backstop; khoản tổn thất là tổn thất một phần vì cơ chế thu nợ hằng ngày đã thu hồi được một phần dư nợ, và do Nhà đầu tư chịu.",
        ],
        contentEn: [
          "SMEs must complete full business verification (KYB) and legal representative eKYC via FundLok's integrated verification infrastructure.",
          "Original electronic revenue evidence: Revenue evidence must consist of electronically signed original VAT tax declarations and XML e-invoices. Scanned PDFs, screenshots, or spreadsheets are rejected.",
          "Facility terms: Declared by the SME as either 6 or 12 months. Twelve months is the statutory platform maximum.",
          "Total repayable: Fixed at signing. Does not expand if trading is slow, nor does it shrink if trading is strong. The only circumstance in which it changes is the extension fee described below.",
          "Daily repayments: A fixed obligation settled each business day to mirror natural retail and operational cash flows.",
          "Relief mechanism (True-up): Verified periodic revenue audits. If revenue falls short, the obligation for that period drops and the facility runs longer. Relief operates downward only: it neither increases nor reduces the total repayable, it extends duration.",
          "Missed payments and early warning: A single unsettled daily instalment raises a warning at the next business-day reconciliation and places the facility on a watchlist. This is neither a penalty nor a default — it exists so the conversation happens on the first day rather than months later. FundLok's first question on a missed payment is what happened.",
          "Extension and extension fee: If the total repayable is not cleared by the end of the declared term, the facility extends and an extension fee applies. The fee is set so the annualised cost of the facility stays what it was at signing — the Investor's expected yield is restored, not increased, and no party profits from the delay. An extension is permitted only inside the backstop date and never moves that date.",
          "Backstop date: A non-negotiable hard ceiling set at 1.33 × the declared term (6 months extends to ~8 months; 12 months extends to ~16 months), at which point the entire remaining balance — unrecovered principal, interest incurred to that point, and any extension fee — falls due in full. Disclosed at signing.",
          "Early repayment: The facility includes 'no prepayment penalty'. Settling early clears the obligation without penalties, but does not provide a fee discount — total repayable remains fixed.",
          "How a facility ends: In one of four ways — repaid over the declared term, repaid early, settled in full at the backstop date, or written down as a loss where the backstop is not met. A write-down can only follow a missed backstop; the loss is partial, because daily collection has already recovered part of the balance, and it is borne by the Investor.",
        ],
      },
      {
        headingVi: "III. TÀI KHOẢN VÀ NGHĨA VỤ CỦA NHÀ ĐẦU TƯ",
        headingEn: "III. INVESTOR ACCOUNTS & TRANSPARENCY",
        contentVi: [
          "Nhà đầu tư thực hiện xác minh danh tính điện tử (KYC) theo quy định và tự chịu trách nhiệm về quyết định phân bổ nguồn vốn.",
          "Minh bạch hồ sơ niêm yết: Trước khi cam kết tài trợ vốn, Nhà đầu tư được tiếp cận đầy đủ: điểm doanh nghiệp và lãi suất tham khảo, dữ liệu doanh thu thực tế đã xác minh, độ mới của dữ liệu, mô hình trả nợ, biểu phí, rủi ro tập trung, các khoảng trống đã biết trong dữ liệu và ngày backstop.",
          "Điểm doanh nghiệp và lãi suất tham khảo: Là chỉ số đánh giá nội bộ theo thang điểm từ 0–100 phục vụ đối chiếu và định giá rủi ro tham khảo giữa lãi suất cơ sở và trần luật định 20%/năm. Đây là dữ liệu tham chiếu hỗ trợ quyết định, không phải là chứng nhận xếp hạng tín nhiệm theo Luật Doanh nghiệp.",
          "Rủi ro và tổn thất: Nhà đầu tư hiểu rõ và đồng ý rằng Nhà đầu tư là bên chịu rủi ro tín dụng và tổn thất tài chính nếu doanh nghiệp không hoàn trả được đầy đủ nghĩa vụ.",
          "Bảo mật thông tin: Nhà đầu tư cam kết bảo mật tuyệt đối các thông tin thương mại, tài chính của Doanh nghiệp nhận được qua nền tảng và không sử dụng cho mục đích cạnh tranh.",
        ],
        contentEn: [
          "Investors must complete electronic identity verification (KYC) and remain solely responsible for capital allocation decisions.",
          "Pre-commitment disclosures: Investors have access to the business score, reference rate, verified historical revenue, data freshness, repayment schedule, fee schedule, concentration risks, known gaps in the underlying data, and the backstop deadline.",
          "Business score & reference rate: A 0–100 internal assessment moving the proposed rate between bank reference rates and the statutory 20%/year ceiling. It serves as a decision input, never a formal credit agency rating.",
          "Loss bearing: The Investor explicitly acknowledges that they bear the credit loss if an enterprise underperforms.",
          "Confidentiality: Commercial data of verified SMEs may not be misused, published, or leveraged for improper commercial advantage.",
        ],
      },
      {
        headingVi: "IV. CƠ CHẾ DÒNG TIỀN VÀ ĐỐI TÁC NGÂN HÀNG LƯU KÝ",
        headingEn: "IV. CUSTODIAL BANK PARTNERS & FUND FLOWS",
        contentVi: [
          "Nguồn vốn của Nhà đầu tư và dòng tiền thanh toán hoàn trả hoàn toàn không đi vào tài khoản sở hữu của FundLok.",
          "Toàn bộ nguồn tiền được lưu giữ và vận hành thông qua các đối tác ngân hàng lưu ký (custodial bank partners) được cấp phép hoạt động hợp pháp.",
          "FundLok không phải là chủ sở hữu số tiền, không có quyền rút hoặc sử dụng số tiền này cho mục đích riêng của mình, và chỉ nắm giữ quyền chỉ thị thanh toán theo các điều kiện nghiêm ngặt do ngân hàng lưu ký thực thi và giám sát.",
          "Dòng tiền chỉ di chuyển theo 2 chiều hợp lệ: (i) Giải ngân trực tiếp đến tài khoản ngân hàng của Doanh nghiệp đã được xác minh theo hợp đồng đã ký kết; hoặc (ii) Hoàn trả tiền gốc và lợi nhuận trực tiếp về tài khoản của chính Nhà đầu tư đã tham gia tài trợ.",
        ],
        contentEn: [
          "Investor capital and loan repayments never enter FundLok's corporate bank accounts.",
          "All funds sit with licensed custodial bank partners.",
          "FundLok is not the owner of the funds, has no right to draw on them for its own purposes, and holds only instruction rights within conditions the bank enforces.",
          "Funds move strictly in two directions: disbursed directly to the verified enterprise account under an executed agreement, or returned directly to the originating Investor.",
        ],
      },
      {
        headingVi: "V. CẢNH BÁO BẢO MẬT VÀ PHÒNG CHỐNG GIAN LẬN",
        headingEn: "V. FRAUD PREVENTION & SECURITY ADVISORIES",
        contentVi: [
          "Người dùng có nghĩa vụ bảo mật thông tin đăng nhập, mật khẩu, passkey và mã xác thực 2 bước (TOTP/OTP). FundLok không bao giờ yêu cầu người dùng cung cấp mật khẩu hoặc mã OTP dưới bất kỳ hình thức nào.",
          "Người dùng tuyệt đối KHÔNG chuyển tiền cho bất kỳ cá nhân hay tổ chức nào xưng danh FundLok ngoài luồng tài khoản ngân hàng lưu ký được quy định chính thức trên hệ thống.",
          "Khi phát hiện có dấu hiệu truy cập trái phép hoặc lừa đảo, Người dùng cần thông báo ngay cho FundLok qua email support@fundlok.com để kịp thời khóa tài khoản và phòng ngừa thiệt hại.",
        ],
        contentEn: [
          "Users must safeguard credentials, passkeys, and two-factor authentication codes. FundLok staff will never ask for your password or OTP.",
          "Users must never transfer money to private accounts claiming to represent FundLok. All transactions are mediated through designated custodial bank partner accounts.",
          "If unauthorized activity is suspected, notify support@fundlok.com immediately to secure the account.",
        ],
      },
      {
        headingVi: "VI. QUYỀN SỞ HỮU TRÍ TUỆ",
        headingEn: "VI. INTELLECTUAL PROPERTY",
        contentVi: [
          "Toàn bộ thương hiệu, biểu tượng 'FundLok', giao diện thiết kế, kiến trúc hệ thống, thuật toán phân tích điểm doanh nghiệp và toàn bộ nội dung hiển thị trên nền tảng thuộc quyền sở hữu trí tuệ độc quyền của Công ty Cổ phần FundLok.",
          "Nghiêm cấm mọi hành vi sao chép, trích xuất dữ liệu tự động (scraping), dịch ngược mã nguồn (reverse engineering) hoặc phát tán tài liệu sở hữu trí tuệ của FundLok khi chưa có văn bản chấp thuận trước.",
        ],
        contentEn: [
          "All trademarks, logos, system UI, design tokens, scoring algorithms, and proprietary software are the exclusive intellectual property of FundLok Joint Stock Company.",
          "Reverse engineering, scraping, unauthorized decompilation, or redistribution of platform assets is strictly prohibited.",
        ],
      },
    ],
  },
  {
    id: "part-c",
    badgeVi: "Phần C",
    badgeEn: "Part C",
    titleVi: "Chính sách bảo mật & Bảo vệ dữ liệu cá nhân",
    titleEn: "Privacy & Personal Data Protection Policy",
    items: [
      {
        headingVi:
          "I. NGUYÊN TẮC BẢO VỆ DỮ LIỆU CÁ NHÂN (NGHỊ ĐỊNH 13/2023/NĐ-CP)",
        headingEn: "I. DATA PROTECTION PRINCIPLES (DECREE 13/2023/ND-CP)",
        contentVi: [
          "Chính sách này được lập và áp dụng nghiêm ngặt theo Nghị định số 13/2023/NĐ-CP ngày 17/04/2023 của Chính phủ về bảo vệ dữ liệu cá nhân.",
          "FundLok cam kết xử lý dữ liệu cá nhân một cách minh bạch, hợp pháp, đúng mục đích đã công bố và tôn trọng quyền tự quyết của chủ thể dữ liệu.",
          "Người dùng đồng ý rằng thông báo này có giá trị thông báo xử lý dữ liệu cá nhân theo quy định trước khi FundLok tiến hành thu thập và xử lý dữ liệu.",
        ],
        contentEn: [
          "This policy adheres strictly to Decree No. 13/2023/ND-CP issued by the Government of Vietnam on personal data protection.",
          "FundLok processes data lawfully, transparently, and strictly within disclosed purposes with the data subject's consent.",
          "This document constitutes official notification of personal data processing prior to collection.",
        ],
      },
      {
        headingVi: "II. DANH MỤC DỮ LIỆU CÁ NHÂN ĐƯỢC XỬ LÝ",
        headingEn: "II. CATEGORIES OF PROCESSED PERSONAL DATA",
        contentVi: [
          "Dữ liệu cá nhân cơ bản: Họ và tên khai sinh, ngày tháng năm sinh, giới tính, số điện thoại, địa chỉ email, địa chỉ thường trú và nơi ở hiện tại, số định danh cá nhân / CCCD / hộ chiếu (kèm ngày cấp, nơi cấp), ảnh chân dung và video phục vụ xác thực sinh trắc học eKYC.",
          "Dữ liệu cá nhân nhạy cảm & Dữ liệu tài chính: Thông tin tài khoản ngân hàng thụ hưởng phục vụ giải ngân/thu nợ, dữ liệu giao dịch tài chính liên quan đến khoản tài trợ, và dữ liệu nhật ký bảo mật (địa chỉ IP, chuỗi tác tử thiết bị) phục vụ kiểm toán an toàn thông tin.",
          "Dữ liệu doanh nghiệp liên quan: Báo cáo thuế, hóa đơn điện tử có chữ ký số, báo cáo tài chính nội bộ và thông tin giấy chứng nhận đăng ký kinh doanh.",
        ],
        contentEn: [
          "Basic Personal Data: Full name, date of birth, gender, contact phone number, email address, residential address, national ID card / passport number (issue date & place), and selfie / facial video recordings used for biometric eKYC.",
          "Sensitive Personal Data & Financial Data: Bank account details for disbursements and repayments, transaction ledger history, and audit log data (IP address, user agent) used for intrusion prevention.",
          "Enterprise Corporate Data: Electronically signed VAT filings, XML e-invoices, and business registration records.",
        ],
      },
      {
        headingVi: "III. MỤC ĐÍCH XỬ LÝ DỮ LIỆU",
        headingEn: "III. PURPOSES OF PROCESSING",
        contentVi: [
          "Thực hiện xác minh danh tính và định danh doanh nghiệp (eKYC / KYB) theo quy định phòng chống rửa tiền và gian lận.",
          "Thiết lập hồ sơ đề nghị vốn, tính toán điểm doanh nghiệp và lãi suất tham khảo.",
          "Kết nối nhu cầu tài trợ vốn giữa Doanh nghiệp và Nhà đầu tư trên nền tảng.",
          "Gửi chỉ thị thanh toán giải ngân và đối soát thu nợ tự động thông qua đối tác ngân hàng lưu ký.",
          "Quản lý, thông báo và hỗ trợ Người dùng trong suốt vòng đời của khoản tài trợ vốn.",
          "Tuân thủ các yêu cầu cung cấp thông tin theo quy định pháp luật khi có yêu cầu bằng văn bản từ cơ quan Nhà nước có thẩm quyền.",
        ],
        contentEn: [
          "Conducting digital identity and enterprise verification (KYC/KYB) in compliance with anti-money laundering regulations.",
          "Processing financing applications, computing enterprise reference scores, and deriving deal terms.",
          "Matching SMEs seeking growth capital with verified Investors.",
          "Issuing payment and repayment instructions through authorized custodial bank partners.",
          "Servicing user facilities, handling queries, and notifying clients throughout facility lifecycles.",
          "Complying with statutory regulatory reporting obligations upon official written request by competent state agencies.",
        ],
      },
      {
        headingVi: "IV. CÁC BÊN ĐƯỢC TIẾP CẬN DỮ LIỆU",
        headingEn: "IV. DATA RECIPIENTS & PROCESSORS",
        contentVi: [
          "Nhân sự có thẩm quyền tại FundLok (tuân thủ nguyên tắc đặc quyền tối thiểu).",
          "Bên cho vay (Nhà đầu tư) và Bên vay (Doanh nghiệp) trong phạm vi cần thiết để giao kết và thực hiện hợp đồng tài trợ vốn.",
          "Các đối tác ngân hàng lưu ký được ủy quyền để thực hiện chuyển dịch dòng tiền.",
          "Các đối tác cung cấp hạ tầng công nghệ và xác thực eKYC/KYB đã ký thỏa thuận bảo mật cam kết tuân thủ Nghị định 13/2023/NĐ-CP.",
          "Cơ quan quản lý Nhà nước có thẩm quyền khi có yêu cầu hợp pháp theo quy định.",
        ],
        contentEn: [
          "Authorized personnel within FundLok under least-privilege role boundaries.",
          "The respective Investor and Enterprise parties executing a mutual financing agreement.",
          "Authorized custodial bank partners executing fund movements.",
          "Vetted verification (KYC/KYB) infrastructure providers bound by non-disclosure agreements compliant with Decree 13/2023/ND-CP.",
          "Competent state authorities pursuant to formal statutory mandates.",
        ],
      },
      {
        headingVi: "V. QUYỀN VÀ NGHĨA VỤ CỦA CHỦ THỂ DỮ LIỆU",
        headingEn: "V. RIGHTS & OBLIGATIONS OF DATA SUBJECTS",
        contentVi: [
          "Quyền của chủ thể dữ liệu (theo Điều 9 Nghị định 13/2023/NĐ-CP): Quyền được biết, quyền đồng ý, quyền truy cập, quyền rút lại sự đồng ý, quyền yêu cầu xóa dữ liệu, quyền hạn chế xử lý dữ liệu, quyền yêu cầu cung cấp dữ liệu, quyền phản đối xử lý dữ liệu, quyền khiếu nại và yêu cầu bồi thường thiệt hại theo luật định.",
          "Cách thức thực hiện quyền: Người dùng gửi yêu cầu văn bản qua email support@fundlok.com. FundLok sẽ phản hồi và xử lý trong thời hạn quy định của pháp luật sau khi hoàn tất xác minh người yêu cầu.",
          "Nghĩa vụ của chủ thể dữ liệu: Tự bảo vệ dữ liệu cá nhân của mình; cung cấp dữ liệu chính xác, đầy đủ; tôn trọng dữ liệu cá nhân của người khác và tuân thủ các quy định bảo vệ dữ liệu.",
        ],
        contentEn: [
          "Data Subject Rights (Article 9 of Decree 13/2023/ND-CP): The right to be informed, right to consent, right of access, right to withdraw consent, right to delete data, right to restrict processing, right to data portability, right to object, right to file complaints, and right to claim damages.",
          "Exercising rights: Submit a written request to support@fundlok.com. FundLok reviews and responds within statutory timeframes following identity verification.",
          "User obligations: Safeguard personal credentials, submit authentic information, respect third-party privacy, and comply with platform security policies.",
        ],
      },
      {
        headingVi: "VI. THỜI GIAN LƯU TRỮ VÀ TIÊU CHUẨN AN NINH DỮ LIỆU",
        headingEn: "VI. RETENTION PERIOD & SECURITY MEASURES",
        contentVi: [
          "Dữ liệu cá nhân được lưu trữ an toàn trong suốt thời gian Người dùng duy trì tài khoản trên Nền tảng FundLok, và được tiếp tục lưu trữ theo thời hạn tối thiểu do Luật Kế toán và Luật Phòng chống rửa tiền quy định sau khi đóng tài khoản.",
          "Tiêu chuẩn kỹ thuật: Toàn bộ dữ liệu truyền tải được mã hóa theo chuẩn TLS 1.3; dữ liệu nhạy cảm được mã hóa lưu trữ ở trạng thái nghỉ (encryption-at-rest). Hệ thống áp dụng tường lửa, giám sát nhật ký bất biến và đánh giá an toàn thông tin định kỳ.",
        ],
        contentEn: [
          "Personal data is retained while an active account is maintained, and subsequently archived for the statutory duration required by anti-money laundering and accounting laws.",
          "Security standards: All communications are encrypted in transit via TLS 1.3 and stored with encryption-at-rest. The platform employs audit logging, network firewalls, and regular penetration testing.",
        ],
      },
    ],
  },
];

export function TermsClient() {
  const { t, locale, localize } = useTranslations();
  const isVi = locale === "vi";

  const [searchQuery, setSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return TERMS_SECTIONS;
    const q = searchQuery.toLowerCase();
    return TERMS_SECTIONS.map((sec) => ({
      ...sec,
      items: sec.items.filter((item) => {
        const text = isVi
          ? `${item.headingVi} ${item.contentVi.join(" ")}`.toLowerCase()
          : `${item.headingEn} ${item.contentEn.join(" ")}`.toLowerCase();
        return text.includes(q);
      }),
    })).filter((sec) => sec.items.length > 0);
  }, [searchQuery, isVi]);

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground overflow-x-hidden">
      <SiteHeader />
      <BackgroundBlobs variant="compact" />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between gap-4 pb-8 border-b border-border/60">
          <Link
            href={localize("/")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            {t("termsPage.backToHome")}
          </Link>
        </div>

        {/* Hero Header */}
        <header className="py-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Shield className="h-3.5 w-3.5" />
            {t("termsPage.badge")}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground text-balance">
            {t("termsPage.title")}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-muted-foreground">
            <span>{t("termsPage.version")}</span>
            <span aria-hidden>•</span>
            <span>{t("termsPage.effectiveDate")}</span>
            <span aria-hidden>•</span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 hover:text-foreground font-medium transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {t("termsPage.shareCopied")}
                  </span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5" />
                  <span>{t("termsPage.share")}</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Mandatory Invariant / Custody Notice Banner */}
        <aside
          aria-label={t("termsPage.noticeTitle")}
          className="mb-10 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 p-5 md:p-6 backdrop-blur-md"
        >
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-sm font-bold text-foreground">
                {t("termsPage.noticeTitle")}
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                {t("termsPage.noticeBanner")}
              </p>
            </div>
          </div>
        </aside>

        {/* Content Layout: Sticky Sidebar Navigation + Terms Body */}
        <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
          {/* Sidebar Navigation */}
          <nav
            aria-label={t("termsPage.tableOfContents")}
            className="hidden lg:block space-y-6 sticky top-24 self-start"
          >
            <div className="rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur-md">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-2">
                {t("termsPage.tableOfContents")}
              </h3>
              <ul className="space-y-1 text-sm">
                {TERMS_SECTIONS.map((sec) => (
                  <li key={sec.id}>
                    <a
                      href={`#${sec.id}`}
                      className="flex items-center justify-between rounded-lg px-2.5 py-1.5 font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors group"
                    >
                      <span className="min-w-0 break-words">
                        {isVi ? sec.titleVi : sec.titleEn}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/40 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Lock className="h-4 w-4 text-emerald-500" />
                {t("termsPage.complianceTitle")}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("termsPage.complianceDesc")}
              </p>
            </div>
          </nav>

          {/* Main Legal Content */}
          <section className="space-y-12">
            {/* Search Filter */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("termsPage.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-card/50 border-border/60"
              />
            </div>

            {filteredSections.length === 0 ? (
              <div className="text-center py-16 space-y-3 rounded-2xl border border-border/60 bg-card/30">
                <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                <p className="text-muted-foreground text-sm font-medium">
                  {t("termsPage.noResults")}
                </p>
              </div>
            ) : (
              filteredSections.map((sec) => (
                <article
                  key={sec.id}
                  id={sec.id}
                  className="rounded-3xl border border-border/60 bg-card/60 p-6 md:p-8 shadow-sm backdrop-blur-md scroll-mt-24 space-y-8"
                >
                  <div className="border-b border-border/50 pb-4">
                    <span className="eyebrow">
                      {isVi ? sec.badgeVi : sec.badgeEn}
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground mt-1">
                      {isVi ? sec.titleVi : sec.titleEn}
                    </h2>
                  </div>

                  <div className="space-y-8">
                    {sec.items.map((item, idx) => (
                      <div key={idx} className="space-y-3">
                        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span>{isVi ? item.headingVi : item.headingEn}</span>
                        </h3>
                        <div className="space-y-2.5 pl-6 text-sm text-muted-foreground leading-relaxed">
                          {(isVi ? item.contentVi : item.contentEn).map(
                            (paragraph, pIdx) => (
                              <p key={pIdx}>{paragraph}</p>
                            ),
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))
            )}

            {/* Support Callout Box */}
            <div className="rounded-2xl border border-border/60 bg-card/40 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  {t("termsPage.supportTitle")}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("termsPage.supportDesc")}
                </p>
              </div>
              <Button asChild variant="outline" className="shrink-0">
                <Link href={localize("/contact")}>
                  {t("auth.footer.supportLink")}
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export default TermsClient;
