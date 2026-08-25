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

  it("marks duration and ROI as pending rather than inventing numbers", () => {
    render(<ProjectCard project={withLoan()} role="INVESTOR" />);
    expect(
      screen.getByText("dashboard.projectCard.pending"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("dashboard.projectCard.pendingGrading"),
    ).toBeInTheDocument();
  });

  it("uses real duration and ROI once the backend supplies them", () => {
    render(
      <ProjectCard
        project={withLoan({ duration_months: 9, interest_rate_pct: 14.32 })}
        role="INVESTOR"
      />,
    );
    expect(
      screen.getByText('dashboard.projectCard.months:{"count":9}'),
    ).toBeInTheDocument();
    expect(screen.getByText("14.3%")).toBeInTheDocument();
    expect(screen.queryByText("dashboard.projectCard.pending")).toBeNull();
  });

  it("shows pending when the project has no application at all", () => {
    render(<ProjectCard project={project()} role="INVESTOR" />);
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
