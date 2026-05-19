import {
  LocationOnOutlined,
  MailOutline,
  PhoneAndroid,
  CalendarToday,
  AttachMoney,
  AccessTime,
  History,
} from '@mui/icons-material'
import { Avatar, Box, Card, CardContent, CardHeader, Typography, Chip, Divider, Button } from '@mui/material'
import { User } from 'lucide-react'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useMoneyFormatter } from '@/hooks/useMoneyFormatter'

const formatDateUtcParts = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return 'Not scheduled'

  const [datePart, rest = ''] = dateString.split('T')
  const [year, month, day] = datePart.split('-')
  const timeSegment = rest.replace(/[+-].*$/, '').replace(/Z$/, '').split('.')[0]
  const [hourStr = '0', minuteStr = '00'] = timeSegment.split(':')

  let hour = parseInt(hourStr, 10)
  const minute = String(minuteStr).padStart(2, '0')
  const ampm = hour >= 12 ? 'PM' : 'AM'
  hour = hour % 12 || 12

  const utcDate = new Date(Date.UTC(year, month - 1, day))
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const weekday = weekdays[utcDate.getUTCDay()]
  const monthName = months[month - 1]

  return `${weekday}, ${monthName} ${day}, ${year} ${hour}:${minute} ${ampm}`
}

const getJobTypeLabel = (jobType) => {
  const labels = {
    one_time: 'One-Time Job',
    recurring: 'Recurring Job',
    subscription: 'Subscription',
  }
  return labels[jobType] || jobType || ''
}

const getJobTypeColor = (jobType) => {
  const colors = {
    one_time: 'default',
    recurring: 'primary',
    subscription: 'secondary',
  }
  return colors[jobType] || 'default'
}

/**
 * Pending reschedule row:
 * - New: GET /reschedule/jobs/ — flat job + contact_details / address_details + submission
 * - Legacy: nested source_job, quote_schedule, service_selections
 */
const ReschedulePendingQuoteCard = ({ row: quote, onConvertToJob }) => {
  const { formatMoney: formatPrice } = useMoneyFormatter()
  const navigate = useNavigate()

  const sourceJob = quote?.source_job
  const schedule = quote?.quote_schedule
  const contactNested = quote?.contact_details || (quote?.contact && typeof quote.contact === 'object' ? quote.contact : null)
  const addrObj =
    quote?.address_details ||
    (quote?.address && typeof quote.address === 'object' ? quote.address : null)

  const customerName =
    quote?.customer_name?.trim() ||
    [contactNested?.first_name, contactNested?.last_name].filter(Boolean).join(' ') ||
    sourceJob?.customer_name?.trim() ||
    [quote?.contact?.first_name, quote?.contact?.last_name].filter(Boolean).join(' ') ||
    'Unknown Customer'

  const customerEmail =
    quote?.customer_email ||
    contactNested?.email ||
    sourceJob?.customer_email ||
    quote?.contact?.email ||
    ''

  const customerPhone =
    quote?.customer_phone ||
    contactNested?.phone ||
    sourceJob?.customer_phone ||
    quote?.contact?.phone ||
    ''

  const customerAddress =
    quote?.customer_address ||
    addrObj?.full_address ||
    (addrObj
      ? [addrObj.street_address, addrObj.city, addrObj.state, addrObj.postal_code].filter(Boolean).join(', ')
      : '') ||
    sourceJob?.customer_address ||
    sourceJob?.address_details?.full_address ||
    (quote?.contact && typeof quote.contact === 'object'
      ? [quote.contact.street_address, quote.contact.city, quote.contact.state, quote.contact.postal_code]
          .filter(Boolean)
          .join(', ')
      : '')

  const requestedScheduleIso =
    quote?.scheduled_at ||
    schedule?.scheduled_date ||
    quote?.scheduled_date

  const previousJobScheduledAt =
    sourceJob?.scheduled_at ?? sourceJob?.occurrence_events?.[0]?.scheduled_at

  const durationFromItems =
    quote?.items?.reduce((acc, it) => acc + (parseFloat(it.duration_hours) || 0), 0) ||
    sourceJob?.items?.reduce((acc, it) => acc + (parseFloat(it.duration_hours) || 0), 0) ||
    null

  const durationHoursTop =
    quote?.duration_hours != null && quote.duration_hours !== ''
      ? parseFloat(quote.duration_hours)
      : null

  const effectiveDuration =
    durationFromItems != null && durationFromItems > 0
      ? durationFromItems
      : durationHoursTop != null && !Number.isNaN(durationHoursTop) && durationHoursTop > 0
        ? durationHoursTop
        : null

  const serviceSelections = quote?.service_selections || []
  const customProducts = quote?.custom_products || []
  const primaryLineItems =
    quote?.items?.length ? quote.items : sourceJob?.items?.length ? sourceJob.items : []
  const showLegacySelectionRows = primaryLineItems.length === 0 && serviceSelections.length > 0

  const totalSurcharge =
    parseFloat(quote?.total_surcharge ?? quote?.total_surcharges ?? sourceJob?.total_surcharge) || 0

  const displayTotal = quote?.revised_total ?? quote?.total_price ?? quote?.final_total ?? sourceJob?.total_price

  const jobType = quote?.job_type || sourceJob?.job_type

  const quoteDetailsId = quote?.submission || quote?.id

  const formatCreated = (iso) => {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleString()
    } catch {
      return iso
    }
  }

  const notesText = quote?.notes || schedule?.notes || sourceJob?.notes

  const canConvert =
    Boolean(onConvertToJob) &&
    (primaryLineItems.length > 0 || serviceSelections.length > 0 || Boolean(sourceJob?.items?.length))

  return (
    <Card
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 2,
      }}
    >
      <CardHeader
        sx={{
          '& .MuiCardHeader-avatar': {
            alignSelf: 'flex-start',
            marginTop: '4px',
          },
          '& .MuiCardHeader-content': {
            minWidth: 0,
            overflow: 'hidden',
          },
          '& .MuiCardHeader-action': {
            margin: 0,
            alignSelf: 'flex-start',
          },
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'start',
        }}
        avatar={
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <User size={20} />
          </Avatar>
        }
        title={
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {customerName}
          </Typography>
        }
        subheader={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <MailOutline sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
            <Typography
              variant="body2"
              component="a"
              href={customerEmail ? `mailto:${customerEmail}` : undefined}
              sx={{
                color: 'text.secondary',
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textDecoration: 'none',
                '&:hover': {
                  color: 'primary.main',
                  textDecoration: 'underline',
                },
              }}
            >
              {customerEmail || 'No email provided'}
            </Typography>
          </Box>
        }
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {jobType && (
              <Chip
                label={getJobTypeLabel(jobType)}
                color={getJobTypeColor(jobType)}
                size="small"
                variant="outlined"
              />
            )}
            <Chip label="Repeat request" color="warning" size="small" variant="outlined" />
          </Box>
        }
      />

      <Divider />

      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 0.2 }}>
        {quote?.created_at && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Requested again {formatCreated(quote.created_at)}
          </Typography>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <PhoneAndroid fontSize="small" color="action" />
            <Typography
              component="a"
              href={customerPhone ? `tel:${customerPhone}` : undefined}
              variant="body2"
              sx={{
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {customerPhone || 'No phone provided'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <LocationOnOutlined fontSize="small" color="action" sx={{ mt: 0.2 }} />
            <Typography variant="body2" color="text.primary">
              {customerAddress || 'No address provided'}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 1 }} />

        {(primaryLineItems.length > 0 || showLegacySelectionRows || customProducts.length > 0) && (
          <>
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Services
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {primaryLineItems.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      p: 1.5,
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={500}>
                        {item.custom_name || item.service_name || 'Service'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.duration_hours} hours
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={600} color="primary.main">
                      {formatPrice(item.price)}
                    </Typography>
                  </Box>
                ))}
                {showLegacySelectionRows &&
                  serviceSelections.map((sel) => (
                  <Box
                    key={sel.id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      p: 1.5,
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={500}>
                        {sel.service_details?.name || 'Service'}
                      </Typography>
                      {sel.selected_package_details?.name && (
                        <Typography variant="caption" color="text.secondary">
                          {sel.selected_package_details.name}
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="body2" fontWeight={600} color="primary.main">
                      {formatPrice(sel.final_total_price)}
                    </Typography>
                  </Box>
                ))}
                {customProducts.map((cp) => (
                  <Box
                    key={cp.id || cp.name}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      p: 1.5,
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" fontWeight={500}>
                      {cp.name || 'Custom'}
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="primary.main">
                      {formatPrice(cp.total_price ?? cp.price)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
            <Divider sx={{ my: 1 }} />
          </>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <CalendarToday fontSize="small" color="action" />
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Requested schedule
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {formatDateUtcParts(requestedScheduleIso)}
              </Typography>
            </Box>
          </Box>

          {previousJobScheduledAt && (
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <History fontSize="small" color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Previous job date
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {formatDateUtcParts(previousJobScheduledAt)}
                </Typography>
              </Box>
            </Box>
          )}

          {effectiveDuration != null && effectiveDuration > 0 && (
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <AccessTime fontSize="small" color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Duration
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {Number(effectiveDuration.toFixed(2))} hours
                </Typography>
              </Box>
            </Box>
          )}

          {notesText && (
            <Box sx={{ py: 0.5 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Notes
              </Typography>
              <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-wrap' }}>
                {notesText}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <AttachMoney fontSize="small" color="action" />
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Total price
              </Typography>
              <Typography variant="h6" color="primary.main" fontWeight={600}>
                {displayTotal != null && displayTotal !== '' ? formatPrice(displayTotal) : 'N/A'}
                {totalSurcharge > 0 && (
                  <Typography component="span" variant="subtitle2" color="text.secondary" display="block">
                    (Includes {formatPrice(quote?.total_surcharge ?? quote?.total_surcharges)} surcharge)
                  </Typography>
                )}
              </Typography>
            </Box>
          </Box>

          {(quote?.submission || quote?.reschedule_source_job_id) && (
            <Typography variant="caption" color="text.secondary">
              {quote?.submission && (
                <>
                  Submission:{' '}
                  <Box component="span" sx={{ fontFamily: 'monospace' }}>
                    {quote.submission}
                  </Box>
                </>
              )}
              {quote?.reschedule_source_job_id && (
                <>
                  {quote?.submission ? ' · ' : ''}
                  Source job:{' '}
                  <Box component="span" sx={{ fontFamily: 'monospace' }}>
                    {quote.reschedule_source_job_id}
                  </Box>
                </>
              )}
            </Typography>
          )}
        </Box>

        <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            disabled={!canConvert}
            onClick={() => quote && onConvertToJob?.(quote)}
          >
            Convert to job
          </Button>
          <Button
            variant="outlined"
            color="primary"
            fullWidth
            onClick={() => quoteDetailsId && navigate(`/quote/details/${quoteDetailsId}`)}
          >
            View quote
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}

export default ReschedulePendingQuoteCard
