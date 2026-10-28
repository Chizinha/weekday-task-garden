import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { Index, STORAGE_KEY } from "@/routes/index";

const saved = (id: number, title: string, tag = "yellow") => ({
  id,
  title,
  deadline: "08:00",
  description: "Take the bins out",
  tag,
  done: false,
});

// Clicking a task must open its editor where the card itself sits, so it is
// obvious which task is being worked on — not a blank form at the top of the day.
describe("Editing a task in its own place", () => {
  beforeEach(() => localStorage.clear());

  it("turns the clicked card into the edit form inside its own list row", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ Wednesday: [saved(31, "Water the plants")] }));

    render(<Index />);
    fireEvent.click(screen.getByText("Water the plants"));

    const form = screen.getByRole("form", { name: "Edit task Water the plants" });
    expect(form.closest("li")).toBeInTheDocument();
    expect(form.closest("ul")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Title")).toHaveValue("Water the plants");
    expect(screen.getByText("Take the bins out")).toBeInTheDocument();

    // The card is replaced, and no empty form opens above the list.
    expect(screen.queryByRole("button", { name: "Mark as done" })).not.toBeInTheDocument();
    expect(screen.queryByRole("form", { name: "New task" })).not.toBeInTheDocument();
  });

  it("saves the edited task back into the same row of the same day", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ Wednesday: [saved(31, "Water the plants")] }));

    render(<Index />);
    fireEvent.click(screen.getByText("Water the plants"));
    fireEvent.change(screen.getByPlaceholderText("Title"), { target: { value: "Water the ferns" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    const card = screen.getByText("Water the ferns").closest("li");
    expect(card).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: /Edit task/ })).not.toBeInTheDocument();
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, { title: string }[]>;
    expect(stored["Wednesday"]?.map((t) => t.title)).toEqual(["Water the ferns"]);
  });

  it("brings the card back when the edit is cancelled", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ Wednesday: [saved(31, "Water the plants"), saved(32, "Call the dentist", "blue")] }),
    );

    render(<Index />);
    fireEvent.click(screen.getByText("Water the plants"));
    fireEvent.change(screen.getByPlaceholderText("Title"), { target: { value: "Typed something wrong" } });
    fireEvent.click(within(screen.getByRole("form", { name: "Edit task Water the plants" })).getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("Water the plants")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Description text that describes the task...")).not.toBeInTheDocument();
    // the other task was never touched
    expect(screen.getByText("Call the dentist")).toBeInTheDocument();
  });
});
