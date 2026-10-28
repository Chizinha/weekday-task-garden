import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { Index, STORAGE_KEY } from "@/routes/index";

const saved = (id: number, title: string) => ({
  id,
  title,
  deadline: "09:15",
  description: "Take the bins out",
  tag: "yellow",
  done: false,
});

// The edit window must offer a Delete action that removes the task for good,
// while the fresh-task form must not show one.
describe("Deleting a task from the edit window", () => {
  beforeEach(() => localStorage.clear());

  it("removes the task from the list and from browser storage", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ Wednesday: [saved(21, "Water the plants")] }));

    render(<Index />);
    fireEvent.click(screen.getByText("Water the plants"));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.queryByText("Water the plants")).not.toBeInTheDocument();
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, unknown[]>;
    expect(stored["Wednesday"]).toEqual([]);
  });

  it("keeps the other tasks of the same day", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ Wednesday: [saved(21, "Water the plants"), saved(22, "Call the dentist")] }),
    );

    render(<Index />);
    fireEvent.click(screen.getByText("Water the plants"));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.queryByText("Water the plants")).not.toBeInTheDocument();
    expect(screen.getByText("Call the dentist")).toBeInTheDocument();
  });

  it("hides Delete from the new-task form", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ Wednesday: [saved(21, "Water the plants")] }));

    render(<Index />);
    fireEvent.click(screen.getByLabelText("Add task to Wednesday"));

    const form = screen.getByPlaceholderText("Description text that describes the task...")
      .closest("form") as HTMLElement;
    expect(within(form).queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    expect(within(form).getByRole("button", { name: "Add to list" })).toBeInTheDocument();
  });
});
