import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthContext";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Link } from "wouter";
import { PlusCircle, ListPlus, Globe, Lock, Star, Film, Tv } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import ListItem from "@/components/media/ListItem";

const formSchema = z.object({
  name: z.string().min(1, "List name is required"),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
});

export default function Lists() {
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      isPublic: false,
    },
  });

  // Fetch user's lists with items
  const { data: lists, isLoading } = useQuery({
    queryKey: [`/api/users/${currentUser?.uid}/lists`],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/users/${currentUser?.uid}/lists`);
        const lists = await response.json();
        console.log("Fetched lists:", lists);
        return lists;
      } catch (error) {
        console.error("Error fetching lists:", error);
        return [];
      }
    },
    enabled: !!currentUser,
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be signed in to create a list.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Creating list with data:", {
        ...values,
        userId: currentUser.uid,
      });
      
      // Create the list using the Firebase user ID
      const response = await apiRequest("POST", "/api/lists", {
        ...values,
        userId: currentUser.uid, // Use the Firebase user ID directly
      });
      
      console.log("List creation response:", await response.clone().json());
      
      toast({
        title: "List created",
        description: "Your new list has been created successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUser.uid}/lists`] });
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error creating list:", error);
      toast({
        title: "Error",
        description: "Failed to create list. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!currentUser) {
    return (
      <div className="container flex flex-col items-center justify-center px-4 py-16 text-center md:px-6">
        <h1 className="mb-4 text-3xl font-bold">Your Lists</h1>
        <p className="mb-8 max-w-md text-muted-foreground">
          Sign in to create and manage your custom movie and TV show lists.
        </p>
        <Button onClick={() => setOpen(true)}>Sign In</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container px-4 py-6 md:px-6 md:py-8">
        <h1 className="mb-6 text-3xl font-bold">Your Lists</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array(3).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-muted/50" />
              <CardContent className="p-4">
                <div className="h-5 w-2/3 rounded bg-muted/50" />
                <div className="mt-2 h-3 w-full rounded bg-muted/50" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-3xl font-bold">Your Lists</h1>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Create New List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New List</DialogTitle>
              <DialogDescription>
                Create a custom list to organize your favorite movies and TV shows.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>List Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. My Favorite Sci-Fi" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add a description for your list..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Public List</FormLabel>
                        <FormDescription>
                          Make this list visible to other users
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit">Create List</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lists?.map((list: any) => (
          <Link key={list.id} href={`/lists/${list.id}`}>
            <Card className="cursor-pointer transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ListPlus className="h-5 w-5" />
                    {list.name}
                  </CardTitle>
                  {list.isPublic ? (
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <CardDescription>{list.description || "No description"}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Film className="h-4 w-4" />
                    <span>0 Movies</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Tv className="h-4 w-4" />
                    <span>0 Shows</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
