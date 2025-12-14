export default function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-12">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <p className="font-mono font-bold text-sm mb-4">PROTOCOL</p>
            <ul className="space-y-2 text-xs text-muted-foreground font-mono">
              <li>
                <a href="#" className="hover:text-foreground">
                  Docs
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  API
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  GitHub
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-mono font-bold text-sm mb-4">COMMUNITY</p>
            <ul className="space-y-2 text-xs text-muted-foreground font-mono">
              <li>
                <a href="#" className="hover:text-foreground">
                  Discord
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Twitter
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Forum
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-mono font-bold text-sm mb-4">LEGAL</p>
            <ul className="space-y-2 text-xs text-muted-foreground font-mono">
              <li>
                <a href="#" className="hover:text-foreground">
                  Terms
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Privacy
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-mono font-bold text-sm mb-4">STATS</p>
            <ul className="space-y-2 text-xs text-muted-foreground font-mono">
              <li>Assemblies: 24</li>
              <li>Contests: 156</li>
              <li>Members: 8.2K</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-xs text-muted-foreground font-mono">© 2025 Agora Protocol. All rights reserved.</p>
          <p className="text-xs text-muted-foreground font-mono mt-4 md:mt-0">Built with governance in mind</p>
        </div>
      </div>
    </footer>
  );
}
