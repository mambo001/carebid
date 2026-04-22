import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "@effect/platform"
import { Schema } from "effect"

const ViewerRoleSchema = Schema.Literal("patient", "provider")

export const SessionGroup = HttpApiGroup.make("session")
  .annotate(OpenApi.Description, "Session and active-role endpoints")
  .add(
    HttpApiEndpoint.get("getSession", "/api/session")
      .addSuccess(Schema.Unknown)
      .annotate(OpenApi.Summary, "Load the current viewer session"),
  )
  .add(
    HttpApiEndpoint.post("switchRole", "/api/session/role")
      .setPayload(Schema.Struct({ role: Schema.optional(ViewerRoleSchema) }))
      .addSuccess(Schema.Unknown)
      .annotate(OpenApi.Summary, "Switch the active viewer role"),
  )

export const OnboardingGroup = HttpApiGroup.make("onboarding")
  .annotate(OpenApi.Description, "Patient and provider onboarding flows")
  .add(
    HttpApiEndpoint.post("onboardPatient", "/api/onboarding/patient")
      .setPayload(Schema.Unknown)
      .addSuccess(Schema.Unknown, { status: 201 })
      .annotate(OpenApi.Summary, "Create or update a patient profile"),
  )
  .add(
    HttpApiEndpoint.post("onboardProvider", "/api/onboarding/provider")
      .setPayload(Schema.Unknown)
      .addSuccess(Schema.Unknown, { status: 201 })
      .annotate(OpenApi.Summary, "Create or update a provider profile"),
  )

export const RequestGroup = HttpApiGroup.make("requests")
  .annotate(OpenApi.Description, "Care request and room lifecycle endpoints")
  .add(
    HttpApiEndpoint.get("listRequests", "/api/requests")
      .addSuccess(Schema.Unknown)
      .annotate(OpenApi.Summary, "List available care requests"),
  )
  .add(
    HttpApiEndpoint.post("validateRequest", "/api/requests/validate")
      .setPayload(Schema.Unknown)
      .addSuccess(Schema.Unknown)
      .annotate(OpenApi.Summary, "Validate a care request payload"),
  )
  .add(
    HttpApiEndpoint.post("createRequest", "/api/requests")
      .setPayload(Schema.Unknown)
      .addSuccess(Schema.Unknown, { status: 201 })
      .annotate(OpenApi.Summary, "Create a care request draft"),
  )
  .add(
    HttpApiEndpoint.post("openRequest", `/api/requests/${HttpApiSchema.param("requestId", Schema.String)}/open`)
      .addSuccess(Schema.Unknown)
      .annotate(OpenApi.Summary, "Open a request for bidding"),
  )
  .add(
    HttpApiEndpoint.get("getRoom", `/api/requests/${HttpApiSchema.param("requestId", Schema.String)}/room`)
      .addSuccess(Schema.Unknown)
      .annotate(OpenApi.Summary, "Load the room snapshot for a request"),
  )
  .add(
    HttpApiEndpoint.post("placeBid", `/api/requests/${HttpApiSchema.param("requestId", Schema.String)}/bids`)
      .setPayload(Schema.Unknown)
      .addSuccess(Schema.Unknown)
      .annotate(OpenApi.Summary, "Place or update a provider bid"),
  )
  .add(
    HttpApiEndpoint.post("withdrawBid", `/api/requests/${HttpApiSchema.param("requestId", Schema.String)}/bids/withdraw`)
      .setPayload(Schema.Unknown)
      .addSuccess(Schema.Unknown)
      .annotate(OpenApi.Summary, "Withdraw an active provider bid"),
  )
  .add(
    HttpApiEndpoint.post("acceptBid", `/api/requests/${HttpApiSchema.param("requestId", Schema.String)}/bids/accept`)
      .setPayload(Schema.Unknown)
      .addSuccess(Schema.Unknown)
      .annotate(OpenApi.Summary, "Accept a bid and award the request"),
  )
  .add(
    HttpApiEndpoint.post("expireRequest", `/api/requests/${HttpApiSchema.param("requestId", Schema.String)}/expire`)
      .addSuccess(Schema.Unknown)
      .annotate(OpenApi.Summary, "Expire an open request"),
  )
  .add(
    HttpApiEndpoint.get("streamRoom", `/api/requests/${HttpApiSchema.param("requestId", Schema.String)}/stream`)
      .setUrlParams(Schema.Struct({ token: Schema.optional(Schema.String) }))
      .addSuccess(
        Schema.String.pipe(
          HttpApiSchema.withEncoding({ kind: "Text", contentType: "text/event-stream" }),
        ),
      )
      .annotate(OpenApi.Summary, "Stream room snapshot updates over SSE"),
  )
