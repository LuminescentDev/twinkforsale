import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { Shield, Scale, FileText } from "lucide-icons-qwik";

export const Footer = component$(() => {
  return (
    <footer class="border-theme-card-border bg-theme-bg-secondary/50 relative z-20 mt-16 border-t backdrop-blur-md">
      <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div class="space-y-4">
            <Link
              href="/"
              class="text-gradient-cute flex items-center gap-2 text-xl font-bold transition-transform duration-300 hover:scale-105"
            >
              <div class="heart-gradient sm"></div>
              <span>twink.forsale</span>
            </Link>
            <p class="text-theme-text-secondary text-sm leading-relaxed">
              The cutest file hosting service with kawaii vibes and amazing
              features~ (◕‿◕)♡
            </p>
          </div>

          {/* Product */}
          <div class="space-y-4">
            <h3 class="text-theme-text-primary font-semibold">Product</h3>
            <ul class="space-y-2">
              <li>
                <Link
                  href="/dashboard"
                  class="text-theme-text-secondary hover:text-theme-accent-primary text-sm transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/setup/sharex"
                  class="text-theme-text-secondary hover:text-theme-accent-primary text-sm transition-colors"
                >
                  ShareX Setup
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/bio"
                  class="text-theme-text-secondary hover:text-theme-accent-primary text-sm transition-colors"
                >
                  Bio Pages
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div class="space-y-4">
            <h3 class="text-theme-text-primary font-semibold">Support</h3>
            <ul class="space-y-2">
              <li>
                <a
                  href="https://discord.gg/hNVkv4M674"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-theme-text-secondary hover:text-theme-accent-primary text-sm transition-colors"
                >
                  Join our Discord
                </a>
              </li>
              <li>
                <a
                  href="mailto:contact@bwmp.dev"
                  class="text-theme-text-secondary hover:text-theme-accent-primary text-sm transition-colors"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/LuminescentDev/twinkforsale"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-theme-text-secondary hover:text-theme-accent-primary text-sm transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="mailto:dmca@bwmp.dev"
                  class="text-theme-text-secondary hover:text-theme-accent-primary text-sm transition-colors"
                >
                  DMCA Reports
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div class="space-y-4">
            <h3 class="text-theme-text-primary font-semibold">Legal</h3>
            <ul class="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  class="text-theme-text-secondary hover:text-theme-accent-primary flex items-center gap-2 text-sm transition-colors"
                >
                  <Shield class="h-3 w-3" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  class="text-theme-text-secondary hover:text-theme-accent-primary flex items-center gap-2 text-sm transition-colors"
                >
                  <Scale class="h-3 w-3" />
                  Terms of Service
                </Link>
              </li>{" "}
              <li>
                <Link
                  href="/dmca"
                  class="text-theme-text-secondary hover:text-theme-accent-primary flex items-center gap-2 text-sm transition-colors"
                >
                  <FileText class="h-3 w-3" />
                  DMCA Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/acceptable-use"
                  class="text-theme-text-secondary hover:text-theme-accent-primary flex items-center gap-2 text-sm transition-colors"
                >
                  <Shield class="h-3 w-3" />
                  Acceptable Use
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div class="border-theme-card-border mt-8 border-t pt-6">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex flex-wrap gap-4 text-sm">
              <Link
                href="/privacy"
                class="text-theme-text-muted hover:text-theme-text-secondary transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                class="text-theme-text-muted hover:text-theme-text-secondary transition-colors"
              >
                Terms
              </Link>{" "}
              <Link
                href="/dmca"
                class="text-theme-text-muted hover:text-theme-text-secondary transition-colors"
              >
                DMCA
              </Link>
              <Link
                href="/acceptable-use"
                class="text-theme-text-muted hover:text-theme-text-secondary transition-colors"
              >
                AUP
              </Link>
            </div>
            <p class="text-theme-text-muted text-sm">
              © 2025 twink.forsale • Made with AI assistance and lots of kawaii
              energy! ✨
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
});
