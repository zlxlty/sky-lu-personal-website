import {
  Panel,
  PanelContent,
  PanelDescription,
  PanelHeader,
  PanelRuleBand,
  PanelTitle,
} from "@/components/blueprint/Panel";
import { RailAnnotation } from "@/components/blueprint/RailAnnotation";
import { StripeSeparator } from "@/components/blueprint/StripeSeparator";
import { PanelGrid, PanelGridItem } from "@/components/blueprint/PanelGrid";

export const blueprintCases = [
  "adjacent",
  "dividers",
  "nested",
  "overlays",
  "short",
  "pairs",
  "descriptions",
  "surfaces",
  "grid",
] as const;
type BlueprintCase = (typeof blueprintCases)[number];

/** Static examples exercise the same Astro/React composition as real routes. */
export function BlueprintCompositions({ example }: { example: BlueprintCase }) {
  if (example === "grid") {
    return (
      <>
        {[1, 3, 4].map((count) => (
          <Panel key={count} data-region={`grid-panel-${count}`}>
            <PanelHeader className="py-4" data-region={`grid-heading-${count}`}>
              <PanelTitle>{count} grid items</PanelTitle>
            </PanelHeader>
            <PanelGrid data-region={`grid-${count}`}>
              {Array.from({ length: count }, (_, index) => (
                <PanelGridItem
                  key={index}
                  data-region={`grid-${count}-item-${index}`}
                >
                  <PanelContent>
                    <h3 className="m-0 text-lg">Item {index + 1}</h3>
                    <p className="mt-2 mb-0">
                      {index % 2
                        ? "A short description."
                        : "A longer description that wraps across several lines, keeping both cells in the row the same height and their rules aligned."}
                    </p>
                  </PanelContent>
                </PanelGridItem>
              ))}
            </PanelGrid>
          </Panel>
        ))}
      </>
    );
  }
  if (example === "surfaces") {
    return (
      <Panel
        data-region="surface-panel"
        className="bg-(--color-surface-raised)"
      >
        <PanelContent data-region="raised-content" className="h-16">
          Opaque panel surface.
        </PanelContent>
        <PanelContent
          data-region="surface-content"
          className="h-16 bg-(--color-surface)"
        >
          Opaque content surface.
        </PanelContent>
        <PanelContent
          data-region="paper-content"
          className="h-16 bg-background"
        >
          Paper content surface.
        </PanelContent>
      </Panel>
    );
  }

  if (example === "descriptions") {
    return (
      <>
        <Panel />
        <Panel hidden>
          <PanelContent>Hidden panel.</PanelContent>
        </Panel>
        <Panel data-region="description-panel">
          <PanelHeader data-region="description-header">
            <PanelTitle data-region="title">Title with description</PanelTitle>
            <PanelDescription data-region="description">
              The title rule and next section rule are distinct.
            </PanelDescription>
          </PanelHeader>
          <PanelRuleBand data-region="description-band" />
          <Panel />
          <PanelContent data-region="description-content">
            <Panel data-region="deep-panel">
              <Panel data-region="deeper-panel">
                <PanelContent data-region="deep-content">
                  A stack nested through several levels.
                </PanelContent>
              </Panel>
            </Panel>
          </PanelContent>
        </Panel>
      </>
    );
  }

  if (example === "pairs") {
    const kinds = ["panel", "band", "stripe"] as const;
    return (
      <>
        {kinds.flatMap((first) =>
          kinds.map((second) => {
            const name = `${first}-${second}`;
            return (
              <Panel key={name} data-region={name}>
                <PanelHeader data-region={`${name}-title`}>
                  <PanelTitle>
                    {first} → {second}
                  </PanelTitle>
                </PanelHeader>
                {[first, second].map((kind, index) => {
                  const label = `${name}-${index}`;
                  if (kind === "band")
                    return <PanelRuleBand key={label} data-region={label} />;
                  if (kind === "stripe")
                    return <StripeSeparator key={label} data-region={label} />;
                  return (
                    <Panel key={label} data-region={label}>
                      <PanelContent>Nested section.</PanelContent>
                    </Panel>
                  );
                })}
              </Panel>
            );
          }),
        )}
      </>
    );
  }
  if (example === "short") {
    return (
      <Panel data-region="short">
        <PanelContent>
          Short page: the rails should reach the bottom of the viewport.
        </PanelContent>
      </Panel>
    );
  }

  if (example === "adjacent") {
    return (
      <>
        <Panel data-region="first-panel">
          <PanelHeader data-region="first-header">
            <PanelTitle>First panel</PanelTitle>
          </PanelHeader>
          <PanelContent data-region="first-content">
            An ordinary section.
          </PanelContent>
        </Panel>
        <Panel data-region="second-panel">
          <PanelHeader data-region="second-header">
            <PanelTitle>Second panel</PanelTitle>
          </PanelHeader>
          <PanelContent data-region="second-content">
            One shared boundary with the panel above.
          </PanelContent>
        </Panel>
      </>
    );
  }

  if (example === "dividers") {
    return (
      <>
        <PanelRuleBand data-region="leading-band" />
        <StripeSeparator data-region="leading-stripe" />
        <Panel data-region="panel">
          <PanelRuleBand data-region="first-band" />
          <PanelContent data-region="content">
            Dividers can start, end, or interrupt a panel.
          </PanelContent>
          <StripeSeparator data-region="inner-stripe" />
          <PanelRuleBand data-region="inner-band" />
          <PanelRuleBand data-region="last-band" />
        </Panel>
        <StripeSeparator data-region="trailing-stripe" />
        <PanelRuleBand data-region="trailing-band" />
      </>
    );
  }

  if (example === "nested") {
    return (
      <Panel data-region="outer-panel">
        <PanelHeader data-region="outer-header">
          <PanelTitle>Nested panels</PanelTitle>
        </PanelHeader>
        <Panel data-region="inner-panel">
          <PanelContent data-region="inner-content">
            This nested panel shares the same vertical rails.
          </PanelContent>
          <PanelRuleBand data-region="inner-band" />
        </Panel>
        <PanelContent data-region="padded-content">
          <Panel data-region="inset-panel">
            <PanelContent data-region="inset-content">
              Panels can also sit inside padded content.
            </PanelContent>
            <StripeSeparator data-region="inset-stripe" />
          </Panel>
        </PanelContent>
        <PanelRuleBand data-region="outer-band" />
      </Panel>
    );
  }

  return (
    <Panel data-region="annotated-panel">
      <RailAnnotation side="left">Before the band</RailAnnotation>
      <PanelRuleBand data-region="first-band" />
      <PanelContent data-region="first-content" className="py-8">
        First visible section.
      </PanelContent>
      <RailAnnotation side="right">Between sections</RailAnnotation>
      <PanelContent hidden data-region="hidden-content">
        Hidden sections have no rules.
      </PanelContent>
      <PanelContent data-region="second-content" className="py-8">
        Second visible section.
      </PanelContent>
      <PanelRuleBand data-region="last-band" />
      <RailAnnotation side="left" align="end">
        After the band
      </RailAnnotation>
    </Panel>
  );
}
