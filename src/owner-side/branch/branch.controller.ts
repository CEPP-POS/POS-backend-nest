import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { BranchService } from './branch.service';
import { CreateBranchDto } from './dto/create-branch/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch/update-branch.dto';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Request } from 'express';

@Controller('branches')
export class BranchController {
  constructor(private readonly branchService: BranchService) { }
  // * Create Branch (Owner Only)
  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('owner')
  async create(@Body() createBranchDto: CreateBranchDto, @Req() req: Request) {
    const user = req.user as { owner_id: string };
    return this.branchService.create({
      ...createBranchDto,
      owner_id: user.owner_id,
    });
  }
  // * Find All Branches (Owner Only)
  @Get()
  async findAll() {
    return this.branchService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.branchService.findOne(id);
  }
  // * Update Branch (Owner Only)
  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('owner')
  async update(
    @Param('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
    @Req() req: Request,
  ) {
    const user = req.user as { owner_id: string };
    return this.branchService.update(id, updateBranchDto, user.owner_id);
  }
  // * Remove Branch (Owner Only)
  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('owner')
  async remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { owner_id: string };
    return this.branchService.remove(id, user.owner_id);
  }

  @Get('owner/my-branches')
  async getOwnerBranches(@Req() request: Request) {
    const ownerId = Array.isArray(request.headers['owner_id'])
      ? request.headers['owner_id'][0]
      : request.headers['owner_id'];

    const branchId = Array.isArray(request.headers['branch_id'])
      ? request.headers['branch_id'][0]
      : request.headers['branch_id'];

    // Check if either ownerId or branchId is missing
    if (!ownerId || !branchId) {
      throw new BadRequestException('Missing owner_id or branch_id');
    }

    return this.branchService.findOwnerBranches(ownerId, branchId);
  }

  @Get('owner/get-branch-setup/:selected_branch_id')
  async getBranchSetup(
    @Param('selected_branch_id') selectedBranchId: string,
    @Req() request: Request,
  ) {
    let ownerId = request.headers['owner_id'];

    // If owner_id is an array, take the first element
    if (Array.isArray(ownerId)) {
      ownerId = ownerId[0];
    }

    // Check if ownerId is still a string
    if (typeof ownerId !== 'string') {
      throw new BadRequestException('Invalid owner_id');
    }

    return this.branchService.getBranchSetup(ownerId, selectedBranchId);
  }

  @Post('owner/clone-branch-setup/:selected_branch_id')
  async cloneBranchSetup(
    @Param('selected_branch_id') selectedBranchId: string,
    @Req() request: Request,
  ) {
    const ownerId = Array.isArray(request.headers['owner_id'])
      ? request.headers['owner_id'][0]
      : request.headers['owner_id'];

    const branchId = Array.isArray(request.headers['branch_id'])
      ? request.headers['branch_id'][0]
      : request.headers['branch_id'];

    // Check if either ownerId or branchId is missing
    if (!ownerId || !branchId) {
      throw new BadRequestException('Missing owner_id or branch_id');
    }

    return this.branchService.cloneBranchSetup(
      ownerId,
      selectedBranchId,
      branchId,
    );
  }

  @Get('owner/:ownerId')
  async getBranchesByOwner(@Param('ownerId') ownerId: string) {
    return this.branchService.getBranchesByOwnerId(ownerId);
  }
}
