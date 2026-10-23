"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { store } from "@/lib/store";
import { settingsApi } from "@/lib/store/(authenticated)/settings/settingsApi";
import { AlertTriangle, CheckCircle2, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";

interface ApiCustomError {
  data?: { message?: string };
}

export function SecuritySection() {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const notify = (msg: string, isErr = false) => {
    if (isErr) {
      setError(msg);
      setSuccess(null);
    } else {
      setSuccess(msg);
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword || !newPassword) {
      return notify("Semua field wajib diisi", true);
    }
    if (newPassword.length < 8) {
      return notify("Password baru minimal 8 karakter", true);
    }
    if (newPassword !== confirmPassword) {
      return notify("Konfirmasi password tidak cocok", true);
    }

    setIsSubmitting(true);
    try {
      const result = await store.dispatch(
        settingsApi.endpoints.changePassword.initiate({
          currentPassword,
          newPassword,
        })
      );

      if ("data" in result) {
        notify("Password berhasil diubah");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        throw result.error;
      }
    } catch (err) {
      const e = err as ApiCustomError;
      notify(e?.data?.message || "Gagal mengubah password", true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      {success && (
        <Alert className="py-2 bg-emerald-500/10 border-emerald-500/20 text-emerald-600">
          <CheckCircle2 size={16} />
          <AlertDescription className="text-sm">{success}</AlertDescription>
        </Alert>
      )}
      {(error) && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle size={16} />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <KeyRound size={16} /> Ubah Password
          </CardTitle>
          <CardDescription className="text-xs">
            Pastikan menggunakan password yang kuat dan belum pernah dipakai di tempat lain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="current" className="text-xs">Password Saat Ini</Label>
              <Input
                id="current"
                type="password"
                className="h-8 text-sm"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="new" className="text-xs">Password Baru</Label>
                <Input
                  id="new"
                  type="password"
                  className="h-8 text-sm"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm" className="text-xs">Konfirmasi Password</Label>
                <Input
                  id="confirm"
                  type="password"
                  className="h-8 text-sm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                />
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <Button type="submit" size="sm" className="h-8 text-xs" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                Simpan Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck size={16} /> Keamanan Akun
          </CardTitle>
          <CardDescription className="text-xs">
            Tips untuk menjaga akun tetap aman.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>• Jangan bagikan password ke siapapun.</p>
          <p>• Aktifkan 2FA nanti di menu authenticator kalau sudah ready.</p>
          <p>• Logout dari device yang tidak dikenali secara berkala.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default SecuritySection;