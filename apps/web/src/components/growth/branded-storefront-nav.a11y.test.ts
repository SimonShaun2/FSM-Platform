// @vitest-environment happy-dom

import { describe, expect, it, vi } from "vitest";

import {
  getFocusableElements,
  handleMobileNavKeydown
} from "@/src/components/growth/branded-storefront-nav.a11y";

describe("branded-storefront-nav.a11y", () => {
  it("collects focusable elements inside the panel", () => {
    document.body.innerHTML = `
      <nav id="panel">
        <a href="#services">Services</a>
        <a href="#pricing">Pricing</a>
        <button type="button">Book</button>
      </nav>
    `;

    const panel = document.getElementById("panel");

    expect(panel).toBeTruthy();
    expect(getFocusableElements(panel as HTMLElement)).toHaveLength(3);
  });

  it("calls onEscape when Escape is pressed", () => {
    document.body.innerHTML = `<nav id="panel"><a href="#">One</a></nav>`;
    const panel = document.getElementById("panel") as HTMLElement;
    const onEscape = vi.fn();

    handleMobileNavKeydown(new KeyboardEvent("keydown", { key: "Escape" }), panel, onEscape);

    expect(onEscape).toHaveBeenCalledOnce();
  });

  it("wraps Tab forward from last focusable to first", () => {
    document.body.innerHTML = `
      <nav id="panel">
        <a href="#a" id="first">A</a>
        <a href="#b" id="last">B</a>
      </nav>
    `;
    const panel = document.getElementById("panel") as HTMLElement;
    const last = document.getElementById("last") as HTMLElement;
    const first = document.getElementById("first") as HTMLElement;

    last.focus();

    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
    const preventDefault = vi.spyOn(event, "preventDefault");

    handleMobileNavKeydown(event, panel, vi.fn());

    expect(preventDefault).toHaveBeenCalled();
    expect(document.activeElement).toBe(first);
  });

  it("wraps Shift+Tab from first focusable to last", () => {
    document.body.innerHTML = `
      <nav id="panel">
        <a href="#a" id="first">A</a>
        <a href="#b" id="last">B</a>
      </nav>
    `;
    const panel = document.getElementById("panel") as HTMLElement;
    const last = document.getElementById("last") as HTMLElement;
    const first = document.getElementById("first") as HTMLElement;

    first.focus();

    const event = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true });
    const preventDefault = vi.spyOn(event, "preventDefault");

    handleMobileNavKeydown(event, panel, vi.fn());

    expect(preventDefault).toHaveBeenCalled();
    expect(document.activeElement).toBe(last);
  });
});
