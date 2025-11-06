import jwt from "jsonwebtoken";
import { JWTPayload } from "../types";

const JWT_SECRET = process.env.JWT_SECRET || "gotham-cipher-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

export class JWTService {
  /**
   * Generate JWT token
   */
  static generateToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: "gotham-cipher-backend",
      audience: "gotham-cipher-frontend",
    } as jwt.SignOptions);
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: "gotham-cipher-backend",
        audience: "gotham-cipher-frontend",
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      console.error("JWT verification error:", error);
      return null;
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return null;
    }

    return parts[1];
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      if (!decoded || !decoded.exp) {
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Refresh token (generate new token with same payload)
   */
  static refreshToken(token: string): string | null {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      if (!decoded) {
        return null;
      }

      const { iat, exp, ...payload } = decoded;
      return this.generateToken(payload);
    } catch (error) {
      console.error("Token refresh error:", error);
      return null;
    }
  }
}
