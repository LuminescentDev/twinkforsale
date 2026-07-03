import { $, component$, useSignal } from "@builder.io/qwik";
import { User } from "lucide-icons-qwik";
import { loginWithDiscord } from "~/lib/auth-client";

type LoginButtonProps = {
  class?: string;
  iconClass?: string;
  label?: string;
  loadingLabel?: string;
  returnTo?: string;
};

export const LoginButton = component$<LoginButtonProps>(
  ({
    class: className = "",
    iconClass = "h-4 w-4",
    label = "Sign In",
    loadingLabel = "Loading...",
    returnTo,
  }) => {
    const isLoading = useSignal(false);

    const handleClick = $(() => {
      if (isLoading.value) return;

      isLoading.value = true;

      setTimeout(() => {
        isLoading.value = false;
        loginWithDiscord(returnTo);
      }, 1000);
    });

    return (
      <button
        type="button"
        onClick$={handleClick}
        disabled={isLoading.value}
        aria-busy={isLoading.value}
        class={`${className} disabled:cursor-wait disabled:opacity-80`}
      >
        {isLoading.value ? (
          <span
            class={`${iconClass} inline-block animate-spin rounded-full border-2 border-current border-r-transparent`}
            aria-hidden="true"
          />
        ) : (
          <User class={iconClass} />
        )}
        {isLoading.value ? loadingLabel : label}
      </button>
    );
  },
);
