"use client";

import { useAuth } from '@/hooks/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';

export function TestIAPermissions() {
  const { profile, hasRole, isAuthenticated } = useAuth();

  const hasUserRole = hasRole('realm:user');
  const hasAdminRole = hasRole('realm:admin');
  const hasRequiredRole = hasUserRole || hasAdminRole;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test des permissions IA</CardTitle>
        <CardDescription>
          Vérification des permissions pour utiliser l&apos;assistant IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statut d'authentification */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <CheckCircle2 className="size-5 text-green-600" />
            ) : (
              <XCircle className="size-5 text-red-600" />
            )}
            <span className="font-medium">Authentifié</span>
          </div>
          <Badge variant={isAuthenticated ? 'default' : 'destructive'}>
            {isAuthenticated ? 'Oui' : 'Non'}
          </Badge>
        </div>

        {/* Vérification du rôle user */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            {hasUserRole ? (
              <CheckCircle2 className="size-5 text-green-600" />
            ) : (
              <XCircle className="size-5 text-gray-400" />
            )}
            <span className="font-medium">Rôle : user</span>
          </div>
          <Badge variant={hasUserRole ? 'default' : 'outline'}>
            {hasUserRole ? 'Présent' : 'Absent'}
          </Badge>
        </div>

        {/* Vérification du rôle admin */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            {hasAdminRole ? (
              <CheckCircle2 className="size-5 text-green-600" />
            ) : (
              <XCircle className="size-5 text-gray-400" />
            )}
            <span className="font-medium">Rôle : admin</span>
          </div>
          <Badge variant={hasAdminRole ? 'default' : 'outline'}>
            {hasAdminRole ? 'Présent' : 'Absent'}
          </Badge>
        </div>

        {/* Liste des rôles actuels */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Vos rôles actuels :</p>
          {profile?.roles && profile.roles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.roles.map((role) => (
                <Badge
                  key={role}
                  variant={
                    role === 'realm:user' || role === 'realm:admin'
                      ? 'default'
                      : 'secondary'
                  }
                  className="font-mono"
                >
                  {role.replace('realm:', '')}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Aucun rôle attribué</p>
          )}
        </div>

        {/* Résultat final */}
        <div className={`p-4 rounded-lg border-2 ${
          isAuthenticated && hasRequiredRole
            ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900'
            : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900'
        }`}>
          <p className={`text-sm font-semibold ${
            isAuthenticated && hasRequiredRole
              ? 'text-green-800 dark:text-green-400'
              : 'text-red-800 dark:text-red-400'
          }`}>
            {isAuthenticated && hasRequiredRole
              ? '✅ Vous avez accès à l\'assistant IA'
              : '❌ Vous n\'avez pas accès à l\'assistant IA'}
          </p>
          {!isAuthenticated && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              → Vous devez être connecté
            </p>
          )}
          {isAuthenticated && !hasRequiredRole && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              → Vous devez avoir le rôle <span className="font-mono font-semibold">user</span> ou <span className="font-mono font-semibold">admin</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
