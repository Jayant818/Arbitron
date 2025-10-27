
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
    const { selectedAccount } = useSolana();
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

    if (!userStats) {
        return <div>User not found</div>;
    }

    const xpProgress = (userStats.xp / userStats.nextLevelXp) * 100;
    const nfts = userStats.nfts || [];
    const badges = userStats.badges || [];
    const recentContests = userStats.recentContests || [];

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 pt-24 pb-16">
                <Card className="border-border bg-card mb-8">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                            <Avatar className="h-24 w-24 border-4 border-primary">
                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-3xl">
                                    {userStats.avatar || 'A'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                    <h1 className="text-3xl font-bold text-foreground">{userStats.username || 'Anonymous'}</h1>
                                    <Badge className="bg-primary text-primary-foreground">
                                        <Crown className="h-3 w-3 mr-1" />
                                        Rank #{userStats.rank || 'N/A'}
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
                                        <span className="text-muted-foreground">Level Progress</span>
                                        <span className="font-medium text-foreground">
                                            {userStats.xp || 0} / {userStats.nextLevelXp || 100} XP
                                        </span>
                                    </div>
                                    <Progress value={xpProgress} className="h-3" />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-3 rounded-lg bg-secondary/30">
                                        <div className="text-2xl font-bold text-foreground">{userStats.contestsPlayed || 0}</div>
                                        <div className="text-xs text-muted-foreground">Contests</div>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-secondary/30">
                                        <div className="text-2xl font-bold text-success">{userStats.winRate || 0}%</div>
                                        <div className="text-xs text-muted-foreground">Win Rate</div>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-secondary/30">
                                        <div className="text-2xl font-bold text-primary">{userStats.totalEarnings || 0} SOL</div>
                                        <div className="text-xs text-muted-foreground">Earned</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Tabs defaultValue="nfts" className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
                        <TabsTrigger value="nfts">NFTs</TabsTrigger>
                        <TabsTrigger value="badges">Badges</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>
                    <TabsContent value="nfts">
                        {nfts.length > 0 ? (
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                {nfts.map((nft: Nft, i: number) => {
                                    const Icon = iconMap[nft.icon];
                                    return (
                                        <Card
                                            key={nft.id}
                                            className="group border-border bg-card hover-glow transition-smooth overflow-hidden animate-slide-up"
                                            style={{ animationDelay: `${i * 100}ms` }}
                                        >
                                            <CardContent className="p-6">
                                                <div
                                                    className={`relative w-full aspect-square rounded-xl bg-gradient-to-br ${nft.color} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}
                                                >
                                                    {Icon && <Icon className="h-16 w-16 text-white" />}
                                                    <div className="absolute inset-0 rounded-xl border-2 border-white/20" />
                                                </div>
                                                <h3 className="font-semibold text-foreground mb-1">{nft.name}</h3>
                                                <Badge variant="outline" className="text-xs">
                                                    {nft.rarity}
                                                </Badge>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                No NFTs earned yet.
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="badges">
                        {badges.length > 0 ? (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {badges.map((badge: BadgeType, i: number) => (
                                    <Card
                                        key={badge.id}
                                        className={`border-border transition-smooth animate-slide-up ${badge.unlocked ? "bg-card hover-glow" : "bg-secondary/30 opacity-60"
                                            }`}
                                        style={{ animationDelay: `${i * 100}ms` }}
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex items-start gap-4">
                                                <div
                                                    className={`flex items-center justify-center w-12 h-12 rounded-full ${badge.unlocked ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                                        }`}
                                                >
                                                    <Award className="h-6 w-6" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-foreground mb-1">{badge.name}</h3>
                                                    <p className="text-sm text-muted-foreground">{badge.description}</p>
                                                    {badge.unlocked && (
                                                        <Badge className="mt-2 bg-success text-success-foreground text-xs">Unlocked</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                No badges earned yet.
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="history">
                        {recentContests.length > 0 ? (
                            <Card className="border-border bg-card">
                                <CardHeader>
                                    <CardTitle className="text-foreground">Recent Contests</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {recentContests.map((contest: Contest, i: number) => (
                                            <div
                                                key={contest.id}
                                                className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary transition-smooth animate-slide-up"
                                                style={{ animationDelay: `${i * 100}ms` }}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${contest.rank <= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                                                            }`}
                                                    >
                                                        #{contest.rank}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-foreground">{contest.name}</div>
                                                        <div className="text-sm text-muted-foreground">{new Date(contest.date).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge variant="outline" className="border-success/50 bg-success/10 text-success mb-1">
                                                        +{contest.pnl}%
                                                    </Badge>
                                                    {contest.prize > 0 && (
                                                        <div className="text-sm font-semibold text-primary">{contest.prize} SOL</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                No recent contests to show.
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
