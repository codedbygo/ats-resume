import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useResume, writeResume } from "./storage";

afterEach(() => {
  writeResume("");
});

describe("resume storage", () => {
  it("saves to localStorage and updates subscribers", () => {
    const { result } = renderHook(() => useResume());

    act(() => {
      writeResume("my resume");
    });

    expect(result.current).toBe("my resume");
    expect(localStorage.getItem("swaramatch:resume")).toBe("my resume");
  });

  it("removes the key when cleared", () => {
    writeResume("x");

    writeResume("");

    expect(localStorage.getItem("swaramatch:resume")).toBeNull();
  });

  it("falls back to memory when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { result } = renderHook(() => useResume());

    act(() => {
      writeResume("kept in memory");
    });

    expect(result.current).toBe("kept in memory");
  });
});
