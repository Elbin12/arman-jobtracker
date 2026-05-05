/**
 * Shared visual tokens for Contacts / CRM pages — inspired by Stripe (tables, surfaces),
 * HubSpot (record header, CRM density), Notion (typography, whitespace), ClickUp (list emphasis).
 */
export const contactsPageSx = {
  canvas: (theme) => ({
    bgcolor: theme.palette.mode === 'dark' ? 'background.default' : theme.palette.grey[50],
    minHeight: '100%',
  }),
  /** Full fluid width inside AdminLayout — matches Jobs / On Hold Jobs (no narrow max-width column). */
  shell: {
    width: '100%',
    maxWidth: 'none',
    mx: 0,
    pb: { xs: 6, md: 8 },
    px: { xs: 2, sm: 3 },
  },
  eyebrow: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'text.secondary',
    mb: 0.75,
  },
  title: {
    fontWeight: 600,
    letterSpacing: '-0.02em',
    color: 'text.primary',
  },
  subtitle: {
    fontSize: '0.8125rem',
    lineHeight: 1.5,
    color: 'text.secondary',
    maxWidth: 'none',
    mt: 0.5,
  },
  surface: (theme) => ({
    bgcolor: 'background.paper',
    borderRadius: 2,
    border: '1px solid',
    borderColor: theme.palette.divider,
    boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.06)',
  }),
  tableHeadCell: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'text.secondary',
    borderBottom: '2px solid',
    borderColor: 'divider',
    py: 1.25,
    bgcolor: 'grey.50',
  },
};

/**
 * VIP Service Hub (`/portal/contacts/...`) — softer gradients, richer accents than admin CRM chrome.
 */
export const portalInviteSx = {
  pageBg: (theme) => ({
    minHeight: '100%',
    bgcolor: theme.palette.mode === 'dark' ? '#0b1220' : '#f8fafc',
    background:
      theme.palette.mode === 'dark'
        ? 'linear-gradient(165deg, #0b1220 0%, #172554 45%, #0f172a 100%)'
        : 'linear-gradient(165deg, #eff6ff 0%, #faf5ff 38%, #ecfeff 72%, #f8fafc 100%)',
  }),
  hero: {
    borderRadius: 3,
    p: { xs: 2.25, sm: 3 },
    mb: 2,
    background: 'linear-gradient(118deg, #2563eb 0%, #4f46e5 42%, #7c3aed 78%, #0d9488 100%)',
    color: '#fff',
    boxShadow: '0 14px 44px rgba(37, 99, 235, 0.28)',
  },
  heroTitle: {
    fontSize: { xs: '1.35rem', sm: '1.6rem' },
    fontWeight: 800,
    letterSpacing: '-0.03em',
    lineHeight: 1.2,
    color: '#fff',
    textShadow: '0 1px 18px rgba(0, 0, 0, 0.12)',
  },
  heroSubtitle: {
    mt: 1,
    fontSize: '0.9rem',
    fontWeight: 500,
    lineHeight: 1.45,
    color: 'rgba(255,255,255,0.92)',
    maxWidth: '36rem',
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    px: 1.25,
    py: 0.35,
    mb: 1.25,
    borderRadius: 999,
    fontSize: '0.68rem',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    bgcolor: 'rgba(255,255,255,0.18)',
    border: '1px solid rgba(255,255,255,0.28)',
    color: '#fff',
  },
};

/** Avatar gradients for portal insight stats (cycles by index % length). */
export const PORTAL_INSIGHT_AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
  'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
  'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
  'linear-gradient(135deg, #6366f1 0%, #2563eb 100%)',
];
