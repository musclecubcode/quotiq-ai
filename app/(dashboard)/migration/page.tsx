import { PageHeader } from "@/components/ui/PageHeader";
import { BrowserDataMigration } from "@/components/migration/BrowserDataMigration";

export default function MigrationPage() {
  return <div><PageHeader title="Cloud data migration" description="Move this browser’s Quotiq records into your private company workspace without deleting the local copy." /><div className="max-w-3xl"><BrowserDataMigration /></div></div>;
}
