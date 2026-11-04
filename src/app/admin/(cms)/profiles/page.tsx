import { asc } from "drizzle-orm";

import { ProfileForm } from "@/components/admin/profile-form";
import { FormDialog } from "@/components/admin/form-dialog";
import { getDatabase } from "@/lib/db/client";
import { adminProfiles } from "@/lib/db/schema";
import { requireTechnicalAdmin } from "@/modules/admin/access";

export default async function ProfilesPage() {
  await requireTechnicalAdmin();
  const profiles = await getDatabase()
    .select({
      id: adminProfiles.id,
      email: adminProfiles.email,
      displayName: adminProfiles.displayName,
      role: adminProfiles.role,
      isActive: adminProfiles.isActive,
    })
    .from(adminProfiles)
    .orderBy(asc(adminProfiles.createdAt));

  return (
    <div>
      <h1 className="font-serif text-4xl">Profil admin</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Kelola akun CMS internal di sini. Menonaktifkan profil langsung
        menghentikan akses akun tanpa menghapus histori konten.
      </p>

      <div className="mt-8">
        <FormDialog
          title="Buat profil admin"
          triggerLabel="Tambah profil admin"
          primary
        >
          <p className="mb-6 text-sm leading-6 text-muted-foreground">
            Tetapkan email, peran, dan kata sandi untuk akun CMS baru.
          </p>
          <ProfileForm profile={null} />
        </FormDialog>
      </div>

      <section className="mt-10" aria-labelledby="existing-profiles-heading">
        <h2 id="existing-profiles-heading" className="font-serif text-2xl">
          Profil yang ada
        </h2>
        <ul className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {profiles.map((profile) => (
            <li key={profile.id} className="rounded-2xl bg-card p-6">
              <p className="break-words font-semibold">
                {profile.displayName || "Tanpa nama tampilan"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {profile.role === "technical_admin"
                  ? "Technical admin"
                  : "Admin"}{" "}
                · {profile.isActive ? "Aktif" : "Nonaktif"}
              </p>
              <p className="mt-2 break-all text-xs text-muted-foreground">
                {profile.email}
              </p>
              <div className="mt-6">
                <FormDialog
                  title={`Edit ${profile.displayName || "profil admin"}`}
                  triggerLabel="Edit profil"
                >
                  <ProfileForm profile={profile} />
                </FormDialog>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
