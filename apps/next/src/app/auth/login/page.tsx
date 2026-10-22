import { Suspense } from "react";
import LoginPage from "./index";
import { AuthFormSkeleton } from "../auth";

export default function Page(): React.JSX.Element {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <LoginPage initialMode="login" />
    </Suspense>
  );
}
