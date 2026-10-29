import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { ProjectCard } from "./ProjectCard";
import type { Project } from "@/services/projects.service";

const locale = vi.hoisted(() => ({ current: "en" }));

vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: locale.current,
    setLocale: vi.fn(),
    t: (key: string, values?: Record<string, string | number>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}));

vi.mock("next/link", () => ({
  default: ({ children }: React.PropsWithChildren) => <a>{children}</a>,
}));

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: "p1",
    legal_name: "Công ty TNHH ABC Retail",
    tax_id: "0100000001",
    industry: "Retail Trade",
    address: { city: "HCM", country: "Vietnam" },
    incorporation_date: "2023-05-10",
    status: "ACTIVE",
    created_at: "2026-02-02T00:00:00Z",
    ...overrides,
  } as Project;
}

const withLoan = (extra: Record<string, unknown> = {}) =>
  project({
    loan_application: {
      id: "l1",
      project_id: "p1",
      requested_amount: "800000000.00",
      purpose: null,
      repayment_preference: "MONTHLY",
      status: "DRAFT",
      submitted_at: null,
      decision_note: null,
      decided_at: null,
      created_at: null,
      documents: [],
      ...extra,
    },
  } as Partial<Project>);

describe("ProjectCard — investor view (FE-008)", () => {
  it("shows the deal terms, not the company paperwork", () => {
    render(<ProjectCard project={withLoan()} role="INVESTOR" />);

    expect(
      screen.getByText("dashboard.projectCard.askingAmount"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("dashboard.projectCard.duration"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("dashboard.projectCard.expectedRoi"),
    ).toBeInTheDocument();
    // Compliance fields moved to the details page.
    expect(screen.queryByText("dashboard.projectCard.taxId")).toBeNull();
    expect(screen.queryByText("dashboard.projectCard.location")).toBeNull();
  });

  it("renders the asking amount from the listing payload as VND", () => {
    render(<ProjectCard project={withLoan()} role="INVESTOR" />);
    expect(screen.getByText("₫800,000,000")).toBeInTheDocument();
  });

  it("marks duration and score as pending rather than inventing numbers", () => {
    render(<ProjectCard project={withLoan()} role="INVESTOR" />);
    // Duration: the backend has not supplied it. ROI shows a dash, never
    // "pending", when the listing carries no rate.
    expect(
      screen.getByText("dashboard.projectCard.pending"),
    ).toBeInTheDocument();
    // The score badge: no locked score run yet.
    expect(
      screen.getByText("dashboard.projectCard.pendingGrading"),
    ).toBeInTheDocument();
  });

  it("shows the round's real funding figures from the listing", () => {
    render(
      <ProjectCard
        project={withLoan({
          listing: {
            id: "lst1",
            status: "OPEN",
            target_amount: 80_000_000,
            funded_amount: 20_000_000,
            min_ticket: 1_000_000,
            investor_count: 3,
            open_at: null,
            close_at: null,
          },
        })}
        role="INVESTOR"
      />,
    );
    expect(
      screen.getByText('dashboard.projectCard.fundedPercent:{"percent":25}'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('dashboard.projectCard.backers:{"count":3}'),
    ).toBeInTheDocument();
    // No closing date on the listing: no "days left" to show.
    expect(screen.queryByText(/dashboard\.projectCard\.daysLeft/)).toBeNull();
    expect(screen.queryByText("dashboard.projectCard.notOpenYet")).toBeNull();
  });

  it("says the round is not open yet when there is no listing", () => {
    render(<ProjectCard project={withLoan()} role="INVESTOR" />);
    expect(
      screen.getByText("dashboard.projectCard.notOpenYet"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/dashboard\.projectCard\.fundedPercent/),
    ).toBeNull();
  });

  it("shows the locked score run's business score from the listing", () => {
    render(
      <ProjectCard
        project={withLoan({ business_score: 79.25 })}
        role="INVESTOR"
      />,
    );
    expect(
      screen.getByText('dashboard.projectCard.score:{"score":"79.25"}'),
    ).toBeInTheDocument();
  });

  it("uses real duration and the ROI in money once the backend supplies the rate", () => {
    render(
      <ProjectCard
        project={withLoan({ duration_months: 9, bank_rate_pct: 12 })}
        role="INVESTOR"
      />,
    );
    expect(
      screen.getByText('dashboard.projectCard.months:{"count":9}'),
    ).toBeInTheDocument();
    // The ROI as money: 12% a year on the 800,000,000 request, for its 9
    // months (not a full year's 96,000,000).
    expect(screen.getByText(/72[.,]000[.,]000/)).toBeInTheDocument();
    expect(screen.queryByText(/96[.,]000[.,]000/)).toBeNull();
    expect(screen.queryByText("12.0%")).toBeNull();
    expect(screen.queryByText("dashboard.projectCard.pending")).toBeNull();
  });

  it("shows pending when the project has no application at all", () => {
    render(<ProjectCard project={project()} role="INVESTOR" />);
    // Asking amount and duration.
    expect(screen.getAllByText("dashboard.projectCard.pending")).toHaveLength(
      2,
    );
  });

  it("keeps the paperwork fields for the SME who filed them", () => {
    render(<ProjectCard project={withLoan()} role="SME" />);
    expect(screen.getByText("dashboard.projectCard.taxId")).toBeInTheDocument();
    expect(
      screen.getByText("dashboard.projectCard.location"),
    ).toBeInTheDocument();
    expect(screen.queryByText("dashboard.projectCard.askingAmount")).toBeNull();
  });

  it("localises the industry label", () => {
    render(<ProjectCard project={withLoan()} role="INVESTOR" />);
    expect(
      screen.getByText("projectApplication.industries.retailTrade"),
    ).toBeInTheDocument();
  });
});
