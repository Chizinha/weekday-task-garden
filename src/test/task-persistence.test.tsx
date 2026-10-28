import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { Index, STORAGE_KEY } from "@/routes/index";

const saved = (id: number, title: string) => ({
  id,
  title,
  deadline: "18:30",
  description: "From a previous visit",
  tag: "blue",
  done: false,
});

describe("Task persistence", () => {
  beforeEach(() => localStorage.clear());

  it("shows tasks stored by an earlier visit", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ Friday: [saved(7, "Pick up tickets")] }));

    render(<Index />);

    expect(screen.getByText("Pick up tickets")).toBeInTheDocument();
    expect(screen.queryAllByText("Title")).toHaveLength(0);
  });

  it("writes a newly added task to browser storage", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({}));

    render(<Index />);
    fireEvent.click(screen.getByLabelText("Add task to Thursday"));
    fireEvent.change(screen.getByPlaceholderText("Title"), { target: { value: "Water the plants" } });
    fireEvent.click(screen.getByRole("button", { name: "Add to list" }));

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, { title: string }[]>;
    expect(stored["Thursday"]?.[0]?.title).toBe("Water the plants");
  });

  it("starts with an empty list when nothing was stored", () => {
    render(<Index />);

    expect(screen.queryByText("Pick up tickets")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: /^Mark as/ })).toHaveLength(0);
  });

  it("shows nothing when stored data is unreadable", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");

    render(<Index />);

    expect(screen.queryAllByRole("button", { name: /^Mark as/ })).toHaveLength(0);
  });

  it("does not reuse a saved task's number for a new task", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ Monday: [saved(140, "Old task")] }));

    render(<Index />);
    fireEvent.click(screen.getByLabelText("Add task to Monday"));
    fireEvent.change(screen.getByPlaceholderText("Title"), { target: { value: "New task" } });
    fireEvent.click(screen.getByRole("button", { name: "Add to list" }));

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, { id: number }[]>;
    expect(stored["Monday"]?.map((t) => t.id)).toEqual([140, 141]);
  });
});
