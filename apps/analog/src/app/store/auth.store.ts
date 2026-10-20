import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { tapResponse } from "@ngrx/operators";
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { pipe, switchMap, tap } from "rxjs";
import { AuthService, extractError } from "../services/auth.service";

type AuthState = {
  isLoading: boolean;
  error: string | null;
};

const initialState: AuthState = {
  isLoading: false,
  error: null,
};

export const AuthStore = signalStore(
  { providedIn: "root" },
  withState(initialState),
  withMethods((store, auth = inject(AuthService), router = inject(Router)) => ({
    login: rxMethod<Parameters<AuthService["login"]>[0]>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((credentials) =>
          auth.login(credentials).pipe(
            tapResponse({
              next: () => {
                patchState(store, { isLoading: false });
                void router.navigateByUrl("/home");
              },
              error: (err) => {
                patchState(store, {
                  isLoading: false,
                  error: extractError(err),
                });
              },
            }),
          ),
        ),
      ),
    ),
  })),
);
