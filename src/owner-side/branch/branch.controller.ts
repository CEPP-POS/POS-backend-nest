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
}
