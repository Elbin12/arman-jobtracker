import { useState } from "react"
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Chip,
  Typography,
} from "@mui/material"
import { Check, Close, ExpandMore } from "@mui/icons-material"

const isQuoteSelected = (packageQuote, selection) =>
  packageQuote.is_selected ||
  selection.selected_package === packageQuote.package ||
  selection.selected_package_details?.id === packageQuote.package

const PackageFeaturesList = ({ packageQuote, muted = false }) => {
  const features = [
    ...(packageQuote.included_features_details || []).map((f) => ({ ...f, included: true })),
    ...(packageQuote.excluded_features_details || []).map((f) => ({ ...f, included: false })),
  ]

  if (!features.length) return null

  return (
    <Box>
      {features.map((feature) => (
        <Box key={feature.id} display="flex" alignItems="center" mb={0.8}>
          {feature.included ? (
            <Check sx={{ fontSize: 18, color: muted ? "#9e9e9e" : "#42bd3f", mr: 1 }} />
          ) : (
            <Close sx={{ fontSize: 18, color: "#9e9e9e", mr: 1 }} />
          )}
          <Typography
            variant="body2"
            sx={{
              color: feature.included ? (muted ? "text.disabled" : "text.primary") : "text.disabled",
              fontWeight: feature.included && !muted ? 500 : 400,
            }}
          >
            {feature.name}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}

const SelectedPackageCard = ({ packageQuote, selection, formatPrice }) => {
  const displayName =
    packageQuote?.package_name || selection.selected_package_details?.name || "Selected package"
  const displayPrice =
    selection.final_total_price != null && selection.final_total_price !== ""
      ? selection.final_total_price
      : packageQuote?.total_price

  return (
    <Card
      variant="outlined"
      sx={{
        border: "2px solid #42bd3f",
        bgcolor: "#f8fff8",
        borderRadius: 3,
        minHeight: 220,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight={700}>
            {displayName}
          </Typography>
          <Chip
            label="Selected"
            sx={{
              bgcolor: "#42bd3f",
              color: "white",
              fontWeight: 600,
            }}
          />
        </Box>

        <Typography variant="h4" sx={{ color: "#42bd3f", fontWeight: 700, mb: 2 }}>
          {formatPrice(displayPrice)}
        </Typography>

        {packageQuote && <PackageFeaturesList packageQuote={packageQuote} />}
      </CardContent>
    </Card>
  )
}

const UnselectedPackageItem = ({ packageQuote, formatPrice }) => (
  <Accordion
    disableGutters
    elevation={0}
    sx={{
      border: "1px solid #e2e8f0",
      borderRadius: "8px !important",
      mb: 1,
      "&:before": { display: "none" },
      "&.Mui-expanded": { mb: 1 },
      bgcolor: "#fafbfc",
    }}
  >
    <AccordionSummary
      expandIcon={<ExpandMore sx={{ color: "#64748b" }} />}
      sx={{
        minHeight: 48,
        "& .MuiAccordionSummary-content": { my: 1 },
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" pr={1}>
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
          {packageQuote.package_name}
        </Typography>
        <Typography variant="subtitle2" fontWeight={600} color="text.disabled">
          {formatPrice(packageQuote.total_price)}
        </Typography>
      </Box>
    </AccordionSummary>
    <AccordionDetails sx={{ pt: 0, pb: 2 }}>
      <PackageFeaturesList packageQuote={packageQuote} muted />
    </AccordionDetails>
  </Accordion>
)

const PackageOptionsSummary = ({ selection, formatPrice }) => {
  const packageQuotes = selection?.package_quotes || []
  const [otherOptionsOpen, setOtherOptionsOpen] = useState(false)

  const selectedQuote =
    packageQuotes.find((q) => isQuoteSelected(q, selection)) ||
    (selection.selected_package_details
      ? packageQuotes.find((q) => q.package === selection.selected_package)
      : null)

  const unselectedQuotes = packageQuotes.filter((q) => !isQuoteSelected(q, selection))

  if (!selectedQuote && !selection.selected_package_details && !packageQuotes.length) {
    return null
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: "#023c8f" }}>
        Selected Package
      </Typography>

      <SelectedPackageCard
        packageQuote={selectedQuote}
        selection={selection}
        formatPrice={formatPrice}
      />

      {unselectedQuotes.length > 0 && (
        <Accordion
          expanded={otherOptionsOpen}
          onChange={(_, expanded) => setOtherOptionsOpen(expanded)}
          disableGutters
          elevation={0}
          sx={{
            mt: 2,
            border: "1px solid #e2e8f0",
            borderRadius: 2,
            "&:before": { display: "none" },
            bgcolor: "white",
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore sx={{ color: "#023c8f" }} />}
            sx={{
              px: 2,
              "& .MuiAccordionSummary-content": { my: 1.5 },
            }}
          >
            <Typography variant="subtitle2" fontWeight={600} sx={{ color: "#023c8f" }}>
              View other package options ({unselectedQuotes.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
            {unselectedQuotes.map((packageQuote) => (
              <UnselectedPackageItem
                key={packageQuote.id}
                packageQuote={packageQuote}
                formatPrice={formatPrice}
              />
            ))}
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  )
}

export default PackageOptionsSummary
