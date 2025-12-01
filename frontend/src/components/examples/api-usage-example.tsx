"use client";

import { useState } from 'react';
import { useApiGet, useApiPost, useApiPut, useApiDelete } from '@/hooks/core';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

/**
 * Example component demonstrating how to use the API hooks with authentication
 *
 * This example shows:
 * 1. Automatic GET request on component mount
 * 2. POST request with form data
 * 3. PUT request to update data
 * 4. DELETE request
 * 5. Error handling with toast notifications
 * 6. Loading states
 */

interface Client {
  id: string;
  name: string;
  email: string;
}

interface CreateClientDto {
  name: string;
  email: string;
}

export function ApiUsageExample() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Example 1: GET request - Automatically fetches on mount
  const {
    data: clients,
    loading: loadingClients,
    error: clientsError,
    refetch: refetchClients,
  } = useApiGet<Client[]>('/clientbases', {
    onSuccess: (data) => {
      toast.success(`Loaded ${data.length} clients`);
    },
    onError: (error) => {
      toast.error(`Failed to load clients: ${error.message}`);
    },
  });

  // Example 2: POST request - Create new client
  const {
    loading: creatingClient,
    error: createError,
    execute: createClient,
  } = useApiPost<Client, CreateClientDto>('/clientbases', {
    onSuccess: (newClient) => {
      toast.success(`Client created: ${newClient.name}`);
      refetchClients(); // Refresh the list
    },
    onError: (error) => {
      toast.error(`Failed to create client: ${error.message}`);
    },
  });

  // Example 3: PUT request - Update client
  const {
    loading: updatingClient,
    execute: updateClient,
  } = useApiPut<Client, Partial<Client>>('/clientbases', {
    onSuccess: (updatedClient) => {
      toast.success(`Client updated: ${updatedClient.name}`);
      refetchClients();
    },
    onError: (error) => {
      toast.error(`Failed to update client: ${error.message}`);
    },
  });

  // Example 4: DELETE request - Delete client
  const {
    loading: deletingClient,
    execute: deleteClient,
  } = useApiDelete('/clientbases', {
    onSuccess: () => {
      toast.success('Client deleted successfully');
      refetchClients();
    },
    onError: (error) => {
      toast.error(`Failed to delete client: ${error.message}`);
    },
  });

  // Handler functions
  const handleCreateClient = async () => {
    const newClientData: CreateClientDto = {
      name: 'New Client',
      email: 'newclient@example.com',
    };
    await createClient(newClientData);
  };

  const handleUpdateClient = async (clientId: string) => {
    const updateData: Partial<Client> = {
      name: 'Updated Name',
    };
    await updateClient(updateData, clientId);
  };

  const handleDeleteClient = async (clientId: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      await deleteClient(clientId);
    }
  };

  // Loading state
  if (loadingClients) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading clients...</div>
      </div>
    );
  }

  // Error state
  if (clientsError) {
    return (
      <div className="p-8">
        <div className="text-destructive mb-4">
          Error: {clientsError.message}
        </div>
        <Button onClick={refetchClients}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Clients</h2>
        <div className="flex gap-2">
          <Button
            onClick={handleCreateClient}
            disabled={creatingClient}
          >
            {creatingClient ? 'Creating...' : 'Create Client'}
          </Button>
          <Button
            variant="outline"
            onClick={refetchClients}
            disabled={loadingClients}
          >
            Refresh
          </Button>
        </div>
      </div>

      {clients && clients.length === 0 && (
        <div className="text-center p-8 text-muted-foreground">
          No clients found. Create one to get started.
        </div>
      )}

      <div className="grid gap-4">
        {clients?.map((client) => (
          <div
            key={client.id}
            className="border rounded-lg p-4 flex items-center justify-between"
          >
            <div>
              <div className="font-semibold">{client.name}</div>
              <div className="text-sm text-muted-foreground">{client.email}</div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateClient(client.id)}
                disabled={updatingClient}
              >
                {updatingClient ? 'Updating...' : 'Update'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteClient(client.id)}
                disabled={deletingClient}
              >
                {deletingClient ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
