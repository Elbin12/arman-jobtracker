import { Box, Skeleton } from '@mui/material';

const CompanyLogoPlaceholder = ({
  sx = {},
  className,
  maxHeight = '80px',
  maxWidth = '200px',
  rounded = false,
}) => (
  <Skeleton
    variant="rectangular"
    animation="wave"
    className={className}
    sx={{
      maxHeight,
      maxWidth,
      width: maxWidth,
      height: maxHeight,
      minWidth: 56,
      minHeight: 56,
      borderRadius: rounded ? 2 : 1,
      bgcolor: 'grey.200',
      ...sx,
    }}
  />
);

export default CompanyLogoPlaceholder;
