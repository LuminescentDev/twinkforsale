import { component$, Slot } from "@builder.io/qwik";
import { cn } from "~/lib/utils";

export const Box = component$<{ id: string; title: string; class?: string }>(
  (props) => (
    <section
      id={props.id}
      aria-labelledby={`${props.id}-title`}
      class={cn("lp-box scroll-mt-4", props.class)}
    >
      <h2
        id={`${props.id}-title`}
        class="lp-box-title lp-pixel px-3 py-1 text-base font-bold"
      >
        {props.title}
      </h2>
      <div class="p-4 sm:p-5">
        <Slot />
      </div>
    </section>
  ),
);
