import React from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import { Form } from "react-final-form";
import { TextField } from "mui-rff";

import type { BidInput } from "../../../lib/api";

import { usePlaceBidMutation } from "../../../lib/queries";

const required = (value: unknown) => (value ? undefined : "Required");

export function ProviderBidCard({ requestId }: { requestId: string }) {
  const placeBid = usePlaceBidMutation(requestId);

  const initialValues: BidInput = {
    requestId,
    amount: 120000,
    availableDate: "2026-04-25",
    notes: "Open slot available this week.",
  };

  return (
    <Card elevation={0} sx={{ borderRadius: 4 }}>
      <CardContent>
        <Stack spacing={3}>
          <div>
            <Typography variant="h6" fontWeight={700}>
              Provider bid controls
            </Typography>
            <Typography color="text.secondary">
              Bids are serialized through the request room Durable Object.
            </Typography>
          </div>

          <Form<BidInput>
            initialValues={initialValues}
            onSubmit={(values) =>
              placeBid.mutateAsync({
                ...values,
                requestId,
                notes: values.notes ?? null,
              })
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
                    fieldProps={{ validate: required }}
                  />
                  <TextField
                    name="availableDate"
                    label="Available date"
                    type="date"
                    required
                    fieldProps={{ validate: required }}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField name="notes" label="Notes" multiline minRows={2} />

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={submitting || placeBid.isPending}
                  >
                    {placeBid.isPending ? "Saving bid..." : "Place bid"}
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
