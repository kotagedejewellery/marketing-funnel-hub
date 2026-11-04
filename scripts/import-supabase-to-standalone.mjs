import postgres from "postgres";

const applicationTables = [
  "admin_profiles",
  "branches",
  "products",
  "content_sections",
  "campaigns",
  "product_branches",
  "links",
  "faqs",
  "gallery_items",
  "branch_review_sources",
  "branch_google_reviews",
  "branch_meta_tracking_configs",
  "site_settings",
  "events",
  "audit_logs",
];
const mediaColumns = ["logo_path", "banner_path", "image_path"];
const importBatchSize = 100;
const primaryKeyColumns = {
  branch_meta_tracking_configs: ["branch_id"],
};

function fail(message) {
  throw new Error(message);
}

function identifier(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

function databaseUrl(name) {
  const value = process.env[name];
  if (!value) fail(`${name} belum diatur.`);
  let url;
  try {
    url = new URL(value);
  } catch {
    fail(`${name} tidak valid.`);
  }
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.username ||
    !url.password
  ) {
    fail(`${name} harus berupa URL PostgreSQL dengan user dan password.`);
  }
  return url;
}

function configuration() {
  if (
    process.env.CUTOVER_CONFIRMATION !== "IMPORT_SOURCE_DATA_WITHOUT_DELETION"
  ) {
    fail(
      "CUTOVER_CONFIRMATION harus bernilai IMPORT_SOURCE_DATA_WITHOUT_DELETION.",
    );
  }
  if (process.env.MEDIA_COPY_VERIFIED !== "true") {
    fail(
      "MEDIA_COPY_VERIFIED=true diperlukan setelah manifest media selesai diverifikasi.",
    );
  }

  const source = databaseUrl("SOURCE_DATABASE_URL");
  const target = databaseUrl("DATABASE_LIVE_MIGRATION_URL");
  if (
    target.hostname !== "db" ||
    target.port !== "5432" ||
    target.pathname !== "/kgj" ||
    target.username !== "postgres" ||
    (target.searchParams.get("sslmode") &&
      target.searchParams.get("sslmode") !== "disable")
  ) {
    fail(
      "DATABASE_LIVE_MIGRATION_URL harus menunjuk ke owner database internal db:5432/kgj tanpa TLS.",
    );
  }
  if (source.toString() === target.toString()) {
    fail("SOURCE_DATABASE_URL tidak boleh menunjuk ke target standalone.");
  }
  return { source, target };
}

function sslFor(url) {
  return url.searchParams.get("sslmode") === "disable" ? false : "require";
}

async function columns(sql, schema, table) {
  const rows = await sql`
    select column_name
    from information_schema.columns
    where table_schema = ${schema}
      and table_name = ${table}
    order by ordinal_position
  `;
  return rows.map((row) => row.column_name);
}

async function rowCount(sql, table) {
  const [row] = await sql.unsafe(
    `select count(*)::int as count from public.${identifier(table)}`,
  );
  return row.count;
}

function insertQuery(table, columnNames, rows, conflictColumns = ["id"]) {
  const values = [];
  const tuples = rows.map((row) => {
    const placeholders = columnNames.map((columnName) => {
      values.push(row[columnName]);
      return `$${values.length}`;
    });
    return `(${placeholders.join(", ")})`;
  });
  const updates = columnNames
    .filter((columnName) => !conflictColumns.includes(columnName))
    .map(
      (columnName) =>
        `${identifier(columnName)} = excluded.${identifier(columnName)}`,
    );
  const conflict = updates.length
    ? `on conflict (${conflictColumns.map(identifier).join(", ")}) do update set ${updates.join(", ")}`
    : `on conflict (${conflictColumns.map(identifier).join(", ")}) do nothing`;
  return {
    query: `insert into public.${identifier(table)} (${columnNames.map(identifier).join(", ")}) values ${tuples.join(", ")} ${conflict}`,
    values,
  };
}

function primaryKeyFor(table) {
  return primaryKeyColumns[table] ?? ["id"];
}

async function upsertByPrimaryKey(sql, table, rows, columnNames) {
  for (let index = 0; index < rows.length; index += importBatchSize) {
    const batch = rows.slice(index, index + importBatchSize);
    const { query, values } = insertQuery(
      table,
      columnNames,
      batch,
      primaryKeyFor(table),
    );
    await sql.unsafe(query, values);
  }
}

async function upsertContentSections(sql, rows, columnNames) {
  const writableColumns = columnNames.filter(
    (columnName) => columnName !== "id",
  );
  for (const row of rows) {
    const [existing] = await sql.unsafe(
      `select id from public.content_sections where branch_id is not distinct from $1 and section_key = $2`,
      [row.branch_id, row.section_key],
    );
    if (!existing) {
      const { query, values } = insertQuery("content_sections", columnNames, [
        row,
      ]);
      await sql.unsafe(query, values);
      continue;
    }
    const values = writableColumns.map((columnName) => row[columnName]);
    const assignments = writableColumns.map(
      (columnName, index) => `${identifier(columnName)} = $${index + 1}`,
    );
    await sql.unsafe(
      `update public.content_sections set ${assignments.join(", ")} where id = $${values.length + 1}`,
      [...values, existing.id],
    );
  }
}

function rowsForTarget(rows, targetColumns) {
  if (rows.length === 0) return { rows, columns: [] };
  const sourceColumns = new Set(Object.keys(rows[0]));
  const sharedColumns = targetColumns.filter((columnName) =>
    sourceColumns.has(columnName),
  );
  return {
    rows: rows.map((row) =>
      Object.fromEntries(
        sharedColumns.map((columnName) => [columnName, row[columnName]]),
      ),
    ),
    columns: sharedColumns,
  };
}

function assertRelativeMediaPaths(table, rows) {
  for (const row of rows) {
    for (const columnName of mediaColumns) {
      const value = row[columnName];
      if (typeof value === "string" && value.includes("://")) {
        fail(
          `${table}.${columnName} berisi URL lama. Transformasikan ke path relatif sebelum import.`,
        );
      }
    }
  }
}

async function sourceSnapshot(source) {
  const data = {};
  for (const table of applicationTables) {
    const rows = await source.unsafe(
      `select * from public.${identifier(table)}`,
    );
    assertRelativeMediaPaths(table, rows);
    data[table] = rows;
  }
  const users = await source`select id, email from auth.users`;
  const emails = new Map(
    users.map((user) => [user.id, user.email?.toLowerCase()]),
  );
  data.admin_profiles = data.admin_profiles.map((profile) => {
    const email = emails.get(profile.id);
    if (!email)
      fail(`admin_profiles ${profile.id} tidak memiliki email auth.users.`);
    return { ...profile, email, password_hash: null };
  });
  return data;
}

async function assertEmptyImportTarget(target) {
  const existingTables = [...applicationTables, "admin_sessions"];
  for (const table of existingTables) {
    const count = await rowCount(target, table);
    const allowed =
      table === "site_settings" ? 1 : table === "content_sections" ? 10 : 0;
    if (count !== allowed) {
      fail(
        `target ${table} berisi ${count} baris; import hanya boleh ke baseline baru tanpa data impor.`,
      );
    }
  }
}

async function assertBaselineCanBeReplaced(target, source) {
  if (source.site_settings.length !== 1) {
    fail("source harus memiliki tepat satu site_settings sebelum import.");
  }
  const seedRows = await target`
    select section_key
    from public.content_sections
    where branch_id is null
  `;
  const sourceGlobalKeys = new Set(
    source.content_sections
      .filter((row) => row.branch_id === null)
      .map((row) => row.section_key),
  );
  if (seedRows.some((row) => !sourceGlobalKeys.has(row.section_key))) {
    fail(
      "source tidak memiliki seluruh section global baseline; hentikan untuk mencegah konfigurasi baru tertinggal.",
    );
  }
}

async function verifyCounts(target, source) {
  for (const table of applicationTables) {
    const count = await rowCount(target, table);
    if (count !== source[table].length) {
      fail(
        `jumlah baris target ${table} (${count}) tidak sama dengan source (${source[table].length}).`,
      );
    }
  }
  if ((await rowCount(target, "admin_sessions")) !== 0) {
    fail("admin_sessions target harus kosong setelah import.");
  }
}

async function main() {
  const { source: sourceUrl, target: targetUrl } = configuration();
  const source = postgres(sourceUrl.toString(), {
    max: 1,
    ssl: sslFor(sourceUrl),
  });
  const target = postgres(targetUrl.toString(), { max: 1, ssl: false });
  try {
    await source`set default_transaction_read_only = on`;
    const sourceData = await sourceSnapshot(source);
    const targetColumns = Object.fromEntries(
      await Promise.all(
        applicationTables.map(async (table) => [
          table,
          await columns(target, "public", table),
        ]),
      ),
    );
    for (const table of applicationTables) {
      const primaryKey = primaryKeyFor(table);
      if (
        !primaryKey.every((columnName) =>
          targetColumns[table].includes(columnName),
        )
      ) {
        fail(
          `target tidak memiliki primary key ${primaryKey.join(", ")} pada ${table}.`,
        );
      }
    }

    await target.begin(async (transaction) => {
      await assertEmptyImportTarget(transaction);
      await assertBaselineCanBeReplaced(transaction, sourceData);
      for (const table of applicationTables) {
        const mapped = rowsForTarget(sourceData[table], targetColumns[table]);
        if (mapped.rows.length === 0) continue;
        if (table === "content_sections") {
          await upsertContentSections(transaction, mapped.rows, mapped.columns);
        } else {
          await upsertByPrimaryKey(
            transaction,
            table,
            mapped.rows,
            mapped.columns,
          );
        }
      }
      await verifyCounts(transaction, sourceData);
    });
    console.log("Import source selesai tanpa penghapusan data.");
  } finally {
    await Promise.all([source.end({ timeout: 5 }), target.end({ timeout: 5 })]);
  }
}

main().catch((error) => {
  console.error(`Import dibatalkan: ${error.message}`);
  process.exit(1);
});
