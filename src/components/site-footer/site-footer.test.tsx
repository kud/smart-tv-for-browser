import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { SiteFooter } from "@/components/site-footer"
import { composeSupportMail, supportAddress } from "@/components/support-link"

describe("site footer", () => {
  it("serves the support link with no address in it", () => {
    const html = renderToStaticMarkup(<SiteFooter />)
    expect(html).toContain("Get support")
    expect(html).toContain('href="https://beansontoast.app"')
    expect(html).not.toContain("mailto")
    expect(html).not.toContain(String.fromCharCode(64))
  })

  it("builds the support address in the browser from its parts", () => {
    expect(supportAddress().split(String.fromCharCode(64))).toEqual([
      "support+tv",
      "beansontoast.app",
    ])
  })

  it("hands the note to the mail app, signed when a name is given", () => {
    const url = new URL(
      composeSupportMail(" Sam ", " The remote lost the TV. "),
    )
    expect(url.protocol).toBe("mailto:")
    expect(url.searchParams.get("subject")).toBe("SmartTV support, from Sam")
    expect(url.searchParams.get("body")).toBe("The remote lost the TV.\n\nSam")
    expect(
      new URL(composeSupportMail("", "Hi")).searchParams.get("subject"),
    ).toBe("SmartTV support")
  })

  it("serves the support dialog closed, with a labelled form", () => {
    const html = renderToStaticMarkup(<SiteFooter />)
    expect(html).toMatch(/<dialog[^>]*aria-labelledby="support-title"/)
    expect(html).not.toMatch(/<dialog[^>]* open/)
    expect(html).not.toMatch(/<p[^>]*>(?:(?!<\/p>).)*<dialog/)
  })
})
