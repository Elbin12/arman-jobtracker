import React, { useState } from 'react'
import { Box, Typography, Alert, Pagination, Stack } from '@mui/material'
import ReschedulePendingQuoteCard from '../../components/admin/quotes/ReschedulePendingQuoteCard.jsx'
import { useGetReschedulePendingSubmissionsQuery } from '../../store/api/user/quoteApi.js'
import { QuoteCardSkeleton } from '../../components/ui/skeletons'
import { EditJobDialog } from '../../components/admin/jobs/EditJobDialog.jsx'

const PAGE_SIZE = 20

/**
 * List row → job object for EditJobDialog convert.
 * New GET /reschedule/jobs/: row is already a job; PATCH uses job id + status=reschedule_pending.
 * Legacy: nested source_job + submission id on quote row.
 */
function mapRescheduleSubmissionToConvertJob(quote) {
  /** Flat job row from GET /reschedule/jobs/ (no nested source_job). */
  if (!quote.source_job && quote.contact_details) {
    const { contact, address, ...rest } = quote
    const contactId = contact ?? quote.contact_id ?? null
    const addressId =
      typeof address === 'number' ? address : quote.address_id ?? quote.address_details?.id ?? null

    return {
      ...rest,
      contact_id: contactId,
      address_id: addressId,
    }
  }

  const sj = quote.source_job || {}
  const c = quote.contact || {}
  const addr = quote.address
  const schedule = quote.quote_schedule || {}

  const customer_address = addr
    ? [addr.street_address, addr.city, addr.state, addr.postal_code].filter(Boolean).join(', ')
    : sj.customer_address || sj.address_details?.full_address || ''

  const durationSum =
    sj.items?.reduce((acc, it) => acc + (parseFloat(it.duration_hours) || 0), 0) || null

  const addressId =
    typeof sj.address === 'number' ? sj.address : addr?.id ?? null

  return {
    ...sj,
    id: quote.id,
    scheduled_at: schedule.scheduled_date || sj.scheduled_at,
    total_price: quote.final_total ?? sj.total_price,
    revised_total: quote.final_total != null ? Number(quote.final_total) : sj.revised_total,
    customer_name: sj.customer_name || [c.first_name, c.last_name].filter(Boolean).join(' ') || '',
    customer_phone: c.phone || sj.customer_phone,
    customer_email: c.email || sj.customer_email,
    customer_address,
    contact_id: c.id ?? sj.contact_id ?? null,
    address_id: addressId,
    ghl_contact_id: c.contact_id || sj.ghl_contact_id || '',
    notes: schedule.notes || sj.notes || '',
    items: Array.isArray(sj.items) ? sj.items : [],
    assignments: Array.isArray(sj.assignments) ? sj.assignments : [],
    title: sj.title || 'Job',
    description: sj.description || '',
    job_type: sj.job_type || 'one_time',
    priority: sj.priority || 'medium',
    duration_hours:
      durationSum && durationSum > 0
        ? durationSum
        : sj.duration_hours != null
          ? parseFloat(sj.duration_hours)
          : 2,
    quoted_by: quote.quoted_by ?? sj.quoted_by,
  }
}

const PendingRescheduleQuotes = () => {
  const [page, setPage] = useState(1)
  const [selectedJob, setSelectedJob] = useState(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const { data, isFetching, isError, error, refetch } = useGetReschedulePendingSubmissionsQuery({
    page,
    page_size: PAGE_SIZE,
  })

  const results = data?.results ?? []
  const totalCount = data?.count ?? 0
  const pageCount = Math.max(1, Math.ceil((totalCount || 0) / PAGE_SIZE))

  const handleConvertToJob = (quote) => {
    setSelectedJob(mapRescheduleSubmissionToConvertJob(quote))
    setEditDialogOpen(true)
  }

  const handleJobUpdate = () => {
    refetch()
    setEditDialogOpen(false)
    setSelectedJob(null)
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Repeat Job Requests
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Customers who requested to book a previous job again will appear here.
      </Typography>

      {isFetching && <QuoteCardSkeleton count={6} />}

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error?.data?.detail || error?.data?.message || 'Failed to load repeat job requests.'}
        </Alert>
      )}

      {!isFetching && !isError && results.length === 0 && (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            bgcolor: 'action.hover',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No repeat job requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            When customers request a job again from the portal, they will appear here.
          </Typography>
        </Box>
      )}

      {!isFetching && !isError && results.length > 0 && (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
              gap: 2,
              width: '100%',
              alignItems: 'stretch',
            }}
          >
            {results.map((row) => (
              <ReschedulePendingQuoteCard
                key={row.id}
                row={row}
                onConvertToJob={handleConvertToJob}
              />
            ))}
          </Box>

          {totalCount > PAGE_SIZE && (
            <Stack alignItems="center" sx={{ mt: 3 }}>
              <Pagination
                count={pageCount}
                page={page}
                onChange={(_, p) => setPage(p)}
                color="primary"
              />
            </Stack>
          )}
        </>
      )}

      {selectedJob && (
        <EditJobDialog
          job={selectedJob}
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false)
            setSelectedJob(null)
          }}
          objective="convert"
          convertQueryFilter="status=reschedule_pending"
          handleJobUpdate={handleJobUpdate}
        />
      )}
    </Box>
  )
}

export default PendingRescheduleQuotes
