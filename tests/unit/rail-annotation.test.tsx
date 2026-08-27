import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RailAnnotation } from "@/components/blueprint/RailAnnotation";

describe("RailAnnotation", () => {
  it("places a decorative note in the left gutter and points inward", () => {
    const html = renderToStaticMarkup(
      <RailAnnotation side="left" align="start">
        Left note
      </RailAnnotation>,
    );

    expect(html).toContain('data-side="left"');
    expect(html).toContain('data-align="start"');
    expect(html).toContain('data-arrow-direction="down"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("right-full");
    expect(html).toContain("mr-3");
    expect(html).toContain("translate-x-3");
    expect(html).toContain('stroke-width="1.5"');
    expect(html).toContain("-scale-x-100");
    expect(html).toContain("Left note");
    expect(html.indexOf('data-slot="rail-annotation-copy"')).toBeLessThan(
      html.indexOf('data-slot="rail-annotation-arrow"'),
    );
  });

  it("places copy below an upward arrow in the right gutter", () => {
    const html = renderToStaticMarkup(
      <RailAnnotation side="right" arrowDirection="up">
        Right note
      </RailAnnotation>,
    );

    expect(html).toContain('data-side="right"');
    expect(html).toContain('data-align="center"');
    expect(html).toContain('data-arrow-direction="up"');
    expect(html).toContain("left-full");
    expect(html).toContain("ml-3");
    expect(html).toContain("-translate-x-3");
    expect(html).toContain("top-1/2");
    expect(html).toContain("-scale-y-100");
    expect(html).not.toContain("-scale-x-100");
    expect(html).toContain("Right note");
    expect(html.indexOf('data-slot="rail-annotation-arrow"')).toBeLessThan(
      html.indexOf('data-slot="rail-annotation-copy"'),
    );
  });
});
