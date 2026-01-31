"use client";

import { SUPPORTED_CHAINS } from "@/config/chains";

export function Footer() {
  return (
    <footer className="border-t border-border/50">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          {/* Left */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
                <span className="text-black font-semibold text-xs">B</span>
              </div>
              <span className="font-medium text-sm">BlockBrew</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Multi-chain transaction explorer with Awaken CSV export for crypto tax reporting.
            </p>
          </div>

          {/* Chains */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Supported
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 max-w-md">
              {SUPPORTED_CHAINS.map((chain) => (
                <span
                  key={chain.id}
                  className="text-sm text-muted-foreground/70"
                >
                  {chain.name}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Links
            </p>
            <div className="space-y-2">
              <a
                href="https://awaken.tax"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Awaken Tax
              </a>
              <a
                href="https://github.com/CodeMaverick2/Blockbrew"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border/50 flex flex-col sm:flex-row justify-between gap-4 text-xs text-muted-foreground/50">
          <p>© {new Date().getFullYear()} BlockBrew. Open source.</p>
          <p>Not financial advice.</p>
        </div>
      </div>
    </footer>
  );
}
