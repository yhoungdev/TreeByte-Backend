import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMockUser } from '../factories/user-factory';
import { createMockProject } from '../factories/project-factory';
import { getTestDatabase, cleanupDatabase } from '../setup/test-setup';

const api = {
  
  async createProject(body: any) {
    const db = getTestDatabase();
    

    if (!body.name || !body.ownerId) {
      return { status: 400, body: { error: 'Invalid data' } };
    }

    const newProject = createMockProject({
      name: body.name,
      ownerId: body.ownerId
    });

    db.projects.set(newProject.id, newProject);

    return {
      status: 201,
      body: newProject
    };
  },

 
  async getProject(projectId: string) {
    const db = getTestDatabase();
    const project = db.projects.get(projectId);
    
    if (!project) {
      return { status: 404, body: { error: 'Project not found' } };
    }

    return { status: 200, body: project };
  },
};

// --- Integration Test Pattern ---


describe('Project API Integration Tests', () => {

  beforeEach(() => {
    cleanupDatabase();
  });

  afterEach(() => {
    // any cleanup logic would go here
  });

  // --- Test Case 1: Successful Project Creation ---
  it('should successfully create a new project and return a 201 status', async () => {

    const mockUser = createMockUser({ id: 'usr_owner_123' });
    const requestBody = { name: 'My New Test Project', ownerId: mockUser.id };

   
    const response = await api.createProject(requestBody);

    
    expect(response.status).toBe(201);
    expect(response.body).toBeDefined();

    if ('name' in response.body && 'ownerId' in response.body) {
      expect(response.body.name).toBe(requestBody.name);
      expect(response.body.ownerId).toBe(requestBody.ownerId);
    } else {
      throw new Error('Response body does not contain project data');
    }


    const db = getTestDatabase();
    const createdProject = db.projects.get(response.body.id);
    
   
    expect(createdProject).toBeDefined();
    expect(createdProject).toEqual(expect.objectContaining(requestBody));
  });

  it('should return a 400 status if required data is missing', async () => {
 
    const invalidRequestBody = { ownerId: 'usr_owner_123' }; 


    const response = await api.createProject(invalidRequestBody);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid data' });

    const db = getTestDatabase();
    expect(db.projects.size).toBe(0);
  });
});

