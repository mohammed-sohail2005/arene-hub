import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Gamepad2, Trophy, Users, Clock, Target, Camera, Youtube, Wallet } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { createTournament } from "@/services/api";

const bgmiMaps = ["Erangel", "Miramar", "Sanhok", "Vikendi", "Livik", "Karakin"];
const freefireMaps = ["Bermuda", "Purgatory", "Kalahari", "Alpine", "Nexterra"];

const formSchema = z.object({
  game: z.enum(["bgmi", "freefire"], {
    required_error: "Please select a game.",
  }),
  ownerName: z.string().min(2, "Owner name must be at least 2 characters.").max(50),
  tournamentName: z.string().min(3, "Tournament name must be at least 3 characters.").max(100),
  map: z.string().min(1, "Please select a map."),
  prizePool: z.string().min(1, "Prize pool is required."),
  matchDate: z.date({
    required_error: "Match date is required.",
  }),
  roomOpenTime: z.string().min(1, "Room opening time is required."),
  matchStartTime: z.string().min(1, "Match start time is required."),
  maxPlayers: z.string().min(1, "Max players is required."),
  entryFee: z.string().optional(),
  upiId: z.string().min(3, "UPI ID is required.").max(100),
  youtubeChannel: z.string().url("Please enter a valid URL.").optional().or(z.literal("")),
  killPoints: z.string().optional(),
  rankPoints: z.string().optional(),
  description: z.string().max(500).optional(),
});

type FormData = z.infer<typeof formSchema>;

const HostTournament = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedGame, setSelectedGame] = useState<"bgmi" | "freefire" | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB.",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ownerName: "",
      tournamentName: "",
      map: "",
      prizePool: "",
      roomOpenTime: "",
      matchStartTime: "",
      maxPlayers: "100",
      entryFee: "",
      upiId: "",
      youtubeChannel: "",
      killPoints: "",
      rankPoints: "",
      description: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const tournamentPayload: Parameters<typeof createTournament>[0] = {
        game: data.game,
        ownerName: data.ownerName,
        tournamentName: data.tournamentName,
        map: data.map,
        prizePool: data.prizePool,
        matchDate: data.matchDate.toISOString(),
        roomOpenTime: data.roomOpenTime,
        matchStartTime: data.matchStartTime,
        roomId: "",
        roomPassword: "",
        maxPlayers: data.maxPlayers,
        entryFee: data.entryFee,
        upiId: data.upiId,
        registerAmount: "0",
        youtubeChannel: data.youtubeChannel,
        killPoints: data.killPoints,
        rankPoints: data.rankPoints,
        description: data.description,
        profilePhoto,
        createdAt: new Date().toISOString(),
      };
      await createTournament(tournamentPayload);
      toast({
        title: "Tournament Created!",
        description: `Your ${data.game.toUpperCase()} tournament "${data.tournamentName}" has been created successfully.`,
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create tournament. Make sure your backend is running.",
        variant: "destructive",
      });
    }
  };

  const getMaps = () => {
    if (selectedGame === "bgmi") return bgmiMaps;
    if (selectedGame === "freefire") return freefireMaps;
    return [];
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
              Host a <span className="text-primary neon-glow">Tournament</span>
            </h1>
            <p className="text-muted-foreground">
              Fill in the details below to create your tournament match
            </p>
          </div>

          <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Match Details
              </CardTitle>
              <CardDescription>
                Provide all the necessary information for your tournament
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Game Selection */}
                  <FormField
                    control={form.control}
                    name="game"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Gamepad2 className="h-4 w-4" />
                          Select Game *
                        </FormLabel>
                        <Select
                          onValueChange={(value: "bgmi" | "freefire") => {
                            field.onChange(value);
                            setSelectedGame(value);
                            form.setValue("map", "");
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a game" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="bgmi">BGMI (Battlegrounds Mobile India)</SelectItem>
                            <SelectItem value="freefire">Free Fire</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Profile Photo & Owner Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium">Profile Photo</label>
                      <div className="flex items-center gap-4">
                        <div 
                          className="relative cursor-pointer group"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Avatar className="h-20 w-20 border-2 border-primary/30 group-hover:border-primary transition-colors">
                            {profilePhoto ? (
                              <AvatarImage src={profilePhoto} alt="Profile" />
                            ) : (
                              <AvatarFallback className="bg-muted">
                                <Camera className="h-6 w-6 text-muted-foreground" />
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Camera className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                        <div className="text-sm text-muted-foreground">
                          <p>Click to upload</p>
                          <p className="text-xs">JPG, PNG (max 5MB)</p>
                        </div>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="ownerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Owner Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Your name or team name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Tournament Name */}
                  <FormField
                    control={form.control}
                    name="tournamentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tournament Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Weekend Warriors Cup" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Map & Prize Pool */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="map"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Map *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!selectedGame}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={selectedGame ? "Select a map" : "Select game first"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getMaps().map((map) => (
                                <SelectItem key={map} value={map.toLowerCase()}>
                                  {map}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="prizePool"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-gold" />
                            Prize Pool (₹) *
                          </FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g., 5000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Match Date */}
                  <FormField
                    control={form.control}
                    name="matchDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Match Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Timings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="roomOpenTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Room Opening Time *
                          </FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormDescription>When players can join the room</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="matchStartTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Match Start Time *
                          </FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormDescription>When the match will begin</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Player Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="maxPlayers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Max Players *
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select max players" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="50">50 Players</SelectItem>
                              <SelectItem value="100">100 Players</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="entryFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entry Fee (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Free if empty" {...field} />
                          </FormControl>
                          <FormDescription>Leave empty for free entry</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* UPI ID & YouTube Channel */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="upiId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Wallet className="h-4 w-4" />
                            UPI ID *
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., yourname@upi" {...field} />
                          </FormControl>
                          <FormDescription>Players will pay to this UPI</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="youtubeChannel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Youtube className="h-4 w-4 text-destructive" />
                            YouTube Channel Link
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="https://youtube.com/@yourchannel" {...field} />
                          </FormControl>
                          <FormDescription>Stream link for viewers</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Points System (Optional) */}
                  <div className="p-4 rounded-lg border border-muted bg-muted/10">
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Points System (Optional)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="killPoints"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Points per Kill</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="e.g., 1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="rankPoints"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rank Points Format</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 15,12,10,8,6,4,2,1" {...field} />
                            </FormControl>
                            <FormDescription>Comma-separated for positions 1-8</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description / Rules</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add any additional rules or information about your tournament..."
                            className="resize-none"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate("/")}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                      Create Tournament
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HostTournament;
