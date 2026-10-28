import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { Index } from "@/routes/index";

// Tasks must outlive the visit they were made in: closing and reopening the
// page has to show the same list, in the same ticked state.
describe("Task persistence", () => {
  beforeEach(() => window.localStorage.clear());

  it("shows a task added in an earlier visit after reopening", () => {
    const first = render(<Index />);
    fireEvent.click(screen.getByLabelText("Add task to Thursday"));
    fireEvent.change(screen.getByPlaceholderText("Title"), { target: { value: "Renew passport" } });
    fireEvent.click(screen.getByRole("button", { name: "Add to list" }));
    expect(screen.getByText("Renew passport")).toBeInTheDocument();
    first.unmount();

    render(<Index />);
    const thursday = screen.getByText("Thursday").closest("section");
    expect(within(thursday!).getByText("Renew passport")).toBeInTheDocument();
  });

  it("keeps a task ticked off after reopening", () => {
    const first = render(<Index />);
    const monday = screen.getByText("Monday").closest("section");
    expect(within(monday!).getAllByLabelText("Mark as done")).toHaveLength(1);
    fireEvent.click(within(monday!).getByLabelText("Mark as not done"));
    first.unmount();

    render(<Index />);
    const reopened = screen.getByText("Monday").closest("section");
    expect(within(reopened!).getAllByLabelText("Mark as done")).toHaveLength(2);
  });
});
