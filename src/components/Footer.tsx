import Link from "next/link";
import Image from "next/image";
import { FaFacebook, FaInstagram } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="footer bg-[#0d1a18] border-t border-[#122e2a] text-white p-10">
      <aside>
        <Image
          src="/mcpic-logo.png"
          width={96}
          height={96}
          className="w-24 h-24 object-contain"
          alt="MCPIC Logo"
        />
        <p className="text-[#8aada9]">
          Mirpur Cantonment Public Information and Technology Club
          <br />
          Regular club activities since 2022
        </p>
        <span className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#17403b] bg-[#0f211e] px-3 py-1 font-mono text-[11px] tracking-wider text-[#30c4b6]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#30c4b6]" />
          Currently in Version 2.0
        </span>
      </aside>

      <nav>
        <h6 className="footer-title tracking-[0.15rem] text-[#e8f5f3]">NAVIGATION</h6>
        <ul className="space-y-2">
          <li><Link href="/" className="link link-hover text-[#8aada9]">Home</Link></li>
          <li><Link href="/about" className="link link-hover text-[#8aada9]">About</Link></li>
          <li><Link href="/events" className="link link-hover text-[#8aada9]">Events</Link></li>
          <li><Link href="/posts" className="link link-hover text-[#8aada9]">Posts</Link></li>
          <li><Link href="/executives" className="link link-hover text-[#8aada9]">Executives</Link></li>
          <li><Link href="/contact" className="link link-hover text-[#8aada9]">Contact</Link></li>
        </ul>
      </nav>

      <nav>
        <h6 className="footer-title tracking-[0.15rem] text-[#e8f5f3]">Developers</h6>
        <Link className="link link-hover text-[#8aada9]" href="/developers">
          Developer
        </Link>
        <Link className="link link-hover text-[#8aada9]" href="/login">
          Login
        </Link>
      </nav>

      <nav>
        <h6 className="footer-title tracking-[0.15rem] text-[#e8f5f3]">Social</h6>
        <div className="grid grid-flow-col gap-4">
          <a
            href="https://www.facebook.com/ictclub.mcpsc"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MCPIC Facebook"
          >
            <div className="border border-[#133630] bg-[#0f211e] p-2 rounded-lg hover:border-[#30c4b6] transition-colors">
              <FaFacebook size={16} className="text-[#8aada9]" />
            </div>
          </a>
          <a
            href="https://www.instagram.com/ictclub.mcpsc"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MCPIC Instagram"
          >
            <div className="border border-[#133630] bg-[#0f211e] p-2 rounded-lg hover:border-[#30c4b6] transition-colors">
              <FaInstagram size={16} className="text-[#8aada9]" />
            </div>
          </a>
        </div>
      </nav>
    </footer>
  );
}
