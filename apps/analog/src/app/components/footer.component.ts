import { Component } from "@angular/core";

@Component({
  selector: "app-footer",
  standalone: true,
  template: `
    <footer
      class="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
    >
      &copy; {{ year }} Aumo Finance. Seluruh hak dilindungi.
    </footer>
  `,
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
}
