import Image from "next/image";
import Link from "next/link";
import * as React from "react";

/**
 * Footer component for Next.js (TSX)
 * - TailwindCSS styling
 * - Uses next/image & next/link
 * - Content is customizable via props with sensible defaults matching the provided HTML
 */

export type FooterLink = { label: string; href?: string };
export type FooterColumn = { title: string; links: FooterLink[] };
export type SocialLink = { alt: string; src: string; href?: string };

export interface FooterProps {
  /** Bottom-left logo src (public/ path, remote URL, or data URI) */
  logoSrc?: string;
  /** Columns with titles and links */
  columns?: FooterColumn[];
  /** Social icons (X, YouTube, etc.) */
  social?: SocialLink[];
  /** Copyright string; if omitted, current year + default message will be used */
  copyright?: string;
  /** Optional extra classes for the outer wrapper */
  className?: string;
}

const DEFAULT_LOGO = "/assets/logo-bottom-L5ZsQV-S.png";

const DEFAULT_COLUMNS: FooterColumn[] = [
  {
    title: "About Us",
    links: [
      { label: "Introduction", href: "#" },
      { label: "Data Strategies", href: "#" },
      { label: "Careers", href: "#" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact Us", href: "#" },
      { label: "FAQ", href: "#" },
    ],
  },
  {
    title: "Community",
    links: [], // will render social icons instead
  },
];

// Base64 icons from the snippet
const ICON_X =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAMAAADVRocKAAAAflBMVEUAAABHQWVIQWVIQGhHQWRHQGRHQWRHQmVIQmRQQHBIQGBHQmVHQmRHQmNHQmVGQGVHQWRHQWRHQWVHQWT////o5+xeWXdSTW7Rz9iXlKj08/V1cYtqZYGvq7ujoLHz8/Xc2+KvrLyjoLK6t8XGxM7d2+KMiJ6MiZ6AfZWAfJW7qWeOAAAAE3RSTlMA32Ag73C/r0AQEJ9wkI8wz1DPRsg2IgAAA2BJREFUaN7Fmtl2ozAQRBG7wcZOOgYc2yRessz//+B4bA11CKBuFs3cJ3JIuqGKkoSII2MRL7Noo3y64aswypbxwpmLhZsq6mCTut4M1ZchGQgn9ohDYomexl+8IhHKHVU/8AnM3yLG1dto4UU0mHSA3S7UsXETi4xGkiUieRSNRglkWvs0AbVm5aeJMEYENJmlrfrowOpjTaU1zcSaeT4n43ud+VI0G6orcRnNSGbJYOD2GWDNhpRmJrIkEIgbDRTNjjLeQFFuG7zn1MnlcbosqM3SeAOH15cG7wV1UOmzh06fE6MDu5cmR0P9z55Rz+zACcV7qvzSZ86cC0/URfHxuPKqqq5/Dt7yHhXP7IMUUSf5ay3Nvde2aJ7ePupfqZdQh5h6+LoX2KFXsz7c7yVhQnaqpdnrXuD9UX+b85NbSH1AGvTSXCT1KYRCJhsudKOEDVwACCRGhSBNrflFFADgsuPoWV8oegkCANJbgw0ZgDS619uBCUArawmZKe7SlIRezQCwJsQEDDZUtQ1XBEBAzCzmMOzt616iBxRJWBHLtS64E9YHKwxEchsQAJ6oN8ftcfOoeyEAAp4xF/A2fNc2XAfMzD5JwFC0g0ISfIdEFB/1k3nVyRMiaoAZAZaPbsDPPgd9NK0Bb8OeRAhN1mW1+Bd51HzhohHDxGWYDcrZDDAZNtx/qogn5IcKrCE0hyE2RJLBDiPEcBtWsnfvUpc+aPHlNiydmHiOj/qvuc5AheTxE05CDFhD7CE+jvh1ixIEANmF+EiegWcsW9gAnOG33IYUCy8uAKcfsw9s4BZeiSgAZdfs86WP+vGw+DUHAOM/xMcR84IQCAKQd88++ojZUEgkAWiQS23Q+wkhH4AffD+e29qGT/N2QiwJAIAN5Y0Xgw31xr/iAtCmFLynK2w2MgHoPQuOxj2jxOcC0GbPvqcr836p3g3pX6Sft6DzF91/sJ0DYpoGv2sX0cykThPPn1kgz/q2ZosVzcjKaZPMubW8QF0bNijP9va+7Q8Ulj+xBJY/4gTWP3MxrBVNwF///0+Nt8StRud34chw1Sh5XEeMl9JgIshj4yZUjL+10MLHw2+jhQpg7kCeImIJY2cKnhsaq+Pip/RIN53KpO6M/6ETB1kU/v33n02UBbGw+G97yiJZKDjk+AAAAABJRU5ErkJggg==";
const ICON_YOUTUBE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAMAAADVRocKAAAAllBMVEUAAABIQWVHQWVMQGhIQGhHQWRHQGRHQWRHQmVIQmRHQmVHQmRHQWNHQmNGQGVHQWRHQmVHQWVHQmVHQGRGQ2NHQWT/FSL////oGir/bXS6JjvRIDP0GCajK0NSPmCYLkfoGypePFx5NVKMMEv/NUDdHS7/4uNqOViuKT/GIzf/8PH/xcj/p6z/UFn/IzD/ipD/ipH/e4Kg+Z+nAAAAFXRSTlMAYN8QIO9wv69An3DfkDDPj8+QUFBtcARQAAAC00lEQVRo3sWa2ZLbIBBFEWhDXmdp2aPFsmVrbM+W5P9/LqqpJNSUWwgQnTlvfuGqb0PTgJkZQs7W6WoeQU80T9L1TArmCxFkc0BYZUHoYfRZAhqSiRoygVHSR/eP52AED5gL8WdGySQkhx4yiTAFazKLdAfKHYogxBocWQsjezg4ww1sWkYwAb4ctR8mMpKIGCYzIxxfKej9IXNpCZ5Y+pufOFGIri8O3uDYiluDR9ZECVYEmgTQpCEDz6REBinkFwEO3uFEAeAlgwMBkRgNYHc+NnVRXMty21Pl/6j6n11ZlsWlbtp2pwlBE8DhUuWG7IuDNguPgNDkVtS6iZS6j69osM71zyLG/KlsBSosE2IwxUVuTT2YZqyD7uwF9rhHuEO73AHcI9yh1kXgjFZtvI4eXQSOWEfcC6zgltpFoMbXmgB0EjlQAJoECQhXbwISb+bKHOH9SS9Q4gVvYSzwtHnWSnSAsEALEWxxgc3m9WS30iBliY1Az9vJSuCOzQGhGhDQSlT4nhABQq4T2Dz/xBUAIWJgLdCDZxswLAWUxIlW4OUXaQQvPz6MLXJJ8tvJIsn20/T1PbeapivzhaaGN19oiU2pUNPTolTgxa5DBVRuzavpwqJcnz6cyrX0tqNdAUHSb5lsTrnp39G3LXjjdXYRaAcaL0HZOoZDze82t6YbPCDEfrJc4A4NeWR/ADmgDn2S0Byh1HWChOkmNYDwoD/GFntjey74MXb0snHXtk19Kcqy7G4P4tuyvBZF3RzPu9E7IxEBAdzzfSkeAP11jppIJAEoUvBMxr4SRp4NCsmvNW9YgEcW/+dqmSwNPKS+3qd+oCB+YomJH3Fi+mcuPUsOE4iW3//UyJhYOK9fwcwIuJM9ATMmzMCaVNlDEQSXrIdMIlKTn0KCx4I58pDCKIlkUwiDRDu6+vgpGtkKEOZZIJgvhIzv0+Tv339W6X0sDQf/DUlwXPfzKG3GAAAAAElFTkSuQmCC";

const DEFAULT_SOCIAL: SocialLink[] = [
  { alt: "X", src: ICON_X, href: "#" },
  { alt: "YouTube", src: ICON_YOUTUBE, href: "#" },
];

export default function Footer({
  logoSrc = DEFAULT_LOGO,
  columns = DEFAULT_COLUMNS,
  social = DEFAULT_SOCIAL,
  copyright,
  className,
}: FooterProps) {
  const year = new Date().getFullYear();
  const copyrightText =
    copyright ?? `Copyright © ${year}. All rights reserved`;

  return (
    <footer
      className={[
        "w-full border-t border-white/10 bg-black text-white",
        "px-4 md:px-6 lg:px-8",
        "py-10 md:py-12 lg:py-14",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="contentinfo"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-stretch">
          {/* Left: Logo */}
          <div className="md:min-w-[220px]">
            <Link href="/" aria-label="Home">
              {/* Using fill layout would require a wrapper; fixed width here for simplicity */}
              {/* <Image
                src={logoSrc}
                alt="Logo"
                width={180}
                height={40}
                className="h-auto w-[180px]"
                priority
              /> */}
              <div 
                className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg"
                style={{transform: "scale(4)",position:'relative',top: "40px"}}
              >
                <span className="text-white font-bold text-lg">CI</span>
              </div>
            </Link>
          </div>

          {/* Right: Columns */}
          <div className="grid flex-1 grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {columns.map((col, i) => (
              <div key={i} className="min-w-0">
                <div className="mb-4 text-sm font-semibold uppercase tracking-wide text-white/80">
                  {col.title}
                </div>

                {/* Links or social icons */}
                {col.title.toLowerCase() !== "community" ? (
                  <ul className="space-y-3 text-white/80">
                    {col.links.map((link, idx) => (
                      <li key={idx}>
                        {link.href ? (
                          <Link
                            href={link.href}
                            className="transition-opacity hover:opacity-80"
                          >
                            {link.label}
                          </Link>
                        ) : (
                          <span>{link.label}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-center gap-4">
                    {social.map((s, idx) => (
                      <a
                        key={idx}
                        href={s.href || "#"}
                        target={s.href?.startsWith("http") ? "_blank" : undefined}
                        rel={s.href?.startsWith("http") ? "noopener noreferrer" : undefined}
                        aria-label={s.alt}
                        className="inline-flex rounded-md p-1.5 ring-1 ring-white/10 transition hover:bg-white/5"
                      >
                        <Image src={s.src} alt={s.alt} width={32} height={32} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-white/60">
          {copyrightText}
        </div>
      </div>
    </footer>
  );
}
