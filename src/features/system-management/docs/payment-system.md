# Payment System Specification

## Database Schema

### Core Models

#### PaymentMethod

```prisma
model PaymentMethod {
  id               String    @id @default(cuid())
  userId           String
  type             String    // card, bank_account, digital_wallet
  providerType     String    // stripe, paypal, etc.
  providerMethodId String    // ID from the provider
  isDefault        Boolean   @default(false)
  metadata         Json?     // Additional provider-specific data
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions     Transaction[]

  @@unique([userId, providerMethodId])
  @@map("payment_methods")
}
```

#### Transaction

```prisma
model Transaction {
  id                String   @id @default(cuid())
  userId            String
  paymentMethodId   String?
  type              String   // charge, refund, payout
  status            String   // pending, completed, failed, cancelled
  amount            Float
  currency          String   @default("USD")
  description       String?
  providerTxnId     String?  // Transaction ID from payment provider
  idempotencyKey    String   @unique
  metadata          Json?    // Additional transaction data
  errorMessage      String?
  refundedAmount    Float?
  refundedTxnId     String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  paymentMethod     PaymentMethod? @relation(fields: [paymentMethodId], references: [id], onDelete: SetNull)
  subscription      Subscription? @relation(fields: [subscriptionId], references: [id])
  subscriptionId    String?
  invoice           Invoice? @relation(fields: [invoiceId], references: [id])
  invoiceId         String?

  @@map("transactions")
}
```

#### Subscription

```prisma
model Subscription {
  id               String        @id @default(cuid())
  userId           String
  planId           String
  status           String        // active, canceled, past_due, trial
  currentPeriodEnd DateTime
  cancelAtPeriod   Boolean       @default(false)
  providerSubId    String?       // Subscription ID from provider
  metadata         Json?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  user             User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  plan             Plan          @relation(fields: [planId], references: [id])
  transactions     Transaction[]
  invoices         Invoice[]

  @@unique([userId, planId])
  @@map("subscriptions")
}
```

#### Plan

```prisma
model Plan {
  id                 String         @id @default(cuid())
  name               String
  description        String?
  price              Float
  interval           String         // month, year
  features           Json           // Array of included features
  isActive           Boolean        @default(true)
  trialDays          Int            @default(0)
  providerPlanId     String?        // Plan ID from provider
  metadata           Json?
  createdAt          DateTime       @default(now())
  updatedAt          DateTime       @updatedAt
  subscriptions      Subscription[]

  @@map("plans")
}
```

#### BillingProfile

```prisma
model BillingProfile {
  id               String    @id @default(cuid())
  userId           String    @unique
  name             String?
  company          String?
  address          String?
  city             String?
  state            String?
  postalCode       String?
  country          String?
  taxId            String?
  phone            String?
  email            String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  invoices         Invoice[]

  @@map("billing_profiles")
}
```

#### Invoice

```prisma
model Invoice {
  id               String        @id @default(cuid())
  userId           String
  subscriptionId   String?
  billingProfileId String?
  status           String        // draft, open, paid, uncollectible, void
  dueDate          DateTime?
  issueDate        DateTime      @default(now())
  amount           Float
  tax              Float         @default(0)
  total            Float
  currency         String        @default("USD")
  items            Json          // Line items for the invoice
  pdfUrl           String?
  providerInvoiceId String?      // Invoice ID from provider
  metadata         Json?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  user             User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  subscription     Subscription? @relation(fields: [subscriptionId], references: [id])
  billingProfile   BillingProfile? @relation(fields: [billingProfileId], references: [id])
  transactions     Transaction[]

  @@map("invoices")
}
```

## Service Architecture

### Payment Service

```typescript
interface PaymentService {
  // Payment methods
  createPaymentMethod(
    userId: string,
    data: PaymentMethodData
  ): Promise<PaymentMethod>;
  getPaymentMethods(userId: string): Promise<PaymentMethod[]>;
  updatePaymentMethod(
    id: string,
    data: Partial<PaymentMethodData>
  ): Promise<PaymentMethod>;
  deletePaymentMethod(id: string): Promise<void>;
  setDefaultPaymentMethod(userId: string, methodId: string): Promise<void>;

  // Transactions
  createCharge(data: ChargeData): Promise<Transaction>;
  createRefund(transactionId: string, amount?: number): Promise<Transaction>;
  getTransaction(id: string): Promise<Transaction>;
  getUserTransactions(
    userId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Transaction>>;

  // Subscriptions
  createSubscription(
    userId: string,
    planId: string,
    paymentMethodId: string
  ): Promise<Subscription>;
  updateSubscription(
    id: string,
    data: Partial<SubscriptionData>
  ): Promise<Subscription>;
  cancelSubscription(id: string, immediate?: boolean): Promise<Subscription>;
  getUserSubscriptions(userId: string): Promise<Subscription[]>;

  // Plans
  getPlans(): Promise<Plan[]>;
  getPlan(id: string): Promise<Plan>;

  // Invoices
  getInvoices(
    userId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Invoice>>;
  getInvoice(id: string): Promise<Invoice>;
  downloadInvoice(id: string): Promise<{ url: string }>;

  // Billing profiles
  getBillingProfile(userId: string): Promise<BillingProfile>;
  updateBillingProfile(
    userId: string,
    data: Partial<BillingProfileData>
  ): Promise<BillingProfile>;
}
```

### Payment Provider Adapters

#### Abstract Provider Interface

```typescript
interface PaymentProviderAdapter {
  // Payment methods
  createPaymentMethod(
    data: ProviderPaymentMethodData
  ): Promise<ProviderPaymentMethod>;
  getPaymentMethod(id: string): Promise<ProviderPaymentMethod>;
  updatePaymentMethod(
    id: string,
    data: Partial<ProviderPaymentMethodData>
  ): Promise<ProviderPaymentMethod>;
  deletePaymentMethod(id: string): Promise<void>;

  // Transactions
  createCharge(data: ProviderChargeData): Promise<ProviderTransaction>;
  createRefund(
    chargeId: string,
    data: ProviderRefundData
  ): Promise<ProviderTransaction>;

  // Subscriptions
  createSubscription(
    data: ProviderSubscriptionData
  ): Promise<ProviderSubscription>;
  updateSubscription(
    id: string,
    data: Partial<ProviderSubscriptionData>
  ): Promise<ProviderSubscription>;
  cancelSubscription(
    id: string,
    immediate?: boolean
  ): Promise<ProviderSubscription>;

  // Webhooks
  handleWebhookEvent(
    payload: unknown,
    signature: string
  ): Promise<WebhookEvent>;
}
```

#### Implementations

- StripeAdapter
- PayPalAdapter
- SquareAdapter

## API Endpoints

### Payment Methods API

#### GET /api/payment/methods

- Get current user's payment methods
- Response: Array of PaymentMethod objects

#### POST /api/payment/methods

- Create new payment method
- Body: PaymentMethodData
- Response: PaymentMethod object

#### PATCH /api/payment/methods/:id

- Update payment method
- Body: Partial<PaymentMethodData>
- Response: PaymentMethod object

#### DELETE /api/payment/methods/:id

- Delete payment method
- Response: 204 No Content

#### PUT /api/payment/methods/:id/default

- Set as default payment method
- Response: Updated PaymentMethod object

### Transactions API

#### POST /api/payment/transactions

- Create a new transaction (charge)
- Body: ChargeData
- Response: Transaction object

#### POST /api/payment/transactions/:id/refund

- Refund a transaction
- Body: { amount?: number }
- Response: Transaction object (refund)

#### GET /api/payment/transactions

- Get current user's transactions
- Query params: page, limit, status, type
- Response: PaginatedResult<Transaction>

#### GET /api/payment/transactions/:id

- Get transaction details
- Response: Transaction object

### Subscriptions API

#### GET /api/payment/subscriptions

- Get current user's subscriptions
- Response: Array of Subscription objects

#### POST /api/payment/subscriptions

- Create new subscription
- Body: { planId: string, paymentMethodId: string }
- Response: Subscription object

#### PATCH /api/payment/subscriptions/:id

- Update subscription
- Body: Partial<SubscriptionData>
- Response: Subscription object

#### DELETE /api/payment/subscriptions/:id

- Cancel subscription
- Query params: immediate=true|false
- Response: Updated Subscription object

### Plans API

#### GET /api/payment/plans

- Get available plans
- Response: Array of Plan objects

#### GET /api/payment/plans/:id

- Get plan details
- Response: Plan object

### Invoices API

#### GET /api/payment/invoices

- Get current user's invoices
- Query params: page, limit, status
- Response: PaginatedResult<Invoice>

#### GET /api/payment/invoices/:id

- Get invoice details
- Response: Invoice object

#### GET /api/payment/invoices/:id/download

- Download invoice PDF
- Response: { url: string }

### Billing Profile API

#### GET /api/payment/billing-profile

- Get current user's billing profile
- Response: BillingProfile object

#### PUT /api/payment/billing-profile

- Update billing profile
- Body: Partial<BillingProfileData>
- Response: BillingProfile object

### Webhooks API

#### POST /api/payment/webhooks/:provider

- Handle payment provider webhooks
- Headers: Provider-specific signature
- Body: Raw provider webhook payload
- Response: 200 OK

## UI Components

### Payment Method Management

#### PaymentMethodList

- Display saved payment methods
- Set default payment method
- Delete payment method

#### PaymentMethodForm

- Add new payment method
- Uses secure payment provider elements
- Validates input before submission

#### PaymentMethodCard

- Display payment method details
- Show card brand, last 4 digits, expiry
- Support for different payment types (card, bank, digital wallet)

### Checkout Components

#### CheckoutForm

- Select payment method or add new
- Display order summary
- Process payment
- Show loading and success/error states

#### SubscriptionCheckout

- Plan selection
- Trial information
- Payment method selection
- Billing profile information

### Account & Billing

#### BillingPortal

- Overview of billing status
- Current plan and usage
- Payment history
- Invoice list and download

#### BillingProfileForm

- Edit billing details
- Company information
- Tax ID
- Billing address

#### InvoiceList

- Paginated list of invoices
- Filter by status
- Download PDF option

#### SubscriptionManager

- View current subscriptions
- Change plans
- Cancel subscription
- Reactivate subscription

## Integration with External Payment Providers

### Stripe Integration

- Use Stripe Elements for secure payment form
- Implement Strong Customer Authentication (SCA) support
- Create reusable payment methods with SetupIntents
- Support for Stripe Checkout for simplified flows
- Implement webhook handler for async events

### PayPal Integration

- Support PayPal Checkout button
- Vault payment methods for future use
- Implement subscription billing
- Handle IPN (Instant Payment Notification) webhooks

### Square Integration

- Square Web Payments SDK integration
- Support for Square Terminal for in-person payments
- Digital wallet support (Apple Pay, Google Pay)
- Handle Square webhooks

## Security Considerations

### Authentication and Authorization

- Implement multi-factor authentication for payment-related operations
- Use role-based permissions with dedicated "payment:\*" permissions
- Restrict sensitive operations to admin and finance roles only
- Implement IP-based fraud detection for suspicious payment patterns

### Data Protection

- Store all payment data encrypted at rest using AES-256
- Implement field-level encryption for card numbers and CVV
- Tokenize payment methods to avoid storing sensitive card details
- Configure automatic data retention policies for payment information

### Transaction Security

- Implement idempotency keys for all payment operations
- Use HTTPS with TLS 1.3 for all payment API communications
- Generate unique transaction IDs with non-sequential formats
- Implement webhooks with signature verification for payment events

### Compliance

- Design for PCI DSS compliance for card processing
- Implement audit logging for all payment-related operations
- Create GDPR-compliant data removal processes
- Store geographical data for tax compliance

### Fraud Prevention

- Implement velocity checks for suspicious transaction patterns
- Use machine learning for anomaly detection in payment behaviors
- Create transaction limits based on user history and verification level
- Design 3D Secure integration for card transactions

## Testing Strategy

### Unit Testing

- Test payment service functions in isolation
- Mock external payment provider APIs
- Validate input/output transformations
- Test error handling and recovery paths

### Integration Testing

- Test database interactions for payment models
- Verify API endpoint behaviors with test database
- Test webhook handlers with sample payloads
- Validate event processing flows

### Provider Integration Testing

- Use provider test mode/sandbox environments
- Test full payment flows with test cards
- Validate webhooks with provider test events
- Test error scenarios and declined payments

### Security Testing

- Perform penetration testing on payment endpoints
- Validate authorization checks for all operations
- Test for common vulnerabilities (OWASP Top 10)
- Verify data encryption and tokenization

### End-to-End Testing

- Test full user payment journeys
- Validate UI components with simulated payments
- Test subscription lifecycle (create, update, cancel, reactivate)
- Verify invoice generation and download
