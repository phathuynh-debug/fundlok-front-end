import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { LateCount, OverdueRepayments, plural } from "./OverdueRepayments";
import type { AdminOverdueRepayments } from "@/services/admin-funding.service";

let overdue: AdminOverdueRepayments | undefined;

vi.mock("@/hooks/use-admin-funding", () => ({
  useAdminOverdueRepayments: () => ({ data: overdue }),
}));

vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: "en",
    t: (key: string, values?: Record<string, string | number>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}));

const O = "admin.transactions.repayments.overdue";

const late: AdminOverdueRepayments = {
  as_of: "2026-11-13",
  tickets: 2,
  businesses: 1,
  overdue_days: 3,
  overdue_net_vnd: 374_109,
  items: [
    {
      tranche_id: "tr-ha",
      window_id: "w-1",
      project_name: "CÔNG TY TNHH HẠT MỘC",
      reference_code: "FLHA000001",
      business: {
        id: "sme-1",
        full_name: "Nguyễn Lan",
        email: "nguyen.lan@hatmoc.vn",
      },
      investor: { id: "inv-1", full_name: "Phạm Thu Hà", email: "ha@x.vn" },
      overdue_days: 2,
      oldest_due_date: "2026-11-10",
      working_days_late: 3,
      overdue_net_vnd: 249_406,
    },
    {
      tranche_id: "tr-bao",
      window_id: "w-1",
      project_name: "CÔNG TY TNHH HẠT MỘC",
      reference_code: "FLBAO00001",
      business: {
        id: "sme-1",
        full_name: "Nguyễn Lan",
        email: "nguyen.lan@hatmoc.vn",
      },
      investor: { id: "inv-2", full_name: "Lê Quốc Bảo", email: null },
      overdue_days: 1,
      oldest_due_date: "2026-11-12",
      working_days_late: 1,
      overdue_net_vnd: 124_703,
    },
  ],
};

describe("OverdueRepayments", () => {
  beforeEach(() => {
    overdue = late;
  });

  it("shows a red alert with how many repayments are late, the days unpaid and the amount owed", () => {
    render(<OverdueRepayments />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("data-testid", "overdue-repayments");
    expect(alert.className).toContain("border-destructive/40");
    expect(alert.className).toContain("bg-destructive/5");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      `${O}.title.other:{"count":2}`,
    );
    expect(screen.getByRole("heading", { level: 2 }).className).toContain(
      "text-destructive",
    );
    // The summary names the businesses, the days unpaid and the total owed.
    expect(alert).toHaveTextContent(`${O}.businesses.one`);
    expect(alert).toHaveTextContent(`${O}.daysUnpaid.other`);
    expect(alert).toHaveTextContent("₫374,109");
  });

  it("lists each late ticket with its working days late, days unpaid, due date and amount", () => {
    render(<OverdueRepayments />);

    const ha = screen.getByTestId("overdue-row-tr-ha");
    expect(ha).toHaveTextContent("FLHA000001");
    expect(ha).toHaveTextContent("Nguyễn Lan");
    expect(ha).toHaveTextContent("Phạm Thu Hà");
    expect(ha).toHaveTextContent(`${O}.workingDaysLate.other:{"count":3}`);
    expect(ha).toHaveTextContent(`${O}.daysUnpaid.other:{"count":2}`);
    expect(ha).toHaveTextContent(`${O}.since:{"date":"11/10/2026"}`);
    expect(ha).toHaveTextContent("₫249,406");

    const bao = screen.getByTestId("overdue-row-tr-bao");
    expect(bao).toHaveTextContent(`${O}.workingDaysLate.one:{"count":1}`);
    expect(bao).toHaveTextContent(`${O}.daysUnpaid.one:{"count":1}`);
    expect(within(bao).getByText("₫124,703").className).toContain(
      "text-destructive",
    );
  });

  it("renders nothing when every repayment is on time", () => {
    overdue = {
      ...late,
      tickets: 0,
      businesses: 0,
      overdue_days: 0,
      overdue_net_vnd: 0,
      items: [],
    };
    const { container } = render(<OverdueRepayments />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("renders nothing while loading or when the list could not be read", () => {
    overdue = undefined;
    const { container } = render(<OverdueRepayments />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe("LateCount", () => {
  it("shows the number of late repayments in red on the tab", () => {
    render(<LateCount count={2} />);

    const count = screen.getByTestId("late-count");
    expect(count).toHaveTextContent("2");
    expect(count.className).toContain("bg-destructive");
    expect(count).toHaveAttribute(
      "aria-label",
      `${O}.tabCount.other:{"count":2}`,
    );
  });

  it("shows nothing when nothing is late", () => {
    const { container } = render(<LateCount count={0} />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe("plural", () => {
  it("picks the .one key for 1 and .other otherwise", () => {
    const t = (key: string, values?: Record<string, string | number>) =>
      `${key}|${values?.count}`;

    expect(plural(t, "x", 1)).toBe("x.one|1");
    expect(plural(t, "x", 0)).toBe("x.other|0");
    expect(plural(t, "x", 5)).toBe("x.other|5");
  });
});
