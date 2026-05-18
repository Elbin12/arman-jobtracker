import { Box } from '@mui/material';
import { useAccountBranding } from '../hooks/useAccountBranding';
import CompanyLogoPlaceholder from './CompanyLogoPlaceholder';

const CompanyLogo = ({
  locationId,
  quote,
  alt,
  fallbackSrc,
  sx = {},
  className,
  style,
  maxHeight = '80px',
  maxWidth = '200px',
}) => {
  const { profile, isLoading, isReady } = useAccountBranding({ locationId, quote });

  if (isLoading || !isReady) {
    return (
      <CompanyLogoPlaceholder
        className={className}
        maxHeight={maxHeight}
        maxWidth={maxWidth}
        sx={sx}
      />
    );
  }

  const logoSrc = profile.logoUrl || fallbackSrc;
  if (!logoSrc) {
    return (
      <CompanyLogoPlaceholder
        className={className}
        maxHeight={maxHeight}
        maxWidth={maxWidth}
        sx={sx}
      />
    );
  }

  return (
    <Box
      component="img"
      src={logoSrc}
      alt={alt || (profile.name ? `${profile.name} Logo` : 'Logo')}
      className={className}
      sx={{
        maxHeight,
        maxWidth,
        objectFit: 'contain',
        ...sx,
      }}
      style={style}
    />
  );
};

export default CompanyLogo;
