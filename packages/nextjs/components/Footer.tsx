export default function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-12">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-xs text-muted-foreground font-mono">© 2025 Agora Protocol. All rights reserved.</p>
          <a className="text-xs text-muted-foreground font-mono" href="https://github.com/Emmo00/agora">Github</a>
          <p className="text-xs text-muted-foreground font-mono mt-4 md:mt-0">Built with governance in mind</p>
        </div>
      </div>
    </footer>
  );
}
