"use client";

import { useAuth } from '@/hooks/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect } from 'react';
import { TestIAPermissions } from './test-ia-permissions';

export default function DebugAuthPage() {
  const { isAuthenticated, profile, token, session, ready } = useAuth();

  // Log dans la console
  useEffect(() => {
    if (ready) {
      console.log('=== DEBUG AUTH ===');
      console.log('Authenticated:', isAuthenticated);
      console.log('Profile:', profile);
      console.log('Roles:', profile?.roles);
      console.log('Token:', token);
      console.log('Session:', session);
      console.log('==================');
    }
  }, [ready, isAuthenticated, profile, token, session]);

  if (!ready) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>Chargement...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>Non authentifié</CardTitle>
            <CardDescription>Vous devez être connecté pour voir cette page</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Décoder le token JWT pour voir le contenu
  const decodeToken = () => {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(window.atob(base64));
    } catch (error) {
      return { error: 'Failed to decode token' };
    }
  };

  const decodedToken = decodeToken();

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">Debug Authentification</h1>

      {/* Test des permissions IA */}
      <TestIAPermissions />

      {/* Informations utilisateur */}
      <Card>
        <CardHeader>
          <CardTitle>Informations utilisateur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <strong>Nom complet :</strong> {profile?.fullName || 'N/A'}
          </div>
          <div>
            <strong>Email :</strong> {profile?.email || 'N/A'}
          </div>
          <div>
            <strong>Username :</strong> {profile?.username || 'N/A'}
          </div>
          <div>
            <strong>Prénom :</strong> {profile?.firstName || 'N/A'}
          </div>
          <div>
            <strong>Nom :</strong> {profile?.lastName || 'N/A'}
          </div>
        </CardContent>
      </Card>

      {/* Rôles */}
      <Card>
        <CardHeader>
          <CardTitle>Rôles ({profile?.roles?.length || 0})</CardTitle>
          <CardDescription>
            Les rôles déterminant vos permissions dans l&apos;application
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profile?.roles && profile.roles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.roles.map((role) => (
                <Badge key={role} variant={role.includes('admin') ? 'default' : 'secondary'}>
                  {role}
                </Badge>
              ))}
              <p>{profile?.roles}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">Aucun rôle attribué</p>
          )}
        </CardContent>
      </Card>

      {/* Token décodé */}
      <Card>
        <CardHeader>
          <CardTitle>Token JWT décodé</CardTitle>
          <CardDescription>
            Contenu complet du token d&apos;authentification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs">
            {JSON.stringify(decodedToken, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Session NextAuth */}
      <Card>
        <CardHeader>
          <CardTitle>Session NextAuth</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs">
            {JSON.stringify(session, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Token brut */}
      <Card>
        <CardHeader>
          <CardTitle>Access Token (brut)</CardTitle>
          <CardDescription>
            Token utilisé pour les appels API au backend
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg break-all text-xs font-mono">
            {token || 'N/A'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
