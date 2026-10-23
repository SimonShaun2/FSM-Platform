import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MarketingLandingPage } from "./MarketingLandingPage";
import { FEATURE_TILES, PROBLEM_CARDS, WORKFLOW_STEPS } from "./marketing-copy";

afterEach(() => {
  cleanup();
});

describe("MarketingLandingPage", () => {
  it("renders problem, workflow, and feature sections at Figma parity counts", () => {
    render(<MarketingLandingPage />);

    expect(screen.getAllByTestId("problem-card")).toHaveLength(PROBLEM_CARDS.length);
    expect(screen.getAllByTestId("workflow-step")).toHaveLength(WORKFLOW_STEPS.length);
    expect(screen.getAllByTestId("feature-tile")).toHaveLength(FEATURE_TILES.length);
  });

  it("exposes viewport markers for responsive QA evidence", () => {
    const { container } = render(<MarketingLandingPage />);
    const root = container.firstElementChild;

    expect(root?.getAttribute("data-marketing-viewports")).toBe("390/768/1440");
  });

  it("shows hero social proof stats", () => {
    render(<MarketingLandingPage />);

    expect(screen.getByText("avg recoverable / month")).toBeTruthy();
    expect(screen.getByLabelText("Social proof")).toBeTruthy();
  });
});
