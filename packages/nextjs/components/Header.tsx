import Link from "next/link";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

export default function Header() {
  return (
    <header className="border-b border-border bg-background">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 border-2 border-foreground"></div>
          <span className="font-mono font-bold text-lg">AGORA</span>
        </Link>
        <nav className="flex items-center md:gap-12">
          <Link href="/assemblies" className="hidden md:block font-mono text-sm hover:text-muted-foreground transition-colors">
            Groups
          </Link>
          <RainbowKitCustomConnectButton />
        </nav>
      </div>
    </header>
  );
}
