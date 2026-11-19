import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BuilderFreeBlock } from "./builder-link-bio";

describe("BuilderFreeBlock", () => {
  it("renders an exact text size with its selected visual style", () => {
    render(
      <BuilderFreeBlock
        block={{
          id: "3f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
          type: "rich_text",
          text: "Hubungi kami",
          fontSize: 18,
          fontUnit: "pt",
          isBold: true,
          isItalic: true,
          textAlign: "center",
          width: "full",
          isVisible: true,
        }}
      />,
    );

    expect(screen.getByText("Hubungi kami")).toHaveStyle({
      fontSize: "18pt",
      fontStyle: "italic",
      fontWeight: "700",
      lineHeight: "1.5",
      textAlign: "center",
    });
    expect(screen.getByText("Hubungi kami")).toHaveClass("break-words");
  });

  it("renders the selected semantic heading level", () => {
    render(
      <BuilderFreeBlock
        block={{
          id: "4f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
          type: "heading",
          text: "Koleksi cincin",
          level: "h3",
          isBold: true,
          isItalic: false,
          textAlign: "left",
          width: "full",
          isVisible: true,
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 3, name: "Koleksi cincin" }),
    ).toBeVisible();
  });

  it("keeps legacy custom HTML safe to render", () => {
    const { container } = render(
      <BuilderFreeBlock
        block={{
          id: "5f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
          type: "html",
          html: "<p>Konten lama</p><script>alert(1)</script>",
          width: "full",
          isVisible: true,
        }}
      />,
    );

    expect(screen.getByText("Konten lama")).toBeVisible();
    expect(container.querySelector("script")).toBeNull();
  });
});
