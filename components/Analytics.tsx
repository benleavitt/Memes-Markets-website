import { CONSENT_KEY } from "@/lib/consent-key";
import Script from "next/script";

/**
 * Google Analytics 4, behind Consent Mode v2.
 *
 * THE ORDER OF THESE TWO SCRIPTS IS THE WHOLE THING. The `consent default`
 * call has to execute BEFORE gtag.js does, or Google's library initialises with
 * its own defaults — which are granted — and sets a cookie before the visitor
 * has been asked anything. `beforeInteractive` is what guarantees that ordering
 * against an async script; `afterInteractive` on the bootstrap would be a race
 * that usually looks fine in testing and quietly loses in the field.
 *
 * THE BOOTSTRAP READS STORAGE ITSELF, and that is not belt-and-braces. Without
 * it, a returning visitor who had already pressed Accept came back defaulted to
 * denied: the stored choice was only ever applied by the banner, and the banner
 * does not render once a choice exists. Their consent was silently discarded on
 * every visit after the first. Setting the default from storage fixes it in one
 * call, with no second update and no window where the state is wrong.
 *
 * With analytics_storage denied, GA still loads and still reports, but without
 * cookies or any persistent identifier — Google calls these cookieless pings.
 * That is the deliberate trade of Consent Mode: no identifier before consent,
 * and modelled numbers rather than a hole in the data. The privacy policy says
 * exactly this rather than implying nothing is sent at all.
 *
 * Renders nothing at all without NEXT_PUBLIC_GA_ID. A site with no measurement
 * id should ship no analytics, not an empty tag manager.
 */
export function Analytics({ gaId }: { gaId?: string }) {
  if (!gaId) return null;

  return (
    <>
      <Script id="ga-consent-default" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          var mmStored = null;
          try { mmStored = localStorage.getItem('${CONSENT_KEY}'); } catch (e) {}
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: mmStored === 'granted' ? 'granted' : 'denied',
            wait_for_update: 500
          });
        `}
      </Script>

      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />

      <Script id="ga-init" strategy="afterInteractive">
        {`
          gtag('js', new Date());
          gtag('config', '${gaId}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
