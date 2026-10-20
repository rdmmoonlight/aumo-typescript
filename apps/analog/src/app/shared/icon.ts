import { Component, input } from "@angular/core";

export type IconName = "home" | "calendar" | "list" | "book";

@Component({
  selector: "app-icon",
  template: `
    <svg
      class="size-5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @switch (name()) {
        @case ("home") {
          <path d="m3 11 9-8 9 8" />
          <path d="M5 10v10h14V10" />
        }
        @case ("calendar") {
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        }
        @case ("list") {
          <path d="M4 6h16M4 12h16M4 18h10" />
        }
        @case ("book") {
          <path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z" />
          <path d="M8 9h8M8 13h6" />
        }
      }
    </svg>
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
}
