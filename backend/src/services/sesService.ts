import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Adopt contents from sesService2 (richer runtime logging) into canonical sesService
// Build SES client config (credentials optional: SDK will pick up env/role if not provided)
const clientConfig: ConstructorParameters<typeof SESClient>[0] = {
  region: process.env.AWS_REGION || "us-east-1",
};

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

const sesClient = new SESClient(clientConfig);

export class SESService {
  private fromEmailAddress = process.env.SES_FROM_EMAIL;

  private ensureConfigured(): boolean {
    if (!this.fromEmailAddress) {
      console.warn("SES: SES_FROM_EMAIL is not set - cannot send email.");
      return false;
    }
    return true;
  }

  // Public helper so other modules can check config at startup
  public isConfigured(): boolean {
    return this.ensureConfigured();
  }

  async sendCongratsMessage(playerEmail: string): Promise<void> {
    if (!this.ensureConfigured()) return;

    try {
      console.log("SES: attempting to send congrats email", {
        from: this.fromEmailAddress,
        to: playerEmail,
      });
      const messageText =
        "🎉 Congratulations! You've completed all 5 levels. Thanks for playing Gotham Cipher!";
      const htmlBody = `
        <h1>Congratulations!</h1>
        <p>${messageText}</p>
        <p>You've proven yourself worthy of protecting Gotham City.</p>
      `;

      const command = new SendEmailCommand({
        Destination: {
          ToAddresses: [playerEmail],
        },
        Message: {
          Body: {
            Html: {
              Charset: "UTF-8",
              Data: htmlBody,
            },
            Text: {
              Charset: "UTF-8",
              Data: messageText,
            },
          },
          Subject: {
            Charset: "UTF-8",
            Data: "Gotham Cipher - Congratulations!",
          },
        },
        Source: this.fromEmailAddress,
      });

      const response = await sesClient.send(command);
      console.log("SES: congrats email sent", { to: playerEmail, response });
    } catch (error) {
      // Log full error for debugging
      console.error("SES: failed to send congrats message", error);

      // Provide actionable hints based on common SES errors
      type ErrorLike = {
        name?: string;
        Code?: string;
        message?: string;
        [key: string]: unknown;
      };
      const errAny = error as ErrorLike;
      const errName = (errAny && (errAny.name || errAny.Code)) || undefined;
      const errMsg =
        (errAny && (errAny.message || JSON.stringify(errAny))) || "";

      if (
        /(not verified|address is not verified|identity must be verified|verify|sandbox)/i.test(
          errMsg
        ) ||
        errName === "MessageRejected"
      ) {
        console.warn(
          "SES: It looks like the error may be due to SES sandbox or unverified identities.\n" +
            "- Ensure SES_FROM_EMAIL is a verified identity (or domain) in SES.\n" +
            "- If your account is in SES sandbox, verify recipient addresses or request production access.\n" +
            "- Check the SES console for more details."
        );
      } else if (
        /(access|authoriz|not authorized|permission)/i.test(errMsg) ||
        errName === "AccessDenied"
      ) {
        console.warn(
          "SES: Access denied. Check IAM permissions for the role/user running the backend.\n" +
            "Required actions: ses:SendEmail, ses:SendRawEmail."
        );
      } else {
        console.warn("SES: send failed - see error object above for details");
      }
    }
  }
}

export const sesService = new SESService();

// Log SES startup status to terminal
if (process.env.SES_FROM_EMAIL) {
  console.log(`SES: configured. From address = ${process.env.SES_FROM_EMAIL}`);
} else {
  console.warn(
    "SES: SES_FROM_EMAIL not configured. SES emails will not be sent."
  );
}
