const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const resp = (name: string) => ({ $ref: `#/components/responses/${name}` });
const json = (schema: any) => ({ "application/json": { schema } });

const envelope = (data?: any, message = "Success") => ({
  type: "object",
  properties: {
    success: { type: "boolean", example: true },
    message: { type: "string", example: message },
    ...(data ? { data } : {}),
  },
});

const ok = (description: string, data?: any, code = "200") => ({
  [code]: { description, content: json(envelope(data, description)) },
});

const body = (schema: any) => ({
  required: true,
  content: json(schema),
});

const idParam = (name = "id", description = "Resource ID (UUID)") => ({
  name,
  in: "path",
  required: true,
  description,
  schema: { type: "string", format: "uuid" },
});

const pageParams = [
  { name: "page", in: "query", schema: { type: "integer", default: 1 } },
  { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
];

const secured = [{ bearerAuth: [] }];

const errs = (...codes: ("400" | "401" | "403" | "404")[]) =>
  Object.fromEntries(
    codes.map((c) => [
      c,
      resp(
        {
          "400": "ValidationError",
          "401": "Unauthorized",
          "403": "Forbidden",
          "404": "NotFound",
        }[c],
      ),
    ]),
  );

export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "SwiftShip Courier & Logistics API",
    version: "1.0.0",
    description: [
      "SwiftShip is a courier and logistics management REST API.",
      "",
      "**Roles:** `CUSTOMER` books and pays for parcels, `COURIER` delivers them, `ADMIN` / `SUPER_ADMIN` oversee everything.",
      "",
      "**Auth:** click **Authorize** and paste the access token from `/auth/login` (without the `Bearer ` prefix).",
      "",
      "**Payments:** bKash and Stripe. Both return a hosted checkout URL which the client redirects to.",
      "",
      "**Response format:** every response uses `{ success, message, data }`. Errors use `{ success: false, message, errors }`.",
    ].join("\n"),
    contact: {
      name: "SwiftShip",
      url: "https://github.com/Topurayhan554/SwiftShip-Backend",
    },
  },
  servers: [
    {
      url: "https://swift-ship-backend-theta.vercel.app/api/v1",
      description: "Production",
    },
    { url: "http://localhost:5000/api/v1", description: "Local" },
  ],
  tags: [
    {
      name: "Auth",
      description:
        "Registration with OTP, login, tokens, Google login, password reset",
    },
    { name: "User", description: "Profile management" },
    { name: "Parcels", description: "Booking, tracking and status updates" },
    { name: "Payment", description: "bKash and Stripe checkout" },
    { name: "Review", description: "Reviews for delivered parcels" },
    { name: "Admin", description: "Admin-only operations" },
  ],
  security: secured,
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    responses: {
      ValidationError: {
        description: "Validation failed",
        content: json(ref("ErrorResponse")),
      },
      Unauthorized: {
        description: "Missing, invalid or expired token",
        content: json(ref("ErrorResponse")),
      },
      Forbidden: {
        description: "Your role cannot access this endpoint",
        content: json(ref("ErrorResponse")),
      },
      NotFound: {
        description: "Resource not found",
        content: json(ref("ErrorResponse")),
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Something went wrong" },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                path: { type: "string", example: "email" },
                message: { type: "string", example: "Invalid email" },
              },
            },
          },
        },
      },
      Role: {
        type: "string",
        enum: ["CUSTOMER", "COURIER", "ADMIN", "SUPER_ADMIN"],
      },
      UserStatus: { type: "string", enum: ["ACTIVE", "BLOCKED", "DELETED"] },
      ParcelStatus: {
        type: "string",
        enum: [
          "PENDING",
          "APPROVED",
          "ASSIGNED",
          "PICKED_UP",
          "IN_TRANSIT",
          "DELIVERED",
          "CANCELLED",
          "FAILED",
        ],
      },
      ParcelType: {
        type: "string",
        enum: ["DOCUMENT", "PACKAGE", "FRAGILE", "ELECTRONICS", "OTHER"],
      },
      PaymentStatus: {
        type: "string",
        enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      },
      PaymentGateway: { type: "string", enum: ["STRIPE", "BKASH"] },

      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Rahim Uddin" },
          email: { type: "string", format: "email" },
          phone: { type: "string", nullable: true },
          role: ref("Role"),
          status: ref("UserStatus"),
          createdAt: { type: "string", format: "date-time" },
        },
      },
      AuthTokens: {
        type: "object",
        properties: {
          accessToken: { type: "string" },
          refreshToken: { type: "string" },
          user: ref("User"),
        },
      },
      Payment: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          parcelId: { type: "string", format: "uuid" },
          amount: { type: "number", example: 120 },
          gateway: ref("PaymentGateway"),
          status: ref("PaymentStatus"),
          transactionId: { type: "string", nullable: true },
          paidAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      Parcel: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          trackingId: { type: "string", example: "SWF-20261031-A1B2C3" },
          parcelType: ref("ParcelType"),
          description: { type: "string", nullable: true },
          weightKg: { type: "number", example: 2.5 },
          fee: { type: "number", example: 120 },
          pickupAddress: { type: "string" },
          deliveryAddress: { type: "string" },
          receiverName: { type: "string" },
          receiverPhone: { type: "string", example: "+8801712345678" },
          status: ref("ParcelStatus"),
          courierId: { type: "string", format: "uuid", nullable: true },
          estimatedDelivery: {
            type: "string",
            format: "date-time",
            nullable: true,
          },
          actualDelivery: {
            type: "string",
            format: "date-time",
            nullable: true,
          },
          createdAt: { type: "string", format: "date-time" },
          payment: { ...ref("Payment"), nullable: true },
        },
      },
      ParcelStatusLog: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          status: ref("ParcelStatus"),
          note: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Review: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          parcelId: { type: "string", format: "uuid" },
          rating: { type: "integer", minimum: 1, maximum: 5 },
          comment: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      CreateParcelInput: {
        type: "object",
        required: [
          "parcelType",
          "weightKg",
          "pickupAddress",
          "deliveryAddress",
          "receiverName",
          "receiverPhone",
        ],
        properties: {
          parcelType: ref("ParcelType"),
          weightKg: { type: "number", minimum: 0.1, example: 2.5 },
          pickupAddress: {
            type: "string",
            example: "House 12, Road 4, Dinajpur",
          },
          deliveryAddress: {
            type: "string",
            example: "Flat 3B, Dhanmondi, Dhaka",
          },
          receiverName: { type: "string", example: "Karim Hossain" },
          receiverPhone: { type: "string", example: "+8801712345678" },
          description: { type: "string", example: "Documents" },
        },
      },
      PaymentInitInput: {
        type: "object",
        required: ["parcelId"],
        properties: { parcelId: { type: "string", format: "uuid" } },
      },
      PaymentUrl: {
        type: "object",
        properties: {
          paymentUrl: {
            type: "string",
            format: "uri",
            description: "Redirect the customer to this URL",
          },
        },
      },
    },
  },

  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new account",
        description:
          "Creates the account and emails a one-time code. Verify it with `/auth/verify-otp`.",
        security: [],
        requestBody: body({
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", example: "Rahim Uddin" },
            email: {
              type: "string",
              format: "email",
              example: "rahim@example.com",
            },
            password: { type: "string", minLength: 6, example: "Pass@1234" },
            phone: { type: "string", example: "+8801712345678" },
            role: {
              type: "string",
              enum: ["CUSTOMER", "COURIER"],
              default: "CUSTOMER",
            },
          },
        }),
        responses: {
          ...ok("OTP sent to email", ref("User"), "201"),
          ...errs("400"),
        },
      },
    },
    "/auth/verify-otp": {
      post: {
        tags: ["Auth"],
        summary: "Verify email with OTP",
        security: [],
        requestBody: body({
          type: "object",
          required: ["email", "otp"],
          properties: {
            email: { type: "string", format: "email" },
            otp: { type: "string", example: "482915" },
          },
        }),
        responses: { ...ok("Email verified"), ...errs("400") },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login with email and password",
        security: [],
        requestBody: body({
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "admin@swiftship.com",
            },
            password: { type: "string", example: "Pass@1234" },
          },
        }),
        responses: {
          ...ok("Login successful", ref("AuthTokens")),
          ...errs("400", "401"),
        },
      },
    },
    "/auth/google": {
      post: {
        tags: ["Auth"],
        summary: "Login with Google",
        security: [],
        requestBody: body({
          type: "object",
          required: ["idToken"],
          properties: {
            idToken: {
              type: "string",
              description: "Google ID token from the client",
            },
          },
        }),
        responses: {
          ...ok("Login successful", ref("AuthTokens")),
          ...errs("400", "401"),
        },
      },
    },
    "/auth/refresh-token": {
      post: {
        tags: ["Auth"],
        summary: "Get a new access token",
        security: [],
        requestBody: body({
          type: "object",
          required: ["refreshToken"],
          properties: { refreshToken: { type: "string" } },
        }),
        responses: {
          ...ok("Token refreshed", {
            type: "object",
            properties: { accessToken: { type: "string" } },
          }),
          ...errs("401"),
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Send password reset email",
        security: [],
        requestBody: body({
          type: "object",
          required: ["email"],
          properties: { email: { type: "string", format: "email" } },
        }),
        responses: { ...ok("Reset instructions sent"), ...errs("400", "404") },
      },
    },
    "/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password",
        security: [],
        requestBody: body({
          type: "object",
          required: ["email", "otp", "newPassword"],
          properties: {
            email: { type: "string", format: "email" },
            otp: { type: "string" },
            newPassword: { type: "string", minLength: 6 },
          },
        }),
        responses: { ...ok("Password updated"), ...errs("400") },
      },
    },

    "/user/me": {
      get: {
        tags: ["User"],
        summary: "Get my profile",
        responses: { ...ok("Profile", ref("User")), ...errs("401") },
      },
      patch: {
        tags: ["User"],
        summary: "Update my profile",
        description:
          "Send as `multipart/form-data` to upload a profile photo (Cloudinary).",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  phone: { type: "string" },
                  photo: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          ...ok("Profile updated", ref("User")),
          ...errs("400", "401"),
        },
      },
    },

    "/parcels": {
      post: {
        tags: ["Parcels"],
        summary: "Book a parcel",
        description:
          "**Role:** CUSTOMER. The delivery fee is calculated by the server.",
        requestBody: body(ref("CreateParcelInput")),
        responses: {
          ...ok("Parcel booked", ref("Parcel"), "201"),
          ...errs("400", "401", "403"),
        },
      },
    },
    "/parcels/my": {
      get: {
        tags: ["Parcels"],
        summary: "List my parcels",
        description: "**Role:** CUSTOMER. Includes the `payment` relation.",
        parameters: [
          ...pageParams,
          { name: "status", in: "query", schema: ref("ParcelStatus") },
        ],
        responses: {
          ...ok("My parcels", { type: "array", items: ref("Parcel") }),
          ...errs("401", "403"),
        },
      },
    },
    "/parcels/assigned": {
      get: {
        tags: ["Parcels"],
        summary: "List parcels assigned to me",
        description: "**Role:** COURIER.",
        parameters: pageParams,
        responses: {
          ...ok("Assigned parcels", { type: "array", items: ref("Parcel") }),
          ...errs("401", "403"),
        },
      },
    },
    "/parcels/track/{trackingId}": {
      get: {
        tags: ["Parcels"],
        summary: "Track a parcel (public)",
        security: [],
        parameters: [
          {
            name: "trackingId",
            in: "path",
            required: true,
            schema: { type: "string" },
            example: "SWF-20261031-A1B2C3",
          },
        ],
        responses: {
          ...ok("Parcel with status history", {
            allOf: [
              ref("Parcel"),
              {
                type: "object",
                properties: {
                  statusLogs: { type: "array", items: ref("ParcelStatusLog") },
                },
              },
            ],
          }),
          ...errs("404"),
        },
      },
    },
    "/parcels/{id}": {
      get: {
        tags: ["Parcels"],
        summary: "Get parcel details",
        parameters: [idParam()],
        responses: {
          ...ok("Parcel", ref("Parcel")),
          ...errs("401", "403", "404"),
        },
      },
      patch: {
        tags: ["Parcels"],
        summary: "Edit a parcel",
        description:
          "**Role:** CUSTOMER (owner). Only while status is `PENDING`.",
        parameters: [idParam()],
        requestBody: body({
          type: "object",
          properties: {
            pickupAddress: { type: "string" },
            deliveryAddress: { type: "string" },
            receiverName: { type: "string" },
            receiverPhone: { type: "string" },
            description: { type: "string" },
          },
        }),
        responses: {
          ...ok("Parcel updated", ref("Parcel")),
          ...errs("400", "401", "403", "404"),
        },
      },
    },
    "/parcels/{id}/cancel": {
      patch: {
        tags: ["Parcels"],
        summary: "Cancel a parcel",
        description:
          "**Role:** CUSTOMER (owner). Only while status is `PENDING`.",
        parameters: [idParam()],
        responses: {
          ...ok("Parcel cancelled", ref("Parcel")),
          ...errs("400", "401", "403", "404"),
        },
      },
    },
    "/parcels/{id}/status": {
      patch: {
        tags: ["Parcels"],
        summary: "Update delivery status",
        description:
          "**Role:** COURIER (assigned) or ADMIN. A status log entry is written in the same transaction.",
        parameters: [idParam()],
        requestBody: body({
          type: "object",
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: ["PICKED_UP", "IN_TRANSIT", "DELIVERED", "FAILED"],
            },
            note: { type: "string", example: "Receiver not available" },
          },
        }),
        responses: {
          ...ok("Status updated", ref("Parcel")),
          ...errs("400", "401", "403", "404"),
        },
      },
    },
    "/parcels/{id}/logs": {
      get: {
        tags: ["Parcels"],
        summary: "Get status history",
        parameters: [idParam()],
        responses: {
          ...ok("Status logs", {
            type: "array",
            items: ref("ParcelStatusLog"),
          }),
          ...errs("401", "404"),
        },
      },
    },

    "/parcels/payment/initiate": {
      post: {
        tags: ["Payment"],
        summary: "Start bKash payment",
        description:
          "Creates a bKash session and returns the checkout URL. Amount comes from `parcel.fee`, never from the client.",
        requestBody: body(ref("PaymentInitInput")),
        responses: {
          ...ok("bKash checkout URL", ref("PaymentUrl")),
          ...errs("400", "401", "404"),
        },
      },
    },
    "/parcels/payment/initiate-stripe": {
      post: {
        tags: ["Payment"],
        summary: "Start Stripe payment",
        description: "Creates a Stripe Checkout Session and returns its URL.",
        requestBody: body(ref("PaymentInitInput")),
        responses: {
          ...ok("Stripe checkout URL", ref("PaymentUrl")),
          ...errs("400", "401", "404"),
        },
      },
    },
    "/parcels/payment/callback": {
      get: {
        tags: ["Payment"],
        summary: "bKash callback",
        description:
          "Called by bKash after checkout. The server verifies the transaction with bKash and marks the payment `PAID` or `FAILED`, then redirects to the frontend.",
        security: [],
        parameters: [
          { name: "paymentID", in: "query", schema: { type: "string" } },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["success", "failure", "cancel"] },
          },
        ],
        responses: {
          "302": {
            description: "Redirect to frontend with the payment result",
          },
        },
      },
    },
    "/parcels/payment/stripe-webhook": {
      post: {
        tags: ["Payment"],
        summary: "Stripe webhook",
        description:
          "Handles `checkout.session.completed`. Verified with the `stripe-signature` header. Not for manual use.",
        security: [],
        responses: {
          "200": { description: "Event received" },
          "400": { description: "Invalid signature" },
        },
      },
    },

    "/review": {
      post: {
        tags: ["Review"],
        summary: "Review a delivered parcel",
        description:
          "**Role:** CUSTOMER (owner). Parcel must be `DELIVERED`. One review per parcel.",
        requestBody: body({
          type: "object",
          required: ["parcelId", "rating"],
          properties: {
            parcelId: { type: "string", format: "uuid" },
            rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
            comment: { type: "string", example: "Fast and careful delivery" },
          },
        }),
        responses: {
          ...ok("Review created", ref("Review"), "201"),
          ...errs("400", "401", "403"),
        },
      },
    },
    "/review/parcel/{parcelId}": {
      get: {
        tags: ["Review"],
        summary: "Get review for a parcel",
        parameters: [idParam("parcelId", "Parcel ID")],
        responses: { ...ok("Review", ref("Review")), ...errs("401", "404") },
      },
    },

    "/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "List users",
        description: "**Role:** ADMIN, SUPER_ADMIN.",
        parameters: [
          ...pageParams,
          { name: "role", in: "query", schema: ref("Role") },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: {
          ...ok("Users", { type: "array", items: ref("User") }),
          ...errs("401", "403"),
        },
      },
    },
    "/admin/users/{id}/status": {
      patch: {
        tags: ["Admin"],
        summary: "Block or unblock a user",
        parameters: [idParam()],
        requestBody: body({
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["ACTIVE", "BLOCKED"] },
          },
        }),
        responses: {
          ...ok("User updated", ref("User")),
          ...errs("400", "401", "403", "404"),
        },
      },
    },
    "/admin/parcels": {
      get: {
        tags: ["Admin"],
        summary: "List all parcels",
        parameters: [
          ...pageParams,
          { name: "status", in: "query", schema: ref("ParcelStatus") },
          {
            name: "search",
            in: "query",
            schema: { type: "string" },
            description: "Tracking ID or receiver name",
          },
        ],
        responses: {
          ...ok("Parcels", { type: "array", items: ref("Parcel") }),
          ...errs("401", "403"),
        },
      },
    },
    "/admin/parcels/{id}/approve": {
      patch: {
        tags: ["Admin"],
        summary: "Approve a parcel",
        parameters: [idParam()],
        responses: {
          ...ok("Parcel approved", ref("Parcel")),
          ...errs("400", "401", "403", "404"),
        },
      },
    },
    "/admin/parcels/{id}/assign": {
      patch: {
        tags: ["Admin"],
        summary: "Assign or reassign a courier",
        parameters: [idParam()],
        requestBody: body({
          type: "object",
          required: ["courierId"],
          properties: { courierId: { type: "string", format: "uuid" } },
        }),
        responses: {
          ...ok("Courier assigned", ref("Parcel")),
          ...errs("400", "401", "403", "404"),
        },
      },
    },
    "/admin/payments": {
      get: {
        tags: ["Admin"],
        summary: "List all payments",
        parameters: [
          ...pageParams,
          { name: "status", in: "query", schema: ref("PaymentStatus") },
          { name: "gateway", in: "query", schema: ref("PaymentGateway") },
        ],
        responses: {
          ...ok("Payments", { type: "array", items: ref("Payment") }),
          ...errs("401", "403"),
        },
      },
    },
    "/admin/audit-logs": {
      get: {
        tags: ["Admin"],
        summary: "View audit logs",
        parameters: pageParams,
        responses: {
          ...ok("Audit logs", {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                action: { type: "string", example: "PARCEL_ASSIGNED" },
                userId: { type: "string" },
                createdAt: { type: "string", format: "date-time" },
              },
            },
          }),
          ...errs("401", "403"),
        },
      },
    },
  },
} as const;
