"use client"

import Image from "next/image"
import Link from "next/link"
import posthog from "posthog-js"

const Navbar = () => {
  const handleNavClick = (label: string) => {
    posthog.capture('nav_link_clicked', { link_label: label })
  }

  return (
    <header>
        <nav>
            <Link href="/" className="logo">
                <Image src="/icons/logo.png" alt="logo" width={24} height={24} />

                <p>DevEvent</p>
            </Link>

            <ul>
                <Link href="/" onClick={() => handleNavClick('Home')}>Home</Link>
                <Link href="/" onClick={() => handleNavClick('Events')}>Events</Link>
                <Link href="/" onClick={() => handleNavClick('Create Events')}>Create Events</Link>

            </ul>
        </nav>
    </header>
  )
}

export default Navbar
