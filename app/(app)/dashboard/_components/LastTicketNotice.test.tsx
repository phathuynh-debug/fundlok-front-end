import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { LastTicketNotice } from "./LastTicketNotice";
import { t } from "../invest/_components/test-t";

describe("LastTicketNotice", () => {
  it("tells an investor on the project page that one exact ticket completes the round", () => {
    render(
      <LastTicketNotice
        amountVnd={5_000_000}
        minTicketVnd={10_000_000}
        locale="en"
        t={t}
      />,
    );
    expect(screen.getByText("Last ticket: ₫5,000,000")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Only ₫5,000,000 is left in this round, below the ₫10,000,000 minimum ticket. One investor can invest exactly ₫5,000,000 to complete the round; no other amount is accepted.",
      ),
    ).toBeInTheDocument();
  });

  it("tells the investor taking it why their ticket may be below the minimum", () => {
    render(
      <LastTicketNotice
        amountVnd={5_000_000}
        minTicketVnd={10_000_000}
        completes
        locale="en"
        t={t}
      />,
    );
    expect(
      screen.getByText("Your investment completes this round"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /It takes the last ₫5,000,000, which is below the usual ₫10,000,000 minimum/,
      ),
    ).toBeInTheDocument();
  });
});
