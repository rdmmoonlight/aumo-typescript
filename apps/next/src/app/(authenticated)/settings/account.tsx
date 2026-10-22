"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { AppDispatch } from "@/lib/store";
import { settingsApi } from "@/lib/store/(authenticated)/settings/settingsApi";
import { authApi } from "@/lib/store/auth/authApi";
import {
  AlertTriangle,
  CheckCircle2,
  Key,
  Loader2,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { AccountDetailsTable, UserProfileField } from "./account-table";

export default function AccountSettings() {
  const dispatch = useDispatch<AppDispatch>();

  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changing, setChanging] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [fullName, setFullName] = useState("");
  const [userName, setUserName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load Profil Pengguna via RTK Query Dispatch
  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await dispatch(
        authApi.endpoints.getProfile.initiate(),
      ).unwrap();
      const userData = res?.data || res;
      setUser(userData);
      if (userData) {
        setFullName(userData.fullName || "");
        setUserName(userData.userName || "");
        setPhoneNumber(userData.phoneNumber || "");
        setBio(userData.bio || "");
        setAvatarPreview(userData.avatarUrl || null);
      }
    } catch (err: any) {
      notify(err?.data?.message || "Gagal memuat profil pengguna", true);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const profileSummaryData = useMemo<UserProfileField[]>(
    () => [
      { label: "Full Name", value: user?.fullName || "", status: "Editable" },
      { label: "Username", value: user?.userName || "", status: "Editable" },
      { label: "Email Address", value: user?.email || "", status: "Verified" },
      {
        label: "Phone Number",
        value: user?.phoneNumber || "",
        status: "Editable",
      },
    ],
    [user],
  );

  const notify = (m: string, e = false) => {
    if (e) {
      setError(m);
      setSuccess(null);
    } else {
      setSuccess(m);
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dispatch(
        settingsApi.endpoints.updateProfile.initiate({
          fullName,
          userName,
          phoneNumber,
          bio,
        }),
      ).unwrap();
      notify("Profile updated!");
      fetchProfile();
    } catch (err: any) {
      notify(err?.data?.message || "Gagal update profile", true);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return notify("Max 2MB", true);

    const blobUrl = URL.createObjectURL(file);
    setAvatarPreview(blobUrl);

    const fd = new FormData();
    fd.append("file", file);

    setUploading(true);
    try {
      const res: any = await dispatch(
        settingsApi.endpoints.uploadAvatar.initiate(fd),
      ).unwrap();
      const newUrl = res?.avatarUrl || res?.data?.avatarUrl || res?.url;
      if (newUrl) setAvatarPreview(newUrl);
      notify("Avatar berhasil diunggah!");
      fetchProfile();
    } catch (err: any) {
      notify(
        err?.data?.message || err?.data?.errors?.file?.[0] || "Gagal upload",
        true,
      );
      setAvatarPreview(user?.avatarUrl || null);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChanging(true);
    try {
      await dispatch(
        settingsApi.endpoints.changePassword.initiate({
          currentPassword,
          newPassword,
        }),
      ).unwrap();
      notify("Password updated!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      notify(err?.data?.message || "Gagal mengubah password", true);
    } finally {
      setChanging(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Hapus permanen akun Anda?")) return;
    setDeleting(true);
    try {
      await dispatch(settingsApi.endpoints.deleteAccount.initiate()).unwrap();
      window.location.href = "/auth";
    } catch (err: any) {
      notify(err?.data?.message || "Gagal menghapus akun", true);
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-caption py-10 flex items-center gap-2">
        <Loader2 className="animate-spin" size={16} /> Loading...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {success && (
        <Alert className="py-2 bg-emerald-500/10 text-emerald-600 text-ui">
          <CheckCircle2 size={14} />
          <AlertDescription className="text-caption">
            {success}
          </AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="py-2 text-ui">
          <AlertTriangle size={14} />
          <AlertDescription className="text-caption">{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="py-3 px-4 flex-row items-center justify-between border-b space-y-0">
          <div>
            <CardTitle className="text-ui flex items-center gap-2">
              <ShieldCheck size={16} className="text-primary" /> Ringkasan
              Status Akun
            </CardTitle>
            <CardDescription className="text-caption">
              Status kredensial pengguna aktif dari `/auth/me`
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <AccountDetailsTable data={profileSummaryData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-ui">Edit Profile</CardTitle>
          <CardDescription className="text-caption">
            Perbarui informasi profil pribadi Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border">
              <AvatarImage src={avatarPreview || undefined} />
              <AvatarFallback className="text-ui">
                {(fullName || "U").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <input
                type="file"
                ref={fileRef}
                onChange={handleAvatar}
                accept=".jpg,.jpeg,.png,.webp,.gif"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-caption"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 size={13} className="animate-spin mr-1" />
                ) : (
                  <Upload size={13} className="mr-1" />
                )}
                Change Avatar
              </Button>
            </div>
          </div>
          <Separator />
          <form
            onSubmit={handleProfile}
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            <div className="space-y-1">
              <Label className="text-caption">Full Name</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-8 text-caption"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-caption">Username</Label>
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="h-8 text-caption"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-caption">Email</Label>
              <Input
                value={user?.email || ""}
                disabled
                className="h-8 text-caption bg-muted/50"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-caption">Phone</Label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-8 text-caption"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-caption">Bio</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="text-caption"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button size="sm" className="h-8 text-caption" disabled={saving}>
                {saving && <Loader2 size={13} className="animate-spin mr-1" />}
                Save
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-ui flex gap-2">
            <Key size={15} /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <form onSubmit={handlePassword} className="space-y-3 max-w-md">
            <Input
              type="password"
              placeholder="Current"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="h-8 text-caption"
            />
            <Input
              type="password"
              placeholder="New"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-8 text-caption"
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-caption"
              disabled={changing}
            >
              {changing && <Loader2 size={13} className="animate-spin mr-1" />}
              Update
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-ui text-destructive flex gap-2">
            <Trash2 size={15} /> Delete Account
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 flex justify-end">
          <Button
            variant="destructive"
            size="sm"
            className="h-8 text-caption"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting && <Loader2 size={13} className="animate-spin mr-1" />}
            Delete
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
