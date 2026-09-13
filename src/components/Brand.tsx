import type { ProviderId } from "../types/usage";

export function KQuotaMark({ className = "h-7 w-7" }: { className?: string }) {
  return <img className={`${className} object-contain`} src="/brand/kquota-logo-concept.png" alt="" aria-hidden="true" draggable={false}/>;
}

export function ProviderLogo({ provider, className = "h-9 w-9" }: { provider: ProviderId; className?: string }) {
  if (provider === "claude") return <span className={`provider-logo provider-logo--claude ${className}`} aria-hidden="true"><svg viewBox="0 0 32 32"><g fill="none" stroke="currentColor" strokeWidth="3.8" strokeLinecap="round"><path d="M16 5.5v5.2M16 21.3v5.2M5.5 16h5.2M21.3 16h5.2M8.6 8.6l3.7 3.7M19.7 19.7l3.7 3.7M23.4 8.6l-3.7 3.7M12.3 19.7l-3.7 3.7"/></g><circle cx="16" cy="16" r="2.5" fill="currentColor"/></svg></span>;
  return <span className={`provider-logo provider-logo--codex ${className}`} aria-hidden="true"><svg viewBox="0 0 32 32"><g fill="none" stroke="currentColor" strokeWidth="2.35" strokeLinecap="round" strokeLinejoin="round"><path d="M16 5.2a5.4 5.4 0 0 1 5.3 4.4v7.7l-5.3 3.1-6.7-3.9"/><path d="M25.35 10.6a5.4 5.4 0 0 1 1.15 6.8l-6.7 3.85-5.3-3.05v-7.75"/><path d="M25.35 21.4a5.4 5.4 0 0 1-4.15 5.55l-6.7-3.9v-6.1l6.7-3.85"/><path d="M16 26.8a5.4 5.4 0 0 1-5.3-4.4v-7.7l5.3-3.1 6.7 3.9"/><path d="M6.65 21.4A5.4 5.4 0 0 1 5.5 14.6l6.7-3.85 5.3 3.05v7.75"/><path d="M6.65 10.6A5.4 5.4 0 0 1 10.8 5.05l6.7 3.9v6.1L10.8 18.9"/></g></svg></span>;
}
