"use client";

import { useActionState } from "react";

import { FormFeedback } from "@/components/admin/admin-toast";
import {
  saveAdminProfile,
  type ProfileActionState,
} from "@/modules/admin/profiles/actions";

type Profile = {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  isActive: boolean;
};

const initialState: ProfileActionState = { message: "", errors: {} };
const inputClass =
  "min-h-11 border border-border bg-background px-3 font-normal focus-visible:outline-2 focus-visible:outline-offset-2";

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const [state, action, pending] = useActionState(
    saveAdminProfile,
    initialState,
  );
  const formId = profile?.id ?? "new";
  const fieldError = (field: string) => `profile-${field}-error-${formId}`;

  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      {profile && <input type="hidden" name="id" value={profile.id} />}
      <div className="grid gap-2 text-sm">
        <label htmlFor={`profile-email-${formId}`} className="font-medium">
          Email
        </label>
        <input
          id={`profile-email-${formId}`}
          required
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={profile?.email ?? ""}
          className={inputClass}
          aria-invalid={Boolean(state.errors.email)}
          aria-describedby={
            state.errors.email ? fieldError("email") : undefined
          }
        />
        {state.errors.email && (
          <p id={fieldError("email")} className="text-destructive">
            {state.errors.email}
          </p>
        )}
      </div>
      <div className="grid gap-2 text-sm">
        <label htmlFor={`profile-password-${formId}`} className="font-medium">
          {profile ? "Kata sandi baru" : "Kata sandi"}
        </label>
        <input
          id={`profile-password-${formId}`}
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={profile ? undefined : 12}
          required={!profile}
          className={inputClass}
          aria-invalid={Boolean(state.errors.password)}
          aria-describedby={
            state.errors.password ? fieldError("password") : undefined
          }
        />
        <p className="text-xs text-muted-foreground">
          {profile
            ? "Kosongkan bila kata sandi tidak diubah."
            : "Minimal 12 karakter."}
        </p>
        {state.errors.password && (
          <p id={fieldError("password")} className="text-destructive">
            {state.errors.password}
          </p>
        )}
      </div>
      <div className="grid gap-2 text-sm">
        <label htmlFor={`profile-name-${formId}`} className="font-medium">
          Nama tampilan
        </label>
        <input
          id={`profile-name-${formId}`}
          name="displayName"
          defaultValue={profile?.displayName ?? ""}
          maxLength={120}
          className={inputClass}
        />
      </div>
      <div className="grid gap-2 text-sm">
        <label htmlFor={`profile-role-${formId}`} className="font-medium">
          Peran
        </label>
        <select
          id={`profile-role-${formId}`}
          name="role"
          defaultValue={profile?.role ?? "admin"}
          className={inputClass}
        >
          <option value="admin">Admin</option>
          <option value="technical_admin">Technical admin</option>
        </select>
      </div>
      <label className="flex min-h-11 items-center gap-3 text-sm md:col-span-2">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={profile?.isActive ?? true}
          className="size-5"
        />
        Aktif
      </label>
      <FormFeedback state={state} pending={pending} />
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending || undefined}
        className={
          profile
            ? "min-h-11 border border-border px-5 font-medium hover:bg-secondary disabled:opacity-50 md:justify-self-end"
            : "min-h-11 bg-primary px-5 font-medium text-primary-foreground disabled:opacity-50 md:justify-self-start"
        }
      >
        {pending
          ? "Menyimpan..."
          : profile
            ? "Simpan perubahan"
            : "Buat profil admin"}
      </button>
    </form>
  );
}
