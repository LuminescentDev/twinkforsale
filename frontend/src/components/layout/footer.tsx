import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";

const linkClass = "focus-ring retro-link inline-flex text-[13px]";

export const Footer = component$(() => (
  <footer class="border-accent-text bg-nav relative z-20 border-t-[3px] border-double">
    <div class="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-[1fr_auto_auto] sm:px-6 lg:px-8">
      <div class="max-w-sm">
        <Link
          href="/"
          class="focus-ring retro-banner inline-flex text-lg font-bold"
        >
          twink.forsale
        </Link>
        <p class="text-ink-muted mt-3 text-[13px] leading-5">
          A practical, invite-only file service for a small community. Queer,
          personal, and built for quick sharing.
        </p>
      </div>

      <div>
        <h2 class="font-pixel text-ink text-[15px] font-semibold">Service</h2>
        <ul class="mt-3 space-y-2">
          <li>
            <Link href="/dashboard" class={linkClass}>
              Files
            </Link>
          </li>
          <li>
            <Link href="/upload" class={linkClass}>
              Upload
            </Link>
          </li>
          <li>
            <Link href="/setup/sharex" class={linkClass}>
              ShareX setup
            </Link>
          </li>
          <li>
            <a
              href="https://discord.gg/RJ9Cedxvqe"
              target="_blank"
              rel="noopener noreferrer"
              class={linkClass}
            >
              Community Discord
            </a>
          </li>
          <li>
            <a
              href="https://github.com/LuminescentDev/twinkforsale"
              target="_blank"
              rel="noopener noreferrer"
              class={linkClass}
            >
              GitHub
            </a>
          </li>
        </ul>
      </div>

      <div>
        <h2 class="font-pixel text-ink text-[15px] font-semibold">Policies</h2>
        <ul class="mt-3 space-y-2">
          <li>
            <Link href="/privacy" class={linkClass}>
              Privacy
            </Link>
          </li>
          <li>
            <Link href="/terms" class={linkClass}>
              Terms
            </Link>
          </li>
          <li>
            <Link href="/acceptable-use" class={linkClass}>
              Acceptable use
            </Link>
          </li>
          <li>
            <Link href="/dmca" class={linkClass}>
              DMCA
            </Link>
          </li>
        </ul>
      </div>
    </div>
    <div class="border-accent-text/45 border-t-2 border-dotted">
      <div class="text-ink-muted mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <span>© {new Date().getFullYear()} twink.forsale</span>
        <span>
          Contact{" "}
          <a class="focus-ring retro-link" href="mailto:contact@bwmp.dev">
            contact@bwmp.dev
          </a>
        </span>
      </div>
    </div>
  </footer>
));
