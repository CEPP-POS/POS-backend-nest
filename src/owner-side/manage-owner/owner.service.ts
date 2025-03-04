import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Branch } from 'src/entities/branch.entity';
import { BranchService } from '../branch/branch.service';
import { CreateEmployeeDto } from './dto/create-employee/create-employee.dto';
import { CreateOwnerDto } from './dto/create-owner/create-owner.dto';
import { Raw, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Owner } from '../../entities/owner.entity';
import { sendTemporaryPasswordEmail } from '../../utils/send-email.util';
import * as bcrypt from 'bcrypt';
import { ForgotPasswordDto, VerifyOtpDto } from '../../auth/dto/auth.dto';
import { UpdatePasswordDto } from '../../auth/dto/password.dto';

@Injectable()
export class OwnerService {
  constructor(
    @InjectRepository(Owner)
    private readonly ownerRepository: Repository<Owner>,

    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,

    private readonly branchService: BranchService,
  ) {}

  // * Create Owner with Branch(CSV)
  async createOwnerWithBranch(row: any): Promise<Owner> {
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    let owner = await this.findByEmail(row.email);

    if (!owner) {
      const createOwnerDto: CreateOwnerDto = {
        owner_name: `${row.first_name} ${row.last_name}`,
        contact_info: row.phone,
        email: row.email,
        password: hashedPassword,
      };

      owner = this.ownerRepository.create(createOwnerDto);
      owner = await this.ownerRepository.save(owner);

      await sendTemporaryPasswordEmail(owner.email, tempPassword);
    }

    const branchName = row.branch_name || `${owner.owner_name}'s New Branch`;

    let branch = await this.branchRepository.findOne({
      where: {
        branch_name: branchName,
        owner: { owner_id: owner.owner_id },
      },
    });

    if (!branch) {
      branch = await this.branchService.create({
        owner_id: owner.owner_id,
        branch_name: branchName,
        branch_address: row.address || 'N/A',
        branch_phone_number: row.phone || 'N/A',
      });
      const employeeCount = await this.countEmployeesInBranch(branch.branch_id);
      if (employeeCount === 0) {
        await this.createDefaultEmployee(owner, branch.branch_id);
      }
    }

    owner.branch_id = branch.branch_id;
    await this.updateBranchId(owner.owner_id, branch.branch_id);

    return owner;
  }

  async updateBranchId(ownerId: number, branchId: number): Promise<void> {
    await this.ownerRepository.update(ownerId, { branch_id: branchId });
  }

  async countEmployeesInBranch(branchId: number): Promise<number> {
    return this.ownerRepository.count({
      where: {
        branch: { branch_id: branchId },
        roles: Raw((alias) => `:role = ANY(${alias})`, { role: 'employee' }),
      },
    });
  }
  async createDefaultEmployee(owner: Owner, branchId: number): Promise<Owner> {
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newEmployee = this.ownerRepository.create({
      email: `${owner.email.split('@')[0]}+emp@${owner.email.split('@')[1]}`, // สร้างอีเมลอัตโนมัติ
      password: hashedPassword,
      roles: ['employee'],
      manager: owner,
      branch: { branch_id: branchId },
    });

    const savedEmployee = await this.ownerRepository.save(newEmployee);

    console.log(
      `📌 สร้าง Employee อัตโนมัติให้กับสาขาใหม่: ${savedEmployee.email}`,
    );

    return savedEmployee;
  }

  // * Create Employee
  async createEmployee(createEmployeeDto: CreateEmployeeDto): Promise<Owner> {
    const { email, password, manager_id, branch_id } = createEmployeeDto;

    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already exists.');
    }

    if (!password) {
      throw new BadRequestException('Password is required.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const manager = await this.ownerRepository.findOne({
      where: { owner_id: manager_id },
      relations: ['branch'],
    });

    if (!manager) {
      throw new BadRequestException('Manager (Owner) not found.');
    }

    const branch = await this.branchRepository.findOne({
      where: { branch_id },
    });

    if (!branch) {
      throw new BadRequestException('Branch not found.');
    }

    const newEmployee = this.ownerRepository.create({
      email,
      password: hashedPassword,
      roles: ['employee'],
      manager,
      branch,
    });

    return this.ownerRepository.save(newEmployee);
  }

  // * Find Owner or Employee by email
  async findByEmail(email: string): Promise<Owner | undefined> {
    return this.ownerRepository.findOne({
      where: { email },
      relations: ['branch', 'manager'],
      select: [
        'owner_id',
        'owner_name',
        'contact_info',
        'email',
        'password',
        'branch',
        'otp',
        'roles',
      ],
    });
  }

  // * forgot password
  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
    ownerId: number,
    branchId: number,
  ): Promise<void> {
    const { usernameOrEmail } = forgotPasswordDto;

    const user = await this.ownerRepository.findOne({
      where: {
        email: usernameOrEmail,
        owner_id: ownerId,
        branch: { branch_id: branchId },
      },
      relations: ['branch'],
    });

    if (!user) {
      throw new NotFoundException(
        'User not found for the given owner and branch.',
      );
    }

    const otp = this.generateOtp();
    user.otp = otp;
    user.otp_expiry = new Date(Date.now() + 15 * 60 * 1000);

    await this.ownerRepository.save(user);
    await this.sendOtpEmail(user.email, otp);
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOtpEmail(email: string, otp: string) {
    console.log(`OTP Sent: ${otp} to ${email}`);
  }

  async verifyOtp(
    verifyOtpDto: VerifyOtpDto,
    ownerId: number,
    branchId: number,
  ): Promise<void> {
    const { usernameOrEmail, otp } = verifyOtpDto;

    const user = await this.ownerRepository.findOne({
      where: {
        email: usernameOrEmail,
        owner_id: ownerId,
        branch: { branch_id: branchId },
      },
      relations: ['branch'],
    });

    if (!user) {
      throw new BadRequestException(
        'User not found for the given owner and branch.',
      );
    }

    if (!user.otp || user.otp !== otp || user.otp_expiry < new Date()) {
      throw new BadRequestException('OTP expired or invalid.');
    }

    user.otp = null;
    user.otp_expiry = null;
    await this.ownerRepository.save(user);
  }

  async findEmployeesByManager(manager_id: number): Promise<Owner[]> {
    const employees = await this.ownerRepository.find({
      where: { manager: { owner_id: manager_id } },
      relations: ['manager', 'branch'],
      select: ['owner_id', 'owner_name', 'email', 'roles'],
    });

    if (!employees || employees.length === 0) {
      throw new NotFoundException('No employees found for this manager.');
    }

    return employees;
  }

  async resetPassword(
    updatePasswordDto: UpdatePasswordDto,
    ownerId: number,
    branchId: number,
  ): Promise<{ message: string }> {
    const { email, newPassword } = updatePasswordDto;
    const user = await this.ownerRepository.findOne({
      where: { email, owner_id: ownerId, branch: { branch_id: branchId } },
      relations: ['branch'],
    });
    user.password = await bcrypt.hash(newPassword, 10);
    await this.ownerRepository.save(user);
    return { message: 'Password reset successful. You can now log in.' };
  }

  async updatePassword(
    ownerId: number,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<Owner> {
    const user = await this.ownerRepository.findOne({
      where: { owner_id: ownerId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }
    const hashedPassword = await bcrypt.hash(updatePasswordDto.newPassword, 10);
    user.password = hashedPassword;

    return this.ownerRepository.save(user);
  }

  async countEmployees(manager_id: number): Promise<number> {
    const manager = await this.ownerRepository.findOne({
      where: { owner_id: manager_id },
    });

    if (!manager) {
      throw new BadRequestException('Manager (Owner) not found.');
    }

    return this.ownerRepository.count({
      where: {
        manager,
        roles: Raw((alias) => `:role = ANY(${alias})`, { role: 'employee' }),
      },
    });
  }

  async updatePasswordInDB(user: Owner): Promise<void> {
    await this.ownerRepository.save(user);
  }
  async requestTempPassword(email: string): Promise<{ message: string }> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found.');
    }
    const tempPassword = Math.random().toString(36).slice(-8);
    user.otp = tempPassword;
    user.otp_expiry = new Date();
    user.otp_expiry.setMinutes(user.otp_expiry.getMinutes() + 15);
    await this.ownerRepository.save(user);
    await sendTemporaryPasswordEmail(user.email, tempPassword);
    return { message: 'Temporary password sent to your email.' };
  }

  
}
