import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, Equal } from 'typeorm';
import { Branch } from '../../entities/branch.entity';
import { CreateBranchDto } from './dto/create-branch/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch/update-branch.dto';
import { Owner } from '../../entities/owner.entity';

@Injectable()
export class BranchService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,

    @InjectRepository(Owner)
    private readonly ownerRepository: Repository<Owner>,
  ) {}
  // * Create Branch (Owner Only)
  async create(createBranchDto: CreateBranchDto): Promise<Branch> {
    const { owner_id, ...branchData } = createBranchDto;

    const owner = await this.ownerRepository.findOne({ where: { owner_id } });
    if (!owner) {
      throw new NotFoundException(`Owner with ID ${owner_id} not found`);
    }

    const newBranch = this.branchRepository.create({
      ...branchData,
      owner,
    });

    return this.branchRepository.save(newBranch);
  }
  // * Find All Branches (Owner Only
  async findAll(): Promise<Branch[]> {
    return this.branchRepository.find();
  }
  // * Find One Branch (Owner Only)
  async findOne(id: number): Promise<Branch> {
    const branch = await this.branchRepository.findOne({
      where: { branch_id: id },
      relations: ['owner'],
    });
    if (!branch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }
    return branch;
  }
  // * Update Branch (Owner Only)
  async update(
    id: number,
    updateBranchDto: UpdateBranchDto,
    owner_id: number,
  ): Promise<Branch> {
    const branch = await this.findOne(id);
    if (branch.owner.owner_id !== owner_id) {
      throw new ForbiddenException(
        'You do not have permission to update this branch',
      );
    }
    Object.assign(branch, updateBranchDto);
    return this.branchRepository.save(branch);
  }
  // * Remove Branch (Owner Only)
  async remove(id: number, owner_id: number): Promise<void> {
    const branch = await this.findOne(id);
    if (branch.owner.owner_id !== owner_id) {
      throw new ForbiddenException(
        'You do not have permission to delete this branch',
      );
    }
    await this.branchRepository.remove(branch);
  }

  async findOwnerBranches(ownerId: number, branchId: number) {
    if (isNaN(ownerId) || isNaN(branchId)) {
      throw new BadRequestException('Invalid owner_id or branch_id');
    }

    const currentBranch = await this.branchRepository.findOne({
      where: {
        owner: { owner_id: ownerId },
        branch_id: branchId,
      },
      select: ['branch_id', 'branch_name'],
    });

    if (!currentBranch) {
      throw new NotFoundException(`Branch with ID ${branchId} not found`);
    }

    const otherBranches = await this.branchRepository.find({
      where: {
        owner: { owner_id: ownerId },
        branch_id: Not(branchId),
      },
      select: ['branch_id', 'branch_name'],
    });

    return {
      current_branch: currentBranch,
      other_branches: otherBranches,
    };
  }
}
