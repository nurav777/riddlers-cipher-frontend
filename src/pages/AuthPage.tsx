import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AuthApi, setAuthToken } from "@/lib/api";
import batmanBg from "@/assets/batman-bg.jpg";

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const AuthPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: "",
    password: "",
  });
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loginErrors, setLoginErrors] = useState<Partial<LoginForm>>({});
  const [registerErrors, setRegisterErrors] = useState<Partial<RegisterForm>>(
    {}
  );
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState("");

  const validateLoginForm = (): boolean => {
    const newErrors: Partial<LoginForm> = {};

    if (!loginForm.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(loginForm.email)) {
      newErrors.email = "Email format is invalid";
    }

    if (!loginForm.password) {
      newErrors.password = "Password is required";
    } else if (loginForm.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setLoginErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegisterForm = (): boolean => {
    const newErrors: Partial<RegisterForm> = {};

    if (!registerForm.name) {
      newErrors.name = "Name is required";
    } else if (registerForm.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!registerForm.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(registerForm.email)) {
      newErrors.email = "Email format is invalid";
    }

    if (!registerForm.password) {
      newErrors.password = "Password is required";
    } else if (registerForm.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!registerForm.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (registerForm.password !== registerForm.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setRegisterErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));

    if (loginErrors[name as keyof LoginForm]) {
      setLoginErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleRegisterInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));

    if (registerErrors[name as keyof RegisterForm]) {
      setRegisterErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateLoginForm()) return;

    setLoading(true);

    try {
      const response = await AuthApi.login({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (!response.success)
        throw new Error(response.message || "Login failed");

      const jwtToken = (response.data as any)?.jwtToken;
      const profile = (response.data as any)?.profile;
      const cognitoSub = (response.data as any)?.user?.sub || profile?.userId;
      
      console.log('Login response:', response);
      console.log('Profile data from login:', profile);
      
      if (jwtToken) setAuthToken(jwtToken);
      
      // Store profile data in localStorage for use by other components
      if (profile) {
        // Clear any existing user data first to prevent cross-user contamination
        localStorage.removeItem('userProfile');
        localStorage.removeItem('gotham_user_profile');
        localStorage.removeItem('gotham_levels_state');
        localStorage.removeItem('gotham_ui_state');
        console.log('Cleared existing localStorage data for new user');
        
        localStorage.setItem('userProfile', JSON.stringify(profile));
        console.log('Profile stored in localStorage');
        
        // Also update the game profile to sync with DynamoDB data
        const gameProfile = {
          username: profile.username || 'BATMAN_01',
          avatarUrl: profile.avatar,
          totalStars: profile.gameStats?.totalScore || 0,
          tutorialSeen: false, // New users need to see the tutorial
          lastSavedAt: new Date().toISOString()
        };
        localStorage.setItem('gotham_user_profile', JSON.stringify(gameProfile));
        
        // Store level progress from DynamoDB if available
        if (profile.levelProgress?.levels) {
          localStorage.setItem('gotham_levels_state', JSON.stringify(profile.levelProgress.levels));
          console.log('Level progress loaded from DynamoDB:', profile.levelProgress.levels);
        }
        
        console.log('Game profile synced with DynamoDB data:', gameProfile);
        console.log('DynamoDB profile username:', profile.username);
        console.log('DynamoDB profile avatar:', profile.avatar);
        console.log('DynamoDB profile gameStats:', profile.gameStats);
        console.log('DynamoDB profile levelProgress:', profile.levelProgress);
        
        // Store user ID to track user changes
        localStorage.setItem('CURRENT_USER_ID', cognitoSub);
        
        // Trigger a custom event to notify other components
        window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: gameProfile }));
        console.log('Custom event dispatched for userProfileUpdated');
      } else {
        console.log('No profile data in login response');
      }

      toast({
        title: "Access Granted",
        description: "Welcome to the Batcave, Detective.",
      });
      navigate("/gotham");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description:
          "The Riddler has encrypted this system. Check your credentials.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateRegisterForm()) return;

    setLoading(true);

    try {
      const [firstName, ...rest] = registerForm.name.trim().split(" ");
      const lastName = rest.join(" ") || "";
      const usernameBase =
        registerForm.email?.split("@")[0] || firstName || "detective";
      const username =
        usernameBase.replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 30) ||
        "detective";

      const response = await AuthApi.register({
        email: registerForm.email,
        password: registerForm.password,
        firstName,
        lastName,
        username,
      });

      if (!response.success)
        throw new Error(response.message || "Registration failed");

      toast({
        title: "Registration Successful",
        description: `Welcome to Gotham, ${registerForm.name}. Your access has been granted.`,
      });
      navigate("/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "Unable to create account. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!loginForm.email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Enter your email above, then click Forgot Password.",
      });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(loginForm.email)) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address.",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await AuthApi.forgotPassword({ email: loginForm.email });
      if (response.success) {
        toast({
          title: "Recovery Protocol Initiated",
          description:
            response.message || "Password reset code sent to your email.",
        });
        setIsResetMode(true);
      } else {
        toast({
          variant: "destructive",
          title: "Recovery Failed",
          description:
            response.error ||
            response.message ||
            "Unable to start password recovery.",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Recovery Failed",
        description: "Unexpected error initiating password recovery.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!isResetMode) return;
    if (!loginForm.email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Enter your email above.",
      });
      return;
    }
    if (!resetCode) {
      toast({
        variant: "destructive",
        title: "Code Required",
        description: "Enter the code sent to your email.",
      });
      return;
    }
    if (!resetPassword || resetPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Weak Password",
        description: "New password must be at least 8 characters.",
      });
      return;
    }
    if (resetPassword !== resetPasswordConfirm) {
      toast({
        variant: "destructive",
        title: "Passwords Don't Match",
        description: "Re-enter the same password.",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await AuthApi.resetPassword({
        email: loginForm.email,
        code: resetCode,
        newPassword: resetPassword,
      });
      if (response.success) {
        toast({
          title: "Password Reset Successful",
          description: "You can now log in with your new password.",
        });
        setIsResetMode(false);
        setResetCode("");
        setResetPassword("");
        setResetPasswordConfirm("");
      } else {
        toast({
          variant: "destructive",
          title: "Reset Failed",
          description:
            response.error || response.message || "Unable to reset password.",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: "Unexpected error resetting password.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToTitle = () => {
    navigate("/");
  };

  const switchToRegister = () => {
    setIsLogin(false);
    setLoginErrors({});
  };

  const switchToLogin = () => {
    setIsLogin(true);
    setRegisterErrors({});
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gotham-black">
      {/* Batman Background with stronger overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${batmanBg})` }}
      >
        <div className="absolute inset-0 bg-gotham-black/80" />
      </div>

      {/* Video background placeholder */}
      <div className="absolute inset-0 bg-gotham-black/20">
        <div className="w-full h-full bg-gradient-to-br from-gotham-black/50 to-gotham-red/10" />
      </div>

      {/* Back button */}
      <div className="absolute top-6 left-6 z-20">
        <Button
          variant="gotham-ghost"
          onClick={handleBackToTitle}
          className="fade-slide-up"
        >
          ← Back to Gotham
        </Button>
      </div>

      {/* Main auth container */}
      <main className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-md fade-slide-up">
          <Card className="bg-gotham-black/90 backdrop-blur-md border-gotham-red/30 shadow-gotham">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-gotham-red rounded-full flex items-center justify-center animate-pulse-glow">
                <span className="text-gotham-white font-orbitron font-black text-2xl">
                  G
                </span>
              </div>
              <CardTitle className="font-orbitron text-2xl text-gotham-white">
                {isLogin ? "SYSTEM ACCESS" : "REGISTER ACCESS"}
              </CardTitle>
              <CardDescription className="text-gotham-white/70">
                {isLogin
                  ? "Enter your credentials to access the Bat-Computer"
                  : "Create your detective profile to join the investigation"}
              </CardDescription>
            </CardHeader>

            {isLogin ? (
              isResetMode ? (
                <>
                  <CardContent className="space-y-4">
                    <div className="text-gotham-white/70 text-sm">
                      Enter the verification code sent to {loginForm.email} and set a new password.
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="resetCode"
                        className="font-orbitron text-gotham-white"
                      >
                        Verification Code
                      </Label>
                      <Input
                        id="resetCode"
                        name="resetCode"
                        type="text"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        className="bg-gotham-gray/50 border-gotham-red/30 text-gotham-white placeholder:text-gotham-white/50 focus:border-gotham-red focus:ring-gotham-red/20"
                        placeholder="Enter the code from your email"
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="newPassword"
                        className="font-orbitron text-gotham-white"
                      >
                        New Password
                      </Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        className="bg-gotham-gray/50 border-gotham-red/30 text-gotham-white placeholder:text-gotham-white/50 focus:border-gotham-red focus:ring-gotham-red/20"
                        placeholder="Enter a new password"
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="newPasswordConfirm"
                        className="font-orbitron text-gotham-white"
                      >
                        Confirm New Password
                      </Label>
                      <Input
                        id="newPasswordConfirm"
                        name="newPasswordConfirm"
                        type="password"
                        value={resetPasswordConfirm}
                        onChange={(e) => setResetPasswordConfirm(e.target.value)}
                        className="bg-gotham-gray/50 border-gotham-red/30 text-gotham-white placeholder:text-gotham-white/50 focus:border-gotham-red focus:ring-gotham-red/20"
                        placeholder="Re-enter new password"
                        disabled={loading}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="space-y-4">
                    <Button
                      type="button"
                      variant="gotham"
                      className="w-full font-orbitron font-bold"
                      disabled={loading}
                      onClick={handleResetPassword}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-gotham-white/30 border-t-gotham-white rounded-full animate-spin" />
                          Resetting...
                        </div>
                      ) : (
                        "RESET PASSWORD"
                      )}
                    </Button>
                    <div className="text-center">
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => setIsResetMode(false)}
                        className="text-gotham-red hover:text-gotham-red/80 p-0 h-auto font-orbitron text-sm"
                        disabled={loading}
                      >
                        Back to Login
                      </Button>
                    </div>
                  </CardFooter>
                </>
              ) : (
                <form onSubmit={handleLogin}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="font-orbitron text-gotham-white"
                      >
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={loginForm.email}
                        onChange={handleLoginInputChange}
                        className="bg-gotham-gray/50 border-gotham-red/30 text-gotham-white placeholder:text-gotham-white/50 focus:border-gotham-red focus:ring-gotham-red/20"
                        placeholder="detective@gotham.com"
                        disabled={loading}
                      />
                      {loginErrors.email && (
                        <Alert variant="destructive" className="py-2">
                          <AlertDescription className="text-sm">
                            {loginErrors.email}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="password"
                        className="font-orbitron text-gotham-white"
                      >
                        Password
                      </Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={loginForm.password}
                        onChange={handleLoginInputChange}
                        className="bg-gotham-gray/50 border-gotham-red/30 text-gotham-white placeholder:text-gotham-white/50 focus:border-gotham-red focus:ring-gotham-red/20"
                        placeholder="Enter your password"
                        disabled={loading}
                      />
                      {loginErrors.password && (
                        <Alert variant="destructive" className="py-2">
                          <AlertDescription className="text-sm">
                            {loginErrors.password}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="link"
                      onClick={handleForgotPassword}
                      className="text-gotham-red hover:text-gotham-red/80 p-0 h-auto font-orbitron text-sm"
                      disabled={loading}
                    >
                      Forgot Password?
                    </Button>
                  </CardContent>
                  <CardFooter className="space-y-4">
                    <Button
                      type="submit"
                      variant="gotham"
                      className="w-full font-orbitron font-bold"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-gotham-white/30 border-t-gotham-white rounded-full animate-spin" />
                          Accessing...
                        </div>
                      ) : (
                        "SYSTEM ACCESS"
                      )}
                    </Button>
                    <div className="text-center">
                      <span className="text-gotham-white/60 text-sm">
                        New to Gotham?{" "}
                      </span>
                      <Button
                        type="button"
                        variant="link"
                        onClick={switchToRegister}
                        className="text-gotham-red hover:text-gotham-red/80 p-0 h-auto font-orbitron text-sm"
                        disabled={loading}
                      >
                        Register Here
                      </Button>
                    </div>
                  </CardFooter>
                </form>
              )
            ) : (
              <form onSubmit={handleRegister}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="font-orbitron text-gotham-white"
                    >
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={registerForm.name}
                      onChange={handleRegisterInputChange}
                      className="bg-gotham-gray/50 border-gotham-red/30 text-gotham-white placeholder:text-gotham-white/50 focus:border-gotham-red focus:ring-gotham-red/20"
                      placeholder="Bruce Wayne"
                      disabled={loading}
                    />
                    {registerErrors.name && (
                      <Alert variant="destructive" className="py-2">
                        <AlertDescription className="text-sm">
                          {registerErrors.name}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="font-orbitron text-gotham-white"
                    >
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={registerForm.email}
                      onChange={handleRegisterInputChange}
                      className="bg-gotham-gray/50 border-gotham-red/30 text-gotham-white placeholder:text-gotham-white/50 focus:border-gotham-red focus:ring-gotham-red/20"
                      placeholder="detective@gotham.com"
                      disabled={loading}
                    />
                    {registerErrors.email && (
                      <Alert variant="destructive" className="py-2">
                        <AlertDescription className="text-sm">
                          {registerErrors.email}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="font-orbitron text-gotham-white"
                    >
                      Password
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={registerForm.password}
                      onChange={handleRegisterInputChange}
                      className="bg-gotham-gray/50 border-gotham-red/30 text-gotham-white placeholder:text-gotham-white/50 focus:border-gotham-red focus:ring-gotham-red/20"
                      placeholder="Create a secure password"
                      disabled={loading}
                    />
                    {registerErrors.password && (
                      <Alert variant="destructive" className="py-2">
                        <AlertDescription className="text-sm">
                          {registerErrors.password}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="confirmPassword"
                      className="font-orbitron text-gotham-white"
                    >
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={registerForm.confirmPassword}
                      onChange={handleRegisterInputChange}
                      className="bg-gotham-gray/50 border-gotham-red/30 text-gotham-white placeholder:text-gotham-white/50 focus:border-gotham-red focus:ring-gotham-red/20"
                      placeholder="Re-enter your password"
                      disabled={loading}
                    />
                    {registerErrors.confirmPassword && (
                      <Alert variant="destructive" className="py-2">
                        <AlertDescription className="text-sm">
                          {registerErrors.confirmPassword}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="space-y-4">
                  <Button
                    type="submit"
                    variant="gotham"
                    className="w-full font-orbitron font-bold"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-gotham-white/30 border-t-gotham-white rounded-full animate-spin" />
                        Creating Profile...
                      </div>
                    ) : (
                      "JOIN THE INVESTIGATION"
                    )}
                  </Button>

                  <div className="text-center">
                    <span className="text-gotham-white/60 text-sm">
                      Already have access?{" "}
                    </span>
                    <Button
                      type="button"
                      variant="link"
                      onClick={switchToLogin}
                      className="text-gotham-red hover:text-gotham-red/80 p-0 h-auto font-orbitron text-sm"
                      disabled={loading}
                    >
                      Login Here
                    </Button>
                  </div>
                </CardFooter>
              </form>
            )}
          </Card>

          {/* Additional info */}
          <div className="mt-6 text-center">
            <p className="text-gotham-white/60 text-sm font-inter">
              Unauthorized access will trigger Gotham City security protocols
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
