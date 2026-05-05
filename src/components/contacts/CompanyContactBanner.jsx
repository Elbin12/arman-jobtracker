import React from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Card, CardContent, Link as MuiLink, Stack, Typography } from '@mui/material';
import Business from '@mui/icons-material/Business';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import PhoneOutlined from '@mui/icons-material/PhoneOutlined';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import LanguageOutlined from '@mui/icons-material/LanguageOutlined';

function readBusinessProfile() {
  return {
    name: import.meta.env.VITE_COMPANY_NAME || 'TruShine Window Cleaning',
    tagline: import.meta.env.VITE_COMPANY_TAGLINE || '',
    phone: import.meta.env.VITE_COMPANY_PHONE || '+1 832-713-3545',
    email: import.meta.env.VITE_COMPANY_EMAIL || 'trushinehouston@gmail.com',
    address:
      import.meta.env.VITE_COMPANY_ADDRESS ||
      '3525 Murdock St, Houston, TX, 77047, United States',
    website: import.meta.env.VITE_COMPANY_WEBSITE || '',
    logoUrl: import.meta.env.VITE_COMPANY_LOGO_URL || '',
  };
}

function formatAddress(addr) {
  if (!addr) return '';
  if (addr.full_address) return addr.full_address;
  const line = [addr.street_address, [addr.city, addr.state, addr.postal_code].filter(Boolean).join(', ')]
    .filter(Boolean)
    .join(', ');
  return line;
}

function Row({ icon: Icon, children, href, external }) {
  const content = (
    <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ minWidth: 0 }}>
      <Icon sx={{ fontSize: 18, color: 'text.secondary', mt: 0.15, flexShrink: 0 }} />
      <Typography variant="body2" sx={{ wordBreak: 'break-word', lineHeight: 1.45 }}>
        {children}
      </Typography>
    </Stack>
  );
  if (href) {
    return (
      <MuiLink
        href={href}
        underline="hover"
        color="inherit"
        sx={{ display: 'block' }}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {content}
      </MuiLink>
    );
  }
  return content;
}

/**
 * @param {'business' | 'customer'} props.mode — `business`: env-based office info; `customer`: contact + optional address from CRM record.
 * @param {boolean} [props.invitePortal] — VIP Service Hub styling (business card only).
 */
export function CompanyContactBanner({ mode = 'business', contact, primaryAddress, invitePortal }) {
  const theme = useTheme();
  const business = readBusinessProfile();

  const businessCardSx =
    invitePortal && mode === 'business'
      ? {
          borderRadius: 3,
          mb: 2.5,
          border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.35 : 0.28)}`,
          background:
            theme.palette.mode === 'dark'
              ? `linear-gradient(150deg, ${alpha('#818cf8', 0.12)} 0%, ${alpha('#22d3ee', 0.06)} 100%)`
              : `linear-gradient(145deg, ${alpha('#3b82f6', 0.11)} 0%, ${alpha('#a855f7', 0.09)} 52%, ${alpha('#22d3ee', 0.08)} 100%)`,
          boxShadow:
            theme.palette.mode === 'dark'
              ? 'none'
              : `0 10px 36px ${alpha(theme.palette.primary.main, 0.12)}`,
        }
      : { borderRadius: 2, border: 1, borderColor: 'divider', mb: 2.5 };

  const labelSx =
    invitePortal && mode === 'business'
      ? {
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'primary.main',
          display: 'block',
          mb: 1.5,
        }
      : {
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'text.secondary',
          display: 'block',
          mb: 1.5,
        };

  if (mode === 'business') {
    return (
      <Card elevation={0} sx={businessCardSx}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
          <Typography variant="caption" sx={labelSx}>
            Company contact
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-start' }}>
            {business.logoUrl ? (
              <Box
                component="img"
                src={business.logoUrl}
                alt=""
                sx={{
                  width: 56,
                  height: 56,
                  objectFit: 'cover',
                  borderRadius: 2,
                  flexShrink: 0,
                  ...(invitePortal
                    ? {
                        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.18)}`,
                      }
                    : {}),
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  ...(invitePortal
                    ? {
                        background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                      }
                    : { bgcolor: 'grey.100' }),
                }}
              >
                <Business sx={{ color: invitePortal ? '#fff' : 'grey.600' }} />
              </Box>
            )}
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                {business.name}
              </Typography>
              {business.tagline ? (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {business.tagline}
                </Typography>
              ) : (
                <Box sx={{ mb: 0.5 }} />
              )}
              <Stack spacing={0.75}>
                {business.email ? (
                  <Row icon={EmailOutlined} href={`mailto:${business.email}`}>
                    {business.email}
                  </Row>
                ) : null}
                {business.phone ? (
                  <Row icon={PhoneOutlined} href={`tel:${business.phone.replace(/\s/g, '')}`}>
                    {business.phone}
                  </Row>
                ) : null}
                {business.address ? <Row icon={PlaceOutlined}>{business.address}</Row> : null}
                {business.website ? (
                  <Row
                    icon={LanguageOutlined}
                    external
                    href={/^https?:\/\//i.test(business.website) ? business.website : `https://${business.website}`}
                  >
                    {business.website.replace(/^https?:\/\//i, '')}
                  </Row>
                ) : null}
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // customer (record) view
  if (!contact) return null;
  const displayName =
    [contact.first_name, contact.last_name].filter(Boolean).join(' ').trim() ||
    contact.email ||
    'Contact';
  const company = contact.company_name || '';
  const addrText = formatAddress(primaryAddress);

  const hasDetail = company || contact.email || contact.phone || addrText;
  if (!hasDetail) return null;

  return (
    <Card elevation={0} sx={{ borderRadius: 2, border: 1, borderColor: 'divider', mb: 2.5 }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'text.secondary',
            display: 'block',
            mb: 1.5,
          }}
        >
          Customer contact
        </Typography>
        <Typography variant="subtitle1" fontWeight={700}>
          {displayName}
        </Typography>
        {company ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {company}
          </Typography>
        ) : (
          <Box sx={{ mb: 0.5 }} />
        )}
        <Stack spacing={0.75}>
          {contact.email ? (
            <Row icon={EmailOutlined} href={`mailto:${contact.email}`}>
              {contact.email}
            </Row>
          ) : null}
          {contact.phone ? (
            <Row icon={PhoneOutlined} href={`tel:${String(contact.phone).replace(/\s/g, '')}`}>
              {contact.phone}
            </Row>
          ) : null}
          {addrText ? <Row icon={PlaceOutlined}>{addrText}</Row> : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
