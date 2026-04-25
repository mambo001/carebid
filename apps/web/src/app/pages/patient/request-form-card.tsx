import React from "react"
import {
  Alert,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { Form } from "react-final-form";
import { Select, TextField } from "mui-rff";

import { useCreateRequestMutation } from "../../../lib/queries";
import {
  bodyAreaOptions,
  createInitialRequestValues,
  imagingTypeOptions,
  requestCategoryOptions,
  serviceModeOptions,
  specialistVisitTypeOptions,
  urgencyOptions,
  type RequestFormValues,
} from "../../../lib/request-form";

const required = (value: unknown) => (value ? undefined : "Required");

export function PatientRequestFormCard() {
  const createRequest = useCreateRequestMutation();
  const initialValues = createInitialRequestValues();

  return (
    <Card elevation={0} sx={{ borderRadius: 4 }}>
      <CardContent>
        <Stack spacing={3}>
          <div>
            <Typography variant="h6" fontWeight={700}>
              Create request
            </Typography>
            <Typography color="text.secondary">
              Start with a sanitized request. This currently saves into the demo
              backend flow.
            </Typography>
          </div>

          <Form<RequestFormValues>
            initialValues={initialValues}
            onSubmit={async (values) => {
              await createRequest.mutateAsync(values);
            }}
            render={({ handleSubmit, submitting, values }) => {
              const currentValues = values ?? initialValues;

              return (
                <form onSubmit={handleSubmit} noValidate>
                  <Stack spacing={2.5}>
                    {createRequest.isSuccess && (
                      <Alert severity="success">
                        Request created and added to the dashboard list.
                      </Alert>
                    )}

                    {createRequest.isError && (
                      <Alert severity="error">Failed to create request.</Alert>
                    )}

                    <Select
                      name="category"
                      label="Category"
                      required
                      fieldProps={{ validate: required }}
                    >
                      {requestCategoryOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>

                    <TextField
                      name="title"
                      label="Title"
                      required
                      fieldProps={{ validate: required }}
                    />

                    <TextField
                      name="sanitizedSummary"
                      label="Sanitized summary"
                      required
                      fieldProps={{ validate: required }}
                      multiline
                      minRows={3}
                    />

                    <TextField
                      name="targetBudget"
                      label="Target budget"
                      required
                      fieldProps={{ validate: required }}
                      type="number"
                    />

                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <TextField
                        name="locationCity"
                        label="City"
                        required
                        fieldProps={{ validate: required }}
                      />
                      <TextField
                        name="locationRegion"
                        label="Region"
                        required
                        fieldProps={{ validate: required }}
                      />
                    </Stack>

                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <TextField
                        name="preferredStartDate"
                        label="Preferred start date"
                        required
                        fieldProps={{ validate: required }}
                        type="date"
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        name="preferredEndDate"
                        label="Preferred end date"
                        required
                        fieldProps={{ validate: required }}
                        type="date"
                        InputLabelProps={{ shrink: true }}
                      />
                    </Stack>

                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <Select
                        name="urgency"
                        label="Urgency"
                        required
                        fieldProps={{ validate: required }}
                      >
                        {urgencyOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>

                      <Select
                        name="serviceMode"
                        label="Service mode"
                        required
                        fieldProps={{ validate: required }}
                      >
                        {serviceModeOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </Stack>

                    <TextField
                      name="expiresAt"
                      label="Bid expiry"
                      required
                      fieldProps={{ validate: required }}
                      type="datetime-local"
                      InputLabelProps={{ shrink: true }}
                    />

                    {currentValues.category === "specialist_consult" ? (
                      <>
                        <Select
                          name="details.visitType"
                          label="Visit type"
                          required
                          fieldProps={{ validate: required }}
                        >
                          {specialistVisitTypeOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>

                        <TextField
                          name="details.specialty"
                          label="Specialty"
                          required
                          fieldProps={{ validate: required }}
                        />
                      </>
                    ) : (
                      <>
                        <Select
                          name="details.imagingType"
                          label="Imaging type"
                          required
                          fieldProps={{ validate: required }}
                        >
                          {imagingTypeOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>

                        <Select
                          name="details.bodyArea"
                          label="Body area"
                          required
                          fieldProps={{ validate: required }}
                        >
                          {bodyAreaOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </>
                    )}

                    <Button
                      type="submit"
                      variant="contained"
                      disabled={submitting || createRequest.isPending}
                    >
                      {createRequest.isPending
                        ? "Saving request..."
                        : "Create request"}
                    </Button>
                  </Stack>
                </form>
              );
            }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
