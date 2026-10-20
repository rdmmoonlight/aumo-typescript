import { Component, input } from "@angular/core";

@Component({
  selector: "app-logo",
  template: `
    <span class="inline-flex items-center gap-2">
      <span
        class="flex size-8 items-center justify-center rounded-lg bg-brand-700 text-sm font-bold text-white"
        >A</span
      >
      <span
        class="text-base font-bold tracking-tight"
        [class.text-white]="light()"
        >Aumo Finance</span
      >
    </span>
  `,
})
export class Logo {
  readonly light = input(false);
}
