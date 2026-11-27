# WhatsApp and Email — setup

In YarnFlow the team only sees:
- **Messages → WhatsApp** and **Messages → Email**: the log of everything sent (with the old software's messages as history).
- A **WhatsApp** and an **email** icon next to Print on sale bills, sale returns, debit / credit notes, sales orders,
  bank receipts / payments and the outstanding report — one click sends that document (or that party's outstanding) to the party.
- Saving one of those documents also sends its message automatically, as the old software did.

There is no settings screen. The connection is set up once on the server with `server/src/tools/messaging.ts`
(commands below), by whoever runs the server.

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

On the server (`cd server`):

6. `npx tsx src/tools/messaging.ts whatsapp --mode cloud --phone-number-id … --waba-id … --app-id … --token … --app-secret …`
7. `npx tsx src/tools/messaging.ts templates` — sends the six message wordings (sale bill, sale return, sale order,
   bank receipt, bank payment, document PDF) to Meta. Approval is usually minutes to a day;
   `npx tsx src/tools/messaging.ts templates --status-only` shows it.
8. **Webhook** (for delivered / read ticks) — in the Meta app: WhatsApp → Configuration → Webhook → Edit:
   *Callback URL* = `https://<YarnFlow address>/api/whatsapp/webhook`,
   *Verify token* = the one printed by the `whatsapp` command (`… messaging.ts show`) → Verify and save → subscribe to **messages**.
9. `npx tsx src/tools/messaging.ts test-whatsapp 98XXXXXXXX` sends a test receipt message to your phone. From then on every saved document goes out automatically.

What changes compared with the old messages: Meta does not allow a varying number of lines in an approved message,
so the item details are on one line (`item Box … Weight … Rt … Amt …`, items separated by `|`), and the bill PDF
comes in the same message as the text. Everything else is the old wording.

## WhatsApp — office PC sender (the old way, until the API is approved)

`npx tsx src/tools/messaging.ts whatsapp --mode linked`, then on one office PC that stays on: install Node.js, open the
`wa-sender` folder, copy `config.example.json` to `config.json` (YarnFlow address + a login), double-click
**Start WhatsApp Sender**, and scan the QR code with the office phone (WhatsApp → Linked devices).

## Email

1. **App password** for the Gmail address (the old software used `umiyayarnllp@gmail.com`) — Google Account → Security →
   turn on 2-Step Verification → *App passwords* → create one for "YarnFlow". (The normal Gmail password does not work.)
2. `npx tsx src/tools/messaging.ts email --user umiyayarnllp@gmail.com --password "abcd efgh ijkl mnop" --on`
   (add `--forms SAL,SALRTN,SalOrder,DBNT,CRNT` to choose which documents email automatically).
3. `npx tsx src/tools/messaging.ts test-email you@example.com`.

Gmail allows about 500 emails a day; the old software hit that limit 940 times in Sep–Oct.
YarnFlow keeps under a daily limit of 450 (`--limit` to change) and, if Gmail still refuses, pauses for an hour and carries on — nothing is lost.
If you email more than that, use a Google Workspace address (2,000 a day) or another mail service.
