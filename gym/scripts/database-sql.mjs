import { readFileSync } from "node:fs";
// Print a single atomic fresh-install script. No database connection or data deletion.
const files = [
  "01_tables.sql",
  "02_views.sql",
  "03_functions.sql",
  "04_triggers.sql",
  "05_security.sql",
  "06_storage.sql",
];
process.stdout.write("begin;\n\n");
for (const file of files)
  process.stdout.write(
    readFileSync(new URL("../supabase/" + file, import.meta.url), "utf8") +
      "\n",
  );
process.stdout.write("notify pgrst, 'reload schema';\ncommit;\n");
