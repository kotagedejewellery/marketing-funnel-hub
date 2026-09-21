"use client";

import { useActionState } from "react";

import { FormFeedback } from "@/components/admin/admin-toast";
import {
  saveAdminProfile,
  type ProfileActionState,
} from "@/modules/admin/profiles/actions";

type Profile = {
  id: string;
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
  const idErrorId = `profile-id-error-${formId}`;
  const nameErrorId = `profile-name-error-${formId}`;
  const roleErrorId = `profile-role-error-${formId}`;

  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      {profile ? (
        <>
          <input type="hidden" name="id" value={profile.id} />
          <p className="break-all text-xs text-muted-foreground md:col-span-2">
            ID Auth: {profile.id}
          </p>
        </>
      ) : (
        <div className="grid gap-2 text-sm md:col-span-2">
          <label htmlFor={`profile-id-${formId}`} className="font-medium">
            ID pengguna Supabase Auth
          </label>
          <input
            id={`profile-id-${formId}`}
            required
            name="id"
            type="text"
            className={inputClass}
            placeholder="UUID pengguna"
            aria-invalid={Boolean(state.errors.id)}
            aria-describedby={state.errors.id ? idErrorId : undefined}
          />
          {state.errors.id && (
            <p id={idErrorId} className="text-destructive">
              {state.errors.id}
            </p>
          )}
        </div>
      )}
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
          aria-invalid={Boolean(state.errors.displayName)}
          aria-describedby={state.errors.displayName ? nameErrorId : undefined}
        />
        {state.errors.displayName && (
          <p id={nameErrorId} className="text-destructive">
            {state.errors.displayName}
          </p>
        )}
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
          aria-invalid={Boolean(state.errors.role)}
          aria-describedby={state.errors.role ? roleErrorId : undefined}
        >
          <option value="admin">Admin</option>
          <option value="technical_admin">Technical admin</option>
        </select>
        {state.errors.role && (
          <p id={roleErrorId} className="text-destructive">
            {state.errors.role}
          </p>
        )}
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
            : "Simpan profil"}
      </button>
    </form>
  );
}
