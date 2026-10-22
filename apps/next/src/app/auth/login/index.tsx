"use client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import AuthForm, { GOOGLE_CLIENT_ID, AuthPageProps } from "../auth";

export default function LoginPage({
  initialMode = "login",
  onSuccess,
}: AuthPageProps): React.JSX.Element {
  const content = <AuthForm initialMode={initialMode} onSuccess={onSuccess} />;
  if (onSuccess) return content; // dipake sebagai modal
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <main className="flex min-h-screen items-center justify-center p-4 bg-zinc-50">
        {content}
      </main>
    </GoogleOAuthProvider>
  );
}
