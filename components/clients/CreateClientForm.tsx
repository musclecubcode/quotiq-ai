"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, inputClass } from "@/components/ui/Field";
import { useClients } from "@/lib/client-storage";
import { US_STATES } from "@/lib/us-states";

export function CreateClientForm() {
  const router = useRouter();
  const { addClient } = useClients();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const get = (key: string) => String(data.get(key) ?? "").trim();

    const firstName = get("firstName");
    const lastName = get("lastName");
    const phone = get("phone");
    const email = get("email");
    const address = get("address");
    const city = get("city");
    const state = get("state");
    const zip = get("zip");
    const company = get("company");
    const notes = get("notes");

    if (!firstName || !lastName || !phone || !email || !address || !city || !state || !zip) {
      setError("Please fill in all required fields.");
      return;
    }

    const client = addClient({
      firstName,
      lastName,
      phone,
      email,
      address,
      city,
      state,
      zip,
      company: company || undefined,
      notes: notes || undefined,
    });

    router.push(`/clients/${client.id}`);
  }

  return (
    <Card className="p-5 sm:p-6">
      <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="First Name" htmlFor="firstName">
          <input id="firstName" name="firstName" className={inputClass} required />
        </Field>
        <Field label="Last Name" htmlFor="lastName">
          <input id="lastName" name="lastName" className={inputClass} required />
        </Field>
        <Field label="Company (optional)" htmlFor="company">
          <input id="company" name="company" className={inputClass} />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <input id="phone" name="phone" type="tel" className={inputClass} required />
        </Field>
        <Field label="Email" htmlFor="email" className="sm:col-span-2">
          <input id="email" name="email" type="email" className={inputClass} required />
        </Field>
        <Field label="Address" htmlFor="address" className="sm:col-span-2">
          <input id="address" name="address" className={inputClass} required />
        </Field>
        <Field label="City" htmlFor="city">
          <input id="city" name="city" className={inputClass} required />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="State" htmlFor="state">
            <select id="state" name="state" defaultValue="" className={inputClass} required>
              <option value="" disabled>
                Select
              </option>
              {US_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ZIP Code" htmlFor="zip">
            <input
              id="zip"
              name="zip"
              inputMode="numeric"
              pattern="\d{5}"
              className={inputClass}
              required
            />
          </Field>
        </div>
        <Field label="Notes (optional)" htmlFor="notes" className="sm:col-span-2">
          <textarea
            id="notes"
            name="notes"
            rows={4}
            className={inputClass}
            placeholder="Anything worth remembering about this client…"
          />
        </Field>

        {error && (
          <p role="alert" className="text-sm text-red-600 sm:col-span-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 sm:col-span-2">
          <Button type="submit">Create Client</Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/clients")}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
