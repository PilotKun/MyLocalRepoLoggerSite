import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth/AuthContext";
import { apiRequest } from "@/lib/queryClient";

interface EditProfileModalProps {
  onClose: () => void;
}

export default function EditProfileModal({ onClose }: EditProfileModalProps) {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState(currentUser?.displayName || "");
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    setError(null);
    
    try {
      await apiRequest("PUT", `/api/users/${currentUser.uid}`, {
        displayName: name,
        photoURL: photoURL,
      });

      await queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUser.uid}`] });
      
      onClose();
    } catch (err: any) { 
      console.error("Failed to update profile:", err);
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="col-span-3" 
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="photoUrl" className="text-right">
              Photo URL
            </Label>
            <Input 
              id="photoUrl" 
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)} 
              placeholder="https://example.com/image.png"
              className="col-span-3" 
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-sm text-red-500 text-center col-span-4">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 