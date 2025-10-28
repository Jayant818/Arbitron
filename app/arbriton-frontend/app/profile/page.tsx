
"use client";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Award, Target, Zap, Crown, Edit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser, useUpdateUser } from "@/hooks/api-hooks/user.hooks";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSolana } from "@/components/solana-provider";
import { Nft, Badge as BadgeType, Contest } from "@/types";

const iconMap: { [key: string]: React.ElementType } = {
    Trophy,
    Award,
    Target,
    Zap,
};

export default function ProfilePage() {
    const { selectedAccount, isConnected } = useSolana();
    if (!isConnected || !selectedAccount) {
        return (
          <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-white">Wallet Not Connected</h2>
              <p className="text-muted-foreground">
                Please connect your wallet to view your profile
              </p>
            </div>
          </div>
        )
      }

    const { data: userStats, isLoading: loading } = useUser();
    const { mutate: updateUser } = useUpdateUser();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editedUsername, setEditedUsername] = useState("");
    const [editedEmail, setEditedEmail] = useState("");

    useEffect(() => {
        if (userStats) {
            setEditedUsername(userStats.username || "");
            setEditedEmail(userStats.email || "");
        }
    }, [userStats]);

    const handleUpdateUser = async () => {
        if (selectedAccount && selectedAccount.address) {
            try {
                updateUser({
                    walletAddress: selectedAccount.address,
                    username: editedUsername,
                    email: editedEmail,
                });
                setIsEditModalOpen(false);
            } catch (error) {
                console.error("Error updating user data:", error);
            }
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    // Set default values for new users or when data is missing
    const xp = userStats?.xp || 0;
    const nextLevelXp = userStats?.nextLevelXp || 100;
    const contestsPlayed = userStats?.contestsPlayed || 0;
    const winRate = userStats?.winRate || 0;
    const totalEarnings = userStats?.totalEarnings || 0;
    const username = userStats?.username || 'Anonymous';
    const avatar = userStats?.avatar || 'A';
    const rank = userStats?.rank || 'N/A';
    
    const xpProgress = nextLevelXp > 0 ? (xp / nextLevelXp) * 100 : 0;
    const nfts = userStats?.nfts || [];
    const badges = userStats?.badges || [];
    const recentContests = userStats?.recentContests || [];

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 pt-24 pb-16">
                <Card className="border-border bg-card mb-8">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                            <Avatar className="h-24 w-24 border-4 border-primary">
                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-3xl">
                                    {avatar}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                    <h1 className="text-3xl font-bold text-foreground">{username}</h1>
                                    <Badge className="bg-primary text-primary-foreground">
                                        <Crown className="h-3 w-3 mr-1" />
                                        Rank #{rank}
                                    </Badge>
                                    <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="icon">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Edit Profile</DialogTitle>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <label htmlFor="username" className="text-right">
                                                        Username
                                                    </label>
                                                    <Input
                                                        id="username"
                                                        value={editedUsername}
                                                        onChange={(e) => setEditedUsername(e.target.value)}
                                                        className="col-span-3"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <label htmlFor="email" className="text-right">
                                                        Email
                                                    </label>
                                                    <Input
                                                        id="email"
                        
                                                        value={editedEmail}
                                                        onChange={(e) => setEditedEmail(e.target.value)}
                                                        className="col-span-3"
                                                    />
                                                </div>
                                            </div>
                                            <Button onClick={handleUpdateUser}>Save changes</Button>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                <div className="mb-4">
                                    <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="text-muted-foreground">XP Progress</span>
                                        <span className="font-medium text-foreground">
                                            {xp} / {nextLevelXp} XP
                                        </span>
                                    </div>
                                    <Progress value={xpProgress} className="h-3" />
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Win contests to earn XP! Each win = 100 XP
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-3 rounded-lg bg-secondary/30">
                                        <div className="text-2xl font-bold text-foreground">{contestsPlayed}</div>
                                        <div className="text-xs text-muted-foreground">Contests</div>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-secondary/30">
                                        <div className="text-2xl font-bold text-success">{winRate}%</div>
                                        <div className="text-xs text-muted-foreground">Win Rate</div>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-secondary/30">
                                        <div className="text-2xl font-bold text-primary">{totalEarnings} SOL</div>
                                        <div className="text-xs text-muted-foreground">Earned</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Tabs defaultValue="history" className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
                        <TabsTrigger value="history">History</TabsTrigger>
                        <TabsTrigger value="nfts" disabled>NFTs</TabsTrigger>
                        <TabsTrigger value="badges" disabled>Badges</TabsTrigger>
                    </TabsList>
                    <TabsContent value="history">
                        {recentContests.length > 0 ? (
                            <Card className="border-border bg-card">
                                <CardHeader>
                                    <CardTitle className="text-foreground">Contest History</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {recentContests.map((contest: Contest, i: number) => (
                                            <div
                                                key={contest.id}
                                                className={`flex items-center justify-between p-4 rounded-lg ${contest.status === 'Won' ? 'bg-success/10' : 'bg-secondary/30'} hover:bg-secondary transition-smooth animate-slide-up`}
                                                style={{ animationDelay: `${i * 100}ms` }}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${contest.status === 'Won' ? 'bg-success text-success-foreground' : 'bg-muted text-foreground'}`}>
                                                        {contest.status === 'Won' ? <Trophy className="h-5 w-5" /> : <Award className="h-5 w-5" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-foreground">{contest.name}</div>
                                                        <div className="text-sm text-muted-foreground">{new Date(contest.date).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge variant="outline" className={`${contest.status === 'Won' ? 'border-success/50 bg-success/10 text-success' : 'border-destructive/50 bg-destructive/10 text-destructive'} mb-1`}>
                                                        {contest.status}
                                                    </Badge>
                                                    {contest.prize > 0 && (
                                                        <div className="text-sm font-semibold text-primary">{contest.prize.toFixed(2)} SOL</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                No contests joined yet. Join your first contest to start building your history!
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="nfts">
                        <div className="text-center py-12 text-muted-foreground">
                            NFT rewards coming soon! Win contests to earn exclusive NFTs.
                        </div>
                    </TabsContent>
                    <TabsContent value="badges">
                        <div className="text-center py-12 text-muted-foreground">
                            Achievement badges coming soon! Complete challenges to unlock badges.
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
