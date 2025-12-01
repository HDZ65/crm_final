"use client"

import React, { useState, useEffect } from 'react';
import { Building2, ArrowRight, Loader2, LogOut, CheckCircle2, ShieldCheck, Users } from 'lucide-react';
import { useAuth, useCreateOrganisation } from "@/hooks/auth";
import { useOrganisation } from "@/contexts/organisation-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";

export function WelcomeForm() {
    const { profile, logout } = useAuth();
    const { refetch } = useOrganisation();
    const { createOrganisation, isLoading } = useCreateOrganisation({
        onSuccess: async () => {
            setStep('success');
            // Refetch les données pour mettre à jour le contexte
            setTimeout(async () => {
                await refetch();
            }, 2000);
        },
        onError: (err) => {
            setError(err.message || "Une erreur est survenue");
        },
    });

    // État pour gérer le formulaire et l'interface
    const [companyName, setCompanyName] = useState('');
    const [step, setStep] = useState<'input' | 'processing' | 'success'>('input');
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (step === 'success') {
            // Petit délai pour que l'utilisateur voie la barre vide avant qu'elle ne se remplisse
            const timer = setTimeout(() => setProgress(100), 100);
            return () => clearTimeout(timer);
        }
    }, [step]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyName.trim()) {
            setError("Le nom de l'entreprise est requis.");
            return;
        }
        if (companyName.length < 3) {
            setError("Le nom doit contenir au moins 3 caractères.");
            return;
        }

        setError('');
        await createOrganisation(companyName, profile?.email);
    };

    // Rendu de l'étape de succès (Transition fluide)
    if (step === 'success') {
        return (
            <Card className="max-w-md w-full animate-in fade-in zoom-in duration-300">
                <CardContent className="pt-8 pb-8 text-center">
                    <div className="mx-auto h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-card-foreground mb-2">Tout est prêt !</h2>
                    <p className="text-slate-500 mb-6">
                        Nous avons configuré l&apos;espace pour <strong className="text-slate-800">{companyName}</strong>.
                        Vous allez être redirigé...
                    </p>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-success h-full transition-all duration-[1500ms] ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const userInitials = profile?.fullName
        ? profile.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
        : "JD";

    return (
        <>
            <div className="w-full max-w-xl mx-4 relative">

                {/* Carte Principale */}
                <div className="w-full">

                    <Card className=" relative border-slate-100 shadow-2xl overflow-hidden backdrop-blur-sm bg-white/95">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 text-slate-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shadow-md"
                            title="Ce n'est pas vous ? Se déconnecter"
                            onClick={() => logout()}
                        >
                            <LogOut size={20} />
                        </Button>
                        {/* En-tête de la carte */}
                        <CardHeader className="px-8 pt-8 pb-6 text-center space-y-2">

                            <CardTitle className="text-2xl font-bold text-slate-800">
                                Bienvenue, {profile?.firstName || profile?.fullName || profile?.username} 👋
                            </CardTitle>
                            <CardDescription className="text-slate-500 text-base">
                                Vous n&apos;êtes membre d&apos;aucune organisation pour le moment.
                                Créez votre propre espace de travail pour commencer.
                            </CardDescription>

                        </CardHeader>

                        {/* Formulaire */}
                        <CardContent className="px-8 pb-6">
                            <form onSubmit={handleSubmit} className="space-y-6">

                                <div className="space-y-2">
                                    <Label htmlFor="company" className="text-sm font-semibold text-slate-700">
                                        Nom de votre entreprise
                                    </Label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Building2 className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                        </div>
                                        <Input
                                            type="text"
                                            id="company"
                                            className={`pl-10 py-6 text-base ${error ? 'border-red-300 focus-visible:ring-red-200' : ''}`}
                                            placeholder="Ex: Acme Corp, Ma Startup..."
                                            value={companyName}
                                            onChange={(e) => {
                                                setCompanyName(e.target.value);
                                                setError('');
                                            }}
                                            autoFocus
                                            disabled={isLoading}
                                        />
                                    </div>
                                    {error && (
                                        <p className="text-sm text-red-600 flex items-center gap-1">
                                            <span>•</span> {error}
                                        </p>
                                    )}
                                    <p className="text-xs text-slate-400">
                                        Cela créera un nouvel espace où vous serez Administrateur.
                                    </p>
                                </div>

                                {/* Bouton d'action */}
                                <Button
                                    size="lg"
                                    type="submit"
                                    disabled={isLoading || !companyName}
                                    className={`w-full ${isLoading || !companyName
                                        ? 'bg-slate-400 cursor-not-allowed'
                                        : ''
                                        }`}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="animate-spin mr-2 h-5 w-5" />
                                            Configuration de l&apos;espace...
                                        </>
                                    ) : (
                                        <>
                                            Créer mon espace
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>

                        {/* Footer Informatif (Réassurance) */}
                        <CardFooter className="flex items-center justify-center text-center bg-slate-50/50">
                            <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                                <ShieldCheck className="h-5 w-5 text-slate-400 mb-1" />
                                <span className="text-xs font-medium text-slate-500">Données sécurisées</span>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                                <Users className="h-5 w-5 text-slate-400 mb-1" />
                                <span className="text-xs font-medium text-slate-500">Invitez votre équipe</span>
                            </div>
                        </CardFooter>
                    </Card>

                    <p className="text-center mt-6 text-sm text-sidebar-foreground drop-shadow-md">
                        Vous avez reçu une invitation par email ? <br />
                        Vérifiez vos spams ou contactez votre administrateur.
                    </p>
                </div>
            </div>
        </>
    );
}