import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../infrastructure/database/schema';
import { ProjectRepository } from '../../infrastructure/database/repositories/project.repository';
import { CategoryRepository } from '../../infrastructure/database/repositories/category.repository';
import { TagRepository } from '../../infrastructure/database/repositories/tag.repository';

export class ReferenceService {
  private projectRepo: ProjectRepository;
  private categoryRepo: CategoryRepository;
  private tagRepo: TagRepository;

  constructor(private db: BetterSQLite3Database<typeof schema>) {
    this.projectRepo = new ProjectRepository(db);
    this.categoryRepo = new CategoryRepository(db);
    this.tagRepo = new TagRepository(db);
  }

  listProjects() { return this.projectRepo.list(); }
  createProject(name: string, description?: string) { return this.projectRepo.create(name, description); }

  listCategories() { return this.categoryRepo.list(); }
  createCategory(name: string, color?: string) { return this.categoryRepo.create(name, color); }

  listTags() { return this.tagRepo.list(); }
}