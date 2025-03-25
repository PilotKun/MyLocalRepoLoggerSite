import { useState } from "react";
import { X } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthContext";

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
        toast({
          title: "Sign in successful",
          description: "Welcome back to CineLog!",
        });
      } else {
        await signUp(email, password, name);
        toast({
          title: "Account created",
          description: "Welcome to CineLog!",
        });
      }
      onClose();
    } catch (error: any) {
      const errorMessage = error.code ? 
        getFirebaseErrorMessage(error.code) : 
        "An error occurred. Please try again.";
        
      toast({
        title: "Authentication failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      console.log("Initiating Google sign-in from modal");
      await signInWithGoogle();
      
      // If we're using popup, this code will run after successful sign-in
      // If we're using redirect, this code won't run (page will redirect)
      toast({
        title: "Sign in successful",
        description: "Welcome to CineLog!",
      });
      onClose();
    } catch (error: any) {
      // Don't show error if user just closed the popup
      if (error.code !== 'auth/cancelled-popup-request' && 
          error.code !== 'auth/popup-closed-by-user') {
        console.error("Google sign-in failed:", error);
        toast({
          title: "Authentication failed",
          description: getFirebaseErrorMessage(error.code),
          variant: "destructive",
        });
      } else {
        console.log("User cancelled the Google sign-in process");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Extend your error message function to handle Google-specific errors:
  const getFirebaseErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'This email is already in use.';
      case 'auth/invalid-email':
        return 'Please provide a valid email address.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Invalid email or password.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      case 'auth/popup-blocked':
        return 'Popup blocked by browser. Please allow popups for this site.';
      case 'auth/internal-error':
        return 'An internal authentication error occurred. Please try again.';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with the same email but different sign-in credentials.';
      default:
        return `Authentication error (${errorCode}). Please try again.`;
    }
  };

  return (
    <Dialog defaultOpen={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'signin' ? 'Sign In' : 'Sign Up'}</DialogTitle>
          <DialogDescription>
            {mode === 'signin' 
              ? 'Sign in to track your movies and shows.' 
              : 'Create an account to start tracking your favorites.'}
          </DialogDescription>
        </DialogHeader>
        
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          type="button"
        >
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            <path d="M1 1h22v22H1z" fill="none" />
          </svg>
          Continue with Google
        </Button>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={mode === 'signup'}
                disabled={isLoading}
              />
            </div>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={isLoading}>
              {mode === 'signin' ? 'Sign In' : 'Sign Up'}
            </Button>
            <Button
              type="button"
              variant="link"
              className="text-xs"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              disabled={isLoading}
            >
              {mode === 'signin'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}