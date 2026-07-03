import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { getInitials } from "@/lib/utils";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

const team = [
  { name: "Ray Delgado", role: "Owner" },
  { name: "J. Alvarez", role: "Lead Carpenter" },
  { name: "M. Sato", role: "Site Foreman" },
  { name: "R. Kim", role: "Electrician" },
  { name: "K. Diaz", role: "Finish Carpenter" },
  { name: "T. Nguyen", role: "Flooring Specialist" },
];

function Toggle({ label, description, defaultChecked = false }: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-start justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span
        className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-slate-200 transition-colors before:absolute before:left-0.5 before:h-5 before:w-5 before:rounded-full before:bg-white before:shadow before:transition-transform peer-checked:bg-blue-600 peer-checked:before:translate-x-5"
        aria-hidden
      />
    </label>
  );
}

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Manage your company profile, team, and notification preferences."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Company Profile"
            description="This information appears on estimates and invoices"
          />
          <form className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="company-name">
                Company name
              </label>
              <input
                id="company-name"
                className={inputClass}
                defaultValue="Delgado Builders"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="license">
                License number
              </label>
              <input
                id="license"
                className={inputClass}
                defaultValue="TX-GC-48213"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="email">
                Contact email
              </label>
              <input
                id="email"
                type="email"
                className={inputClass}
                defaultValue="ray@delgadobuilders.com"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="phone">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                className={inputClass}
                defaultValue="(512) 555-0102"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="address">
                Business address
              </label>
              <input
                id="address"
                className={inputClass}
                defaultValue="1220 S Congress Ave, Austin, TX 78704"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="markup">
                Default markup (%)
              </label>
              <input
                id="markup"
                type="number"
                className={inputClass}
                defaultValue={18}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="tax-rate">
                Sales tax rate (%)
              </label>
              <input
                id="tax-rate"
                type="number"
                className={inputClass}
                defaultValue={8.25}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="button" className="mt-2 w-fit">
                Save changes
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader title="Team" description={`${team.length} active members`} />
          <ul className="divide-y divide-slate-100">
            {team.map((member) => (
              <li key={member.name} className="flex items-center gap-3 px-5 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                  {getInitials(member.name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {member.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">{member.role}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Notifications"
          description="Choose when Quotiq AI should keep you in the loop"
        />
        <div className="divide-y divide-slate-100 px-5">
          <Toggle
            label="Estimate approved"
            description="Email me as soon as a client approves an estimate"
            defaultChecked
          />
          <Toggle
            label="Invoice overdue"
            description="Email me when an invoice passes its due date"
            defaultChecked
          />
          <Toggle
            label="Job starting soon"
            description="Text reminders 24 hours before a scheduled job starts"
          />
        </div>
      </Card>
    </div>
  );
}
