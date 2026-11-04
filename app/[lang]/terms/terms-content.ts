import type { SeoLocale } from "@/lib/seo";

/**
 * The terms and privacy policy, in both languages. Read on the server only
 * (page.tsx), which hands TermsClient the one language the page is in: the
 * full text of both is the bulk of this page, and as part of the client
 * component it was downloaded, parsed and hydrated on every visit, the
 * language nobody was reading included.
 */
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
          "Đối tác của FundLok: là các tổ chức, cá nhân hợp tác với FundLok, bao gồm tổ chức cung cấp giải pháp xác thực (eKYC/KYB), đơn vị cung cấp chứng thư số và chữ ký số, và đơn vị tư vấn pháp lý. FundLok không dùng ngân hàng lưu ký hay tài khoản trung gian nào để giữ tiền của Người dùng.",
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
          "FundLok Partners: Third-party service providers, including verified identity providers (KYC/KYB), digital certificate and e-signature providers, and legal advisers. FundLok uses no custodial bank or intermediary account to hold Users' money.",
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
          "Kỳ hạn tài trợ: Doanh nghiệp đăng ký kỳ hạn từ 1 đến 6 tháng. 6 tháng là kỳ hạn tối đa; nền tảng không cung cấp kỳ hạn dài hơn.",
          "Tổng nghĩa vụ hoàn trả: Được ấn định tại thời điểm ký hợp đồng. Một tháng kinh doanh tốt không làm giảm số tiền này. Trường hợp duy nhất làm thay đổi tổng nghĩa vụ hoàn trả là khi thời hạn được kéo dài theo cơ chế hỗ trợ hoặc gia hạn dưới đây: lãi của phần thời gian kéo dài làm tổng số tiền tăng lên.",
          "Cơ chế hoàn trả hàng ngày: Doanh nghiệp trả một khoản cố định vào mỗi ngày làm việc, trực tiếp vào tài khoản ngân hàng của từng Nhà đầu tư, theo lịch do FundLok tính toán. Với Nhà đầu tư là cá nhân, Doanh nghiệp khấu trừ thuế thu nhập cá nhân trên phần lãi trước khi chuyển và tự nộp cho cơ quan thuế.",
          "Cơ chế hỗ trợ khi doanh thu giảm (Relief): Trong tháng, mỗi ngày làm việc vẫn được trả đủ. Sau khi tháng kết thúc, Doanh nghiệp có thể gửi yêu cầu hỗ trợ kèm doanh thu đã xác minh. Nếu tỷ lệ đã thống nhất trên doanh thu đó thấp hơn số đã trả, phần chênh lệch được đổi thành thời gian: khoản trả mỗi ngày giảm cho phần còn lại của khoản tài trợ và thời hạn kéo dài. Lãi tính cùng mức lãi suất cho phần thời gian thêm, nên tổng số tiền phải trả tăng lên. Tháng có doanh thu cao không làm tăng khoản trả mỗi ngày.",
          "Khoản trả thiếu và cảnh báo sớm: Một ngày trả nợ được coi là đã thanh toán, trừ khi Nhà đầu tư báo chưa nhận được trong thời hạn quy định. Một ngày chưa thanh toán sẽ phát sinh cảnh báo và đưa khoản tài trợ vào danh sách theo dõi (watchlist). Đây không phải là chế tài xử phạt và cũng không phải là trạng thái vi phạm hợp đồng: cơ chế này tồn tại để các bên trao đổi ngay từ ngày đầu tiên thay vì nhiều tháng sau đó. Câu hỏi đầu tiên của FundLok khi có kỳ trả thiếu là điều gì đã xảy ra. Trả thiếu khi chưa được duyệt hỗ trợ được tính là trễ hạn.",
          "Gia hạn: Nếu tổng nghĩa vụ hoàn trả chưa được tất toán khi kết thúc kỳ hạn đã đăng ký, khoản tài trợ được gia hạn. Phần thời gian thêm chịu lãi theo mức lãi suất đã ký, nên tổng số tiền phải trả tăng lên. Việc gia hạn chỉ được thực hiện trong phạm vi ngày backstop và không bao giờ làm dịch chuyển ngày này.",
          "Ngày chạm ngưỡng tới hạn (Backstop date): Hạn chót cố định tại 1,33 lần kỳ hạn đăng ký (kỳ hạn 3 tháng ứng với tối đa khoảng 4 tháng; kỳ hạn 6 tháng ứng với tối đa khoảng 8 tháng). Tại ngày này, toàn bộ dư nợ còn lại, gồm phần gốc chưa hoàn trả và lãi phát sinh đến thời điểm đó, đến hạn tất toán toàn bộ. Ngày backstop được công khai ngay từ ngày ký hợp đồng.",
          "Hoàn trả trước hạn: Lợi ích dành cho doanh nghiệp là 'không bị phạt trả trước' ('no prepayment penalty'), tuyệt đối không phải là chiết khấu giảm trừ tổng số tiền hoàn trả đã ký kết.",
          "Các trạng thái kết thúc khoản tài trợ: Khoản tài trợ kết thúc theo một trong bốn trường hợp: hoàn trả đủ trong kỳ hạn đã đăng ký, hoàn trả trước hạn, tất toán toàn bộ tại ngày backstop, hoặc được ghi giảm thành tổn thất khi không đáp ứng được ngày backstop. Việc ghi giảm chỉ có thể xảy ra sau khi đã quá ngày backstop; khoản tổn thất là tổn thất một phần vì các khoản trả hằng ngày đã hoàn lại một phần dư nợ, và do Nhà đầu tư chịu.",
        ],
        contentEn: [
          "SMEs must complete full business verification (KYB) and legal representative eKYC via FundLok's integrated verification infrastructure.",
          "Original electronic revenue evidence: Revenue evidence must consist of electronically signed original VAT tax declarations and XML e-invoices. Scanned PDFs, screenshots, or spreadsheets are rejected.",
          "Facility terms: Declared by the SME, from 1 to 6 months. Six months is the maximum; the platform does not offer longer terms.",
          "Total repayable: Fixed at signing. A strong month never shrinks it. The only thing that changes it is a longer term under the relief or extension rules below: interest on the added time raises the total.",
          "Daily repayments: The SME pays a fixed amount each business day, directly into each Investor's bank account, on the schedule FundLok computes. For individual Investors, the SME withholds personal income tax on the interest before paying and remits it to the tax office.",
          "Relief when revenue drops: Within a month, every business day is paid in full. After the month closes, the SME may request relief, sending its verified revenue. If the agreed share of that revenue is less than what was paid, the difference becomes extra time: the daily amount drops for the rest of the facility and the term extends. Interest runs at the same rate on the added time, so the total repayable goes up. A strong month never raises the daily amount.",
          "Missed payments and early warning: A repayment day counts as paid unless the Investor reports it missing within the set deadline. An unpaid day raises a warning and places the facility on a watchlist. This is neither a penalty nor a default: it exists so the conversation happens on the first day rather than months later. FundLok's first question on a missed payment is what happened. Paying less without approved relief counts as a missed payment.",
          "Extension: If the total repayable is not cleared by the end of the declared term, the facility extends. The added time carries interest at the rate signed, so the total repayable goes up. An extension is permitted only inside the backstop date and never moves that date.",
          "Backstop date: A fixed deadline at 1.33 × the declared term (3 months extends to about 4; 6 months to about 8), when the entire remaining balance, unrepaid principal plus interest incurred to that point, falls due in full. Disclosed at signing.",
          "Early repayment: The facility includes 'no prepayment penalty'. Settling early clears the obligation without penalties, but does not provide a fee discount — total repayable remains fixed.",
          "How a facility ends: In one of four ways: repaid over the declared term, repaid early, settled in full at the backstop date, or written down as a loss where the backstop is not met. A write-down can only follow a missed backstop; the loss is partial, because daily repayments have already returned part of the balance, and it is borne by the Investor.",
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
        headingVi: "IV. CƠ CHẾ DÒNG TIỀN",
        headingEn: "IV. HOW MONEY MOVES",
        contentVi: [
          "FundLok không giữ tiền của khách hàng. FundLok không có tài khoản nào để nhận, giữ hay chuyển tiếp vốn của Nhà đầu tư hoặc tiền hoàn trả.",
          "Giải ngân: Nhà đầu tư chuyển khoản từ tài khoản ngân hàng đứng tên mình thẳng vào tài khoản đã xác minh của Doanh nghiệp, theo Hợp đồng tài trợ vốn đã ký, với thông tin tài khoản và nội dung chuyển khoản do FundLok cung cấp. Nhà đầu tư tải biên lai lên để FundLok đối chiếu và ghi nhận.",
          "Hoàn trả: Doanh nghiệp trả trực tiếp cho từng Nhà đầu tư, mỗi ngày làm việc, vào tài khoản ngân hàng đã được duyệt của Nhà đầu tư.",
          "Phí: Phí của FundLok (phí kích hoạt một lần đối với Doanh nghiệp và phí dịch vụ hằng năm đối với Nhà đầu tư) được xuất hóa đơn riêng và thanh toán vào tài khoản của FundLok. Phí không bao giờ được trừ vào tiền gốc hay khoản hoàn trả.",
          "Vai trò của FundLok: tính lịch trả nợ, cung cấp thông tin thanh toán, đối chiếu và lưu giữ chứng từ (biên lai, xác nhận), theo dõi và báo cáo. FundLok không ra lệnh, giữ hay chuyển tiền thay cho Người dùng.",
        ],
        contentEn: [
          "FundLok never holds customer money. FundLok has no account through which Investor capital or repayments pass.",
          "Funding: The Investor transfers from a bank account in their own name straight to the Enterprise's verified account, under the signed Financing Agreement, using the account details and payment reference FundLok provides. The Investor uploads the receipt so FundLok can check and record it.",
          "Repayment: The Enterprise pays each Investor directly, every business day, into the Investor's approved bank account.",
          "Fees: FundLok's fees (a one-time activation fee for the Enterprise and a yearly service fee for the Investor) are invoiced separately and paid into FundLok's own account. They are never deducted from principal or repayments.",
          "FundLok's role: computing repayment schedules, providing payment details, checking and keeping evidence (receipts and confirmations), monitoring and reporting. FundLok does not instruct, hold or move money on a User's behalf.",
        ],
      },
      {
        headingVi: "V. CẢNH BÁO BẢO MẬT VÀ PHÒNG CHỐNG GIAN LẬN",
        headingEn: "V. FRAUD PREVENTION & SECURITY ADVISORIES",
        contentVi: [
          "Người dùng có nghĩa vụ bảo mật thông tin đăng nhập, mật khẩu, passkey và mã xác thực 2 bước (TOTP/OTP). FundLok không bao giờ yêu cầu người dùng cung cấp mật khẩu hoặc mã OTP dưới bất kỳ hình thức nào.",
          "Người dùng tuyệt đối KHÔNG chuyển tiền cho bất kỳ cá nhân hay tổ chức nào xưng danh FundLok. Tiền đầu tư chỉ chuyển vào tài khoản của Doanh nghiệp hiển thị trên bảng điều khiển FundLok của bạn, và phí của FundLok chỉ thanh toán vào tài khoản của FundLok ghi trên hóa đơn GTGT.",
          "Khi phát hiện có dấu hiệu truy cập trái phép hoặc lừa đảo, Người dùng cần thông báo ngay cho FundLok qua email support@fundlok.com để kịp thời khóa tài khoản và phòng ngừa thiệt hại.",
        ],
        contentEn: [
          "Users must safeguard credentials, passkeys, and two-factor authentication codes. FundLok staff will never ask for your password or OTP.",
          "Never transfer money to anyone claiming to represent FundLok. Investment money goes only to the business account shown in your FundLok dashboard, and FundLok's fees only to the FundLok account named on its VAT invoice.",
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
          "Tính lịch trả nợ, cung cấp thông tin thanh toán và đối chiếu các khoản chuyển khoản dựa trên biên lai và xác nhận do Người dùng tải lên.",
          "Quản lý, thông báo và hỗ trợ Người dùng trong suốt vòng đời của khoản tài trợ vốn.",
          "Tuân thủ các yêu cầu cung cấp thông tin theo quy định pháp luật khi có yêu cầu bằng văn bản từ cơ quan Nhà nước có thẩm quyền.",
        ],
        contentEn: [
          "Conducting digital identity and enterprise verification (KYC/KYB) in compliance with anti-money laundering regulations.",
          "Processing financing applications, computing enterprise reference scores, and deriving deal terms.",
          "Matching SMEs seeking growth capital with verified Investors.",
          "Computing repayment schedules, providing payment details and reconciling transfers using the receipts and confirmations Users upload.",
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
          "Các đơn vị cung cấp chữ ký số và hóa đơn điện tử, trong phạm vi cần thiết để ký hợp đồng và xuất hóa đơn.",
          "Các đối tác cung cấp hạ tầng công nghệ và xác thực eKYC/KYB đã ký thỏa thuận bảo mật cam kết tuân thủ Nghị định 13/2023/NĐ-CP.",
          "Cơ quan quản lý Nhà nước có thẩm quyền khi có yêu cầu hợp pháp theo quy định.",
        ],
        contentEn: [
          "Authorized personnel within FundLok under least-privilege role boundaries.",
          "The respective Investor and Enterprise parties executing a mutual financing agreement.",
          "Electronic signature and e-invoice providers, as needed to sign agreements and issue invoices.",
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

/** One section of the terms in a single language, as TermsClient renders it. */
export interface TermsSection {
  id: string;
  badge: string;
  title: string;
  items: { heading: string; content: string[] }[];
}

export function termsSectionsFor(locale: SeoLocale): TermsSection[] {
  const isVi = locale === "vi";
  return TERMS_SECTIONS.map((sec) => ({
    id: sec.id,
    badge: isVi ? sec.badgeVi : sec.badgeEn,
    title: isVi ? sec.titleVi : sec.titleEn,
    items: sec.items.map((item) => ({
      heading: isVi ? item.headingVi : item.headingEn,
      content: isVi ? item.contentVi : item.contentEn,
    })),
  }));
}
