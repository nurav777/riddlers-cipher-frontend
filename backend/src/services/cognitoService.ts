import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminConfirmSignUpCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  AdminDeleteUserCommand,
  ListUsersCommand,
  SignUpCommand,
  UserType,
} from "@aws-sdk/client-cognito-identity-provider";
import {
  AuthResponse,
  User,
  LoginRequest,
  RegisterRequest,
  VerifyRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "../types";

// Build client config, only attach explicit credentials if both are provided
const clientConfig: ConstructorParameters<
  typeof CognitoIdentityProviderClient
>[0] = {
  region: process.env.AWS_REGION || "us-east-1",
};

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

const cognitoClient = new CognitoIdentityProviderClient(clientConfig);

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID!;
// CLIENT_SECRET is optional; only some app clients have a secret
const CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET;

export class CognitoService {
  private ensureBaseConfig(): void {
    console.log("Checking USER_POOL_ID:", USER_POOL_ID);
    console.log("Checking CLIENT_ID:", CLIENT_ID);
    if (!USER_POOL_ID || !CLIENT_ID) {
      throw new Error(
        "Cognito configuration missing: COGNITO_USER_POOL_ID/COGNITO_CLIENT_ID"
      );
    }
  }

  /**
   * Authenticate user with email and password
   */
  async login(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      if (!CLIENT_ID) throw new Error("COGNITO_CLIENT_ID is missing");

      const command = new InitiateAuthCommand({
        ClientId: CLIENT_ID,
        AuthFlow: "USER_PASSWORD_AUTH",
        AuthParameters: {
          USERNAME: loginData.email,
          PASSWORD: loginData.password,
          ...(CLIENT_SECRET
            ? { SECRET_HASH: this.generateSecretHash(loginData.email) }
            : {}),
        },
      });

      const response = await cognitoClient.send(command);

      return {
        success: true,
        message: "Authentication successful",
        data: {
          tokens: {
            accessToken: response.AuthenticationResult?.AccessToken!,
            refreshToken: response.AuthenticationResult?.RefreshToken!,
            idToken: response.AuthenticationResult?.IdToken!,
          },
        },
      };
    } catch (error: any) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "Authentication failed",
        error: error.message || "Unknown error",
      };
    }
  }

  /**
   * Register a new user
   */
  async register(registerData: RegisterRequest): Promise<AuthResponse> {
    try {
      this.ensureBaseConfig();

      // 1. Create user with temporary password
      const command = new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: registerData.email,
        UserAttributes: [
          { Name: "email", Value: registerData.email },
          { Name: "email_verified", Value: "true" }, // 👈 ensures email is verified
          { Name: "given_name", Value: registerData.firstName },
          { Name: "family_name", Value: registerData.lastName },
          { Name: "preferred_username", Value: registerData.username },
        ],
        TemporaryPassword: this.generateTemporaryPassword(),
        MessageAction: "SUPPRESS", // Don’t send Cognito's welcome email
      });

      await cognitoClient.send(command);

      // 2. Set permanent password (this will also confirm the user automatically)
      await this.setUserPassword(registerData.email, registerData.password);

      return {
        success: true,
        message: "User registered successfully.",
      };
    } catch (error: any) {
      console.error("Registration error:", error);
      return {
        success: false,
        message: "Registration failed",
        error: this.getErrorMessage(error),
      };
    }
  }
  /**
   * Verify user email with code
   */
  async verifyEmail(verifyData: VerifyRequest): Promise<AuthResponse> {
    try {
      this.ensureBaseConfig();
      const command = new AdminConfirmSignUpCommand({
        UserPoolId: USER_POOL_ID,
        Username: verifyData.email,
      });

      await cognitoClient.send(command);

      return {
        success: true,
        message: "Email verified successfully",
      };
    } catch (error: any) {
      console.error("Email verification error:", error);
      return {
        success: false,
        message: "Email verification failed",
        error: this.getErrorMessage(error),
      };
    }
  }

  /**
   * Initiate forgot password flow
   */
  async forgotPassword(
    forgotData: ForgotPasswordRequest
  ): Promise<AuthResponse> {
    try {
      this.ensureBaseConfig();
      const command = new ForgotPasswordCommand({
        ClientId: CLIENT_ID,
        Username: forgotData.email,
        ...(CLIENT_SECRET
          ? { SecretHash: this.generateSecretHash(forgotData.email) }
          : {}),
      });

      await cognitoClient.send(command);

      return {
        success: true,
        message: "Password reset code sent to your email",
      };
    } catch (error: any) {
      console.error("Forgot password error:", error);
      return {
        success: false,
        message: "Failed to send password reset code",
        error: this.getErrorMessage(error),
      };
    }
  }

  /**
   * Reset password with verification code
   */
  async resetPassword(resetData: ResetPasswordRequest): Promise<AuthResponse> {
    try {
      this.ensureBaseConfig();
      const command = new ConfirmForgotPasswordCommand({
        ClientId: CLIENT_ID,
        Username: resetData.email,
        ConfirmationCode: resetData.code,
        Password: resetData.newPassword,
        ...(CLIENT_SECRET
          ? { SecretHash: this.generateSecretHash(resetData.email) }
          : {}),
      });

      await cognitoClient.send(command);

      return {
        success: true,
        message: "Password reset successfully",
      };
    } catch (error: any) {
      console.error("Reset password error:", error);
      return {
        success: false,
        message: "Password reset failed",
        error: this.getErrorMessage(error),
      };
    }
  }

  /**
   * Get user information by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      this.ensureBaseConfig();
      const command = new AdminGetUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
      });

      const response = await cognitoClient.send(command);

      if (response.Username) {
        // Create a basic user object from the response
        return {
          id: response.Username,
          email: response.Username, // Assuming username is email
          username: response.Username,
          firstName: "",
          lastName: "",
          isVerified: true,
          createdAt: new Date().toISOString(),
        };
      }

      return null;
    } catch (error) {
      console.error("Get user error:", error);
      return null;
    }
  }

  /**
   * Delete user account
   */
  async deleteUser(email: string): Promise<AuthResponse> {
    try {
      this.ensureBaseConfig();
      const command = new AdminDeleteUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
      });

      await cognitoClient.send(command);

      return {
        success: true,
        message: "User account deleted successfully",
      };
    } catch (error: any) {
      console.error("Delete user error:", error);
      return {
        success: false,
        message: "Failed to delete user account",
        error: this.getErrorMessage(error),
      };
    }
  }

  /**
   * Generate secret hash for Cognito
   */
  private generateSecretHash(username: string): string {
    const crypto = require("crypto");
    if (!CLIENT_SECRET) {
      throw new Error(
        "COGNITO_CLIENT_SECRET is not set but SecretHash was requested"
      );
    }
    return crypto
      .createHmac("SHA256", CLIENT_SECRET)
      .update(username + CLIENT_ID)
      .digest("base64");
  }

  /**
   * Generate temporary password
   */
  private generateTemporaryPassword(): string {
    return "TempPass123!";
  }

  /**
   * Set user password
   */
  private async setUserPassword(
    email: string,
    password: string
  ): Promise<void> {
    const command = new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true,
    });

    await cognitoClient.send(command);
  }

  /**
   * Confirm user signup
   */
  private async confirmUser(email: string): Promise<void> {
    const command = new AdminConfirmSignUpCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
    });

    await cognitoClient.send(command);
  }

  /**
   * Map Cognito user to our User type
   */
  private mapCognitoUserToUser(cognitoUser: UserType): User {
    const attributes = cognitoUser.Attributes || [];
    const email = attributes.find((attr) => attr.Name === "email")?.Value || "";
    const firstName =
      attributes.find((attr) => attr.Name === "given_name")?.Value || "";
    const lastName =
      attributes.find((attr) => attr.Name === "family_name")?.Value || "";
    const username =
      attributes.find((attr) => attr.Name === "preferred_username")?.Value ||
      "";

    return {
      id: cognitoUser.Username || "",
      email,
      username,
      firstName,
      lastName,
      isVerified: cognitoUser.UserStatus === "CONFIRMED",
      createdAt:
        cognitoUser.UserCreateDate?.toISOString() || new Date().toISOString(),
      lastLogin: cognitoUser.UserLastModifiedDate?.toISOString(),
    };
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: any): string {
    if (error.name === "NotAuthorizedException") {
      return "Invalid credentials";
    }
    if (error.name === "UserNotFoundException") {
      return "User not found";
    }
    if (error.name === "UserNotConfirmedException") {
      return "Please verify your email address";
    }
    if (error.name === "InvalidPasswordException") {
      return "Password does not meet requirements";
    }
    if (error.name === "UsernameExistsException") {
      return "User already exists";
    }
    if (error.name === "InvalidParameterException") {
      return "Invalid parameters provided";
    }
    if (error.name === "CodeMismatchException") {
      return "Invalid verification code";
    }
    if (error.name === "ExpiredCodeException") {
      return "Verification code has expired";
    }

    return error.message || "An unexpected error occurred";
  }

  async getUserEmailBySub(sub: string): Promise<string | undefined> {
    if (!USER_POOL_ID) {
      console.warn("CognitoService: COGNITO_USER_POOL_ID not set.");
      return undefined;
    }

    try {
      const resp = await cognitoClient.send(new AdminGetUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: sub,
      }));

      const attrs = resp.UserAttributes || [];
      const emailAttr = attrs.find(a => a.Name === 'email');
      return emailAttr?.Value;
    } catch (err) {
      console.warn("CognitoService: failed to fetch user email", err);
      return undefined;
    }
  }
}

export const cognitoService = new CognitoService();
