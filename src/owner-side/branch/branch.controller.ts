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
  constructor(private readonly branchService: BranchService) {}
  // * Create Branch (Owner Only)
  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('owner')
  async create(@Body() createBranchDto: CreateBranchDto, @Req() req: Request) {
    const user = req.user as { owner_id: number };
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
    return this.branchService.findOne(+id);
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
    const user = req.user as { owner_id: number };
    return this.branchService.update(+id, updateBranchDto, user.owner_id);
  }
  // * Remove Branch (Owner Only)
  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('owner')
  async remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { owner_id: number };
    return this.branchService.remove(+id, user.owner_id);
  }

  // * Get Owner's Branches
  @Get('owner/my-branches')
  // @UseGuards(JwtGuard, RolesGuard)
  // @Roles('owner')
  async getOwnerBranches(@Req() request: Request) {
    // const user = req.user as { owner_id: number };
    const ownerId = request.headers['owner_id'];
    const branch_id = request.headers['branch_id'];
    const ownerIdNum = Number(ownerId);
    const branchIdNum = Number(branch_id);
    console.log(ownerIdNum, branchIdNum);
    // return this.branchService.findOwnerBranches(user.owner_id);
    return this.branchService.findOwnerBranches(ownerIdNum, branchIdNum);
  }

  @Get('owner/get-branch-setup/:selected_branch_id')
  async getBranchSetup(
    @Param('selected_branch_id') selectedBranchId: string,
    @Req() request: Request,
  ) {
    const ownerId = request.headers['owner_id'];
    const ownerIdNum = Number(ownerId);
    const selectedBranchIdNum = Number(selectedBranchId);
    return this.branchService.getBranchSetup(ownerIdNum, selectedBranchIdNum);
  }
}
