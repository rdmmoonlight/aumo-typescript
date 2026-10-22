import { Suspense } from "react";
import RegisterPage from "./index";
import { AuthFormSkeleton } from "../auth";

export default function Page(): React.JSX.Element {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <RegisterPage initialMode="register" />
    </Suspense>
  );
}
