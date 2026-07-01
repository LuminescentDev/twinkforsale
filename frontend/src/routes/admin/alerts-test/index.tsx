import { component$ } from "@builder.io/qwik";
import { useAlert } from "~/lib/use-alert";

export default component$(() => {
  const { success, error, warning, info, confirm, confirmAsync } = useAlert();

  return (
    <div class="container mx-auto px-4 py-8">
      <div class="mx-auto max-w-4xl">
        <h1 class="text-theme-text-primary mb-8 text-3xl font-bold">
          🚨 Alert System Test
        </h1>

        <div class="glass border-theme-card-border mb-8 rounded-2xl border p-6">
          <h2 class="text-theme-text-primary mb-4 text-xl font-semibold">
            Test All Alert Types
          </h2>
          <p class="text-theme-text-secondary mb-6">
            Click the buttons below to test different alert types with the
            current theme.
          </p>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Success Alert */}
            <button
              onClick$={() =>
                success("Success! 🎉", "Your operation completed successfully!")
              }
              class="btn-cute bg-gradient-to-br from-theme-confirm to-theme-confirm-hover text-white transition-all duration-300 hover:scale-105"
            >
              Show Success
            </button>

            {/* Error Alert */}
            <button
              onClick$={() =>
                error("Error! ❌", "Something went wrong. Please try again.")
              }
              class="btn-cute bg-gradient-to-br from-theme-deny to-theme-deny-hover text-white transition-all duration-300 hover:scale-105"
            >
              Show Error
            </button>

            {/* Warning Alert */}
            <button
              onClick$={() =>
                warning(
                  "Warning! ⚠️",
                  "Please review your settings before continuing.",
                )
              }
              class="btn-cute bg-gradient-to-br from-theme-[#f59e0b] to-theme-[#d97706] text-white transition-all duration-300 hover:scale-105"
            >
              Show Warning
            </button>

            {/* Info Alert */}
            <button
              onClick$={() =>
                info("Info 💡", "Here's some helpful information for you.")
              }
              class="btn-cute bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary text-white transition-all duration-300 hover:scale-105"
            >
              Show Info
            </button>

            {/* Confirm Alert */}
            <button
              onClick$={() =>
                confirm(
                  "Confirm Action 💝",
                  "Are you sure you want to proceed?",
                  () => success("Confirmed! ✅", "You clicked confirm!"),
                  () => info("Cancelled 🚫", "You clicked cancel."),
                  "Yes, do it!",
                  "No, cancel",
                )
              }
              class="btn-cute bg-gradient-to-br from-theme-accent-tertiary to-theme-accent-quaternary text-white transition-all duration-300 hover:scale-105"
            >
              Show Confirm
            </button>

            {/* Async Confirm */}
            <button
              onClick$={async () => {
                const result = await confirmAsync(
                  "Async Confirm 🔄",
                  "This is a promise-based confirmation dialog.",
                );
                if (result) {
                  success(
                    "Promise Resolved! ✨",
                    "You confirmed the async dialog!",
                  );
                } else {
                  warning(
                    "Promise Rejected 😔",
                    "You cancelled the async dialog.",
                  );
                }
              }}
              class="btn-cute bg-gradient-to-br from-theme-accent-primary/20 to-theme-accent-secondary/20 text-white transition-all duration-300 hover:scale-105"
            >
              Async Confirm
            </button>
          </div>
        </div>

        {/* Long-duration alerts */}
        <div class="glass border-theme-card-border mb-8 rounded-2xl border p-6">
          <h2 class="text-theme-text-primary mb-4 text-xl font-semibold">
            Custom Duration Alerts
          </h2>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <button
              onClick$={() =>
                success(
                  "Quick Success! ⚡",
                  "This alert will disappear in 1 second.",
                  1000,
                )
              }
              class="btn-cute bg-gradient-to-br from-theme-confirm to-theme-confirm-hover text-white transition-all duration-300 hover:scale-105"
            >
              1 Second Alert
            </button>

            <button
              onClick$={() =>
                info(
                  "Persistent Info 📌",
                  "This alert will stay for 10 seconds.",
                  10000,
                )
              }
              class="btn-cute bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary text-white transition-all duration-300 hover:scale-105"
            >
              10 Second Alert
            </button>
          </div>
        </div>

        {/* Multiple alerts */}
        <div class="glass border-theme-card-border rounded-2xl border p-6">
          <h2 class="text-theme-text-primary mb-4 text-xl font-semibold">
            Multiple Alerts
          </h2>
          <button
            onClick$={() => {
              // Show multiple alerts with slight delays
              success("First Alert! 1️⃣", "This is the first alert.");
              setTimeout(() => {
                warning("Second Alert! 2️⃣", "This is the second alert.");
              }, 500);
              setTimeout(() => {
                info("Third Alert! 3️⃣", "This is the third alert.");
              }, 1000);
              setTimeout(() => {
                error("Fourth Alert! 4️⃣", "This is the fourth alert.");
              }, 1500);
            }}
            class="btn-cute bg-gradient-to-br from-theme-accent-primary/20 to-theme-accent-secondary/20 text-white transition-all duration-300 hover:scale-105"
          >
            Show Multiple Alerts
          </button>
        </div>

        <div class="mt-8 text-center">
          <p class="text-theme-text-muted text-sm">
            💡 Tip: Try switching themes to see how alerts adapt to different
            color schemes!
          </p>
        </div>
      </div>
    </div>
  );
});
