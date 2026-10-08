"use client";

import { useState } from "react";
import { CheckCircle2, MapPin } from "lucide-react";
import { googleMapsUrl, parseLatLng } from "@/lib/geo";
import { Field, Input } from "@/components/ui";

/**
 * Paste box for a Google Maps location. Full links and "lat, lng" are read
 * immediately; short share links (maps.app.goo.gl) are resolved when saved.
 */
export function GoogleLocationField({ current }: { current: string }) {
  const [value, setValue] = useState("");
  const point = parseLatLng(value);
  const shortLink = /^https:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps)\//i.test(value.trim());

  return (
    <Field
      label="Google Maps location"
      hint="In Google Maps, find the venue, tap Share and copy the link, or long-press the map and copy the coordinates. Paste it here."
    >
      <div className="relative">
        <MapPin className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-orange-dark" />
        <Input
          name="googleLocation"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={current ? `Current pin: ${current}` : "https://maps.app.goo.gl/… or -20.15, 28.58"}
          className="pl-10"
        />
      </div>
      {value && (
        <span className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold">
          {point ? (
            <>
              <CheckCircle2 className="size-4 text-green-800" />
              <span className="text-green-900">
                Pin found: {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
              </span>
              <a href={googleMapsUrl(point.lat, point.lng)} target="_blank" rel="noopener" className="text-orange-dark underline">
                Check on Google Maps
              </a>
            </>
          ) : shortLink ? (
            <span className="text-muted">Short link: the pin will be read when you save.</span>
          ) : (
            <span className="text-danger">No location found in that text yet.</span>
          )}
        </span>
      )}
    </Field>
  );
}
