import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Index } from "@/routes/index";

// The "Send task" button must open a popup holding the task card, a recipient
// field, and Send/Cancel actions, and it must refuse an empty recipient.
describe("Send task popup", () => {
  it("opens over the form, blocks an empty recipient, then reports the send", () => {
    render(<Index />);

    fireEvent.click(screen.getByLabelText("Add task to Monday"));
    fireEvent.change(screen.getByPlaceholderText("Title"), { target: { value: "Water plants" } });
    fireEvent.click(screen.getByRole("button", { name: "Send task" }));

    const dialog = screen.getByRole("dialog", { name: "Send task" });
    expect(within(dialog).getByText("Water plants")).toBeInTheDocument();
    expect(within(dialog).getByText("Monday")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Username or e-mail")).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Send" }));
    expect(within(dialog).getByText("Add a username or e-mail first")).toBeInTheDocument();
    expect(screen.queryByText(/^Sent to/)).not.toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText("Username or e-mail"), { target: { value: "jane@mail.com" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Send" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Sent to jane@mail.com")).toBeInTheDocument();
  });

  it("closes the popup from its Cancel button without sending", () => {
    render(<Index />);

    fireEvent.click(screen.getByLabelText("Add task to Tuesday"));
    fireEvent.change(screen.getByPlaceholderText("Title"), { target: { value: "Book flights" } });
    fireEvent.click(screen.getByRole("button", { name: "Send task" }));

    const dialog = screen.getByRole("dialog", { name: "Send task" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText(/^Sent to/)).not.toBeInTheDocument();
  });
});
