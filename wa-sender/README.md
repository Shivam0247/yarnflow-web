# YarnFlow WhatsApp sender

Same job as the old **WhatsApp Sender** program on the office server: when someone saves a sale bill, sale order,
bank receipt / payment, debit / credit note or sale return, YarnFlow puts the messages in the queue
(Reports → WhatsApp messages). This program, running on one office PC, sends them within seconds from the
office WhatsApp number — the text, and the bill PDF with its caption — and marks them **Sent**.

1. Install Node.js 20 or newer on the PC.
2. Copy `config.example.json` to `config.json`; fill in the YarnFlow address, and a YarnFlow login for the sender.
3. Double-click **Start WhatsApp Sender** (`.bat` on Windows, `.command` on Mac).
4. The first time, a QR code appears: on the office phone open WhatsApp → Linked devices → Link a device, and scan it.
   After that it stays logged in.

Keep the window open (as the old sender was). If it stops, it restarts itself.
A message that fails is tried 3 times, then shows as **Failed** with the reason on the WhatsApp messages screen.

Test without sending anything: `npm run dry -- --once` writes the texts and PDFs to `./dry-run`.
