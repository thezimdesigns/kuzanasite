"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { submitExhibitorRegistration } from "@/app/actions/public";
import { ActionForm } from "@/components/action-form";
import { Uploader, type UploadedFile } from "@/components/uploader";
import { Alert, Button, Card, Checkbox, cn, Field, Input, Select, Textarea } from "@/components/ui";
import { OPPORTUNITIES } from "@/lib/options";
import type { ExhibitorMediaKind } from "@/lib/generated/prisma/enums";

const DRAFT_KEY = "kuzana.exhibitorDraft";

const STEPS = ["Organisation", "About", "Stand photos", "Materials", "Links", "Opportunities", "Confirm"];

type Media = UploadedFile & { kind: ExhibitorMediaKind };

export function ExhibitorRegistrationForm({ sectors, code }: { sectors: { id: string; name: string }[]; code: string }) {
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState("");
  const [media, setMedia] = useState<Record<string, Media[]>>({});
  const formRef = useRef<HTMLDivElement>(null);

  const allMedia = Object.values(media).flat();
  const setGroup = (group: string, kind: ExhibitorMediaKind) => (files: UploadedFile[]) =>
    setMedia((m) => ({ ...m, [group]: files.map((f) => ({ ...f, kind })) }));

  // Restore and save a draft of typed answers so a dropped connection loses nothing.
  useEffect(() => {
    const form = formRef.current?.closest("form");
    if (!form) return;
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "{}") as Record<string, string | string[]>;
      for (const [name, value] of Object.entries(draft)) {
        const els = form.querySelectorAll<HTMLInputElement>(`[name="${CSS.escape(name)}"]`);
        els.forEach((el) => {
          if (el.type === "checkbox") el.checked = Array.isArray(value) ? value.includes(el.value) : value === "on";
          else if (typeof value === "string") el.value = value;
        });
      }
    } catch {}
    const save = () => {
      const data: Record<string, string | string[]> = {};
      const fd = new FormData(form);
      for (const key of new Set(fd.keys())) {
        if (["media", "code", "recaptchaToken", "website_url", "consent"].includes(key)) continue;
        const all = fd.getAll(key).map(String);
        data[key] = key === "opportunities" ? all : all[0];
      }
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      } catch {}
    };
    form.addEventListener("input", save);
    return () => form.removeEventListener("input", save);
  }, []);

  function validateStep(): boolean {
    const form = formRef.current?.closest("form");
    if (!form) return true;
    if (step === 0) {
      const fd = new FormData(form);
      const missing = ["name", "contactName", "phone", "categoryId"].filter((k) => !String(fd.get(k) ?? "").trim());
      if (missing.length) {
        setStepError("Please fill in the organisation name, contact person, mobile number and sector.");
        (form.querySelector(`[name="${missing[0]}"]`) as HTMLElement | null)?.focus();
        return false;
      }
    }
    if (step === 2 && !allMedia.some((m) => m.kind === "BOOTH")) {
      setStepError("Please add at least one photo of your stand.");
      return false;
    }
    setStepError("");
    return true;
  }

  function go(delta: number) {
    if (delta > 0 && !validateStep()) return;
    setStep((s) => Math.min(STEPS.length - 1, Math.max(0, s + delta)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <ActionForm
      action={submitExhibitorRegistration}
      recaptchaAction="exhibitor"
      onSuccess={() => {
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {}
      }}
      success={(s) => (
        <Card className="p-6 text-center">
          <CheckCircle2 className="mx-auto mb-3 size-12 text-green-800" />
          <p className="font-heading text-xl font-bold text-green-900">Stand registered</p>
          <p className="mt-2 text-muted">{s.message}</p>
        </Card>
      )}
    >
      {(state, pending) => (
        <div ref={formRef}>
          <JumpToError errors={state.errors} onJump={setStep} />
          <input type="hidden" name="code" value={code} />
          <input type="hidden" name="media" value={JSON.stringify(allMedia.map(({ preview: _p, ...m }) => m))} />

          <ol className="mb-6 flex gap-1" aria-label="Progress">
            {STEPS.map((label, i) => (
              <li key={label} className="flex-1">
                <span className={cn("block h-1.5 rounded-full", i <= step ? "bg-orange" : "bg-line")} />
                <span className="sr-only">
                  {label}
                  {i === step ? " (current)" : ""}
                </span>
              </li>
            ))}
          </ol>
          <p className="mb-4 text-sm font-semibold text-muted">
            Step {step + 1} of {STEPS.length} · <span className="text-green-900">{STEPS[step]}</span>
          </p>

          {(stepError || state.errors?.media) && (
            <div className="mb-4">
              <Alert tone="red">{stepError || state.errors?.media}</Alert>
            </div>
          )}

          <Card className="space-y-4 p-5">
            <div className={cn("space-y-4", step !== 0 && "hidden")}>
              <Field label="Organisation / business name" required error={state.errors?.name}>
                <Input name="name" autoComplete="organization" />
              </Field>
              <Field label="Contact person" required error={state.errors?.contactName}>
                <Input name="contactName" autoComplete="name" />
              </Field>
              <Field label="Mobile / WhatsApp number" required error={state.errors?.phone}>
                <Input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+263 7…" />
              </Field>
              <Field label="Sector" required error={state.errors?.categoryId}>
                <Select name="categoryId" defaultValue="">
                  <option value="" disabled>
                    Choose your sector…
                  </option>
                  {sectors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Email" error={state.errors?.email}>
                <Input name="email" type="email" autoComplete="email" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Hall">
                  <Input name="hall" />
                </Field>
                <Field label="Stand / booth number">
                  <Input name="stand" />
                </Field>
              </div>
            </div>

            <div className={cn("space-y-4", step !== 1 && "hidden")}>
              <Field label="Short description of your organisation" hint="A few sentences is perfect." error={state.errors?.description}>
                <Textarea name="description" rows={4} maxLength={1500} />
              </Field>
              <Field label="What are you showcasing at KUZANA?" error={state.errors?.showcasing}>
                <Textarea name="showcasing" rows={3} maxLength={1500} />
              </Field>
            </div>

            <div className={cn("space-y-5", step !== 2 && "hidden")}>
              <p className="text-sm text-muted">Take a photo of your stand so visitors can find you. At least one photo is needed.</p>
              <Uploader label="Stand photos *" capture multiple max={4} code={code} onChange={setGroup("booth", "BOOTH")} />
              <Uploader label="Product photos (optional)" capture multiple max={4} code={code} onChange={setGroup("product", "PRODUCT")} />
              <Uploader label="Team photo (optional)" capture code={code} onChange={setGroup("team", "TEAM")} />
            </div>

            <div className={cn("space-y-5", step !== 3 && "hidden")}>
              <p className="text-sm text-muted">Snap or upload your flyer, brochure, business card or price list. PDFs are welcome.</p>
              <Uploader label="Logo (optional)" code={code} onChange={setGroup("logo", "LOGO")} />
              <Uploader label="Flyer, poster or business card" capture multiple max={4} code={code} onChange={setGroup("flyer", "FLYER")} />
              <Uploader label="Brochure, catalogue or company profile (PDF)" accept="any" multiple max={3} code={code} onChange={setGroup("brochure", "BROCHURE")} />
            </div>

            <div className={cn("space-y-4", step !== 4 && "hidden")}>
              <p className="text-sm text-muted">All optional. Add whatever you have.</p>
              <Field label="Website" error={state.errors?.website}>
                <Input name="website" inputMode="url" placeholder="www.example.co.zw" />
              </Field>
              <Field label="Facebook" error={state.errors?.facebook}>
                <Input name="facebook" inputMode="url" placeholder="facebook.com/…" />
              </Field>
              <Field label="Instagram" error={state.errors?.instagram}>
                <Input name="instagram" inputMode="url" placeholder="instagram.com/…" />
              </Field>
              <Field label="LinkedIn" error={state.errors?.linkedin}>
                <Input name="linkedin" inputMode="url" />
              </Field>
              <Field label="TikTok" error={state.errors?.tiktok}>
                <Input name="tiktok" inputMode="url" />
              </Field>
              <Field label="WhatsApp business number (if different)">
                <Input name="whatsapp" type="tel" inputMode="tel" />
              </Field>
              <Field label="Physical address">
                <Input name="address" autoComplete="street-address" />
              </Field>
            </div>

            <div className={cn("space-y-4", step !== 5 && "hidden")}>
              <fieldset>
                <legend className="mb-2 text-sm font-semibold">What are you looking for? (optional)</legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {OPPORTUNITIES.map((o) => (
                    <Checkbox key={o} name="opportunities" value={o} label={o} />
                  ))}
                </div>
              </fieldset>
              <Field label="What opportunities are you looking for?">
                <Textarea name="seeking" rows={3} maxLength={1500} />
              </Field>
              <Field label="What can your organisation offer?">
                <Textarea name="offering" rows={3} maxLength={1500} />
              </Field>
            </div>

            <div className={cn("space-y-4", step !== 6 && "hidden")}>
              <p className="text-sm">
                You&apos;re about to submit <strong>{allMedia.length}</strong> file{allMedia.length === 1 ? "" : "s"}. The KUZANA team reviews every
                registration before it appears in the public exhibitor directory.
              </p>
              <Checkbox
                name="consent"
                label="I confirm I am authorised to submit this information, and I give KUZANA SCEEZ permission to publish the business information and images above."
              />
              {state.errors?.consent && <p className="text-xs font-semibold text-danger">{state.errors.consent}</p>}
            </div>
          </Card>

          <div className="mt-5 flex items-center justify-between gap-3">
            {step > 0 ? (
              <Button type="button" variant="ghost" onClick={() => go(-1)}>
                <ChevronLeft className="size-4" /> Back
              </Button>
            ) : (
              <span />
            )}
            {step < STEPS.length - 1 ? (
              <Button type="button" variant="secondary" size="lg" onClick={() => go(1)}>
                {step === 4 || step === 5 ? "Next (optional)" : "Next"} <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button type="submit" size="lg" disabled={pending}>
                {pending ? "Submitting…" : "Submit registration"}
              </Button>
            )}
          </div>
        </div>
      )}
    </ActionForm>
  );
}

const FIELD_STEP: Record<string, number> = {
  name: 0, contactName: 0, phone: 0, categoryId: 0, email: 0,
  description: 1, showcasing: 1,
  media: 2,
  website: 4, facebook: 4, instagram: 4, linkedin: 4, tiktok: 4,
  consent: 6,
};

/** After a failed submit, move to the step holding the first invalid field. */
function JumpToError({ errors, onJump }: { errors?: Record<string, string>; onJump: (step: number) => void }) {
  useEffect(() => {
    if (!errors) return;
    const steps = Object.keys(errors).map((k) => FIELD_STEP[k]).filter((n) => n !== undefined);
    if (steps.length) onJump(Math.min(...steps));
  }, [errors, onJump]);
  return null;
}
