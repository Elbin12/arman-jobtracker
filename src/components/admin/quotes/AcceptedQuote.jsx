import { LocationOnOutlined, MailOutline, PhoneAndroid, CalendarToday, AttachMoney, AccessTime, WorkOutline, Person, Delete } from '@mui/icons-material'
import { Avatar, Box, Card, CardContent, CardHeader, Typography, Chip, Divider, Grid, Button, IconButton } from '@mui/material'
import { User } from 'lucide-react'
import React from 'react'

const AcceptedQuote = ({ quote, handleEdit, handleDelete }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';

    // Split ISO string manually to avoid local timezone conversion
    const [datePart, timePart] = dateString.split('T');
    const [year, month, day] = datePart.split('-');
    const [hourStr, minuteStr] = timePart.replace('Z', '').split(':');

    let hour = parseInt(hourStr, 10);
    const minute = minuteStr.padStart(2, '0');

    // Convert to 12-hour format
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12; // 0 -> 12

    // Get weekday name (using UTC to avoid conversion)
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const weekday = weekdays[utcDate.getUTCDay()];
    const monthName = months[month - 1];

    return `${weekday}, ${monthName} ${day}, ${year} ${hour}:${minute} ${ampm}`;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const getStatusColor = (status) => {
    const statusColors = {
      to_convert: 'warning',
      accepted: 'success',
      pending: 'info',
      rejected: 'error'
    }
    return statusColors[status] || 'default'
  }

  const getJobTypeLabel = (jobType) => {
    const labels = {
      one_time: 'One-Time Job',
      recurring: 'Recurring Job',
      subscription: 'Subscription'
    }
    return labels[jobType] || jobType
  }

  const getJobTypeColor = (jobType) => {
    const colors = {
      one_time: 'default',
      recurring: 'primary',
      subscription: 'secondary'
    }
    return colors[jobType] || 'default'
  }

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
          "& .MuiCardHeader-root": {
            overflow: "visible",
          },

          "& .MuiCardHeader-avatar": {
            alignSelf: "flex-start",
            marginTop: "4px",
          },

          "& .MuiCardHeader-content": {
            minWidth: 0,
            overflow: "hidden",
          },

          "& .MuiCardHeader-action": {
            margin: 0,
            alignSelf: "flex-start",
          },

          // Force a 3-column grid
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "start",
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
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {quote?.customer_name || 'Unknown Customer'}
          </Typography>
        }
        subheader={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            <MailOutline sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
            <Typography
              variant="body2"
              component="a"
              href={`mailto:${quote?.customer_email}`}
              sx={{
                color: "text.secondary",
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                textDecoration: "none",
                "&:hover": {
                  color: "primary.main",
                  textDecoration: "underline",
                },
              }}
            >
              {quote?.customer_email || 'No email provided'}
            </Typography>
          </Box>
        }
        action={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              label={getJobTypeLabel(quote?.job_type)}
              color={getJobTypeColor(quote?.job_type)}
              size="small"
              variant="outlined"
            />

            {handleDelete && (
              <IconButton
                size="small"
                onClick={() => handleDelete(quote)}
                sx={{ color: "error.main" }}
              >
                <Delete fontSize="small" />
              </IconButton>
            )}
          </Box>
        }
      />

      
      <Divider />
      
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 0.2 }}>
        {/* Quote Details */}
        {/* <Box>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            {quote?.title || 'Untitled Quote'}
          </Typography>
          {quote?.description && (
            <Typography variant="body2" color="text.secondary">
              {quote.description}
            </Typography>
          )}
        </Box> */}

        {/* Contact Information */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <PhoneAndroid fontSize="small" color="action" />
            <Typography 
              component="a" 
              href={`tel:${quote?.customer_phone}`} 
              variant="body2"
              sx={{ 
                color: 'primary.main', 
                textDecoration: 'none', 
                '&:hover': { textDecoration: 'underline' } 
              }}
            >
              {quote?.customer_phone || 'No phone provided'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <LocationOnOutlined fontSize="small" color="action" sx={{ mt: 0.2 }} />
            <Typography variant="body2" color="text.primary">
              {quote?.customer_address || 'No address provided'}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Services/Items */}
        {quote?.items && quote.items.length > 0 && (
          <>
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Services
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {quote.items.map((item) => (
                  <Box 
                    key={item.id} 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      p: 1.5,
                      bgcolor: 'action.hover',
                      borderRadius: 1
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={500}>
                        {item.custom_name || item.service_name}
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
              </Box>
            </Box>
            <Divider sx={{ my: 1 }} />
          </>
        )}

        {/* Assigned Workers */}
        {/* {quote?.assignments && quote.assignments.length > 0 && (
          <>
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Assigned Team
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {quote.assignments.map((assignment) => (
                  <Chip
                    key={assignment.id}
                    icon={<Person />}
                    label={assignment.user_name}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
            <Divider sx={{ my: 1 }} />
          </>
        )} */}

        {/* Job Details */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <CalendarToday fontSize="small" color="action" />
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Scheduled
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {formatDate(quote?.scheduled_at)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <AccessTime fontSize="small" color="action" />
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Duration
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {quote?.duration_hours ? `${quote.duration_hours} hours` : 'Not specified'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <AttachMoney fontSize="small" color="action" />
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Total Price
              </Typography>
              <Typography variant="h6" color="primary.main" fontWeight={600}>
                {quote?.total_price ? formatPrice(quote.total_price) : 'N/A'}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{mt: 'auto' }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => handleEdit(quote)}
          >
            Convert to job
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}

export default AcceptedQuote