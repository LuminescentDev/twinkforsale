import {
  component$,
  useSignal,
  useStore,
  useOnDocument,
  $,
  noSerialize,
  type NoSerialize,
  type QRL,
} from "@builder.io/qwik";
import { canvasFile } from "~/lib/image-edit";
import { Button, Input, Field, Callout } from "~/components/ui";

export const ScreenshotTools = component$<{
  onReady$: QRL<(files: File[]) => Promise<void>>;
}>(({ onReady$ }) => {
  const canvas = useSignal<HTMLCanvasElement>();
  const input = useSignal<HTMLInputElement>();
  const bitmap = useSignal<NoSerialize<ImageBitmap>>();
  const original = useSignal<NoSerialize<File>>();
  const loaded = useSignal(false);
  const busy = useSignal(false);
  const error = useSignal("");
  const name = useSignal("screenshot.png");
  const rect = useStore({ x: 0, y: 0, width: 0, height: 0 });
  const anchor = useSignal<{ x: number; y: number }>();
  const draw = $((selection = true) => {
    const target = canvas.value;
    const image = bitmap.value;
    if (!target || !image) return;
    target.width = image.width;
    target.height = image.height;
    const ctx = target.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(image, 0, 0);
    if (selection && rect.width > 0 && rect.height > 0) {
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = Math.max(1, image.width / 500);
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      ctx.strokeStyle = "#ffffff";
      ctx.lineDashOffset = 6;
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }
  });
  const load = $(async (file: File) => {
    error.value = "";
    busy.value = true;
    try {
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
        throw new Error("Choose a PNG, JPEG, or WebP image for editing.");
      const next = await createImageBitmap(file);
      if (next.width * next.height > 40_000_000) {
        next.close();
        throw new Error("Image editing is limited to 40 megapixels.");
      }
      bitmap.value?.close();
      bitmap.value = noSerialize(next);
      original.value = noSerialize(file);
      name.value = file.name;
      rect.x = 0;
      rect.y = 0;
      rect.width = 0;
      rect.height = 0;
      loaded.value = true;
      await draw();
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Could not open image.";
    } finally {
      busy.value = false;
    }
  });
  useOnDocument(
    "paste",
    $((event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.files || []);
      const image = files.find((file) => file.type.startsWith("image/"));
      if (image) load(image);
    }),
  );
  const apply = $(async (crop: boolean) => {
    const image = bitmap.value;
    if (!image || !canvas.value) return;
    busy.value = true;
    error.value = "";
    try {
      const x = Math.floor(rect.x),
        y = Math.floor(rect.y),
        width = Math.floor(rect.width),
        height = Math.floor(rect.height);
      if (
        ![x, y, width, height].every(Number.isFinite) ||
        x < 0 ||
        y < 0 ||
        width < 1 ||
        height < 1 ||
        x + width > image.width ||
        y + height > image.height
      )
        throw new Error("Select a rectangle inside the image.");
      await draw(false);
      let next: ImageBitmap;
      if (crop) next = await createImageBitmap(image, x, y, width, height);
      else {
        const ctx = canvas.value.getContext("2d")!;
        ctx.fillStyle = "#000000";
        ctx.fillRect(x, y, width, height);
        next = await createImageBitmap(canvas.value);
      }
      image.close();
      bitmap.value = noSerialize(next);
      rect.width = 0;
      rect.height = 0;
      rect.x = 0;
      rect.y = 0;
      await draw();
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Could not edit image.";
    } finally {
      busy.value = false;
    }
  });
  return (
    <section class="border-edge mt-4 border-b pb-4">
      <div class="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick$={() => input.value?.click()}>
          Prepare screenshot
        </Button>
        <p class="text-ink-muted text-sm">
          Paste an image here to crop or redact before publishing.
        </p>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        class="sr-only"
        aria-label="Choose screenshot to edit"
        onChange$={(_, el) => {
          const file = el.files?.[0];
          el.value = "";
          if (file) load(file);
        }}
      />
      {error.value && (
        <Callout tone="danger" title="Image editor" class="mt-3">
          {error.value}
        </Callout>
      )}
      <div hidden={!loaded.value} class="mt-4">
        <p class="text-ink-muted mb-2 text-sm">
          Drag a rectangle, or enter coordinates. Redaction permanently paints
          the selected area black. Exporting removes metadata and produces a
          PNG; animated images become still.
        </p>
        <canvas
          ref={canvas}
          width={1}
          height={1}
          aria-label="Screenshot editing preview"
          class="border-edge max-h-96 max-w-full touch-none border object-contain"
          onPointerDown$={(event, el) => {
            const box = el.getBoundingClientRect();
            const x = Math.floor(
              ((event.clientX - box.left) * el.width) / box.width,
            );
            const y = Math.floor(
              ((event.clientY - box.top) * el.height) / box.height,
            );
            anchor.value = { x, y };
            el.setPointerCapture(event.pointerId);
          }}
          onPointerUp$={(event, el) => {
            if (!anchor.value) return;
            const box = el.getBoundingClientRect();
            const x = Math.max(
              0,
              Math.min(
                el.width,
                Math.floor(((event.clientX - box.left) * el.width) / box.width),
              ),
            );
            const y = Math.max(
              0,
              Math.min(
                el.height,
                Math.floor(
                  ((event.clientY - box.top) * el.height) / box.height,
                ),
              ),
            );
            rect.x = Math.min(anchor.value.x, x);
            rect.y = Math.min(anchor.value.y, y);
            rect.width = Math.abs(x - anchor.value.x);
            rect.height = Math.abs(y - anchor.value.y);
            anchor.value = undefined;
            draw();
          }}
        />
        <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(["x", "y", "width", "height"] as const).map((key) => (
            <Field key={key} label={key} for={`crop-${key}`}>
              <Input
                id={`crop-${key}`}
                type="number"
                min={0}
                value={rect[key]}
                onInput$={(_, el) => {
                  rect[key] = Number(el.value);
                  draw();
                }}
              />
            </Field>
          ))}
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={busy.value}
            onClick$={() => apply(true)}
          >
            Crop selection
          </Button>
          <Button
            variant="secondary"
            disabled={busy.value}
            onClick$={() => apply(false)}
          >
            Redact selection
          </Button>
          <Button
            variant="ghost"
            disabled={busy.value}
            onClick$={() => original.value && load(original.value)}
          >
            Reset image
          </Button>
          <Button
            loading={busy.value}
            onClick$={async () => {
              if (!canvas.value) return;
              busy.value = true;
              error.value = "";
              try {
                await draw(false);
                const file = await canvasFile(canvas.value, name.value);
                await onReady$([file]);
                loaded.value = false;
                bitmap.value?.close();
                bitmap.value = undefined;
                original.value = undefined;
              } catch (e) {
                error.value =
                  e instanceof Error
                    ? e.message
                    : "Could not upload screenshot.";
              } finally {
                busy.value = false;
              }
            }}
          >
            Upload prepared image
          </Button>
        </div>
      </div>
    </section>
  );
});
