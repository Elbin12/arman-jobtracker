import { Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { resolveBrandingLocationId } from '../hooks/useAccountBranding';
import { ALL_DAY_PROJECTS_LOCATION_ID } from '../utils/bookingRedirect';

export function useShouldShowPoweredBy(locationIdProp) {
  const [searchParams] = useSearchParams();
  const locationId = locationIdProp ?? resolveBrandingLocationId(searchParams);
  return locationId !== ALL_DAY_PROJECTS_LOCATION_ID;
}

const PoweredBy = ({ variant = 'logo', locationId: locationIdProp, sx, ...typographyProps }) => {
  const show = useShouldShowPoweredBy(locationIdProp);
  if (!show) return null;

  return (
    <Typography
      variant="caption"
      display="flex"
      sx={{
        fontSize: { xs: '0.5rem', md: variant === 'logo' ? '1rem' : '0.7rem' },
        color: 'text.secondary',
        alignItems: 'center',
        ...sx,
      }}
      {...typographyProps}
    >
      Powered by{' '}
      <a
        href={import.meta.env.VITE_SERVICE_PILOT_WEBSITE_URL || 'https://theservicepilot.com/'}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: '#023c8f',
          textDecoration: 'none',
          fontWeight: 500,
        }}
      >
        {variant === 'logo' ? (
          <img
            src="/servicepilot.jpg"
            alt="Company Logo"
            className="object-contain max-h-[20px] md:max-h-[40px]"
            style={{ objectFit: 'contain' }}
          />
        ) : (
          'The Service Pilot'
        )}
      </a>
    </Typography>
  );
};

export default PoweredBy;
