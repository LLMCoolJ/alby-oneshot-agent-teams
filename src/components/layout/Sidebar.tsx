import { NavLink } from 'react-router-dom';
import { SCENARIOS, CONSTANTS } from '@/types';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo section */}
          <div className="flex items-center justify-between px-4 py-5 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <LightningIcon className="w-8 h-8 text-bitcoin" />
              <div>
                <h1 className="text-lg font-bold text-slate-900">Lightning Demo</h1>
                <p className="text-xs text-slate-500">Alice & Bob Scenarios</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-600"
              aria-label="Close menu"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {SCENARIOS.map((scenario) => (
                <li key={scenario.id}>
                  <NavLink
                    to={scenario.path}
                    onClick={onClose}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                      transition-colors
                      ${isActive
                        ? 'bg-bitcoin/10 text-bitcoin'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }
                    `}
                  >
                    <span className="text-lg" role="img" aria-hidden="true">
                      {scenario.icon}
                    </span>
                    <span>{scenario.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer links */}
          <div className="border-t border-slate-200 p-4 space-y-2">
            <a
              href={CONSTANTS.FAUCET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-bitcoin"
            >
              <FaucetIcon className="w-4 h-4" />
              Get Testnet Sats
              <ExternalLinkIcon className="w-3 h-3" />
            </a>
            <a
              href="https://github.com/getAlby/alby-js-sdk"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-bitcoin"
            >
              <GithubIcon className="w-4 h-4" />
              Alby SDK Docs
              <ExternalLinkIcon className="w-3 h-3" />
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}

// Icon components (inline SVGs for simplicity)
function LightningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function FaucetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.42 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}
