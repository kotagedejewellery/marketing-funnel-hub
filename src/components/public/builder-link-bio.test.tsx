import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { PublicContent } from "@/modules/public-content/data";

import { BuilderFreeBlock, BuilderSection } from "./builder-link-bio";

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

  it("renders a custom section title instead of its source fallback", () => {
    render(
      <BuilderSection
        content={
          {
            faqs: [
              {
                id: "faq-1",
                question: "Apakah tersedia?",
                answer: "Tersedia.",
              },
            ],
          } as PublicContent
        }
        section={
          {
            sectionKey: "faq",
            publicTitle: null,
            spacingAfter: "normal",
            showDivider: false,
          } as PublicContent["sections"][number]
        }
        block={{
          id: "6f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
          type: "section",
          sectionKey: "faq",
          title: {
            mode: "custom",
            text: "Tanya jawab",
            level: "h3",
            fontSize: 20,
            fontUnit: "pt",
            lineHeight: 1.4,
            isBold: true,
            isItalic: false,
            textAlign: "center",
          },
          width: "full",
          isVisible: true,
        }}
      />,
    );

    const title = screen.getByRole("heading", {
      level: 3,
      name: "Tanya jawab",
    });
    expect(title).toHaveStyle({
      fontSize: "20pt",
      lineHeight: "1.4",
      textAlign: "center",
    });
    expect(screen.queryByRole("heading", { name: "FAQ" })).toBeNull();
  });

  it("keeps the source title for legacy layouts and hides only the heading", () => {
    const content = {
      faqs: [
        {
          id: "faq-1",
          question: "Apakah tersedia?",
          answer: "Tersedia.",
        },
      ],
    } as PublicContent;
    const section = {
      sectionKey: "faq",
      publicTitle: "FAQ",
      spacingAfter: "normal",
      showDivider: false,
    } as PublicContent["sections"][number];

    const { rerender } = render(
      <BuilderSection
        content={content}
        section={section}
        block={{
          id: "7f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
          type: "section",
          sectionKey: "faq",
          width: "full",
          isVisible: true,
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "FAQ" }),
    ).toBeVisible();

    rerender(
      <BuilderSection
        content={content}
        section={section}
        block={{
          id: "8f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
          type: "section",
          sectionKey: "faq",
          title: {
            mode: "hidden",
            level: "h2",
            isBold: true,
            isItalic: false,
            textAlign: "left",
          },
          width: "full",
          isVisible: true,
        }}
      />,
    );

    expect(screen.queryByRole("heading", { name: "FAQ" })).toBeNull();
    expect(screen.getByText("Apakah tersedia?")).toBeVisible();
  });
});
