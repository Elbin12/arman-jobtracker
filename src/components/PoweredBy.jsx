import { Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';

const HIDDEN_POWERED_BY_LOCATION_ID = 'Q6mmZyHzEztauzOHEBrk';

export function useShouldShowPoweredBy() {
  const [searchParams] = useSearchParams();
  return searchParams.get('location_id') !== HIDDEN_POWERED_BY_LOCATION_ID;
}

const PoweredBy = ({ variant = 'logo', sx, ...typographyProps }) => {
  const show = useShouldShowPoweredBy();
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
