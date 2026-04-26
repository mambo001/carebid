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
    <Card elevation={0} sx={{ borderRadius: 4 }}>
      <CardContent>
        <Stack spacing={3}>
          <div>
            <Typography variant="h6" fontWeight={700}>
              {existingBid ? "Update provider bid" : "Provider bid controls"}
            </Typography>
            <Typography color="text.secondary">
              {existingBid
                ? "You already submitted a bid for this request. Editing this form updates that bid."
                : "Bids are submitted via the Effect-based API and streamed in real-time via server-sent events."}
            </Typography>
          </div>

          <Form<ProviderBidFormValues>
            initialValues={initialValues}
            onSubmit={(values) =>
              placeBid.mutateAsync(providerBidSubmitInput(requestId, values))
            }
            render={({ handleSubmit, submitting }) => (
              <form onSubmit={handleSubmit} noValidate>
                <Stack spacing={2}>
                  {placeBid.isSuccess && (
                    <Alert severity="success">Bid saved to the room.</Alert>
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
                    disabled={submitting || placeBid.isPending}
                  >
                    {placeBid.isPending
                      ? "Saving bid..."
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
