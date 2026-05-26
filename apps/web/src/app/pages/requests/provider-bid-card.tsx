import React from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  InputAdornment,
  Stack,
  Typography,
} from "@mui/material";
import { Form } from "react-final-form";
import { TextField, DatePicker } from "mui-rff";

import type { Bid } from "../../../lib/api";

import { usePlaceBidMutation } from "../../../lib/queries";
import {
  providerBidInitialValues,
  providerBidSubmitInput,
  type ProviderBidFormValues,
} from "./provider-bid-card-submit";

const required = (value: unknown) => (value ? undefined : "Required");

export function ProviderBidCard({
  requestId,
  existingBid,
}: {
  requestId: string;
  existingBid?: Bid | null;
}) {
  const placeBid = usePlaceBidMutation(requestId);
  const initialValues = providerBidInitialValues(requestId, existingBid);

  return (
    <Card elevation={0}>
      <CardContent>
        <Stack spacing={2.5}>
          <Typography variant="h2">
            {existingBid ? "Update your bid" : "Place a bid"}
          </Typography>

          <Form<ProviderBidFormValues>
            initialValues={initialValues}
            onSubmit={(values) =>
              placeBid.mutateAsync(providerBidSubmitInput(requestId, values))
            }
            render={({ handleSubmit, submitting }) => (
              <form onSubmit={handleSubmit} noValidate>
                <Stack spacing={2}>
                  {placeBid.isSuccess && (
                    <Alert severity="success">Bid saved.</Alert>
                  )}

                  <TextField
                    name="amount"
                    label="Bid amount"
                    type="number"
                    required
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">$</InputAdornment>
                        ),
                      },
                    }}
                    fieldProps={{ validate: required }}
                  />
                  <DatePicker
                    name="availableDate"
                    label="Available date"
                    required
                    fieldProps={{ validate: required }}
                  />
                  <TextField name="notes" label="Notes" multiline minRows={2} />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={submitting || placeBid.isPending}
                  >
                    {placeBid.isPending
                      ? "Saving..."
                      : existingBid
                        ? "Update bid"
                        : "Place bid"}
                  </Button>
                </Stack>
              </form>
            )}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
