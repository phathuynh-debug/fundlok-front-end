import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DataTable, type Column } from "./DataTable";

vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: "en",
    t: (key: string) => key,
  }),
}));

interface SampleRow {
  id: string;
  name: string;
  amount: number;
  status: string;
}

const sampleRows: SampleRow[] = [
  { id: "1", name: "Beta Corp", amount: 500, status: "Pending" },
  { id: "2", name: "Alpha Co", amount: 1500, status: "Approved" },
  { id: "3", name: "Gamma Ltd", amount: 100, status: "Approved" },
];

const columns: Column<SampleRow>[] = [
  {
    key: "name",
    header: "Company",
    render: (row) => row.name,
  },
  {
    key: "amount",
    header: "Amount",
    sortValue: (row) => row.amount,
    render: (row) => `$${row.amount}`,
  },
  {
    key: "status",
    header: "Status",
    filterType: "select",
    render: (row) => row.status,
  },
];

describe("DataTable interactive sorting and filtering", () => {
  it("cycles sort order (Asc -> Desc -> Reset) when clicking a column header", () => {
    render(
      <DataTable
        columns={columns}
        rows={sampleRows}
        getRowKey={(row) => row.id}
      />,
    );

    const amountButton = screen.getByRole("button", { name: "Amount" });

    // 1st click: Ascending (100, 500, 1500 -> Gamma, Beta, Alpha)
    fireEvent.click(amountButton);
    let cells = screen.getAllByRole("cell");
    expect(cells[0]).toHaveTextContent("Gamma Ltd");
    expect(cells[3]).toHaveTextContent("Beta Corp");
    expect(cells[6]).toHaveTextContent("Alpha Co");

    // 2nd click: Descending (1500, 500, 100 -> Alpha, Beta, Gamma)
    fireEvent.click(amountButton);
    cells = screen.getAllByRole("cell");
    expect(cells[0]).toHaveTextContent("Alpha Co");
    expect(cells[3]).toHaveTextContent("Beta Corp");
    expect(cells[6]).toHaveTextContent("Gamma Ltd");

    // 3rd click: Reset to original order (Beta, Alpha, Gamma)
    fireEvent.click(amountButton);
    cells = screen.getAllByRole("cell");
    expect(cells[0]).toHaveTextContent("Beta Corp");
    expect(cells[3]).toHaveTextContent("Alpha Co");
    expect(cells[6]).toHaveTextContent("Gamma Ltd");
  });

  it("filters rows via text search popover and select checkboxes popover", () => {
    render(
      <DataTable
        columns={columns}
        rows={sampleRows}
        getRowKey={(row) => row.id}
      />,
    );

    // Open text filter popover on Company column
    const filterButtons = screen.getAllByRole("button", {
      name: /tableControls\.filterBy/,
    });
    fireEvent.click(filterButtons[0]);

    const searchInput = screen.getByPlaceholderText(
      /tableControls\.filterPlaceholder/,
    );
    fireEvent.change(searchInput, { target: { value: "Alpha" } });

    expect(screen.getByText("Alpha Co")).toBeInTheDocument();
    expect(screen.queryByText("Beta Corp")).toBeNull();
    expect(screen.queryByText("Gamma Ltd")).toBeNull();

    // Reset all filters using the active filters bar
    fireEvent.click(
      screen.getByRole("button", { name: /tableControls\.clearAll/ }),
    );
    expect(screen.getByText("Beta Corp")).toBeInTheDocument();
    expect(screen.getByText("Gamma Ltd")).toBeInTheDocument();
  });
});
