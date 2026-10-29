import { component$, useSignal, $, type Signal } from "@builder.io/qwik";
import { library, type SavedFilter } from "~/lib/library-api";
import type { FileKind } from "~/lib/file-kinds";
import { Button, Input, Select, Checkbox, Callout } from "~/components/ui";

export const SavedFilters = component$<{
  initial: SavedFilter[];
  search: Signal<string>;
  kind: Signal<FileKind | "all">;
  sort: Signal<"date" | "name" | "size" | "views" | "downloads">;
  direction: Signal<"asc" | "desc">;
  tag: Signal<string>;
  favorites: Signal<boolean>;
  period: Signal<string>;
}>((props) => {
  const filters = useSignal(props.initial);
  const name = useSignal("");
  const selected = useSignal("");
  const busy = useSignal(false);
  const error = useSignal("");
  const save = $(async () => {
    busy.value = true;
    error.value = "";
    try {
      await library.saveFilter({
        name: name.value,
        search: props.search.value,
        kind: props.kind.value,
        sort: props.sort.value,
        direction: props.direction.value,
        tag: props.tag.value || null,
        favoritesOnly: props.favorites.value,
        period: props.period.value,
      });
      filters.value = (await library.filters()).filters;
      name.value = "";
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Could not save filter.";
    } finally {
      busy.value = false;
    }
  });
  return (
    <details class="border-edge mb-4 border-b pb-3">
      <summary class="focus-ring text-ink-muted cursor-pointer text-sm">
        Favorites, tags and saved filters
      </summary>
      <div class="mt-3 flex flex-wrap items-center gap-3">
        <Checkbox
          showLabel
          label="Favorites only"
          checked={props.favorites.value}
          onChange$={(v) => (props.favorites.value = v)}
        />
        <Input
          aria-label="Filter by tag"
          placeholder="Tag"
          value={props.tag.value}
          class="w-40"
          onInput$={(_, el) => (props.tag.value = el.value)}
        />
        <Select
          aria-label="Upload period"
          value={props.period.value}
          class="w-44"
          onChange$={(_, el) => (props.period.value = el.value)}
        >
          <option value="all">Any time</option>
          <option value="month">This month (UTC)</option>
          <option value="week">Last 7 days</option>
        </Select>
        <Select
          aria-label="Saved filters"
          value={selected.value}
          class="w-48"
          onChange$={(_, el) => {
            selected.value = el.value;
            const filter = filters.value.find((f) => f.id === el.value);
            if (!filter) return;
            props.search.value = filter.search;
            props.kind.value = filter.kind as FileKind | "all";
            props.sort.value = filter.sort as typeof props.sort.value;
            props.direction.value = filter.direction as "asc" | "desc";
            props.tag.value = filter.tag || "";
            props.favorites.value = filter.favoritesOnly;
            props.period.value = filter.period;
          }}
        >
          <option value="">Choose saved filter</option>
          {filters.value.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </Select>
        {selected.value && (
          <Button
            size="sm"
            variant="ghost"
            disabled={busy.value}
            onClick$={async () => {
              busy.value = true;
              error.value = "";
              try {
                await library.deleteFilter(selected.value);
                filters.value = filters.value.filter(
                  (f) => f.id !== selected.value,
                );
                selected.value = "";
              } catch (e) {
                error.value =
                  e instanceof Error ? e.message : "Could not remove filter.";
              } finally {
                busy.value = false;
              }
            }}
          >
            Remove saved filter
          </Button>
        )}
      </div>
      <form
        preventdefault:submit
        onSubmit$={save}
        class="mt-3 flex flex-wrap gap-2"
      >
        <Input
          aria-label="Filter name"
          placeholder="Name these filters"
          maxLength={80}
          required
          value={name.value}
          class="w-56"
          onInput$={(_, el) => (name.value = el.value)}
        />
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          loading={busy.value}
        >
          Save current filters
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick$={() => {
            props.tag.value = "";
            props.favorites.value = false;
            props.period.value = "all";
            selected.value = "";
          }}
        >
          Reset extra filters
        </Button>
      </form>
      {error.value && (
        <Callout tone="danger" title="Filter error" class="mt-3">
          {error.value}
        </Callout>
      )}
    </details>
  );
});
