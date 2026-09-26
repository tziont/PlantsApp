# Plant Watering Control

**Technical Specification — POC**

---

## 1. Overview

**Plant Watering Control** is a web application for monitoring plant moisture conditions using connected plant moisture meters.

For the POC, physical moisture meters will be replaced by a **mock hardware layer** that behaves as if real moisture-meter devices were connected to the system.

Authenticated users can:

- Create, view, update, and delete moisture-meter controllers.
- Associate a controller with a plant.
- View the current moisture condition of each plant.
- View historical moisture readings.
- Refresh controller information by navigating to or clicking the Controllers page.
- Request general information about a known plant species.
- Store the AI-generated plant information and plant image in MongoDB.

---

## 2. Technology Stack

### Frontend / Backend

- Next.js
- TypeScript
- React
- Next.js Route Handlers
- SCSS

### Authentication

- Better Auth

### Database

- MongoDB
- Mongoose (application collections)
- MongoDB native driver (required by the Better Auth adapter — see [section 4](#4-authentication))

### AI

- AI provider abstraction, with OpenAI as the initial implementation.
- AI-generated plant information is persisted in MongoDB.

### Hardware

- Mock moisture-meter layer.
- Designed so that the mock implementation can later be replaced by real hardware integration.

---

## 3. High-Level Architecture

```text
                    ┌──────────────────────┐
                    │      Browser         │
                    │  Next.js / React     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    Next.js Server    │
                    │                      │
                    │ Route Handlers / API │
                    │ Authentication       │
                    │ Business Logic       │
                    └───┬──────┬───────┬───┘
                        │      │       │
        ┌───────────────┘      │       └──────────────┐
        ▼                      ▼                      ▼
┌────────────────┐   ┌────────────────────┐   ┌────────────────┐
│    MongoDB     │   │   Mock Hardware    │   │   AI Service   │
│   / Mongoose   │   │    Sensor Layer    │   │                │
└────────────────┘   └────────────────────┘   └────────────────┘
```

The mock hardware layer is a server-side module like any other dependency. It is invoked by the server and its readings are persisted through Mongoose — it never touches MongoDB itself.

The frontend must **never communicate directly with MongoDB or the AI provider**.

All application data access goes through the server.

---

## 4. Authentication

Better Auth is responsible for authentication.

The application must require authentication for all controller-related operations.

### Authentication requirements

Unauthenticated users can access:

- Login
- Signup

Authenticated users can access:

- Controllers
- Controller details
- Controller creation/editing
- Plant information

### Better Auth database structure

Better Auth owns its authentication collections and defines their shape. The application must not invent its own `users` collection or write to these collections directly — it reads the current user through the Better Auth session API.

With the MongoDB adapter there are no migrations or generated schema files; the collections are created on demand. Default model names are **singular**:

```text
user
session
account
verification
```

#### `user`

| Field           | Type    | Required | Notes       |
| --------------- | ------- | -------- | ----------- |
| `id`            | string  | Yes      | Primary key |
| `name`          | string  | Yes      |             |
| `email`         | string  | Yes      | Unique      |
| `emailVerified` | boolean | Yes      |             |
| `image`         | string  | No       |             |
| `createdAt`     | Date    | Yes      |             |
| `updatedAt`     | Date    | Yes      |             |

#### `session`

| Field       | Type   | Required | Notes                  |
| ----------- | ------ | -------- | ---------------------- |
| `id`        | string | Yes      | Primary key            |
| `userId`    | string | Yes      | References `user.id`   |
| `token`     | string | Yes      | Unique                 |
| `expiresAt` | Date   | Yes      |                        |
| `ipAddress` | string | No       |                        |
| `userAgent` | string | No       |                        |
| `createdAt` | Date   | Yes      |                        |
| `updatedAt` | Date   | Yes      |                        |

#### `account`

An account represents one authentication method linked to a user. Better Auth identifies the provider-side identity by the `providerId` + `accountId` pair. Email/password signup creates an account with `providerId: "credential"` and the password hash in `account.password` — **the `user` document never stores credentials**.

| Field                   | Type   | Required | Notes                |
| ----------------------- | ------ | -------- | -------------------- |
| `id`                    | string | Yes      | Primary key          |
| `userId`                | string | Yes      | References `user.id` |
| `accountId`             | string | Yes      |                      |
| `providerId`            | string | Yes      |                      |
| `accessToken`           | string | No       |                      |
| `refreshToken`          | string | No       |                      |
| `accessTokenExpiresAt`  | Date   | No       |                      |
| `refreshTokenExpiresAt` | Date   | No       |                      |
| `scope`                 | string | No       |                      |
| `idToken`               | string | No       |                      |
| `password`              | string | No       | Hashed               |
| `createdAt`             | Date   | Yes      |                      |
| `updatedAt`             | Date   | Yes      |                      |

#### `verification`

| Field        | Type   | Required | Notes       |
| ------------ | ------ | -------- | ----------- |
| `id`         | string | Yes      | Primary key |
| `identifier` | string | Yes      |             |
| `value`      | string | Yes      |             |
| `expiresAt`  | Date   | Yes      |             |
| `createdAt`  | Date   | Yes      |             |
| `updatedAt`  | Date   | Yes      |             |

#### Rules for working with the Better Auth schema

- Extra user profile fields must be declared through `user.additionalFields` in the Better Auth configuration, not added ad hoc to the collection.
- Collection and field names may be renamed through `modelName` / `fields` in the configuration. For the POC the defaults are kept.
- Do not define a Mongoose model to mutate these collections. A read-only Mongoose model may be introduced later for reporting, but Better Auth remains the only writer.
- The MongoDB adapter stores documents with `_id` as an `ObjectId` and exposes `id` as its string form. `session.user.id` is therefore a string, and `Controller.ownerId` stores that string value consistently.

### Authorization

For the POC, there are no roles.

Every authenticated user has the same permissions.

However, every controller must have an `ownerId` referencing `user.id`.

A user must only be able to access controllers belonging to that user.

For example:

```text
GET /api/controllers/:id
```

must not return a controller belonging to another user, even if the user knows its ID.

Authorization must therefore be enforced **server-side**, never only in the frontend.

---

## 5. Controller Domain

A controller represents a plant moisture-meter device.

Each controller belongs to exactly one authenticated user.

### Controller fields

```typescript
interface Controller {
  _id: string;
  ownerId: string;

  name: string;
  plantName?: string;

  location?: string;

  status: ControllerStatus;

  batteryLevel: number;

  currentMoistureLevel: number;
  lastReadingAt: Date;

  plantInfo?: PlantInfo;

  createdAt: Date;
  updatedAt: Date;
}
```

### Controller status

```typescript
type ControllerStatus =
  | 'online'
  | 'offline';
```

### Moisture level

Moisture is represented as a percentage:

```text
0   = completely dry
100 = completely wet
```

The application should not assume that 50% universally means "healthy."

Plant-specific moisture recommendations belong to `PlantInfo`.

---

## 6. Plant Information

A controller may optionally have a `plantName`.

For example:

```text
Controller:
    name: "Balcony Sensor 1"
    plantName: "Monstera deliciosa"
```

When a known plant name is supplied, the application can request plant information from the AI service.

### Plant information

The AI response should provide general information such as:

```typescript
interface PlantInfo {
  plantName: string;

  commonName?: string;

  description: string;

  watering: {
    description: string;
    recommendedMoisture?: {
      min: number;
      max: number;
    };
  };

  light: string;

  temperature?: string;

  humidity?: string;

  careInstructions: string[];

  imageUrl?: string;

  generatedAt: Date;
}
```

The exact fields may evolve as the AI integration is implemented.

### Important rule

AI-generated information must be treated as **advisory information**, not as a safety-critical or authoritative watering prescription.

---

## 7. Plant Image

The plant information should include an image.

The AI integration should return or identify an appropriate image source.

The application should store the resulting image reference:

```typescript
imageUrl?: string;
```

The image itself should not be stored directly inside MongoDB as binary data for this POC.

The architecture should allow the image-storage implementation to be replaced later.

---

## 8. AI Integration

The application should isolate AI functionality behind a service.

The controller/business layer should not directly contain OpenAI-specific code.

Example:

```text
PlantService
     │
     ▼
PlantInformationService
     │
     ▼
AI Provider
```

This allows the AI provider to be changed later without rewriting the application.

### Example operation

```typescript
getPlantInformation(plantName: string)
```

The service sends the plant name to the AI provider and receives structured plant information.

The application then validates the response and stores it in MongoDB.

### Persistence

Once generated, the information should be stored.

Therefore:

```text
User requests plant information
            ↓
Check MongoDB
            ↓
Plant information exists?
       ↙           ↘
     YES            NO
      ↓              ↓
Return existing    Call AI
                     ↓
                  Validate
                     ↓
                  Save MongoDB
                     ↓
                  Return data
```

This avoids unnecessarily calling the AI provider repeatedly.

If the user changes the plant name, the existing plant information must no longer be considered valid for that controller.

---

## 9. Mock Hardware Layer

The mock hardware must be separated from the application UI.

The purpose is to simulate a future physical moisture meter.

### Conceptual interface

```typescript
interface MoistureSensor {
  getReading(controllerId: string): Promise<SensorReading>;
}
```

The initial implementation:

```typescript
MockMoistureSensor
```

will implement this interface.

A future implementation could be:

```typescript
RealMoistureSensor
```

without requiring major changes to the rest of the application.

### Sensor reading

```typescript
interface SensorReading {
  controllerId: string;

  moistureLevel: number;

  batteryLevel: number;

  status: 'online' | 'offline';

  recordedAt: Date;
}
```

The mock sensor should produce realistic readings rather than arbitrary values on every request.

For example, a controller could gradually become:

```text
62%
60%
58%
55%
52%
```

rather than randomly jumping:

```text
12%
94%
37%
81%
```

This makes the POC behave more like an actual hardware system.

---

## 10. Moisture Reading History

Sensor readings should be stored historically.

### MoistureReading model

```typescript
interface MoistureReading {
  _id: string;

  controllerId: string;

  moistureLevel: number;

  batteryLevel: number;

  status: 'online' | 'offline';

  recordedAt: Date;
}
```

This provides the foundation for future functionality such as:

- Moisture charts
- Watering trends
- Historical analysis
- Alerts
- Plant-health analysis

The Controllers page only needs the latest reading for the initial POC.

---

## 11. Controller Refresh Behavior

The application does **not** require WebSockets, SSE, or continuous polling for the POC.

When the user opens or refreshes the Controllers page:

```text
Controllers page
       ↓
GET /api/controllers
       ↓
Server retrieves controllers
       ↓
Mock hardware queried
       ↓
Latest readings generated/retrieved
       ↓
Readings persisted
       ↓
Response returned
       ↓
UI displays current state
```

This means the user sees updated information whenever they explicitly visit or refresh the Controllers page.

---

## 12. REST API

The application should expose a REST-style API through Next.js Route Handlers.

Better Auth mounts its own endpoints under `/api/auth/*` via a catch-all route handler. Those routes are owned by the library and are not defined manually.

### Controllers

#### Create

```http
POST /api/controllers
```

Request:

```json
{
  "name": "Balcony Sensor",
  "plantName": "Monstera deliciosa",
  "location": "Balcony"
}
```

Response:

```json
{
  "id": "...",
  "name": "Balcony Sensor",
  "plantName": "Monstera deliciosa",
  "location": "Balcony"
}
```

#### Get all controllers

```http
GET /api/controllers
```

Returns only controllers belonging to the authenticated user.

#### Get controller

```http
GET /api/controllers/:id
```

#### Update controller

```http
PATCH /api/controllers/:id
```

Example:

```json
{
  "name": "Living Room Sensor",
  "plantName": "Monstera deliciosa"
}
```

#### Delete controller

```http
DELETE /api/controllers/:id
```

---

## 13. Sensor API

The application should keep sensor functionality separate from controller CRUD.

```http
GET /api/controllers/:id/readings
```

Returns historical readings.

The Controllers endpoint may internally request the latest mock sensor reading when refreshing the controller list.

---

## 14. Plant API

Plant information should have its own API boundary.

```http
GET /api/controllers/:id/plant
```

If plant information does not exist, the server may generate it through the AI service.

Alternatively, generation can be explicit:

```http
POST /api/controllers/:id/plant
```

The latter is preferable if we want to avoid unexpected AI API calls.

---

## 15. MongoDB Data Model

The database contains two groups of collections.

Managed by Better Auth (structure defined in [section 4](#better-auth-database-structure)):

```text
user
session
account
verification
```

Managed by the application through Mongoose:

```text
controllers
moistureReadings
```

Application code defines Mongoose models **only** for the application collections.

### Controllers

```text
controllers
 ├── _id
 ├── ownerId          → user.id (string)
 ├── name
 ├── plantName
 ├── location
 ├── status
 ├── batteryLevel
 ├── currentMoistureLevel
 ├── lastReadingAt
 ├── plantInfo
 ├── createdAt
 └── updatedAt
```

`ownerId` is stored as a string holding the Better Auth user id. It is not declared as a Mongoose `ref`, because the `user` collection is not an application-owned model.

### Moisture readings

```text
moistureReadings
 ├── _id
 ├── controllerId
 ├── moistureLevel
 ├── batteryLevel
 ├── status
 └── recordedAt
```

### Indexes

An index should exist on:

```text
controllerId + recordedAt
```

to efficiently retrieve recent readings.

An index should also exist on:

```text
ownerId
```

for controller queries.

Better Auth's MongoDB adapter creates only the indexes its schema **declares** — a field-level
`unique: true`, such as the one on `user.email`, does not produce one. The indexes the auth
collections need (`user.email` unique, `session.token` unique, `session.userId`, `account.userId`)
are therefore declared through a plugin schema in `lib/auth.ts`, and Better Auth creates them
itself. The application must never create them directly with `createIndex`: a hand-made index on
the same keys under a different name makes the adapter's own call fail silently.

---

## 16. Mongoose Models

Mongoose schemas should be kept separate from API route handlers.

Suggested structure:

```text
src/
├── models/
│   ├── Controller.ts
│   └── MoistureReading.ts
│
├── services/
│   ├── controller.service.ts
│   ├── sensor.service.ts
│   ├── plant.service.ts
│   └── ai.service.ts
│
├── lib/
│   ├── db.ts
│   ├── auth.ts          → Better Auth server instance (mongodbAdapter)
│   ├── auth-client.ts   → Better Auth client for React components
│   └── validation.ts
```

There is no `models/User.ts`: the `user`, `session`, `account`, and `verification` collections belong to Better Auth.

The exact Next.js `src` layout can be adjusted according to the selected App Router structure.

---

## 17. Frontend Architecture

The application should use a component-based architecture.

Suggested pages:

```text
/login
/signup

/controllers
/controllers/new
/controllers/[id]
/controllers/[id]/edit
```

### Controllers page

The main dashboard should display:

```text
Controllers
────────────────────────────────

[ + Add Controller ]

┌───────────────────────────────┐
│ Balcony Sensor                │
│ Monstera deliciosa            │
│                               │
│ Moisture: 62%                 │
│ Battery: 87%                  │
│ Status: Online                │
│                               │
│ [View] [Edit] [Delete]        │
└───────────────────────────────┘
```

The UI should clearly distinguish between:

- Healthy moisture
- Too dry
- Too wet
- Unknown

The thresholds should preferably be based on the plant information when available.

---

## 18. Smart and Presentational Components

The frontend should separate data/business responsibilities from presentation where practical.

For example:

```text
ControllersPage
      │
      ├── ControllerList
      │       └── ControllerCard
      │
      └── ControllerFilters
```

A `ControllerCard` should primarily be responsible for presentation.

Data retrieval and mutations should remain at the page/container/service level.

---

## 19. Client API Layer

Frontend components should not scatter `fetch()` calls throughout the application.

Use a small API layer:

```text
services/
    controllers-api.ts
    plants-api.ts
```

Example:

```typescript
getControllers()
createController()
updateController()
deleteController()
getController()
getPlantInformation()
```

This keeps API communication centralized.

Authentication calls (signup, login, logout, session) go through the Better Auth client instead of hand-written `fetch()` calls.

---

## 20. Validation

Input validation must occur on the server.

Controller creation should validate at minimum:

```text
name
plantName
location
```

Examples:

- `name` is required.
- `name` must not be empty.
- `plantName`, if supplied, must be a valid string.
- Moisture values must be between 0 and 100.
- Battery values must be between 0 and 100.

Client-side validation may be added for UX, but it must never replace server-side validation.

Credential rules (email format, password length) are enforced by Better Auth and must not be re-implemented in the application layer.

---

## 21. Error Handling

API errors should have a consistent structure.

Example:

```json
{
  "error": {
    "code": "CONTROLLER_NOT_FOUND",
    "message": "Controller not found"
  }
}
```

Possible error codes:

```text
UNAUTHORIZED
FORBIDDEN
VALIDATION_ERROR
CONTROLLER_NOT_FOUND
PLANT_NOT_FOUND
AI_SERVICE_ERROR
DATABASE_ERROR
SENSOR_ERROR
```

The UI should display user-friendly messages rather than raw server errors.

---

## 22. Security Requirements

The following are mandatory:

### Authentication

Every protected API endpoint must verify the Better Auth session.

### Authorization

Every controller query must be scoped to the authenticated user.

Bad:

```typescript
Controller.findById(controllerId)
```

Preferred:

```typescript
Controller.findOne({
  _id: controllerId,
  ownerId: userId
})
```

### AI API key

The AI API key must exist only on the server.

It must never be exposed to browser-side JavaScript.

### MongoDB credentials

MongoDB credentials must also remain server-side.

### Credentials and sessions

Password hashes live only in `account.password` and must never be selected into an API response. Session tokens are handled by Better Auth cookies and must not be forwarded to client-side state.

### Environment variables

Sensitive configuration should be stored in environment variables.

Example:

```text
MONGODB_URI=
AI_API_KEY=
```

Authentication secrets required by Better Auth should likewise be environment-specific.

---

## 23. Database Connection

MongoDB connections should be centralized.

Example responsibility:

```text
lib/db.ts
```

The application should reuse the existing Mongoose connection where appropriate rather than establishing a new connection for every request.

This is particularly important for serverless-compatible deployments.

### Two clients, one connection strategy

The Better Auth MongoDB adapter requires a **native MongoDB driver `Db` instance** — it does not accept a Mongoose connection object. The application therefore needs both:

- Mongoose, for `controllers` and `moistureReadings`.
- A native `Db`, for `mongodbAdapter(db, { client })`. Passing `client` is optional but enables transactions.

To avoid two independent connection pools, the `Db` should be derived from the established Mongoose connection (`mongoose.connection.db` / `.getClient()`) rather than opening a separate `MongoClient`. Whichever approach is chosen, the instance must be cached globally in the same way as the Mongoose connection.

---

## 24. Environment Configuration

The specification should remain deployment-provider-neutral.

Expected environment configuration:

```text
MONGODB_URI=

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

AI_API_KEY=
```

Additional configuration can be introduced later.

No deployment provider should be assumed by the application architecture.

---

## 25. POC Scope

The initial POC should include:

### Authentication

- Signup
- Login
- Logout
- Protected application area

### Controllers

- Create
- Read/list
- View details
- Update
- Delete

### Mock hardware

- Simulated moisture readings
- Simulated battery level
- Online/offline state
- Reading history

### Plant information

- Plant name
- AI-generated general information
- Care information
- Plant image
- Persistence in MongoDB

### Dashboard

- Current moisture
- Battery
- Sensor status
- Plant name
- Plant information availability

---

## 26. Explicitly Out of Scope for the POC

The following should **not** be implemented initially:

- Real physical hardware integration
- Automatic watering
- Water pumps
- WebSockets
- Push notifications
- Email notifications
- Email verification and password reset flows
- Social/OAuth providers
- Mobile application
- Multi-user controller sharing
- Admin roles
- Advanced analytics
- Automated watering recommendations
- IoT device provisioning
- Complex device authentication
- Deployment-provider-specific infrastructure

The architecture should allow these capabilities to be added later without requiring a major rewrite. The `account` and `verification` collections already exist in the Better Auth schema, so adding OAuth providers or verification flows later requires no data-model change.

---

## 27. Suggested Project Structure

A reasonable initial structure:

```text
plant-watering-control/
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   │
│   │   ├── controllers/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── edit/
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...all]/       → Better Auth route handler
│   │       ├── controllers/
│   │       │   └── ...
│   │       └── ...
│   │
│   ├── components/
│   │   ├── controllers/
│   │   ├── plants/
│   │   └── shared/
│   │
│   ├── models/
│   │   ├── Controller.ts
│   │   └── MoistureReading.ts
│   │
│   ├── services/
│   │   ├── controller.service.ts
│   │   ├── sensor.service.ts
│   │   ├── plant.service.ts
│   │   └── ai.service.ts
│   │
│   ├── lib/
│   │   ├── db.ts
│   │   ├── auth.ts
│   │   ├── auth-client.ts
│   │   └── validation.ts
│   │
│   └── styles/
│       └── ...
│
├── public/
│
├── .env.local
├── next.config.ts
├── tsconfig.json
└── package.json
```

The exact structure can be refined during implementation based on the Next.js version and Better Auth integration.

---

## 28. Main Data Flow

### Creating a controller

```text
User
 ↓
Create Controller form
 ↓
POST /api/controllers
 ↓
Authenticate user
 ↓
Validate input
 ↓
Create Controller
 ↓
MongoDB
 ↓
Return controller
```

### Getting current sensor information

```text
Controllers page
 ↓
GET /api/controllers
 ↓
Authenticate user
 ↓
Get user's controllers
 ↓
Mock Sensor Service
 ↓
Generate/retrieve latest reading
 ↓
Persist reading
 ↓
Update controller's current state
 ↓
Return controllers
 ↓
UI
```

### Getting plant information

```text
User
 ↓
Controller with plantName
 ↓
GET/POST plant information
 ↓
Check MongoDB
 ↓
Existing information?
       │
   ┌───┴───┐
  YES      NO
   │        │
   │      AI Service
   │        │
   │     Validate
   │        │
   │     MongoDB
   │        │
   └───┬────┘
       ↓
      UI
```

---

## 29. Design Principles

The implementation should follow these principles:

### Separation of concerns

UI, API, business logic, database access, hardware simulation, and AI integration should remain separate.

### Server-side authority

Authentication, authorization, validation, database operations, and AI access are server responsibilities.

### Library-owned auth schema

The authentication data model is owned by Better Auth. The application adapts to it rather than reshaping it.

### Replaceable hardware

The mock sensor implementation should satisfy an interface that a real sensor implementation could later replace.

### Replaceable AI provider

AI-specific implementation should be isolated behind a service boundary.

### No unnecessary infrastructure

The POC should remain simple.

No real-time infrastructure or complex event architecture is required.

### Production-minded boundaries

Although this is a POC, the code should avoid shortcuts that would make the application difficult to evolve.

---

## 30. Development Phases

### Phase 1 — Project foundation

- Create Next.js + TypeScript project
- Configure SCSS
- Establish project structure
- Configure environment variables
- Configure MongoDB/Mongoose

### Phase 2 — Authentication

- Install/configure Better Auth with the MongoDB adapter
- Mount the `/api/auth/[...all]` route handler
- Signup
- Login
- Logout
- Protected routes/pages
- Server-side session validation

### Phase 3 — Controllers

- Controller Mongoose model
- Controller service
- REST API
- Create/edit/delete
- User ownership
- Controllers dashboard

### Phase 4 — Mock hardware

- Sensor interface
- Mock sensor implementation
- Reading generation
- MoistureReading model
- Reading persistence
- Latest-reading retrieval

### Phase 5 — Plant information

- Plant information model/schema
- AI service abstraction
- Structured AI response
- Plant information persistence
- Plant image
- Plant information UI

### Phase 6 — Dashboard refinement

- Moisture status visualization
- Battery status
- Online/offline status
- Plant information
- Error/loading states
- Empty states

### Phase 7 — Testing and hardening

- API validation
- Authorization testing
- Authentication testing
- Controller ownership testing
- AI failure handling
- Sensor failure handling
- Database failure handling
- Basic component/API tests

---

## 31. Definition of Done

The POC is considered complete when an authenticated user can:

1. Create an account.
2. Log in.
3. Create a moisture-meter controller.
4. Give it a name.
5. Optionally associate it with a plant.
6. See the controller on the Controllers page.
7. Receive a simulated current moisture reading.
8. See battery and sensor status.
9. Navigate away and return to the Controllers page and receive updated sensor information.
10. View historical sensor readings.
11. Edit the controller.
12. Delete the controller.
13. Request information about the associated plant.
14. See AI-generated general plant information.
15. See a plant image.
16. Have the generated plant information persisted in MongoDB.
17. Never access another user's controllers.
18. Continue functioning gracefully when the AI service, database, or mock sensor encounters an error.

---

## 32. Architectural Goal

The most important architectural characteristic of this POC is that the **mock hardware is not treated as a temporary hack**.

The intended evolution is:

```text
POC

MockMoistureSensor
        ↓
SensorService
        ↓
Application


Future

RealMoistureSensor
        ↓
SensorService
        ↓
Application
```

The rest of the application should not need to know whether the reading came from a simulated device or a physical moisture meter.

Likewise, plant information should be isolated behind a plant/AI service boundary so that the application is not tightly coupled to a particular AI provider.

The result should be a relatively small POC, but with architectural boundaries that make it possible to evolve into a real plant-monitoring application without throwing away the initial implementation.
