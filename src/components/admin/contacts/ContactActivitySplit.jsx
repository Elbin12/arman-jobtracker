import React, { Fragment } from 'react';
import { alpha } from '@mui/material/styles';
import { Box, Drawer, Paper, Typography, IconButton, useMediaQuery, useTheme } from '@mui/material';
import Close from '@mui/icons-material/Close';

/** Master–detail list + pane (Stripe / HubSpot CRM pattern: white surfaces, subtle chrome). */
export function ContactActivitySplit({
  items,
  getKey,
  selectedId,
  onSelect,
  renderListItem,
  renderDetail,
  emptyList,
  selectHint = 'Select an item to preview details.',
  drawerTitle = 'Details',
  /** VIP Service Hub — warmer list/detail surfaces */
  invitePortal,
}) {
  const theme = useTheme();
  const isLgUp = useMediaQuery(theme.breakpoints.up('lg'));

  const selected =
    selectedId != null ? items.find((item) => String(getKey(item)) === String(selectedId)) : null;

  const detailContent = selected ? renderDetail(selected) : null;

  const listSection = (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        borderRadius: invitePortal ? 3 : 2,
        overflow: 'hidden',
        flex: 1,
        minHeight: 280,
        maxHeight: { xs: 'none', lg: 'calc(100vh - 220px)' },
        display: 'flex',
        flexDirection: 'column',
        bgcolor: invitePortal ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.06 : 0.03) : 'background.paper',
        borderColor: invitePortal ? alpha(theme.palette.primary.main, 0.22) : 'divider',
        ...(invitePortal && theme.palette.mode === 'light'
          ? { boxShadow: `0 4px 24px ${alpha(theme.palette.primary.main, 0.07)}` }
          : {}),
      }}
    >
      <Box sx={{ overflow: 'auto', flex: 1, p: 1 }}>
        {!items?.length ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2, fontSize: '0.8125rem' }}>
            {emptyList}
          </Typography>
        ) : (
          items.map((item) => (
            <Fragment key={String(getKey(item))}>
              {renderListItem(item, String(getKey(item)) === String(selectedId))}
            </Fragment>
          ))
        )}
      </Box>
    </Paper>
  );

  const detailSection = (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        borderRadius: invitePortal ? 3 : 2,
        overflow: 'auto',
        flex: 1,
        minHeight: 280,
        minWidth: 0,
        maxHeight: { xs: 'none', lg: 'calc(100vh - 220px)' },
        display: 'flex',
        flexDirection: 'column',
        bgcolor: invitePortal ? alpha(theme.palette.secondary.main, theme.palette.mode === 'dark' ? 0.07 : 0.03) : 'background.paper',
        borderColor: invitePortal ? alpha(theme.palette.secondary.main, 0.2) : 'divider',
        boxShadow:
          theme.palette.mode === 'dark'
            ? 'none'
            : invitePortal
              ? `0 6px 28px ${alpha(theme.palette.secondary.main, 0.09)}`
              : '0 1px 3px rgba(15, 23, 42, 0.08)',
      }}
    >
      <Box sx={{ overflow: 'auto', flex: 1, p: { xs: 2, sm: 3 } }}>
        {!items?.length ? null : !selected ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: 'center', px: 2, fontSize: '0.8125rem' }}>
            {selectHint}
          </Typography>
        ) : (
          detailContent
        )}
      </Box>
    </Paper>
  );

  return (
    <>
      <Box
        sx={{
          display: { xs: 'block', lg: 'grid' },
          gridTemplateColumns: {
            lg: 'minmax(280px, 0.36fr) minmax(440px, 1fr)',
          },
          gap: { xs: 2, lg: 2 },
          alignItems: 'stretch',
        }}
      >
        {listSection}
        <Box sx={{ display: { xs: 'none', lg: 'block' }, minWidth: 0 }}>
          {detailSection}
        </Box>
      </Box>

      <Drawer
        anchor="right"
        open={Boolean(selected) && !isLgUp}
        onClose={() => onSelect(null)}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: { xs: '100%', sm: 600 },
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.25,
            borderBottom: 1,
            borderColor: 'divider',
            ...(invitePortal
              ? {
                  background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                }
              : { bgcolor: 'grey.50' }),
          }}
        >
          <Typography variant="subtitle2" fontWeight={600}>
            {drawerTitle}
          </Typography>
          <IconButton aria-label="Close" onClick={() => onSelect(null)} size="small">
            <Close />
          </IconButton>
        </Box>
        <Box sx={{ overflow: 'auto', flex: 1, p: { xs: 2, sm: 3 } }}>{detailContent}</Box>
      </Drawer>
    </>
  );
}
