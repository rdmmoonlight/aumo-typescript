import { provideFileRouter, withExtraRoutes } from "@analogjs/router";
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from "@angular/common/http";
import { ApplicationConfig } from "@angular/core";

import { authInterceptor } from "./interceptors/auth.interceptor";
import { routes } from "./routes";

export const appConfig: ApplicationConfig = {
  providers: [
    provideFileRouter(withExtraRoutes(routes)),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
  ],
};
