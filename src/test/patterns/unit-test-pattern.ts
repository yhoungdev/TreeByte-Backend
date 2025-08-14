import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockProject } from '../factories/project-factory';
import { createMockUser } from '../factories/user-factory';


class ProjectService {
    // This is the dependency we will mock.
    constructor(private dataAccess: { saveProject: (project: any) => Promise<any> }) {}

    async createProject(name: string, ownerId: string) {
        if (!name || !ownerId) {
            throw new Error('Project name and owner ID are required.');
        }

        const project = createMockProject({ name, ownerId });
        await this.dataAccess.saveProject(project);

        return project;
    }
}


describe('ProjectService Unit Tests', () => {


    let mockDataAccess: { saveProject: ReturnType<typeof vi.fn> };
    let projectService: ProjectService;

   
    beforeEach(() => {
       
        mockDataAccess = {
            saveProject: vi.fn().mockResolvedValue(true), 
        };

        projectService = new ProjectService(mockDataAccess);
    });

    // --- Test Case 1: Successful Project Creation ---
    it('should successfully create a new project and call the data access layer', async () => {
        // 1. Setup Phase: Prepare the test data.
        const mockUser = createMockUser({ id: 'usr_owner_123' });
        const projectName = 'My New Test Project';

        const createdProject = await projectService.createProject(projectName, mockUser.id);

        expect(createdProject.name).toBe(projectName);
        expect(createdProject.ownerId).toBe(mockUser.id);
        expect(createdProject.id).toBeDefined();

        expect(mockDataAccess.saveProject).toHaveBeenCalledTimes(1);
        expect(mockDataAccess.saveProject).toHaveBeenCalledWith(
            expect.objectContaining({
                name: projectName,
                ownerId: mockUser.id,
            }),
        );
    });


    it('should throw an error if the project name is missing', async () => {
        const mockUser = createMockUser({ id: 'usr_owner_123' });
        const invalidName = ''; 

        await expect(projectService.createProject(invalidName, mockUser.id)).rejects.toThrow(
            'Project name and owner ID are required.',
        );

        expect(mockDataAccess.saveProject).not.toHaveBeenCalled();
    });
});
