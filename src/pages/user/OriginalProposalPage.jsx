"use client";

import { useParams } from "react-router-dom";
import { Box, CircularProgress, Container, Typography } from "@mui/material";
import CheckoutSummary from "../../components/user/forms/CheckoutSummary";
import { useGetQuoteDetailsQuery } from "../../store/api/user/quoteApi";

const noop = () => {};

export default function OriginalProposalPage() {
  const { id } = useParams();
  const { data: quote, isLoading, isError } = useGetQuoteDetailsQuery(id, {
    skip: !id,
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress sx={{ color: "#023c8f" }} />
      </Box>
    );
  }

  if (isError || !quote) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h6" color="error" textAlign="center">
          Could not load the original proposal.
        </Typography>
      </Container>
    );
  }

  if (!quote.is_persisted_snapshot) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h6" color="text.secondary" textAlign="center">
          This quote is not a saved original proposal.
        </Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ py: { xs: 2, md: 4 }, bgcolor: "#fafafa", minHeight: "100vh" }}>
      <CheckoutSummary
        readOnly
        data={{ submission_id: id }}
        onUpdate={noop}
        setTermsAccepted={noop}
        setAdditionalNotes={noop}
        handleSignatureEnd={noop}
        setSignature={noop}
        isStepComplete={() => true}
        handleNext={noop}
      />
    </Box>
  );
}
