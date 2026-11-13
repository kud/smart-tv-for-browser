"use client"

import { FooterLink } from "@/components/footer-link"
import { SupportLink } from "@/components/support-link"

const HOME_URL = "https://beansontoast.app"

// Who makes this and where to get help: one quiet line under the channels,
// sitting between the settings and remote buttons and clear of both.
export const SiteFooter = () => (
  <footer className="site-footer flex h-[6vh] flex-none items-center justify-center px-[7vh] text-[max(12px,1.6vh)] text-tv-muted">
    <div className="flex items-center gap-[0.4vh] whitespace-nowrap">
      <FooterLink
        href={HOME_URL}
        onEnterPress={() => window.location.assign(HOME_URL)}
      >
        beansontoast.app
      </FooterLink>
      <span aria-hidden className="opacity-50">
        ·
      </span>
      <SupportLink />
    </div>
  </footer>
)
