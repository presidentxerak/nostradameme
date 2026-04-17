"use client";

import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/config/copy";
import { usePushSubscription } from "@/lib/hooks/use-push-subscription";

export function PushNotificationToggle() {
  const { state, enable, disable, error } = usePushSubscription();

  if (state === "unsupported") {
    return (
      <p className="text-xs text-text-muted">{COPY.profile.settings.pushUnsupported}</p>
    );
  }

  if (state === "denied") {
    return (
      <p className="text-xs text-no-glow">{COPY.profile.settings.pushDenied}</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {state === "granted-subscribed" && (
        <>
          <p className="text-xs text-yes-glow">{COPY.profile.settings.pushEnabled}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void disable()}
          >
            {COPY.profile.settings.pushDisable}
          </Button>
        </>
      )}
      {state === "loading" && (
        <p className="text-xs text-text-muted">{COPY.profile.settings.pushLoading}</p>
      )}
      {(state === "default" || state === "granted-unsubscribed") && (
        <Button size="sm" onClick={() => void enable()}>
          {COPY.profile.settings.pushEnable}
        </Button>
      )}
      {error && <p className="text-xs text-no-glow">{error}</p>}
    </div>
  );
}
