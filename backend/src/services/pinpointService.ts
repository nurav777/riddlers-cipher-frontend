// Note: this file used to import @aws-sdk/client-pinpoint at top-level.
// Some environments may not have that package installed (we've migrated to SES).
// Use a runtime require and graceful no-op fallback so TypeScript build doesn't fail
// when @aws-sdk/client-pinpoint is absent.

let PinpointClient: any = undefined;
let UpdateEndpointCommand: any = undefined;
let SendMessagesCommand: any = undefined;
let pinpointClient: any = undefined;
let pinpointAvailable = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pkg = require("@aws-sdk/client-pinpoint");
  PinpointClient = pkg.PinpointClient;
  UpdateEndpointCommand = pkg.UpdateEndpointCommand;
  SendMessagesCommand = pkg.SendMessagesCommand;

  // AWS Configuration (use any for the config shape to avoid type issues when package absent)
  const clientConfig: any = {
    region: process.env.AWS_REGION || "us-east-1",
  };

  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    clientConfig.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }

  pinpointClient = new PinpointClient(clientConfig);
  pinpointAvailable = true;
} catch (e) {
  // Package not present or failed to load — fall back to a noop behaviour and log once.
  console.warn(
    "Pinpoint package not available: pinpoint methods will be no-ops. If you need Pinpoint, install @aws-sdk/client-pinpoint."
  );
}

export type PinpointChannel = "EMAIL";

export class PinpointService {
  private appId = process.env.PINPOINT_APP_ID || "";
  private defaultChannel: PinpointChannel = "EMAIL";
  private defaultAddress = process.env.PINPOINT_ADDRESS || ""; // email address only
  private fromEmailAddress = process.env.PINPOINT_FROM_EMAIL || undefined;

  private ensureConfigured(): boolean {
    if (!this.appId) {
      console.warn(
        "Pinpoint: PINPOINT_APP_ID is not set - skipping notifications."
      );
      return false;
    }
    if (!this.defaultAddress) {
      console.warn(
        "Pinpoint: PINPOINT_ADDRESS is not set - skipping notifications (no address)."
      );
      return false;
    }
    if (!this.fromEmailAddress) {
      console.warn(
        "Pinpoint: PINPOINT_FROM_EMAIL is not set - cannot send email."
      );
      return false;
    }
    return true;
  }

  async upsertEndpoint(playerId: string, address?: string): Promise<void> {
    if (!this.ensureConfigured()) return;

    const resolvedAddress = (address || this.defaultAddress).trim();

    const endpointId = playerId; // Use playerId as EndpointId

    const command = new UpdateEndpointCommand({
      ApplicationId: this.appId,
      EndpointId: endpointId,
      EndpointRequest: {
        Address: resolvedAddress,
        ChannelType: "EMAIL",
        OptOut: "NONE",
        User: {
          UserId: playerId,
        },
      },
    });

    await pinpointClient.send(command);
  }

  async sendCongratsMessage(playerId: string, address?: string): Promise<void> {
    if (!this.ensureConfigured()) return;

    const resolvedAddress = (address || this.defaultAddress).trim();

    try {
      // Ensure endpoint exists/updated
      await this.upsertEndpoint(playerId, resolvedAddress);

      const endpointId = playerId;
      const messageText =
        "🎉 Congratulations! You’ve completed all 5 levels. Thanks for playing Gotham Cipher!";

      const command = new SendMessagesCommand({
        ApplicationId: this.appId,
        MessageRequest: {
          Addresses: {
            [resolvedAddress]: {
              ChannelType: "EMAIL",
            },
          },
          MessageConfiguration: {
            EmailMessage: {
              FromAddress: this.fromEmailAddress,
              SimpleEmail: {
                Subject: { Data: "Gotham Cipher - Congratulations!" },
                HtmlPart: { Data: `<p>${messageText}</p>` },
                TextPart: { Data: messageText },
              },
            },
          },
        },
      });

      const response = await pinpointClient.send(command);
      console.log("Pinpoint: congrats email sent", {
        to: resolvedAddress,
        responseSummary: response?.MessageResponse?.Result?.[resolvedAddress],
      });
    } catch (error) {
      console.error("Pinpoint: failed to send congrats message", error);
    }
  }
}

export const pinpointService = new PinpointService();
