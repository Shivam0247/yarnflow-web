# WhatsApp and Email — setup

Both live under **Messages** in the menu. When a sale bill / return, sale order, bank receipt / payment or
debit / credit note is saved, YarnFlow prepares the same messages the old software sent and sends them by itself.

## WhatsApp — official WhatsApp Business API (recommended)

One-time setup at Meta (about a week, mostly waiting for verification):

1. **Meta Business account** — business.facebook.com → create / open the account for the company.
   Business settings → Security centre → **Start verification** (GST certificate or utility bill, company name and address must match).
2. **App** — developers.facebook.com → My apps → Create app → type *Business* → add the **WhatsApp** product.
   Note the **App ID** (top of the app dashboard).
3. **Phone number** — WhatsApp → API Setup → *Add phone number*. Use a number that will send the bills
   (it can be your current WhatsApp Business app number — Meta lets the app and the API share it).
   Note the **Phone number ID** and the **WhatsApp Business Account ID** shown on API Setup.
4. **Permanent access token** — Business settings → Users → **System users** → Add (Admin) →
   *Assign assets*: the app (full control) and the WhatsApp account (full control) →
   *Generate token* → choose the app, expiry **Never**, permissions `whatsapp_business_messaging` and `whatsapp_business_management`.
   Copy the token. Also copy the **App secret** (App settings → Basic).
5. **Payment method** — WhatsApp Manager → Account tools → Payment methods → add a card (messages are billed by Meta, about ₹0.145 each).

In YarnFlow → **Messages → WhatsApp → WhatsApp setup**:

6. Choose **Official WhatsApp API**, paste Phone number ID, Business account ID, App ID, Access token, App secret → **Save**.
7. **Send templates for approval** — the six message wordings (sale bill, sale return, sale order, bank receipt,
   bank payment, document PDF) go to Meta. Approval is usually minutes to a day; **Refresh status** shows it.
8. **Webhook** (for delivered / read ticks) — in the Meta app: WhatsApp → Configuration → Webhook → Edit:
   *Callback URL* = the Webhook URL shown in YarnFlow (must be the public https address of YarnFlow),
   *Verify token* = the one shown in YarnFlow → Verify and save → subscribe to **messages**.
9. **Send a test receipt message** to your own phone. From then on every saved document goes out automatically.

What changes compared with the old messages: Meta does not allow a varying number of lines in an approved message,
so the item details are on one line (`item Box … Weight … Rt … Amt …`, items separated by `|`), and the bill PDF
comes in the same message as the text. Everything else is the old wording.

## WhatsApp — office PC sender (the old way, until the API is approved)

Choose **Office PC sender** in WhatsApp setup, then on one office PC that stays on: install Node.js, open the
`wa-sender` folder, copy `config.example.json` to `config.json` (YarnFlow address + a login), double-click
**Start WhatsApp Sender**, and scan the QR code with the office phone (WhatsApp → Linked devices).

## Email

**Messages → Email → Email setup**:

1. Gmail address (the old software used `umiyayarnllp@gmail.com`), server `smtp.gmail.com`, port `587`.
2. **App password** — Google Account → Security → turn on 2-Step Verification → *App passwords* → create one
   for "YarnFlow" → paste the 16 letters. (The normal Gmail password does not work.)
3. Tick which documents are emailed, switch **On**, **Save**, and **Send test email**.

Gmail allows about 500 emails a day; the old software hit that limit 940 times in Sep–Oct.
YarnFlow keeps under the *Daily limit* (450) and, if Gmail still refuses, pauses for an hour and carries on — nothing is lost.
If you email more than that, use a Google Workspace address (2,000 a day) or another mail service.
