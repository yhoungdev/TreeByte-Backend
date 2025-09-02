import { Request, Response, NextFunction } from 'express';

// Mock data middleware para testing - NO usar en producción
export const mockDataMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Mock repositories para testing
  const mockUserRepo = {
    findById: async (id: string) => {
      if (id === '123e4567-e89b-12d3-a456-426614174000' || 
          id === '456e7890-e89b-12d3-a456-426614174000' || 
          id === 'valid-user-id') {
        return {
          id: id,
          email: 'test@example.com',
          public_key: 'GTESTPUBLICKEYTESTPUBLICKEYTESTPUBKEY12'
        };
      }
      return null;
    }
  };

  const mockProjectRepo = {
    findById: async (id: string) => {
      if (id === '987fcdeb-51d2-43e8-b456-789012345678') {
        return {
          id: id,
          name: 'Test Project',
          active: true,
          website_url: 'https://testproject.com'
        };
      }
      if (id === '321fcdeb-51d2-43e8-b456-789012345678') {
        return {
          id: id,
          name: 'Restaurant Project',
          active: true,
          website_url: 'https://restaurantproject.com'
        };
      }
      return null;
    }
  };

  const mockPurchaseRepo = {
    findById: async (id: number) => {
      if (id === 12345) {
        return {
          id: id,
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          project_id: '987fcdeb-51d2-43e8-b456-789012345678',
          amount: 100,
          currency: 'USD'
        };
      }
      if (id === 67890) {
        return {
          id: id,
          user_id: '456e7890-e89b-12d3-a456-426614174000',
          project_id: '321fcdeb-51d2-43e8-b456-789012345678',
          amount: 200,
          currency: 'USD'
        };
      }
      return null;
    }
  };

  // Inyectar mocks en el request para que el controller los use
  (req as any).mockRepositories = {
    userRepo: mockUserRepo,
    projectRepo: mockProjectRepo,
    purchaseRepo: mockPurchaseRepo
  };

  next();
};