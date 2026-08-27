/**
 * Adapted from src/components/base/ui/collapsible.tsx in ncdai/chanhdai.com at
 * b0f54ff5a6b40e13fa9a9ce6d3458c7833d50321.
 * Copyright (c) 2026 Chánh Đại. Licensed under the MIT License.
 */
import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";

function Collapsible(props: CollapsiblePrimitive.Root.Props) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

function CollapsibleTrigger(props: CollapsiblePrimitive.Trigger.Props) {
  return (
    <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />
  );
}

function CollapsibleContent(props: CollapsiblePrimitive.Panel.Props) {
  return (
    <CollapsiblePrimitive.Panel data-slot="collapsible-content" {...props} />
  );
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
