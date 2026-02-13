# Issues: WinLeadPlus Settings UI


## Blocker: Cannot Complete Functional Acceptance Tests

### Issue
The "Definition of Done" section contains 9 functional acceptance criteria that require the application to be running:

1. Owner ouvre Paramètres → Intégrations → voit formulaire WinLeadPlus
2. Si pas de config existante: formulaire vide, bouton "Activer WinLeadPlus"
3. Si config existante: formulaire pré-rempli avec valeurs actuelles
4. Token masqué ("Token: ✓ configuré" si existant, champ vide sinon)
5. "Tester la connexion" fonctionne avec l'endpoint saisi
6. "Enregistrer" crée ou met à jour la config en base
7. Toggle enabled/disabled fonctionnel
8. Non-owner voit message "Accès réservé aux administrateurs"
9. Build frontend + backend: 0 erreurs

### Root Cause
Docker Desktop is not running on the Windows machine.

**Error**: `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`

### Impact
- Cannot start the development environment with `make dev-up`
- Cannot access the frontend at http://localhost:3000
- Cannot manually test the UI implementation
- Cannot verify the functional behavior of the WinLeadPlus settings form

### Technical Verification Status
✅ All technical implementation criteria have been verified by code inspection:
- Proto fields added correctly
- Migration file created
- Backend controller updated
- Frontend gRPC client and server actions implemented
- UI component fully implemented with all required features
- TypeScript compilation passes (0 errors in our code)

### Resolution Required
User must:
1. Start Docker Desktop application
2. Wait for Docker daemon to initialize (green icon in system tray)
3. Run `make dev-up` to start all services
4. Access http://localhost:3000 to perform manual testing

### Recommendation
Mark the plan as **IMPLEMENTATION COMPLETE** with a note that functional acceptance testing is pending Docker availability.

Create a separate QA task/checklist for manual testing once the environment is running.
